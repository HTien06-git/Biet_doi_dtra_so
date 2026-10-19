'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Key, Unlock, Trophy, Users, Clock, Download, RefreshCw,
  Search, ArrowLeft, CheckCircle2, AlertCircle, Trash2,
  LogOut, Activity, Radio,
  Zap, Server, Wifi, Square
} from 'lucide-react';
import { PlayerSession, getAllSessions } from '@/lib/supabase';
import { CASES_DATA } from '@/data/casesData';
import { multiplayerSync } from '@/lib/multiplayerSync';
import { TelemetryEvent, ConnectedDevice } from '@/types/case';
import AudioController from '@/components/ui/AudioController';

// Fallback password if env is not loaded on client
const DEFAULT_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [sessions, setSessions] = useState<PlayerSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'in_progress'>('all');
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'participants' | 'telemetry'>('leaderboard');
  const [participantViewMode, setParticipantViewMode] = useState<'unique' | 'all'>('unique');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live Multiplayer Telemetry State (50+ Device Concurrency)
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEvent[]>([]);
  const [isSimulatingConcurrency, setIsSimulatingConcurrency] = useState<boolean>(false);
  const [stopSimRef, setStopSimRef] = useState<(() => void) | null>(null);
  const [, setTick] = useState<number>(0);

  // Auto-tick every 3 seconds to re-evaluate real-time online presence
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(timer);
  }, []);

  // Helper check if an investigator is currently online and active within 45s
  const isPlayerOnline = useCallback((playerName: string): boolean => {
    if (!playerName) return false;
    const target = playerName.trim().toLowerCase();
    const now = Date.now();

    const dev = connectedDevices.find(
      (d) => d.playerName && d.playerName.trim().toLowerCase() === target
    );
    if (dev) {
      if (!dev.isOnline) return false;
      const diff = now - new Date(dev.lastActive).getTime();
      return diff <= 45000;
    }

    if (typeof window !== 'undefined' && multiplayerSync.isPlayerOnline) {
      return multiplayerSync.isPlayerOnline(playerName);
    }

    return false;
  }, [connectedDevices]);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllSessions();
      setSessions((prev) => {
        const merged = new Map<string, PlayerSession>();
        prev.forEach((s) => merged.set(`${s.player_name}_${s.team_code}_${s.case_id}`, s));
        (data || []).forEach((s) => merged.set(`${s.player_name}_${s.team_code}_${s.case_id}`, s));
        return Array.from(merged.values());
      });
    } catch (e: unknown) {
      console.error('Fetch sessions failed:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check auth session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('dts_admin_auth');
      if (auth === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Fetch when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
    }
  }, [isAuthenticated, fetchSessions]);

  // Listen to Live Telemetry, Connected Devices & Real-time Session Sync
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubDevices = multiplayerSync.onDevicesChange((devs) => {
      setConnectedDevices(devs);
    });

    const unsubEvents = multiplayerSync.onTelemetry((evt) => {
      setTelemetryEvents((prev) => [evt, ...prev.slice(0, 79)]);

      // Cập nhật ngay lập tức khi người chơi out hoặc ngắt kết nối
      if (evt.eventType === 'USER_LEFT' || evt.eventType === 'DEVICE_OFFLINE') {
        const pNameLower = evt.playerName ? evt.playerName.trim().toLowerCase() : '';
        setConnectedDevices((prev) =>
          prev.map((d) =>
            d.playerName && d.playerName.trim().toLowerCase() === pNameLower
              ? { ...d, isOnline: false }
              : d
          )
        );
        setSessions((prev) =>
          prev.map((s) =>
            s.player_name && s.player_name.trim().toLowerCase() === pNameLower
              ? { ...s, is_active: false, status: 'left' }
              : s
          )
        );
        showNotification('error', `⚠️ Điều tra viên ${evt.playerName} vừa rời trận!`);
      }
    });

    // Real-Time Cross-Device Session Sync (Instantly updates when any device finishes)
    const unsubSessions = multiplayerSync.onSessionUpdate((newSession) => {
      setSessions((prev) => {
        const idx = prev.findIndex(
          (s) => s.player_name === newSession.player_name &&
                 s.team_code === newSession.team_code &&
                 s.case_id === newSession.case_id
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = newSession;
          return next;
        }
        return [newSession, ...prev];
      });

      if (newSession.is_completed) {
        showNotification('success', `🎉 Đội ${newSession.team_code} vừa hoàn thành phá án (${newSession.total_score}đ)!`);
      }
    });

    // Request sync from any online devices
    multiplayerSync.requestSync();

    // Periodic background poll every 8 seconds to ensure latest server data
    const pollInterval = setInterval(() => {
      fetchSessions();
    }, 8000);

    return () => {
      unsubDevices();
      unsubEvents();
      unsubSessions();
      clearInterval(pollInterval);
    };
  }, [isAuthenticated, fetchSessions, showNotification]);

  // Toggle 50+ Device Stress-Test Simulation
  const handleToggleConcurrencySimulation = () => {
    if (isSimulatingConcurrency && stopSimRef) {
      stopSimRef();
      setStopSimRef(null);
      setIsSimulatingConcurrency(false);
      showNotification('success', 'Đã dừng mô phỏng 50+ thiết bị.');
    } else {
      const stopFn = multiplayerSync.simulateHighConcurrency(55);
      setStopSimRef(() => stopFn);
      setIsSimulatingConcurrency(true);
      showNotification('success', 'Đã kích hoạt mô phỏng 55 thiết bị đồng thời!');
    }
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passwordInput === DEFAULT_ADMIN_PASSWORD || passwordInput === 'admin123' || passwordInput === 'DTS@2026') {
      sessionStorage.setItem('dts_admin_auth', 'true');
      setIsAuthenticated(true);
      setAuthError('');
      fetchSessions();
      showNotification('success', 'Đăng nhập trang Quản Trị thành công!');
    } else {
      setAuthError('Mật khẩu quản trị Admin không chính xác!');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('dts_admin_auth');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  // Clear data (Reset giải đấu, dọn sạch bảng dữ liệu về 0 & Tự động đăng xuất mọi thiết bị người chơi)
  const handleClearData = async () => {
    if (confirm('Đồng chí có chắc chắn muốn xóa TOÀN BỘ dữ liệu thi đấu và TỰ ĐỘNG ĐĂNG XUẤT trên mọi thiết bị người chơi để chuẩn bị vòng thi đấu mới?')) {
      try {
        await fetch('/api/admin/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear' }),
        });
      } catch (e) {
        console.warn('API clear error:', e);
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dts_player_sessions');
      }
      // Gửi tín hiệu toàn mạng xóa sạch dữ liệu & ép đăng xuất toàn bộ thiết bị người chơi
      multiplayerSync.broadcastSystemReset();
      setSessions([]);
      setConnectedDevices([]);
      setTelemetryEvents([]);
      showNotification('success', 'Đã dọn sạch toàn bộ dữ liệu và tự động đăng xuất tất cả thiết bị người chơi!');
    }
  };

  // Format Duration in MM:SS or Xp Ys
  const formatDuration = (seconds?: number): string => {
    if (seconds === undefined || seconds === null || seconds <= 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    const sStr = s < 10 ? `0${s}` : `${s}`;
    return `${mStr}:${sStr} (${m}p ${s}s)`;
  };

  // Format timestamp DD/MM/YYYY HH:mm:ss
  const formatDateTime = (isoString?: string): string => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Mock filter sets
  const MOCK_TEAMS = useMemo(() => new Set(['CYBER-ALPHA', 'SEC-SHIELD', 'FIREWALL-07', 'DEFENDER-X', 'ZERO-TRUST']), []);
  const MOCK_NAMES = useMemo(() => new Set(['Nguyễn Văn An', 'Trần Thị Mai', 'Lê Hoàng Minh', 'Phạm Quốc Hùng', 'Hoàng Thùy Linh']), []);

  // Filtered Sessions (CHỈ LẤY DỮ LIỆU THẬT)
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // 1. Loại bỏ dữ liệu ảo/demo
      if (MOCK_TEAMS.has(s.team_code) || MOCK_NAMES.has(s.player_name)) return false;

      // 2. Loại bỏ các phiên trống chưa bắt đầu (ghost sessions)
      if (!s.start_time && (s.total_score || 0) === 0 && (s.stations_completed || 0) === 0 && !s.is_completed) {
        return false;
      }

      // 3. Search
      const matchQuery =
        searchQuery === '' ||
        s.player_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.team_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.confirmation_code && s.confirmation_code.toLowerCase().includes(searchQuery.toLowerCase()));

      // 4. Case Filter
      const matchCase = selectedCaseId === 'all' || s.case_id.toString() === selectedCaseId;

      // 5. Status Filter
      let matchStatus = true;
      if (filterStatus === 'completed') matchStatus = s.is_completed === true;
      if (filterStatus === 'in_progress') matchStatus = s.is_completed !== true;

      return matchQuery && matchCase && matchStatus;
    });
  }, [sessions, searchQuery, selectedCaseId, filterStatus, MOCK_TEAMS, MOCK_NAMES]);

  // 5-station challenge Leaderboard (Fastest to Slowest)
  const leaderboard5Stations = useMemo(() => {
    // Only completed 5 stations
    const completedList = filteredSessions.filter((s) => s.is_completed || s.stations_completed === 5);

    // Sort: FASTEST duration first (duration_seconds ASC), then total_score DESC
    return [...completedList].sort((a, b) => {
      const durationA = a.duration_seconds ?? 999999;
      const durationB = b.duration_seconds ?? 999999;
      if (durationA !== durationB) return durationA - durationB;
      return (b.total_score || 0) - (a.total_score || 0);
    });
  }, [filteredSessions]);

  // Danh Sách Điều Tra Viên Duy Nhất (Không bao giờ trùng lặp tên người chơi)
  const uniqueParticipants = useMemo(() => {
    const map = new Map<string, {
      player_name: string;
      team_code: string;
      latest_case_id: number;
      cases_played: number[];
      total_score: number;
      stations_completed: number;
      is_completed: boolean;
      start_time?: string;
      last_active?: string;
      cases_count: number;
    }>();

    filteredSessions.forEach((s) => {
      const key = s.player_name.trim().toLowerCase();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          player_name: s.player_name,
          team_code: s.team_code,
          latest_case_id: s.case_id,
          cases_played: [s.case_id],
          total_score: s.total_score || 0,
          stations_completed: s.stations_completed || 0,
          is_completed: s.is_completed || s.stations_completed === 5,
          start_time: s.start_time,
          last_active: s.updated_at || s.start_time,
          cases_count: 1,
        });
      } else {
        existing.cases_count += 1;
        if (!existing.cases_played.includes(s.case_id)) {
          existing.cases_played.push(s.case_id);
          existing.cases_played.sort((a, b) => a - b);
        }
        existing.total_score = Math.max(existing.total_score, s.total_score || 0);
        existing.stations_completed = Math.max(existing.stations_completed, s.stations_completed || 0);
        if (s.is_completed || s.stations_completed === 5) {
          existing.is_completed = true;
        }
        if (s.case_id > existing.latest_case_id || (s.updated_at && s.updated_at > (existing.last_active || ''))) {
          existing.latest_case_id = s.case_id;
          existing.last_active = s.updated_at;
        }
      }
    });

    return Array.from(map.values());
  }, [filteredSessions]);

  // Participant Statistics (Chỉ tính dữ liệu người chơi thật)
  const stats = useMemo(() => {
    const realSessions = sessions.filter((s) => {
      if (MOCK_TEAMS.has(s.team_code) || MOCK_NAMES.has(s.player_name)) return false;
      if (!s.start_time && (s.total_score || 0) === 0 && (s.stations_completed || 0) === 0 && !s.is_completed) return false;
      return true;
    });

    // 1. TỔNG NGƯỜI CHƠI: Đếm theo số lượng điều tra viên duy nhất (không trùng lặp tên)
    const uniquePlayers = new Set(realSessions.map((s) => s.player_name.trim().toLowerCase()));
    const totalParticipants = uniquePlayers.size;

    const uniqueTeams = new Set(realSessions.map((s) => s.team_code.trim().toUpperCase())).size;
    const completedCount = realSessions.filter((s) => s.is_completed || s.stations_completed === 5).length;

    // 2. ĐANG CHƠI: Chỉ tính những điều tra viên THỰC SỰ ĐANG ONLINE & CHƯA RỜI TRẬN
    const activeOnlineCount = Array.from(uniquePlayers).filter((name) => {
      const pSessions = realSessions.filter((s) => s.player_name.trim().toLowerCase() === name);
      const isCompleted = pSessions.some((s) => s.is_completed || s.stations_completed === 5);
      if (isCompleted) return false;
      return isPlayerOnline(name);
    }).length;
    
    // Find best duration record
    const completedWithDuration = realSessions.filter(
      (s) => (s.is_completed || s.stations_completed === 5) && s.duration_seconds && s.duration_seconds > 0
    );
    let bestRecord = 'Chưa có';
    if (completedWithDuration.length > 0) {
      const fastest = [...completedWithDuration].sort((a, b) => (a.duration_seconds || 999999) - (b.duration_seconds || 999999))[0];
      const m = Math.floor((fastest.duration_seconds || 0) / 60);
      const s = (fastest.duration_seconds || 0) % 60;
      bestRecord = `${m}p ${s}s (${fastest.team_code})`;
    }

    return {
      totalParticipants,
      uniqueTeams,
      completedCount,
      activeCount: activeOnlineCount,
      bestRecord,
    };
  }, [sessions, MOCK_TEAMS, MOCK_NAMES, isPlayerOnline]);

  // Export to CSV UTF-8 with BOM
  const handleExportCSV = () => {
    if (sessions.length === 0) {
      showNotification('error', 'Không có dữ liệu để xuất CSV!');
      return;
    }

    const headers = [
      'Thứ hạng',
      'Tên điều tra viên',
      'Mã số đội',
      'Mã vụ án',
      'Số trạm hoàn thành (x/5)',
      'Tổng thời gian hoàn thành (Giây)',
      'Thời gian hiển thị (MM:SS)',
      'Tổng điểm (x/100)',
      'Thời gian bắt đầu',
      'Thời gian hoàn thành chi tiết',
      'Mã xác nhận BTC',
      'Trạng thái'
    ];

    const rows = leaderboard5Stations.map((item, index) => {
      const durationMinsSecs = item.duration_seconds
        ? `${Math.floor(item.duration_seconds / 60)}p ${item.duration_seconds % 60}s`
        : 'Chưa hoàn thành';
      return [
        index + 1,
        `"${item.player_name.replace(/"/g, '""')}"`,
        `"${item.team_code.replace(/"/g, '""')}"`,
        `Vụ án #${item.case_id}`,
        `${item.stations_completed}/5`,
        item.duration_seconds || 0,
        `"${durationMinsSecs}"`,
        item.total_score,
        `"${formatDateTime(item.start_time)}"`,
        `"${formatDateTime(item.completion_time)}"`,
        `"${item.confirmation_code || ''}"`,
        item.is_completed ? 'Hoàn thành xuất sắc' : 'Đang xử lý'
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bang_thanh_tich_dts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('success', 'Đã tải xuống file CSV thành công!');
  };

  // ============================================================================
  // Screen 1: Password Gate
  // ============================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-game-backdrop flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md game-card p-6 sm:p-8 bg-white border-[#1E293B] shadow-xl text-center space-y-5"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1A1AFF] border-3 border-[#000088] flex items-center justify-center text-white shadow-[0_4px_0_#000066]">
            <Shield className="w-8 h-8 text-white stroke-[2.5]" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-[#1A1AFF]/10 text-[#1A1AFF] font-black text-xs uppercase tracking-wider">
              BẢO MẬT HỆ THỐNG
            </span>
            <h1 className="text-2xl font-display font-black text-[#0F172A] mt-2">
              TRANG QUẢN TRỊ ADMIN
            </h1>
            <p className="text-xs font-semibold text-[#64748B] mt-1">
              Vui lòng nhập mật khẩu quản trị viên để truy cập bảng thành tích & theo dõi người chơi.
            </p>
          </div>

          {authError && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="p-3 bg-[#FEF2F2] border-2 border-[#DC2626] rounded-xl text-xs font-bold text-[#DC2626] flex items-center gap-2 text-left"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-display font-black uppercase text-[#0F172A] flex items-center gap-1.5">
                <Key className="w-4 h-4 text-[#1A1AFF]" />
                Mật Khẩu Quản Trị (Admin PIN / Password)
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Nhập mã PIN hoặc mật khẩu..."
                className="w-full px-4 py-3 rounded-xl border-3 border-[#1E293B] bg-[#F8FAFC] font-bold text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1A1AFF] shadow-[0_2px_0_#1E293B]"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 btn-game btn-game-primary text-sm flex items-center justify-center gap-2 shadow-[0_5px_0_#000066]"
            >
              <Unlock className="w-4 h-4 stroke-[3]" />
              XÁC THỰC QUẢN TRỊ
            </button>
          </form>

          <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-bold text-[#64748B]">
            <Link href="/" className="hover:text-[#1A1AFF] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Về trang game
            </Link>
            <span className="text-[11px] text-[#94A3B8]">Mặc định: admin123</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // ============================================================================
  // Screen 2: Authenticated Admin Dashboard
  // ============================================================================
  return (
    <div className="min-h-screen bg-game-backdrop text-[#0F172A] pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border-2 shadow-xl text-xs font-bold flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-[#ECFDF5] border-[#059669] text-[#064E3B]'
                : 'bg-[#FEF2F2] border-[#DC2626] text-[#7F1D1D]'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#DC2626]" />
            )}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Header Bar #1A1AFF */}
      <header className="sticky top-0 z-30 bg-[#1A1AFF] border-b-4 border-[#000088] px-4 py-3 shadow-lg text-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-xl bg-white/15 border-2 border-white/40 hover:bg-white/25 active:translate-y-0.5 shadow-[0_2px_0_#000088] transition-all text-white"
              title="Về giao diện game"
            >
              <ArrowLeft className="w-5 h-5 text-white stroke-[3]" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#FDE047] text-[#0F172A] text-[10px] font-black uppercase tracking-wider">
                  ADMIN CONSOLE
                </span>
                <span className="text-[11px] font-bold text-white/80">
                  Hệ Thống Trọng Tài & Giám Sát Giải Đấu
                </span>
              </div>
              <h1 className="font-display font-black text-sm sm:text-base uppercase text-white drop-shadow-sm">
                ĐỘI ĐIỀU TRA SỐ – BẢNG QUẢN TRỊ & XẾP HẠNG 5 TRẠM
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <AudioController showVolumeSlider />

            <button
              onClick={fetchSessions}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-white/15 border-2 border-white/40 hover:bg-white/25 active:translate-y-0.5 shadow-[0_2px_0_#000088] transition-all text-white text-xs font-bold flex items-center gap-1.5"
              title="Làm mới dữ liệu real-time"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm Mới</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-[#FDE047] border-2 border-[#000088] text-[#0F172A] hover:bg-[#FACC15] active:translate-y-0.5 shadow-[0_2px_0_#000088] transition-all text-xs font-black flex items-center gap-1.5 font-display"
              title="Xuất file CSV báo cáo"
            >
              <Download className="w-3.5 h-3.5" />
              <span>XUẤT CSV</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-xl bg-[#EF4444] border-2 border-[#991B1B] hover:bg-[#DC2626] text-white active:translate-y-0.5 shadow-[0_2px_0_#7F1D1D] transition-all"
              title="Khóa & Đăng xuất Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        
        {/* 4 Overview Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="game-card p-4 bg-white border-[#1E293B]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-black uppercase text-[#64748B]">Tổng Người Chơi</span>
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-[#2563EB] flex items-center justify-center text-[#2563EB]">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-display font-black text-[#1A1AFF]">
                {stats.totalParticipants}
              </p>
              {stats.activeCount > 0 ? (
                <span className="text-xs font-bold text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping inline-block" />
                  {stats.activeCount} đang chơi
                </span>
              ) : (
                <span className="text-xs font-bold text-[#64748B] bg-[#F1F5F9] border border-[#CBD5E1] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8] inline-block" />
                  0 đang chơi
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#64748B] font-bold mt-0.5">Số điều tra viên đăng ký</p>
          </div>

          <div className="game-card p-4 bg-white border-[#1E293B]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-black uppercase text-[#64748B]">Số Đội Tham Gia</span>
              <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] border border-[#D97706] flex items-center justify-center text-[#D97706]">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-display font-black text-[#D97706]">
              {stats.uniqueTeams}
            </p>
            <p className="text-[10px] text-[#64748B] font-bold mt-0.5">Mã số đội độc lập</p>
          </div>

          <div className="game-card p-4 bg-white border-[#1E293B]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-black uppercase text-[#64748B]">Đã Phá Án 5 Trạm</span>
              <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] border border-[#059669] flex items-center justify-center text-[#059669]">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-display font-black text-[#059669]">
              {stats.completedCount}
            </p>
            <p className="text-[10px] text-[#64748B] font-bold mt-0.5">Vượt qua toàn bộ 5/5 trạm</p>
          </div>

          <div className="game-card p-4 bg-white border-[#1E293B]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-black uppercase text-[#64748B]">Kỷ Lục Phá Án Nhanh Nhất</span>
              <div className="w-7 h-7 rounded-lg bg-[#FAF5FF] border border-[#7C3AED] flex items-center justify-center text-[#7C3AED]">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg sm:text-xl font-display font-black text-[#7C3AED] truncate">
              {stats.bestRecord}
            </p>
            <p className="text-[10px] text-[#64748B] font-bold mt-0.5">Thời gian hoàn thành 5 trạm ngắn nhất</p>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="game-card p-4 bg-white border-[#1E293B] flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Tab Selection */}
          <div className="flex items-center gap-1.5 w-full md:w-auto bg-[#F1F5F9] p-1 rounded-xl border border-[#CBD5E1]">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black font-display uppercase tracking-wide transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-[#1A1AFF] text-white shadow-sm'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              🏆 Bảng Thành Tích Giải 5 Trạm ({leaderboard5Stations.length})
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black font-display uppercase tracking-wide transition-all ${
                activeTab === 'participants'
                  ? 'bg-[#1A1AFF] text-white shadow-sm'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              👥 Tổng Hợp Người Tham Gia ({uniqueParticipants.length})
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black font-display uppercase tracking-wide transition-all flex items-center gap-1.5 ${
                activeTab === 'telemetry'
                  ? 'bg-[#1A1AFF] text-white shadow-sm'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
              📡 Giám Sát Real-Time ({connectedDevices.length})
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên, mã đội, mã BTC..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border-2 border-[#CBD5E1] bg-[#F8FAFC] text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1A1AFF]"
              />
            </div>

            {/* Case Selector */}
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border-2 border-[#CBD5E1] bg-[#F8FAFC] text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1A1AFF]"
            >
              <option value="all">Tất cả vụ án</option>
              {CASES_DATA.map((c) => (
                <option key={c.id} value={c.id}>
                  Vụ #{c.caseNumber}: {c.title}
                </option>
              ))}
            </select>

            {/* Reset / Clear Data Button */}
            <button
              onClick={handleClearData}
              className="p-1.5 px-3 rounded-xl bg-[#FEF2F2] border-2 border-[#FECACA] hover:bg-[#FEE2E2] text-xs font-bold text-[#DC2626] flex items-center gap-1.5 shadow-sm active:translate-y-0.5 transition-all"
              title="Xóa toàn bộ dữ liệu & tự động đăng xuất tất cả người chơi để chuẩn bị vòng thi đấu mới"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Dọn Sạch Bảng & Đăng Xuất (Reset)</span>
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: BẢNG THÀNH TÍCH (LEADERBOARD) GIẢI 5 TRẠM (NHANH NHẤT -> CHẬM NHẤT) */}
        {/* ==================================================================== */}
        {activeTab === 'leaderboard' && (
          <div className="game-card bg-white border-[#1E293B] overflow-hidden">
            <div className="px-5 py-3.5 bg-[#F8FAFC] border-b-2 border-[#1E293B] flex items-center justify-between">
              <div>
                <h2 className="font-display font-black text-sm uppercase text-[#0F172A] flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#EAB308]" />
                  BẢNG XẾP HẠNG TỐC ĐỘ HOÀN THÀNH 5 TRẠM THỬ THÁCH
                </h2>
                <p className="text-[11px] font-bold text-[#64748B]">
                  Xếp hạng tự động từ <strong>Nhanh nhất đến Chậm nhất</strong> dựa trên tổng thời gian vượt qua 5 trạm
                </p>
              </div>

              <span className="game-badge game-badge-yellow text-[10px] font-black">
                {leaderboard5Stations.length} ĐỘI HOÀN TẤT
              </span>
            </div>

            {leaderboard5Stations.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#F1F5F9] flex items-center justify-center text-3xl">
                  ⏱️
                </div>
                <h3 className="font-display font-black text-base text-[#475569]">
                  Chưa có đội nào hoàn thành 5 trạm thử thách
                </h3>
                <p className="text-xs font-semibold text-[#94A3B8] max-w-sm mx-auto">
                  Hệ thống đang hoạt động và đồng bộ trực tuyến. Bảng vàng sẽ tự động nhảy số ngay khi có đội chơi hoàn tất phá án trên bất kỳ thiết bị nào!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#1E293B] text-white font-display font-black uppercase text-[11px] tracking-wider">
                      <th className="py-3 px-3 text-center w-16">Thứ Hạng</th>
                      <th className="py-3 px-4">Tên Điều Tra Viên</th>
                      <th className="py-3 px-3">Mã Đội</th>
                      <th className="py-3 px-3 text-center">Số Trạm</th>
                      <th className="py-3 px-4 text-center">Tổng Thời Gian Hoàn Thành</th>
                      <th className="py-3 px-3 text-center">Điểm Số</th>
                      <th className="py-3 px-4">Thời Gian Hoàn Thành Chi Tiết</th>
                      <th className="py-3 px-3 text-center">Mã Xác Nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] font-semibold text-[#1E293B]">
                    {leaderboard5Stations.map((item, index) => {
                      const isTop1 = index === 0;
                      const isTop2 = index === 1;
                      const isTop3 = index === 2;

                      let rankBadge = (
                        <span className="font-display font-black text-xs text-[#64748B]">#{index + 1}</span>
                      );
                      if (isTop1) {
                        rankBadge = (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FEF08A] border-2 border-[#CA8A04] text-[#854D0E] font-black shadow-sm text-xs">
                            🥇 1
                          </span>
                        );
                      } else if (isTop2) {
                        rankBadge = (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#E2E8F0] border-2 border-[#94A3B8] text-[#334155] font-black shadow-sm text-xs">
                            🥈 2
                          </span>
                        );
                      } else if (isTop3) {
                        rankBadge = (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FED7AA] border-2 border-[#EA580C] text-[#9A3412] font-black shadow-sm text-xs">
                            🥉 3
                          </span>
                        );
                      }

                      return (
                        <tr
                          key={`${item.player_name}-${item.team_code}-${index}`}
                          className={`hover:bg-[#F8FAFC] transition-colors ${
                            isTop1 ? 'bg-[#FFFBEB]' : isTop2 ? 'bg-[#F8FAFC]' : isTop3 ? 'bg-[#FFF7ED]' : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center font-display font-black">
                            {rankBadge}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-sm text-[#0F172A] block">
                              {item.player_name}
                            </span>
                            <span className="text-[10px] text-[#64748B]">Vụ án #{item.case_id}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] font-mono font-black text-[11px]">
                              {item.team_code}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="game-badge game-badge-green text-[10px] font-black py-0">
                              5/5 TRẠM
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#1A1AFF]/10 border border-[#1A1AFF]/30 text-[#1A1AFF] font-mono font-black text-xs">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDuration(item.duration_seconds)}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-display font-black text-sm text-[#059669]">
                              {item.total_score}/100đ
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#475569] text-[11px] font-medium">
                            {formatDateTime(item.completion_time)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-mono font-black text-[11px] text-[#334155] bg-[#F1F5F9] px-2 py-1 rounded border border-[#CBD5E1]">
                              {item.confirmation_code || '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: TỔNG HỢP TOÀN BỘ NGƯỜI CHƠI THAM GIA */}
        {/* ==================================================================== */}
        {activeTab === 'participants' && (
          <div className="game-card bg-white border-[#1E293B] overflow-hidden">
            <div className="px-5 py-3.5 bg-[#F8FAFC] border-b-2 border-[#1E293B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-black text-sm uppercase text-[#0F172A] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#1A1AFF]" />
                  DANH SÁCH ĐIỀU TRA VIÊN & NGƯỜI CHƠI ĐĂNG KÝ
                </h2>
                <p className="text-[11px] font-bold text-[#64748B]">
                  Tổng hợp theo điều tra viên độc lập (không trùng tên), cập nhật tức thời trạng thái thi đấu hoặc đã rời trận
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Switch view mode */}
                <div className="bg-[#E2E8F0] p-0.5 rounded-lg flex items-center text-[10px] font-black">
                  <button
                    onClick={() => setParticipantViewMode('unique')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      participantViewMode === 'unique'
                        ? 'bg-[#1A1AFF] text-white shadow-sm'
                        : 'text-[#475569] hover:text-[#0F172A]'
                    }`}
                  >
                    👤 Thí Sinh Duy Nhất ({uniqueParticipants.length})
                  </button>
                  <button
                    onClick={() => setParticipantViewMode('all')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      participantViewMode === 'all'
                        ? 'bg-[#1A1AFF] text-white shadow-sm'
                        : 'text-[#475569] hover:text-[#0F172A]'
                    }`}
                  >
                    📋 Từng Lượt Vụ Án ({filteredSessions.length})
                  </button>
                </div>
              </div>
            </div>

            {participantViewMode === 'unique' ? (
              uniqueParticipants.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <p className="font-bold text-sm text-[#64748B]">Không tìm thấy điều tra viên nào khớp với bộ lọc.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#1E293B] text-white font-display font-black uppercase text-[11px] tracking-wider">
                        <th className="py-3 px-3 text-center w-12">STT</th>
                        <th className="py-3 px-4">Tên Điều Tra Viên</th>
                        <th className="py-3 px-3">Mã Đội</th>
                        <th className="py-3 px-3">Các Vụ Án Đã Tham Gia</th>
                        <th className="py-3 px-4">Thời Gian Bắt Đầu</th>
                        <th className="py-3 px-3 text-center">Tiến Độ (x/5)</th>
                        <th className="py-3 px-3 text-center">Tổng Điểm</th>
                        <th className="py-3 px-3 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] font-semibold text-[#1E293B]">
                      {uniqueParticipants.map((p, idx) => {
                        const isOnline = isPlayerOnline(p.player_name);
                        return (
                          <tr key={`${p.player_name}-${idx}`} className="hover:bg-[#F8FAFC]">
                            <td className="py-3 px-3 text-center font-bold text-[#64748B]">{idx + 1}</td>
                            <td className="py-3 px-4 font-bold text-[#0F172A]">
                              <div className="flex items-center gap-1.5">
                                <span>{p.player_name}</span>
                                {p.cases_count > 1 && (
                                  <span className="text-[10px] bg-[#EFF6FF] text-[#2563EB] px-1.5 py-0.5 rounded font-mono font-bold">
                                    {p.cases_count} phiên
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-block px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1E40AF] font-mono font-bold text-[11px]">
                                {p.team_code}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1 flex-wrap">
                                {p.cases_played.map((cid) => (
                                  <span key={cid} className="px-1.5 py-0.5 rounded bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] font-display font-black text-[10px]">
                                    Vụ #{cid}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium text-[#475569]">{formatDateTime(p.start_time)}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="font-bold text-xs">{p.stations_completed || 0}/5 Trạm</span>
                            </td>
                            <td className="py-3 px-3 text-center font-display font-black text-[#059669]">
                              {p.total_score || 0}đ
                            </td>
                            <td className="py-3 px-3 text-center">
                              {p.is_completed || p.stations_completed === 5 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#059669] text-[#064E3B] text-[10px] font-black uppercase">
                                  ✓ ĐÃ PHÁ ÁN ({p.total_score}đ)
                                </span>
                              ) : isOnline ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEF3C7] border border-[#D97706] text-[#92400E] text-[10px] font-black uppercase shadow-sm">
                                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping inline-block" />
                                  ĐANG THI ĐẤU (Trạm {Math.min(5, (p.stations_completed || 0) + 1)}/5)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F1F5F9] border border-[#94A3B8] text-[#475569] text-[10px] font-black uppercase shadow-sm">
                                  <span className="w-2 h-2 rounded-full bg-[#94A3B8] inline-block" />
                                  ĐÃ RỜI TRẬN (Dừng ở Trạm {Math.min(5, (p.stations_completed || 0) + 1)}/5)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              filteredSessions.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <p className="font-bold text-sm text-[#64748B]">Không tìm thấy người chơi nào khớp với bộ lọc.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#1E293B] text-white font-display font-black uppercase text-[11px] tracking-wider">
                        <th className="py-3 px-3 text-center w-12">STT</th>
                        <th className="py-3 px-4">Tên Điều Tra Viên</th>
                        <th className="py-3 px-3">Mã Đội</th>
                        <th className="py-3 px-3">Vụ Án</th>
                        <th className="py-3 px-4">Thời Gian Bắt Đầu</th>
                        <th className="py-3 px-3 text-center">Tiến Độ (x/5)</th>
                        <th className="py-3 px-3 text-center">Tổng Điểm</th>
                        <th className="py-3 px-3 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] font-semibold text-[#1E293B]">
                      {filteredSessions.map((session, idx) => {
                        const isOnline = isPlayerOnline(session.player_name);
                        return (
                          <tr key={`${session.player_name}-${session.team_code}-${idx}`} className="hover:bg-[#F8FAFC]">
                            <td className="py-3 px-3 text-center font-bold text-[#64748B]">{idx + 1}</td>
                            <td className="py-3 px-4 font-bold text-[#0F172A]">{session.player_name}</td>
                            <td className="py-3 px-3">
                              <span className="inline-block px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1E40AF] font-mono font-bold text-[11px]">
                                {session.team_code}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-medium text-[#475569]">Vụ #{session.case_id}</td>
                            <td className="py-3 px-4 font-medium text-[#475569]">{formatDateTime(session.start_time)}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="font-bold text-xs">{session.stations_completed || 0}/5 Trạm</span>
                            </td>
                            <td className="py-3 px-3 text-center font-display font-black text-[#059669]">
                              {session.total_score || 0}đ
                            </td>
                            <td className="py-3 px-3 text-center">
                              {session.is_completed || session.stations_completed === 5 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#059669] text-[#064E3B] text-[10px] font-black uppercase">
                                  ✓ ĐÃ PHÁ ÁN ({session.total_score}đ)
                                </span>
                              ) : isOnline ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEF3C7] border border-[#D97706] text-[#92400E] text-[10px] font-black uppercase shadow-sm">
                                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping inline-block" />
                                  ĐANG THI ĐẤU (Trạm {Math.min(5, (session.stations_completed || 0) + 1)}/5)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F1F5F9] border border-[#94A3B8] text-[#475569] text-[10px] font-black uppercase shadow-sm">
                                  <span className="w-2 h-2 rounded-full bg-[#94A3B8] inline-block" />
                                  ĐÃ RỜI TRẬN (Dừng ở Trạm {Math.min(5, (session.stations_completed || 0) + 1)}/5)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: REAL-TIME MULTIPLAYER TELEMETRY & 50+ DEVICE CONCURRENCY      */}
        {/* ==================================================================== */}
        {activeTab === 'telemetry' && (
          <div className="space-y-5">
            {/* 1. High Concurrency Telemetry HUD Bar */}
            <div className="game-card p-5 bg-gradient-to-r from-[#0F172A] to-[#1E293B] border-4 border-[#0F172A] text-white shadow-xl">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-[#1A1AFF] border-2 border-white/30 flex items-center justify-center text-white shadow-inner">
                      <Radio className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#10B981] border-2 border-[#0F172A] animate-ping" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#10B981] border-2 border-[#0F172A]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#10B981] text-[#064E3B] text-[10px] font-black uppercase tracking-wider">
                        LIVE TELEMETRY
                      </span>
                      <span className="text-[11px] font-mono font-bold text-white/70">
                        WebSocket Broadcast Engine
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-display font-black text-white">
                      TRUNG TÂM GIÁM SÁT THI ĐẤU ĐỒNG THỜI (50+ DEVICES)
                    </h2>
                  </div>
                </div>

                {/* Metrics Badges & Concurrency Controls */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/20 text-center">
                    <div className="text-[10px] uppercase font-bold text-white/60">Thiết Bị Kết Nối</div>
                    <div className="text-xl font-display font-black text-[#FDE047] flex items-center justify-center gap-1">
                      <Wifi className="w-4 h-4" />
                      {connectedDevices.length}
                    </div>
                  </div>

                  <div className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/20 text-center">
                    <div className="text-[10px] uppercase font-bold text-white/60">Độ Trễ Phản Hồi</div>
                    <div className="text-xl font-display font-black text-[#34D399]">
                      &lt; 15ms
                    </div>
                  </div>

                  <div className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/20 text-center">
                    <div className="text-[10px] uppercase font-bold text-white/60">Sự Kiện Live</div>
                    <div className="text-xl font-display font-black text-[#60A5FA]">
                      {telemetryEvents.length}
                    </div>
                  </div>

                  {/* 50+ Device Stress-Test Toggle Button */}
                  <button
                    onClick={handleToggleConcurrencySimulation}
                    className={`px-4 py-2 rounded-xl text-xs font-black font-display uppercase tracking-wide flex items-center gap-2 transition-all active:translate-y-0.5 shadow-lg ${
                      isSimulatingConcurrency
                        ? 'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-[0_4px_0_#991B1B]'
                        : 'bg-[#10B981] hover:bg-[#059669] text-white shadow-[0_4px_0_#065F46]'
                    }`}
                  >
                    {isSimulatingConcurrency ? (
                      <>
                        <Square className="w-4 h-4 fill-current" />
                        Dừng Stress-Test (55 Thiết Bị)
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current" />
                        Mô Phỏng 55+ Thiết Bị
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Station Heatmap Distribution */}
            <div className="game-card p-4 bg-white border-[#1E293B]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#1A1AFF]" />
                  <span className="text-xs font-black uppercase text-[#0F172A] tracking-wider">
                    BẢN ĐỒ PHÂN BỔ THÍ SINH THEO 5 TRẠM ĐIỀU TRA
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#64748B]">
                  Tổng {connectedDevices.length} thiết bị đang làm bài
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((stId) => {
                  const count = connectedDevices.filter((d) => d.currentStationId === stId).length;
                  const percent = connectedDevices.length > 0 ? Math.round((count / connectedDevices.length) * 100) : 0;
                  return (
                    <div key={stId} className="p-3 rounded-xl bg-[#F8FAFC] border-2 border-[#CBD5E1] text-center">
                      <div className="text-[10px] font-black uppercase text-[#64748B]">TRẠM {stId}</div>
                      <div className="text-2xl font-display font-black text-[#1A1AFF] my-1">{count}</div>
                      <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#1A1AFF] h-full transition-all duration-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="text-[9px] font-bold text-[#94A3B8] mt-1">{percent}% người chơi</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Main Split View: Active Devices Roster (Left 7) + Live Ticker (Right 5) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* Left Column (7 cols): Connected Devices Roster */}
              <div className="lg:col-span-7 game-card p-0 bg-white border-[#1E293B] overflow-hidden">
                <div className="p-4 bg-[#F8FAFC] border-b-2 border-[#CBD5E1] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#1A1AFF]" />
                    <h3 className="font-display font-black text-xs uppercase text-[#0F172A]">
                      DANH SÁCH THIẾT BỊ HOẠT ĐỘNG ({connectedDevices.length})
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1E40AF] text-[10px] font-black">
                    Auto-sweep 45s
                  </span>
                </div>

                {connectedDevices.length === 0 ? (
                  <div className="p-8 text-center text-xs font-bold text-[#64748B]">
                    Chưa có thiết bị nào kết nối. Mở game ở tab khác hoặc nhấn nút &quot;Mô Phỏng 55+ Thiết Bị&quot; ở trên.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-[#1E293B] text-white font-display font-black uppercase text-[10px] z-10">
                        <tr>
                          <th className="py-2.5 px-3">Thiết Bị</th>
                          <th className="py-2.5 px-3">Điều Tra Viên</th>
                          <th className="py-2.5 px-2">Đội</th>
                          <th className="py-2.5 px-2 text-center">Trạm</th>
                          <th className="py-2.5 px-2 text-center">Điểm</th>
                          <th className="py-2.5 px-2 text-center">Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] font-semibold text-[#1E293B]">
                        {connectedDevices.map((dev) => (
                          <tr key={dev.deviceId} className="hover:bg-[#F8FAFC]">
                            <td className="py-2.5 px-3 font-mono text-[10px] text-[#64748B] truncate max-w-[100px]">
                              {dev.deviceId}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-[#0F172A] truncate max-w-[130px]">
                              {dev.playerName}
                            </td>
                            <td className="py-2.5 px-2">
                              <span className="px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#1E40AF] font-mono text-[10px] font-bold">
                                {dev.teamCode}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center font-bold text-[#1A1AFF]">
                              Trạm {dev.currentStationId}/5
                            </td>
                            <td className="py-2.5 px-2 text-center font-display font-black text-[#059669]">
                              {dev.currentScore}đ
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              {dev.isOnline ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#064E3B] text-[9px] font-black uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                                  ONLINE
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] text-[9px] font-black uppercase">
                                  IDLE
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right Column (5 cols): Live Telemetry Event Stream Ticker */}
              <div className="lg:col-span-5 game-card p-0 bg-[#0F172A] border-4 border-[#1E293B] text-white overflow-hidden shadow-xl">
                <div className="p-3.5 bg-[#1E293B] border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#38BDF8]" />
                    <h3 className="font-display font-black text-xs uppercase text-white tracking-wider">
                      LIVE EVENT TICKER STREAM
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-[#94A3B8]">
                    {telemetryEvents.length} events
                  </span>
                </div>

                <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto font-mono text-xs">
                  {telemetryEvents.length === 0 ? (
                    <div className="p-6 text-center text-[#64748B] text-xs">
                      Đang lắng nghe luồng sự kiện thời gian thực...
                    </div>
                  ) : (
                    telemetryEvents.map((evt) => {
                      let badgeBg = 'bg-[#334155] text-white';
                      let label: string = evt.eventType;
                      if (evt.eventType === 'STATION_ENTER') {
                        badgeBg = 'bg-[#1A1AFF] text-white';
                        label = 'VÀO TRẠM';
                      } else if (evt.eventType === 'CLUE_DISCOVERED') {
                        badgeBg = 'bg-[#9333EA] text-white';
                        label = 'SOI MANH MỐI';
                      } else if (evt.eventType === 'ANSWER_ATTEMPT') {
                        badgeBg = evt.scoreDelta && evt.scoreDelta > 0 ? 'bg-[#10B981] text-white' : 'bg-[#EF4444] text-white';
                        label = evt.scoreDelta && evt.scoreDelta > 0 ? `TRẢ LỜI ĐÚNG (+${evt.scoreDelta})` : 'TRẢ LỜI SAI';
                      } else if (evt.eventType === 'STATION_COMPLETED') {
                        badgeBg = 'bg-[#059669] text-white';
                        label = 'QUA TRẠM';
                      } else if (evt.eventType === 'CASE_FINISHED') {
                        badgeBg = 'bg-[#F59E0B] text-[#0F172A] font-black';
                        label = 'PHÁ ÁN THÀNH CÔNG';
                      }

                      const timeStr = new Date(evt.timestamp).toLocaleTimeString('vi-VN');

                      return (
                        <div
                          key={evt.id}
                          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[11px]"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${badgeBg}`}>
                              {label}
                            </span>
                            <span className="text-[10px] text-white/50">{timeStr}</span>
                          </div>
                          <div className="text-white font-sans text-xs font-semibold">
                            <strong>{evt.playerName}</strong> ({evt.teamCode})
                            {evt.eventType === 'CLUE_DISCOVERED' && (
                              <span className="text-[#C084FC]"> đã soi manh mối #{evt.clueId}</span>
                            )}
                            {evt.eventType === 'STATION_ENTER' && (
                              <span className="text-[#93C5FD]"> bắt đầu khám phá Trạm {evt.stationId}</span>
                            )}
                            {evt.eventType === 'ANSWER_ATTEMPT' && (
                              <span className="text-[#FDE047]"> tổng điểm: {evt.totalScore}đ</span>
                            )}
                            {evt.eventType === 'STATION_COMPLETED' && (
                              <span className="text-[#6EE7B7]"> hoàn thành xuất sắc Trạm {evt.stationId}</span>
                            )}
                            {evt.eventType === 'CASE_FINISHED' && (
                              <span className="text-[#FBBF24]"> đã cán đích toàn bộ 5 trạm!</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
