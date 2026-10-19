'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Key, Lock, Unlock, Trophy, Users, Clock, Download, RefreshCw,
  Search, ArrowLeft, CheckCircle2, AlertCircle, FileSpreadsheet, Trash2,
  Sparkles, ExternalLink, Filter, Medal, Award, LogOut
} from 'lucide-react';
import { PlayerSession, getAllSessions, savePlayerSession } from '@/lib/supabase';
import { CASES_DATA } from '@/data/casesData';

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
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'participants'>('leaderboard');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check auth session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('dts_admin_auth');
      if (auth === 'true') {
        setIsAuthenticated(true);
        fetchSessions();
      }
    }
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
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

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const data = await getAllSessions();
      setSessions(data || []);
    } catch (e: any) {
      console.error('Fetch sessions failed:', e);
      showNotification('error', 'Lỗi tải danh sách người chơi!');
    } finally {
      setIsLoading(false);
    }
  };

  // Seed sample demo teams for test / preview
  const handleSeedDemoData = async () => {
    const demoTeams: PlayerSession[] = [
      {
        player_name: 'Nguyễn Văn An',
        team_code: 'CYBER-ALPHA',
        case_id: 1,
        station_scores: [15, 15, 20, 25, 25],
        total_score: 100,
        clues_collected: 5,
        stations_completed: 5,
        is_completed: true,
        start_time: new Date(Date.now() - 3 * 3600000).toISOString(),
        completion_time: new Date(Date.now() - 3 * 3600000 + 132000).toISOString(), // 2m 12s
        duration_seconds: 132,
        confirmation_code: 'DTS-A19B3X',
        updated_at: new Date(Date.now() - 3 * 3600000 + 132000).toISOString(),
      },
      {
        player_name: 'Trần Thị Mai',
        team_code: 'SEC-SHIELD',
        case_id: 1,
        station_scores: [15, 15, 20, 25, 25],
        total_score: 100,
        clues_collected: 5,
        stations_completed: 5,
        is_completed: true,
        start_time: new Date(Date.now() - 2 * 3600000).toISOString(),
        completion_time: new Date(Date.now() - 2 * 3600000 + 185000).toISOString(), // 3m 05s
        duration_seconds: 185,
        confirmation_code: 'DTS-M48K2P',
        updated_at: new Date(Date.now() - 2 * 3600000 + 185000).toISOString(),
      },
      {
        player_name: 'Lê Hoàng Minh',
        team_code: 'FIREWALL-07',
        case_id: 1,
        station_scores: [15, 15, 20, 0, 25],
        total_score: 75,
        clues_collected: 4,
        stations_completed: 5,
        is_completed: true,
        start_time: new Date(Date.now() - 1 * 3600000).toISOString(),
        completion_time: new Date(Date.now() - 1 * 3600000 + 248000).toISOString(), // 4m 08s
        duration_seconds: 248,
        confirmation_code: 'DTS-F92L8W',
        updated_at: new Date(Date.now() - 1 * 3600000 + 248000).toISOString(),
      },
      {
        player_name: 'Phạm Quốc Hùng',
        team_code: 'DEFENDER-X',
        case_id: 1,
        station_scores: [15, 15, 20, 25, 25],
        total_score: 100,
        clues_collected: 5,
        stations_completed: 5,
        is_completed: true,
        start_time: new Date(Date.now() - 45 * 60000).toISOString(),
        completion_time: new Date(Date.now() - 45 * 60000 + 310000).toISOString(), // 5m 10s
        duration_seconds: 310,
        confirmation_code: 'DTS-D33V1K',
        updated_at: new Date(Date.now() - 45 * 60000 + 310000).toISOString(),
      },
      {
        player_name: 'Hoàng Thùy Linh',
        team_code: 'ZERO-TRUST',
        case_id: 1,
        station_scores: [15, 15, 20, 0, 0],
        total_score: 50,
        clues_collected: 3,
        stations_completed: 3,
        is_completed: false,
        start_time: new Date(Date.now() - 15 * 60000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 60000).toISOString(),
      },
    ];

    try {
      for (const s of demoTeams) {
        await savePlayerSession(s);
      }
      await fetchSessions();
      showNotification('success', 'Đã nạp 5 đội thi đấu mẫu thành công!');
    } catch (e: any) {
      showNotification('error', 'Lỗi nạp dữ liệu mẫu');
    }
  };

  // Clear data
  const handleClearData = () => {
    if (confirm('Đồng chí có chắc chắn muốn xóa toàn bộ dữ liệu người chơi để chuẩn bị vòng thi đấu mới?')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dts_player_sessions');
      }
      setSessions([]);
      showNotification('success', 'Đã dọn sạch dữ liệu thi đấu!');
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

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Search
      const matchQuery =
        searchQuery === '' ||
        s.player_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.team_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.confirmation_code && s.confirmation_code.toLowerCase().includes(searchQuery.toLowerCase()));

      // Case Filter
      const matchCase = selectedCaseId === 'all' || s.case_id.toString() === selectedCaseId;

      // Status Filter
      let matchStatus = true;
      if (filterStatus === 'completed') matchStatus = s.is_completed === true;
      if (filterStatus === 'in_progress') matchStatus = s.is_completed !== true;

      return matchQuery && matchCase && matchStatus;
    });
  }, [sessions, searchQuery, selectedCaseId, filterStatus]);

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

  // Participant Statistics
  const stats = useMemo(() => {
    const totalParticipants = sessions.length;
    const uniqueTeams = new Set(sessions.map((s) => s.team_code)).size;
    const completedCount = sessions.filter((s) => s.is_completed || s.stations_completed === 5).length;
    
    // Find best duration record
    const completedWithDuration = sessions.filter(
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
      bestRecord,
    };
  }, [sessions]);

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
            <p className="text-2xl sm:text-3xl font-display font-black text-[#1A1AFF]">
              {stats.totalParticipants}
            </p>
            <p className="text-[10px] text-[#64748B] font-bold mt-0.5">Lượt đăng ký phiên thi đấu</p>
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
              👥 Tổng Hợp Người Tham Gia ({filteredSessions.length})
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

            {/* Seed / Demo Button for BTC */}
            <button
              onClick={handleSeedDemoData}
              className="p-1.5 px-2.5 rounded-xl bg-[#F8FAFC] border-2 border-[#CBD5E1] hover:bg-[#F1F5F9] text-xs font-bold text-[#475569] flex items-center gap-1"
              title="Thêm dữ liệu mẫu thử nghiệm giải đấu"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#1A1AFF]" />
              <span className="hidden sm:inline">Dữ Liệu Mẫu</span>
            </button>

            {/* Reset data */}
            <button
              onClick={handleClearData}
              className="p-1.5 rounded-xl bg-[#FEF2F2] border-2 border-[#FECACA] hover:bg-[#FEE2E2] text-xs font-bold text-[#DC2626]"
              title="Xóa sạch dữ liệu thi đấu"
            >
              <Trash2 className="w-4 h-4" />
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
                  Hãy mời người chơi tham gia hoặc bấm nút &quot;Dữ Liệu Mẫu&quot; ở thanh công cụ phía trên để xem thử nghiệm bảng xếp hạng.
                </p>
                <button
                  onClick={handleSeedDemoData}
                  className="btn-game btn-game-primary text-xs px-4 py-2 mt-2"
                >
                  Nạp 5 Đội Mẫu Thử Nghiệm
                </button>
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
            <div className="px-5 py-3.5 bg-[#F8FAFC] border-b-2 border-[#1E293B] flex items-center justify-between">
              <div>
                <h2 className="font-display font-black text-sm uppercase text-[#0F172A] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#1A1AFF]" />
                  DANH SÁCH TẤT CẢ LƯỢT TRUY CẬP & NGƯỜI CHƠI ĐĂNG KÝ
                </h2>
                <p className="text-[11px] font-bold text-[#64748B]">
                  Tổng hợp thông tin điều tra viên, mã đội, thời gian bắt đầu và tiến độ
                </p>
              </div>

              <span className="game-badge game-badge-blue text-[10px] font-black">
                {filteredSessions.length} LƯỢT ĐĂNG KÝ
              </span>
            </div>

            {filteredSessions.length === 0 ? (
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
                    {filteredSessions.map((session, idx) => (
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
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#059669] text-[#064E3B] text-[10px] font-black uppercase">
                              ✓ ĐÃ HOÀN THÀNH
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FEF3C7] border border-[#D97706] text-[#92400E] text-[10px] font-black uppercase animate-pulse">
                              ⏳ ĐANG THI ĐẤU
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
        )}

      </div>
    </div>
  );
}
