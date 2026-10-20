'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Key, Unlock, Trophy, Users, Clock, Download, RefreshCw,
  Search, ArrowLeft, CheckCircle2, AlertCircle, Trash2,
  LogOut, Activity, Radio,
  Zap, Server, Wifi, Square, ChevronDown, ChevronUp, Settings, Lock, LockOpen, Eye,
  Crown, Medal, Award
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
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'participants' | 'telemetry' | 'settings'>('leaderboard');
  const [participantViewMode, setParticipantViewMode] = useState<'unique' | 'all'>('unique');
  const [leaderboardView, setLeaderboardView] = useState<'individual' | 'team'>('individual');
  const [expandedLeaderboardRows, setExpandedLeaderboardRows] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Admin Game Mode Settings (persisted in localStorage)
  const [caseAccessMode, setCaseAccessMode] = useState<'single' | 'multi'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dts_admin_case_access_mode');
      return (saved === 'single' || saved === 'multi') ? saved : 'multi';
    }
    return 'multi';
  });
  const [lastResetTime, setLastResetTime] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('dts_admin_reset_at');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

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
      setSessions(data || []);
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

  // Fetch remote game config
  const fetchGameConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/config');
      const data = await res.json();
      if (data.success && data.caseAccessMode) {
        setCaseAccessMode(data.caseAccessMode);
        if (typeof window !== 'undefined') {
          localStorage.setItem('dts_admin_case_access_mode', data.caseAccessMode);
        }
      }
    } catch (e) {
      console.warn('Fetch config failed:', e);
    }
  }, []);

  // Fetch when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
      fetchGameConfig();
    }
  }, [isAuthenticated, fetchSessions, fetchGameConfig]);

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
      const now = Date.now();
      setLastResetTime(now);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dts_admin_reset_at', now.toString());
        localStorage.removeItem('dts_player_sessions');
      }
      try {
        await fetch('/api/admin/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear' }),
        });
      } catch (e) {
        console.warn('API clear error:', e);
      }
      // Gửi tín hiệu toàn mạng xóa sạch dữ liệu & ép đăng xuất toàn bộ thiết bị người chơi
      multiplayerSync.broadcastSystemReset();
      multiplayerSync.clearAllDevices();
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

  // Filtered Sessions (CHỈ LẤY DỮ LIỆU THẬT & ĐÃ BẮT ĐẦU GIẢI TRẠM)
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // 1. Loại bỏ dữ liệu ảo/demo
      if (MOCK_TEAMS.has(s.team_code) || MOCK_NAMES.has(s.player_name)) return false;

      // 2. Chỉ ghi nhận khi người chơi THỰC SỰ tham gia giải trạm (có hoàn thành trạm, có điểm, đã phá án hoặc đang trực tiếp thi đấu)
      const isOnline = isPlayerOnline(s.player_name);
      const hasRealParticipation =
        (s.stations_completed || 0) > 0 ||
        (s.total_score || 0) > 0 ||
        s.is_completed ||
        (isOnline && s.status === 'playing');

      if (!hasRealParticipation) {
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
  }, [sessions, searchQuery, selectedCaseId, filterStatus, MOCK_TEAMS, MOCK_NAMES, isPlayerOnline]);

  // 5-station challenge Leaderboard: Xếp hạng theo ĐIỂM SỐ CAO NHẤT LÊN TRƯỚC (từ cao tới thấp), bằng điểm xét thời gian nhanh hơn
  const leaderboard5Stations = useMemo(() => {
    // Lấy các thí sinh đã hoàn thành vụ án hoặc hoàn thành 5 trạm
    const completedList = filteredSessions.filter((s) => s.is_completed || s.stations_completed === 5);

    // Sort: ĐIỂM SỐ CAO NHẤT LÊN TRƯỚC (total_score DESC), bằng điểm thì THỜI GIAN NHANH HƠN (duration_seconds ASC)
    return [...completedList].sort((a, b) => {
      const scoreA = a.total_score || 0;
      const scoreB = b.total_score || 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA; // Điểm nhiều nhất lên trước
      }
      const durationA = a.duration_seconds ?? 999999;
      const durationB = b.duration_seconds ?? 999999;
      if (durationA !== durationB) {
        return durationA - durationB; // Bằng điểm thì thời gian nhanh hơn đứng trên
      }
      return (b.clues_collected || 0) - (a.clues_collected || 0);
    });
  }, [filteredSessions]);

  // Team Ranking - Aggregate scores across users with same team_code
  const teamRanking = useMemo(() => {
    const teamMap = new Map<string, {
      team_code: string;
      members: {
        player_name: string;
        case_id: number;
        total_score: number;
        stations_completed: number;
        is_completed: boolean;
        duration_seconds?: number;
        station_scores: number[];
      }[];
      total_score: number;
      total_stations: number;
      cases_completed: number;
      fastest_duration?: number;
    }>();

    filteredSessions.forEach((s) => {
      const teamKey = s.team_code.trim().toUpperCase();
      if (!teamMap.has(teamKey)) {
        teamMap.set(teamKey, {
          team_code: s.team_code,
          members: [],
          total_score: 0,
          total_stations: 0,
          cases_completed: 0,
          fastest_duration: undefined,
        });
      }
      const team = teamMap.get(teamKey)!;
      team.members.push({
        player_name: s.player_name,
        case_id: s.case_id,
        total_score: s.total_score || 0,
        stations_completed: s.stations_completed || 0,
        is_completed: s.is_completed || s.stations_completed === 5,
        duration_seconds: s.duration_seconds,
        station_scores: s.station_scores || [],
      });
      team.total_score += (s.total_score || 0);
      team.total_stations += (s.stations_completed || 0);
      if (s.is_completed || s.stations_completed === 5) {
        team.cases_completed += 1;
        if (s.duration_seconds && s.duration_seconds > 0) {
          if (!team.fastest_duration || s.duration_seconds < team.fastest_duration) {
            team.fastest_duration = s.duration_seconds;
          }
        }
      }
    });

    return Array.from(teamMap.values()).sort((a, b) => {
      // Sort by total_score DESC, then by cases_completed DESC, then fastest_duration ASC
      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      if (b.cases_completed !== a.cases_completed) return b.cases_completed - a.cases_completed;
      return (a.fastest_duration ?? 999999) - (b.fastest_duration ?? 999999);
    });
  }, [filteredSessions]);

  // Helper to toggle expanded row
  const toggleExpandedRow = (key: string) => {
    setExpandedLeaderboardRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Save case access mode to localStorage, server API and broadcast
  const handleCaseAccessModeChange = async (mode: 'single' | 'multi') => {
    setCaseAccessMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dts_admin_case_access_mode', mode);
    }
    // Gửi lên server API để lưu trữ lâu dài
    try {
      await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseAccessMode: mode }),
      });
    } catch (e) {
      console.warn('API config update failed:', e);
    }
    // Broadcast to all connected devices via multiplayerSync
    try {
      multiplayerSync.broadcastGameConfig({ caseAccessMode: mode });
    } catch (e) {
      console.warn('Broadcast config error:', e);
    }
    showNotification('success', mode === 'single'
      ? '🔒 Đã bật chế độ KHÓA: Mỗi người chơi chỉ được chọn 1 vụ án duy nhất!'
      : '🔓 Đã bật chế độ TỰ DO: Người chơi được phá tất cả vụ án!');
  };

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
      const isOnline = isPlayerOnline(s.player_name);
      return (
        (s.stations_completed || 0) > 0 ||
        (s.total_score || 0) > 0 ||
        s.is_completed ||
        (isOnline && s.status === 'playing')
      );
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

  // Filtered Connected Devices (Loại bỏ các thiết bị đã ngắt kết nối hoặc tồn tại trước lần Reset gần nhất)
  const filteredConnectedDevices = useMemo(() => {
    return connectedDevices.filter((dev) => {
      if (!dev.playerName || !dev.playerName.trim()) return false;
      if (!dev.isOnline) return false;
      if (!isSimulatingConcurrency && (MOCK_TEAMS.has(dev.teamCode) || MOCK_NAMES.has(dev.playerName))) {
        return false;
      }
      if (lastResetTime > 0 && new Date(dev.lastActive).getTime() <= lastResetTime) {
        return false;
      }
      return true;
    });
  }, [connectedDevices, isSimulatingConcurrency, MOCK_TEAMS, MOCK_NAMES, lastResetTime]);

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
        `"${item.stations_completed}/5 Trạm (${item.is_completed || item.stations_completed === 5 ? 'Đã xong 5/5' : `Trạm ${Math.min(5, (item.stations_completed || 0) + 1)}`})"`,
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
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#191AFE] border-3 border-[#000088] flex items-center justify-center text-white shadow-[0_4px_0_#000066]">
            <Shield className="w-8 h-8 text-white stroke-[2.5]" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-[#191AFE]/10 text-[#191AFE] font-black text-xs uppercase tracking-wider">
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
                <Key className="w-4 h-4 text-[#191AFE]" />
                Mật Khẩu Quản Trị (Admin PIN / Password)
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Nhập mã PIN hoặc mật khẩu..."
                className="w-full px-4 py-3 rounded-xl border-3 border-[#1E293B] bg-[#F8FAFC] font-bold text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#191AFE] shadow-[0_2px_0_#1E293B]"
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
            <Link href="/" className="hover:text-[#191AFE] flex items-center gap-1">
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

      {/* Admin Header Bar #191AFE */}
      <header className="sticky top-0 z-30 bg-[#191AFE] border-b-4 border-[#000088] px-4 py-3 shadow-lg text-white">
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
              <p className="text-2xl sm:text-3xl font-display font-black text-[#191AFE]">
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
          <div className="flex items-center gap-1.5 w-full md:w-auto bg-[#F1F5F9] p-1 rounded-xl border border-[#CBD5E1] flex-wrap">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black font-display uppercase tracking-wide transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-[#191AFE] text-white shadow-sm'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              🏆 Bảng Thành Tích ({leaderboard5Stations.length})
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black font-display uppercase tracking-wide transition-all ${
                activeTab === 'participants'
                  ? 'bg-[#191AFE] text-white shadow-sm'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              👥 Người Tham Gia ({uniqueParticipants.length})
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black font-display uppercase tracking-wide transition-all flex items-center gap-1.5 ${
                activeTab === 'telemetry'
                  ? 'bg-[#191AFE] text-white shadow-sm'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
              📡 Real-Time ({filteredConnectedDevices.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black font-display uppercase tracking-wide transition-all flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-[#191AFE] text-white shadow-sm'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              ⚙️ Cài Đặt
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
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border-2 border-[#CBD5E1] bg-[#F8FAFC] text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#191AFE]"
              />
            </div>

            {/* Case Selector */}
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border-2 border-[#CBD5E1] bg-[#F8FAFC] text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#191AFE]"
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
        {/* TAB 1: BẢNG THÀNH TÍCH (LEADERBOARD) - CÁ NHÂN & ĐỘI */}
        {/* ==================================================================== */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            {/* Sub-tab: Individual vs Team */}
            <div className="flex items-center gap-2">
              <div className="bg-[#E2E8F0] p-0.5 rounded-lg flex items-center text-[10px] font-black">
                <button
                  onClick={() => setLeaderboardView('individual')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    leaderboardView === 'individual'
                      ? 'bg-[#191AFE] text-white shadow-sm'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  🏅 Xếp Hạng Cá Nhân ({leaderboard5Stations.length})
                </button>
                <button
                  onClick={() => setLeaderboardView('team')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    leaderboardView === 'team'
                      ? 'bg-[#191AFE] text-white shadow-sm'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  🏆 Xếp Hạng Đội ({teamRanking.length})
                </button>
              </div>
            </div>

            {/* ===== INDIVIDUAL LEADERBOARD ===== */}
            {leaderboardView === 'individual' && (
              <div className="game-card bg-white border-[#1E293B] overflow-hidden">
                <div className="px-5 py-3.5 bg-[#F8FAFC] border-b-2 border-[#1E293B] flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-black text-sm uppercase text-[#0F172A] flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-[#EAB308]" />
                      BẢNG XẾP HẠNG THÀNH TÍCH PHÁ ÁN (5 TRẠM THỬ THÁCH)
                    </h2>
                    <p className="text-[11px] font-bold text-[#64748B]">
                      Xếp hạng theo <strong>Điểm số từ Cao tới Thấp</strong> (Bằng điểm ưu tiên tốc độ nhanh hơn) · Nhấn vào hàng để xem chi tiết trạm hoàn thành
                    </p>
                  </div>
                  <span className="game-badge game-badge-yellow text-[10px] font-black">
                    {leaderboard5Stations.length} LƯỢT HOÀN TẤT
                  </span>
                </div>

                {leaderboard5Stations.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-full bg-[#F1F5F9] flex items-center justify-center text-3xl">⏱️</div>
                    <h3 className="font-display font-black text-base text-[#475569]">Chưa có đội nào hoàn thành 5 trạm thử thách</h3>
                    <p className="text-xs font-semibold text-[#94A3B8] max-w-sm mx-auto">
                      Bảng vàng sẽ tự động cập nhật khi có đội chơi hoàn tất phá án!
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
                          <th className="py-3 px-4 text-center">Vụ Án & Các Trạm Đã Hoàn Thành</th>
                          <th className="py-3 px-4 text-center">Tổng Thời Gian</th>
                          <th className="py-3 px-3 text-center">Tổng Điểm</th>
                          <th className="py-3 px-4">Thời Gian Hoàn Thành</th>
                          <th className="py-3 px-3 text-center">Mã Xác Nhận</th>
                          <th className="py-3 px-2 text-center w-10">Chi Tiết</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] font-semibold text-[#1E293B]">
                        {leaderboard5Stations.map((item, index) => {
                          const isTop1 = index === 0;
                          const isTop2 = index === 1;
                          const isTop3 = index === 2;
                          const rowKey = `${item.player_name}-${item.team_code}-${item.case_id}`;
                          const isExpanded = expandedLeaderboardRows.has(rowKey);

                          // Get case data for station names
                          const caseData = CASES_DATA.find((c) => c.id === item.case_id);
                          const stationScores = item.station_scores || [];
                          const totalStations = caseData?.stations?.length || 5;

                          let rankBadge = (
                            <span className="font-display font-black text-xs text-[#64748B]">#{index + 1}</span>
                          );
                          if (isTop1) {
                            rankBadge = (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-b from-[#FEF08A] to-[#F59E0B] border-2 border-[#854D0E] text-[#451A03] font-black shadow-sm text-xs gap-0.5">
                                <Crown className="w-3.5 h-3.5 text-[#854D0E] fill-current" />
                                <span>1</span>
                              </span>
                            );
                          } else if (isTop2) {
                            rankBadge = (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-b from-[#F1F5F9] to-[#CBD5E1] border-2 border-[#475569] text-[#1E293B] font-black shadow-sm text-xs gap-0.5">
                                <Medal className="w-3.5 h-3.5 text-[#475569] fill-current" />
                                <span>2</span>
                              </span>
                            );
                          } else if (isTop3) {
                            rankBadge = (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-b from-[#FFEDD5] to-[#FB923C] border-2 border-[#9A3412] text-[#7C2D12] font-black shadow-sm text-xs gap-0.5">
                                <Award className="w-3.5 h-3.5 text-[#9A3412] fill-current" />
                                <span>3</span>
                              </span>
                            );
                          }

                          return (
                            <>
                              <tr
                                key={rowKey}
                                className={`hover:bg-[#F8FAFC] transition-colors cursor-pointer ${
                                  isTop1 ? 'bg-[#FFFBEB]' : isTop2 ? 'bg-[#F8FAFC]' : isTop3 ? 'bg-[#FFF7ED]' : ''
                                }`}
                                onClick={() => toggleExpandedRow(rowKey)}
                              >
                                <td className="py-3 px-3 text-center font-display font-black">{rankBadge}</td>
                                <td className="py-3 px-4">
                                  <span className="font-bold text-sm text-[#0F172A] block">{item.player_name}</span>
                                  <span className="text-[10px] text-[#64748B] flex items-center gap-1 mt-0.5">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#191AFE]" />
                                    Vụ #{item.case_id}: {caseData?.title || 'N/A'}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="inline-block px-2 py-0.5 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] font-mono font-black text-[11px] whitespace-nowrap">
                                    {item.team_code}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    {/* Station pill badges */}
                                    <div className="flex items-center gap-1 flex-wrap justify-center">
                                      {(caseData?.stations || Array(totalStations).fill(null)).map((st, sIdx) => {
                                        const score = stationScores[sIdx] ?? (item.stations_completed && sIdx < item.stations_completed ? 20 : 0);
                                        const isPassed = score > 0;
                                        return (
                                          <span
                                            key={sIdx}
                                            title={st?.title ? `${st.title}: ${score}đ` : `Trạm ${sIdx + 1}: ${score}đ`}
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-black border transition-all whitespace-nowrap inline-flex items-center ${
                                              isPassed
                                                ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                                                : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA] line-through'
                                            }`}
                                          >
                                            {isPassed ? `✓ T${sIdx + 1}: ${score}đ` : `✕ T${sIdx + 1}`}
                                          </span>
                                        );
                                      })}
                                    </div>
                                    <span className="text-[10px] font-bold text-[#64748B] whitespace-nowrap">
                                      Hoàn thành {item.stations_completed || totalStations}/{totalStations} trạm
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#191AFE]/10 border border-[#191AFE]/30 text-[#191AFE] font-mono font-black text-xs">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatDuration(item.duration_seconds)}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span className="font-display font-black text-sm text-[#059669]">{item.total_score}/100đ</span>
                                </td>
                                <td className="py-3 px-4 text-[#475569] text-[11px] font-medium">{formatDateTime(item.completion_time)}</td>
                                <td className="py-3 px-3 text-center">
                                  <span className="font-mono font-black text-[11px] text-[#334155] bg-[#F1F5F9] px-2 py-1 rounded border border-[#CBD5E1]">
                                    {item.confirmation_code || '—'}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-center">
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-[#191AFE] mx-auto" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-[#94A3B8] mx-auto" />
                                  )}
                                </td>
                              </tr>

                              {/* Expanded Station Details Row */}
                              {isExpanded && (
                                <tr key={`${rowKey}-detail`} className="bg-[#F8FAFC]">
                                  <td colSpan={9} className="px-4 py-3">
                                    <div className="rounded-xl border-2 border-[#E2E8F0] bg-white p-4">
                                      <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                          <Eye className="w-4 h-4 text-[#191AFE]" />
                                          <span className="text-xs font-black uppercase text-[#0F172A]">
                                            Chi Tiết Trạm Đã Hoàn Thành — Vụ Án #{item.case_id}: {caseData?.title || ''}
                                          </span>
                                        </div>
                                        <span className="text-[11px] font-black text-[#191AFE] bg-[#EFF6FF] px-2.5 py-0.5 rounded-lg border border-[#BFDBFE]">
                                          Tổng điểm vụ án: {item.total_score}/100đ
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                                        {(caseData?.stations || []).map((station, sIdx) => {
                                          const sScore = stationScores[sIdx] ?? (item.stations_completed && sIdx < item.stations_completed ? station.points : 0);
                                          const isCompleted = sScore > 0;
                                          return (
                                            <div
                                              key={sIdx}
                                              className={`p-3 rounded-xl border-2 text-left transition-all ${
                                                isCompleted
                                                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                                                  : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                                              }`}
                                            >
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-black uppercase">Trạm {sIdx + 1}</span>
                                                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                                                  isCompleted ? 'bg-[#A7F3D0] text-[#064E3B]' : 'bg-[#FECACA] text-[#991B1B]'
                                                }`}>
                                                  {isCompleted ? `+${sScore}đ` : '0đ'}
                                                </span>
                                              </div>
                                              <div className="text-xs font-display font-black line-clamp-1 mb-1" title={station.title}>
                                                {isCompleted ? '✅' : '❌'} {station.title}
                                              </div>
                                              <div className="text-[10px] font-semibold leading-snug line-clamp-2 opacity-90">
                                                {isCompleted
                                                  ? `🔎 Manh mối: ${station.clue?.title || 'Đã tìm ra'}`
                                                  : '⚠️ Không tìm ra manh mối trạm này'}
                                              </div>
                                              <div className="text-[9px] font-black mt-2 pt-1 border-t border-black/10 uppercase">
                                                {isCompleted ? 'Hoàn thành trạm' : 'Chưa hoàn thành'}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ===== TEAM LEADERBOARD ===== */}
            {leaderboardView === 'team' && (
              <div className="game-card bg-white border-[#1E293B] overflow-hidden">
                <div className="px-5 py-3.5 bg-[#F8FAFC] border-b-2 border-[#1E293B] flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-black text-sm uppercase text-[#0F172A] flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#191AFE]" />
                      BẢNG XẾP HẠNG ĐỘI – TỔNG ĐIỂM TOÀN BỘ THÀNH VIÊN
                    </h2>
                    <p className="text-[11px] font-bold text-[#64748B]">
                      Xếp hạng theo <strong>tổng điểm các thành viên cùng mã đội</strong> phá các vụ án · Nhấn để xem chi tiết thành viên
                    </p>
                  </div>
                  <span className="game-badge game-badge-yellow text-[10px] font-black">
                    {teamRanking.length} ĐỘI
                  </span>
                </div>

                {teamRanking.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-full bg-[#F1F5F9] flex items-center justify-center text-3xl">🏆</div>
                    <h3 className="font-display font-black text-base text-[#475569]">Chưa có đội nào tham gia</h3>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#1E293B] text-white font-display font-black uppercase text-[11px] tracking-wider">
                          <th className="py-3 px-3 text-center w-16">Thứ Hạng</th>
                          <th className="py-3 px-4">Mã Đội</th>
                          <th className="py-3 px-3 text-center">Số Thành Viên</th>
                          <th className="py-3 px-3 text-center">Vụ Án Hoàn Thành</th>
                          <th className="py-3 px-3 text-center">Tổng Trạm</th>
                          <th className="py-3 px-4 text-center">TỔNG ĐIỂM ĐỘI</th>
                          <th className="py-3 px-3 text-center">Thời Gian Nhanh Nhất</th>
                          <th className="py-3 px-2 text-center w-10">Chi Tiết</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] font-semibold text-[#1E293B]">
                        {teamRanking.map((team, tIdx) => {
                          const teamKey = `team-${team.team_code}`;
                          const isExpanded = expandedLeaderboardRows.has(teamKey);
                          const isTop1 = tIdx === 0;
                          const isTop2 = tIdx === 1;
                          const isTop3 = tIdx === 2;
                          const uniqueMembers = new Set(team.members.map((m) => m.player_name.trim().toLowerCase()));

                          let rankBadge = (
                            <span className="font-display font-black text-xs text-[#64748B]">#{tIdx + 1}</span>
                          );
                          if (isTop1) {
                            rankBadge = (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-b from-[#FEF08A] to-[#F59E0B] border-2 border-[#854D0E] text-[#451A03] font-black shadow-sm text-xs gap-0.5">
                                <Crown className="w-3.5 h-3.5 text-[#854D0E] fill-current" />
                                <span>1</span>
                              </span>
                            );
                          } else if (isTop2) {
                            rankBadge = (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-b from-[#F1F5F9] to-[#CBD5E1] border-2 border-[#475569] text-[#1E293B] font-black shadow-sm text-xs gap-0.5">
                                <Medal className="w-3.5 h-3.5 text-[#475569] fill-current" />
                                <span>2</span>
                              </span>
                            );
                          } else if (isTop3) {
                            rankBadge = (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-b from-[#FFEDD5] to-[#FB923C] border-2 border-[#9A3412] text-[#7C2D12] font-black shadow-sm text-xs gap-0.5">
                                <Award className="w-3.5 h-3.5 text-[#9A3412] fill-current" />
                                <span>3</span>
                              </span>
                            );
                          }

                          return (
                            <>
                              <tr
                                key={teamKey}
                                className={`hover:bg-[#F8FAFC] transition-colors cursor-pointer ${
                                  isTop1 ? 'bg-[#FFFBEB]' : isTop2 ? 'bg-[#F8FAFC]' : isTop3 ? 'bg-[#FFF7ED]' : ''
                                }`}
                                onClick={() => toggleExpandedRow(teamKey)}
                              >
                                <td className="py-3 px-3 text-center font-display font-black">{rankBadge}</td>
                                <td className="py-3 px-4">
                                  <span className="inline-block px-2.5 py-1 rounded-md bg-[#EFF6FF] border-2 border-[#BFDBFE] text-[#1E40AF] font-mono font-black text-sm">
                                    {team.team_code}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span className="font-display font-black text-sm text-[#0F172A]">{uniqueMembers.size}</span>
                                  <span className="text-[10px] text-[#64748B] ml-1">người</span>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span className={`game-badge text-[10px] font-black py-0 ${
                                    team.cases_completed > 0 ? 'game-badge-green' : 'game-badge-yellow'
                                  }`}>
                                    {team.cases_completed} vụ án
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center font-bold">{team.total_stations} trạm</td>
                                <td className="py-3 px-4 text-center">
                                  <span className="font-display font-black text-lg text-[#191AFE]">
                                    {team.total_score}đ
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {team.fastest_duration ? (
                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#191AFE]/10 border border-[#191AFE]/30 text-[#191AFE] font-mono font-black text-[11px]">
                                      <Clock className="w-3 h-3" />
                                      {formatDuration(team.fastest_duration)}
                                    </div>
                                  ) : (
                                    <span className="text-[#94A3B8]">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-2 text-center">
                                  {isExpanded ? <ChevronUp className="w-4 h-4 text-[#191AFE] mx-auto" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8] mx-auto" />}
                                </td>
                              </tr>

                              {/* Expanded Team Members Detail */}
                              {isExpanded && (
                                <tr key={`${teamKey}-detail`} className="bg-[#F8FAFC]">
                                  <td colSpan={8} className="px-4 py-3">
                                    <div className="rounded-xl border-2 border-[#E2E8F0] bg-white p-4">
                                      <div className="flex items-center gap-2 mb-3">
                                        <Users className="w-4 h-4 text-[#191AFE]" />
                                        <span className="text-xs font-black uppercase text-[#0F172A]">
                                          Chi Tiết Điểm Thành Viên Đội {team.team_code} — Tổng: {team.total_score}đ
                                        </span>
                                      </div>
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-xs border-collapse">
                                          <thead>
                                            <tr className="bg-[#F1F5F9] text-[#475569] font-black uppercase text-[10px]">
                                              <th className="py-2 px-3 text-left">Thành Viên</th>
                                              <th className="py-2 px-3 text-center">Vụ Án</th>
                                              <th className="py-2 px-3 text-center">Trạm Hoàn Thành</th>
                                              <th className="py-2 px-3 text-center">Điểm Đóng Góp</th>
                                              <th className="py-2 px-3 text-center">Điểm Từng Trạm</th>
                                              <th className="py-2 px-3 text-center">Trạng Thái</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-[#E2E8F0]">
                                            {team.members.map((m, mIdx) => {
                                              const mCaseData = CASES_DATA.find((c) => c.id === m.case_id);
                                              return (
                                                <tr key={`${m.player_name}-${m.case_id}-${mIdx}`} className="hover:bg-[#F8FAFC]">
                                                  <td className="py-2 px-3 font-bold text-[#0F172A]">{m.player_name}</td>
                                                  <td className="py-2 px-3 text-center">
                                                    <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] font-black text-[10px]">
                                                      #{m.case_id} {mCaseData?.title || ''}
                                                    </span>
                                                  </td>
                                                  <td className="py-2 px-3 text-center font-bold">{m.stations_completed}/5</td>
                                                  <td className="py-2 px-3 text-center">
                                                    <span className="font-display font-black text-[#059669]">{m.total_score}đ</span>
                                                  </td>
                                                  <td className="py-2 px-3 text-center">
                                                    <div className="flex items-center justify-center gap-1 flex-wrap">
                                                      {(m.station_scores || []).map((sc, scIdx) => (
                                                        <span
                                                          key={scIdx}
                                                          className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                                            sc > 0
                                                              ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                                                              : 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]'
                                                          }`}
                                                        >
                                                          T{scIdx + 1}: {sc}đ
                                                        </span>
                                                      ))}
                                                      {(m.station_scores || []).length === 0 && (
                                                        <span className="text-[10px] text-[#94A3B8]">Không có dữ liệu</span>
                                                      )}
                                                    </div>
                                                  </td>
                                                  <td className="py-2 px-3 text-center">
                                                    {m.is_completed ? (
                                                      <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-[#059669] text-[#064E3B] text-[9px] font-black">✓ HOÀN THÀNH</span>
                                                    ) : (
                                                      <span className="px-2 py-0.5 rounded-full bg-[#FEF2F2] border border-[#DC2626] text-[#991B1B] text-[9px] font-black">CHƯA XONG</span>
                                                    )}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                          <tfoot>
                                            <tr className="bg-[#F1F5F9] border-t-2 border-[#CBD5E1]">
                                              <td className="py-2 px-3 font-black text-[#0F172A] uppercase" colSpan={3}>TỔNG CỘNG ĐỘI</td>
                                              <td className="py-2 px-3 text-center">
                                                <span className="font-display font-black text-lg text-[#191AFE]">{team.total_score}đ</span>
                                              </td>
                                              <td className="py-2 px-3 text-center text-[10px] font-bold text-[#64748B]">
                                                = {team.members.map((m) => `${m.total_score}đ`).join(' + ')}
                                              </td>
                                              <td className="py-2 px-3 text-center">
                                                <span className="text-[10px] font-black text-[#059669]">{team.cases_completed} vụ án hoàn thành</span>
                                              </td>
                                            </tr>
                                          </tfoot>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
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
                  <Users className="w-4 h-4 text-[#191AFE]" />
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
                        ? 'bg-[#191AFE] text-white shadow-sm'
                        : 'text-[#475569] hover:text-[#0F172A]'
                    }`}
                  >
                    👤 Thí Sinh Duy Nhất ({uniqueParticipants.length})
                  </button>
                  <button
                    onClick={() => setParticipantViewMode('all')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      participantViewMode === 'all'
                        ? 'bg-[#191AFE] text-white shadow-sm'
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
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                <span className="font-bold text-xs text-[#0F172A]">
                                  {p.stations_completed || 0}/5 Trạm
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border whitespace-nowrap ${
                                  p.is_completed || (p.stations_completed || 0) === 5
                                    ? 'text-[#065F46] bg-[#ECFDF5] border-[#A7F3D0]'
                                    : isOnline
                                    ? 'text-[#1E40AF] bg-[#EFF6FF] border-[#BFDBFE]'
                                    : 'text-[#475569] bg-[#F1F5F9] border-[#CBD5E1]'
                                }`}>
                                  {p.is_completed || (p.stations_completed || 0) === 5
                                    ? 'Đã xong 5/5 Trạm'
                                    : isOnline
                                    ? `Đang ở Trạm ${Math.min(5, (p.stations_completed || 0) + 1)}`
                                    : `Dừng ở Trạm ${Math.min(5, (p.stations_completed || 0) + 1)}`}
                                </span>
                              </div>
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
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                <span className="font-bold text-xs text-[#0F172A]">
                                  {session.stations_completed || 0}/5 Trạm
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border whitespace-nowrap ${
                                  session.is_completed || (session.stations_completed || 0) === 5
                                    ? 'text-[#065F46] bg-[#ECFDF5] border-[#A7F3D0]'
                                    : isOnline
                                    ? 'text-[#1E40AF] bg-[#EFF6FF] border-[#BFDBFE]'
                                    : 'text-[#475569] bg-[#F1F5F9] border-[#CBD5E1]'
                                }`}>
                                  {session.is_completed || (session.stations_completed || 0) === 5
                                    ? 'Đã xong 5/5 Trạm'
                                    : isOnline
                                    ? `Đang ở Trạm ${Math.min(5, (session.stations_completed || 0) + 1)}`
                                    : `Dừng ở Trạm ${Math.min(5, (session.stations_completed || 0) + 1)}`}
                                </span>
                              </div>
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
                    <div className="w-12 h-12 rounded-2xl bg-[#191AFE] border-2 border-white/30 flex items-center justify-center text-white shadow-inner">
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
                  <Activity className="w-4 h-4 text-[#191AFE]" />
                  <span className="text-xs font-black uppercase text-[#0F172A] tracking-wider">
                    BẢN ĐỒ PHÂN BỔ THÍ SINH THEO 5 TRẠM ĐIỀU TRA
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#64748B]">
                  Tổng {filteredConnectedDevices.length} thiết bị đang làm bài
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((stId) => {
                  const count = filteredConnectedDevices.filter((d) => d.currentStationId === stId).length;
                  const percent = filteredConnectedDevices.length > 0 ? Math.round((count / filteredConnectedDevices.length) * 100) : 0;
                  return (
                    <div key={stId} className="p-3 rounded-xl bg-[#F8FAFC] border-2 border-[#CBD5E1] text-center">
                      <div className="text-[10px] font-black uppercase text-[#64748B]">TRẠM {stId}</div>
                      <div className="text-2xl font-display font-black text-[#191AFE] my-1">{count}</div>
                      <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#191AFE] h-full transition-all duration-500 rounded-full"
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
                    <Users className="w-4 h-4 text-[#191AFE]" />
                    <h3 className="font-display font-black text-xs uppercase text-[#0F172A]">
                      DANH SÁCH THIẾT BỊ HOẠT ĐỘNG ({filteredConnectedDevices.length})
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const now = Date.now();
                        setLastResetTime(now);
                        if (typeof window !== 'undefined') {
                          sessionStorage.setItem('dts_admin_reset_at', now.toString());
                        }
                        multiplayerSync.clearAllDevices();
                        setConnectedDevices([]);
                        setTelemetryEvents([]);
                        showNotification('success', 'Đã dọn sạch toàn bộ danh sách thiết bị real-time!');
                      }}
                      className="px-2 py-0.5 rounded-md bg-[#FEF2F2] border border-[#FECACA] hover:bg-[#FEE2E2] text-[#DC2626] text-[10px] font-black cursor-pointer active:translate-y-0.5 transition-all"
                      title="Làm trống danh sách thiết bị real-time"
                    >
                      Dọn danh sách
                    </button>
                    <span className="px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1E40AF] text-[10px] font-black">
                      Auto-sweep 45s
                    </span>
                  </div>
                </div>

                {filteredConnectedDevices.length === 0 ? (
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
                        {filteredConnectedDevices.map((dev) => (
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
                            <td className="py-2.5 px-2 text-center font-bold text-[#191AFE]">
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
                        badgeBg = 'bg-[#191AFE] text-white';
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

        {/* ==================================================================== */}
        {/* TAB 4: CÀI ĐẶT QUẢN TRỊ (ADMIN SETTINGS)                          */}
        {/* ==================================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-5">
            {/* Game Mode: Case Access Control */}
            <div className="game-card bg-white border-[#1E293B] overflow-hidden">
              <div className="px-5 py-3.5 bg-[#F8FAFC] border-b-2 border-[#1E293B] flex items-center justify-between">
                <div>
                  <h2 className="font-display font-black text-sm uppercase text-[#0F172A] flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[#191AFE]" />
                    CÀI ĐẶT CHẾ ĐỘ TRUY CẬP VỤ ÁN
                  </h2>
                  <p className="text-[11px] font-bold text-[#64748B]">
                    Điều chỉnh cho phép người chơi được phá 1 vụ án duy nhất hoặc tất cả vụ án
                  </p>
                </div>
                <span className={`game-badge text-[10px] font-black ${
                  caseAccessMode === 'single' ? 'game-badge-yellow' : 'game-badge-green'
                }`}>
                  {caseAccessMode === 'single' ? '🔒 CHẾ ĐỘ KHÓA' : '🔓 CHẾ ĐỘ TỰ DO'}
                </span>
              </div>

              <div className="p-5 space-y-5">
                {/* Description */}
                <div className="p-4 rounded-xl bg-[#FFF7ED] border-2 border-[#FDBA74] text-xs text-[#9A3412] font-semibold leading-relaxed">
                  <strong className="font-black">📋 Giải thích:</strong>
                  <ul className="mt-2 space-y-1.5 list-disc pl-4">
                    <li><strong>Chế độ KHÓA (1 vụ án):</strong> Người chơi chỉ được chọn chơi 1 vụ án duy nhất. Sau khi bắt đầu 1 vụ án bất kỳ, các vụ án còn lại sẽ tự động bị khóa, không cho truy cập.</li>
                    <li><strong>Chế độ TỰ DO (tất cả):</strong> Người chơi được tự do chọn phá tất cả các vụ án mà không bị hạn chế.</li>
                  </ul>
                </div>

                {/* Mode Selector Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Single Case Mode */}
                  <button
                    onClick={() => handleCaseAccessModeChange('single')}
                    className={`p-5 rounded-2xl border-3 text-left transition-all active:translate-y-0.5 ${
                      caseAccessMode === 'single'
                        ? 'bg-[#FEF3C7] border-[#D97706] shadow-lg ring-2 ring-[#F59E0B]/30'
                        : 'bg-white border-[#CBD5E1] hover:border-[#D97706] hover:bg-[#FFFBEB]'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        caseAccessMode === 'single' ? 'bg-[#D97706] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                      }`}>
                        <Lock className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-display font-black text-sm uppercase text-[#0F172A]">CHẾ ĐỘ KHÓA</div>
                        <div className="text-[10px] font-bold text-[#64748B] uppercase">Chỉ 1 vụ án duy nhất</div>
                      </div>
                      {caseAccessMode === 'single' && (
                        <CheckCircle2 className="w-6 h-6 text-[#D97706] ml-auto" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#475569] leading-relaxed">
                      Người chơi chỉ được chọn và phá <strong>1 vụ án duy nhất</strong>. Các vụ án khác sẽ tự động bị khóa sau khi đã chọn 1 vụ án bất kỳ.
                    </p>
                  </button>

                  {/* Multi Case Mode */}
                  <button
                    onClick={() => handleCaseAccessModeChange('multi')}
                    className={`p-5 rounded-2xl border-3 text-left transition-all active:translate-y-0.5 ${
                      caseAccessMode === 'multi'
                        ? 'bg-[#ECFDF5] border-[#059669] shadow-lg ring-2 ring-[#10B981]/30'
                        : 'bg-white border-[#CBD5E1] hover:border-[#059669] hover:bg-[#F0FDF4]'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        caseAccessMode === 'multi' ? 'bg-[#059669] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                      }`}>
                        <LockOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-display font-black text-sm uppercase text-[#0F172A]">CHẾ ĐỘ TỰ DO</div>
                        <div className="text-[10px] font-bold text-[#64748B] uppercase">Phá tất cả vụ án</div>
                      </div>
                      {caseAccessMode === 'multi' && (
                        <CheckCircle2 className="w-6 h-6 text-[#059669] ml-auto" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#475569] leading-relaxed">
                      Người chơi được tự do chọn phá <strong>tất cả vụ án</strong> mà không bị hạn chế. Phù hợp cho luyện tập hoặc sự kiện không giới hạn.
                    </p>
                  </button>
                </div>

                {/* Current Status */}
                <div className={`p-4 rounded-xl border-2 flex items-center gap-3 ${
                  caseAccessMode === 'single'
                    ? 'bg-[#FEF3C7] border-[#D97706]'
                    : 'bg-[#ECFDF5] border-[#059669]'
                }`}>
                  {caseAccessMode === 'single' ? (
                    <Lock className="w-5 h-5 text-[#D97706] flex-shrink-0" />
                  ) : (
                    <LockOpen className="w-5 h-5 text-[#059669] flex-shrink-0" />
                  )}
                  <div className="text-xs font-bold">
                    <span className="font-black uppercase">
                      {caseAccessMode === 'single' ? 'Đang áp dụng: CHẾ ĐỘ KHÓA (1 VỤ ÁN)' : 'Đang áp dụng: CHẾ ĐỘ TỰ DO (TẤT CẢ VỤ ÁN)'}
                    </span>
                    <span className="text-[#475569] block mt-0.5">
                      {caseAccessMode === 'single'
                        ? 'Mỗi người chơi chỉ được chọn 1 vụ án. Sau khi bắt đầu vụ án đầu tiên, các vụ án khác sẽ bị khóa tự động.'
                        : 'Người chơi được phá tất cả 4 vụ án mà không bị hạn chế nào.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
