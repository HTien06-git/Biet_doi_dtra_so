// ============================================================================
// LOBBY SCREEN - Danh Sách Hồ Sơ Vụ Án (2D Game Case Hunter Rực Rỡ)
// ============================================================================
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Star, Search, LogOut, ChevronRight, Trophy, Puzzle, Shield,
  ShieldCheck, ExternalLink, Settings, MoreVertical, Lock, LockOpen, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useGame } from '@/lib/gameStore';
import { CASES_DATA } from '@/data/casesData';
import { sounds } from '@/lib/sounds';
import GameIcon, { GameIconType } from './GameIcon';
import LeaderboardModal from './LeaderboardModal';
import AudioController from '@/components/ui/AudioController';
import { savePlayerSession, PlayerSession } from '@/lib/supabase';
import { multiplayerSync } from '@/lib/multiplayerSync';

export default function LobbyScreen() {
  const { state, dispatch } = useGame();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [lockAlert, setLockAlert] = useState<{ isOpen: boolean; message: string; caseId?: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Admin Game Mode Setting (single case vs multi cases)
  const [caseAccessMode, setCaseAccessMode] = useState<'single' | 'multi'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dts_admin_case_access_mode');
      return (saved === 'single' || saved === 'multi') ? saved : 'multi';
    }
    return 'multi';
  });

  // Fetch initial config from server and listen to realtime updates from Admin
  useEffect(() => {
    fetch('/api/admin/config')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.caseAccessMode) {
          setCaseAccessMode(data.caseAccessMode);
          if (typeof window !== 'undefined') {
            localStorage.setItem('dts_admin_case_access_mode', data.caseAccessMode);
          }
        }
      })
      .catch(() => {});

    const unsub = multiplayerSync.onGameConfigChange((cfg) => {
      setCaseAccessMode(cfg.caseAccessMode);
    });
    return () => {
      unsub();
    };
  }, []);

  // Xác định vụ án mà người chơi đã chọn trong chế độ 1 vụ án
  const chosenSingleCaseId = useMemo(() => {
    if (typeof window !== 'undefined' && state.playerName) {
      const saved = localStorage.getItem(`dts_chosen_single_case_${state.playerName.trim().toLowerCase()}`);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    // Tìm vụ án đầu tiên người chơi đã có tiến trình thực tế
    for (const c of CASES_DATA) {
      const p = state.caseProgress[c.id];
      if (p && (p.isCompleted || (p.stationsCompleted || 0) > 0 || (p.totalScore || 0) > 0 || p.startTime)) {
        return c.id;
      }
    }
    return null;
  }, [state.playerName, state.caseProgress]);

  // Close menu when tapping outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showMenu]);

  const totalScore = Object.values(state.caseProgress).reduce((sum, cp) => sum + cp.totalScore, 0);
  const totalClues = Object.values(state.caseProgress).reduce((sum, cp) => sum + cp.cluesCollected, 0);
  const completedCases = Object.values(state.caseProgress).filter((cp) => cp.isCompleted).length;

  const handleSelectCase = (caseId: number) => {
    // Kiểm tra quy chế Khóa vụ án khi Admin bật chế độ single (chỉ 1 vụ án duy nhất)
    if (caseAccessMode === 'single' && chosenSingleCaseId !== null && chosenSingleCaseId !== caseId) {
      sounds.playWrong();
      const chosenCase = CASES_DATA.find((c) => c.id === chosenSingleCaseId);
      setLockAlert({
        isOpen: true,
        caseId,
        message: `Theo quy chế giải đấu từ Ban Quản Trị, mỗi điều tra viên chỉ được phép phá 1 VỤ ÁN DUY NHẤT.\n\nBạn đã đăng ký tham gia Vụ án #${chosenSingleCaseId}: "${chosenCase?.title || ''}". Các vụ án còn lại đã được tự động khóa để bảo đảm tính công bằng.`,
      });
      return;
    }

    // Nếu người chơi chọn vụ án đầu tiên trong chế độ single, ghi nhớ lại
    if (caseAccessMode === 'single' && chosenSingleCaseId === null && typeof window !== 'undefined' && state.playerName) {
      localStorage.setItem(`dts_chosen_single_case_${state.playerName.trim().toLowerCase()}`, caseId.toString());
    }

    sounds.playClick();
    const caseProg = state.caseProgress[caseId];
    if (caseProg?.isCompleted) {
      // Cuộc thi: Vụ án đã hoàn thành thì xem kết quả phá án, KHÔNG cho chơi lại để sửa điểm!
      dispatch({ type: 'SELECT_CASE', payload: caseId });
      dispatch({ type: 'SET_SCREEN', payload: 'summary' });
      return;
    }
    // Chuyển sang màn hình lộ trình các trạm của vụ án
    dispatch({ type: 'SELECT_CASE', payload: caseId });
  };

  const handleLogout = () => {
    sounds.playClick();

    // Thông báo cho hệ thống là user đã out không chơi nữa
    multiplayerSync.markDeviceOffline({
      playerName: state.playerName,
      teamCode: state.teamCode,
      caseId: 0,
      stationId: 0,
      score: totalScore,
    });

    try {
      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'leave',
          player_name: state.playerName,
          team_code: state.teamCode,
          is_active: false,
          status: 'left',
        }),
      }).catch(() => {});
    } catch {}

    dispatch({ type: 'LOGOUT' });
  };

  const getCaseIconType = (caseId: number): GameIconType => {
    switch (caseId) {
      case 1:
      case 2:
        return caseId === 1 ? 'phone' : 'alert';
      case 3:
        return 'shopping';
      case 4:
      case 5:
        return 'trending';
      default:
        return 'folder';
    }
  };

  return (
    <div className="min-h-screen bg-game-backdrop text-[#0F172A] pb-12">
      {/* Header Bar Xanh Điện #191AFE Chuẩn Thiết Kế */}
      <header className="sticky top-0 z-30 bg-[#191AFE] border-b-4 border-[#000088] px-3 sm:px-4 py-2 sm:py-2.5 shadow-lg text-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Detective Avatar & Player Name */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white flex-shrink-0 shadow-[0_2px_0_#000088]">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-black text-xs sm:text-base uppercase tracking-wide text-white drop-shadow-sm truncate">
                ĐỘI ĐIỀU TRA SỐ
              </h1>
              <p className="text-[10px] sm:text-[11px] font-bold text-white/80 truncate">
                {state.playerName} · Đội <strong className="text-[#FDE047]">{state.teamCode}</strong>
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* 1. Nút Bảng Vàng */}
            <button
              onClick={() => {
                sounds.playClick();
                setShowLeaderboard(true);
              }}
              className="px-2 sm:px-3 py-1.5 rounded-xl bg-[#FDE047] text-[#0F172A] font-black text-xs border-2 border-[#000088] shadow-[0_2px_0_#000088] active:translate-y-0.5 transition-all flex items-center gap-1 font-display"
              title="Xem Bảng Vàng"
            >
              <Trophy className="w-3.5 h-3.5 fill-current text-[#854D0E]" />
              <span className="text-[11px] font-black uppercase sm:inline">Bảng Vàng</span>
            </button>

            {/* 2. Nút Âm Thanh BGM */}
            <AudioController />

            {/* 3. Nút Thao Tác Nhanh trên Desktop */}
            <div className="hidden sm:flex items-center gap-1.5">
              <Link
                href="/admin"
                className="p-1.5 rounded-xl bg-white/15 border-2 border-white/40 hover:bg-white/25 text-white active:translate-y-0.5 shadow-[0_2px_0_#000088] transition-all"
                title="Trang Quản Trị Admin"
              >
                <Settings className="w-4 h-4 text-white" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-xl bg-[#EF4444] border-2 border-[#991B1B] hover:bg-[#DC2626] text-white active:translate-y-0.5 shadow-[0_2px_0_#7F1D1D] transition-all"
                title="Đổi điều tra viên"
              >
                <LogOut className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* 4. Menu Rút Gọn Trên Điện Thoại */}
            <div className="relative sm:hidden" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`p-1.5 rounded-xl border-2 active:translate-y-0.5 shadow-[0_2px_0_#000088] transition-all flex items-center justify-center ${
                  showMenu
                    ? 'bg-white text-[#191AFE] border-white'
                    : 'bg-white/15 border-white/40 text-white hover:bg-white/25'
                }`}
                title="Menu Cài Đặt"
                aria-label="Menu mở rộng"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Dropdown Popover */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-white border-2 border-[#1E293B] shadow-2xl p-1.5 z-50 text-[#0F172A] space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-black uppercase text-[#64748B] tracking-wider border-b border-[#E2E8F0] mb-1">
                    Tuỳ Chọn
                  </div>
                  <Link
                    href="/admin"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold hover:bg-[#EFF6FF] text-[#1E293B] transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Quản Trị Admin</span>
                  </Link>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleLogout();
                    }}
                    className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold hover:bg-[#FEF2F2] text-[#DC2626] transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span>Đổi Điều Tra Viên</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-5">
        {/* 3 Stats Overview Badges */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="game-card p-3 sm:p-4 text-center bg-white">
            <div className="flex justify-center mb-1">
              <GameIcon type="trophy" size="md" theme="amber" />
            </div>
            <p className="text-xl sm:text-2xl font-display font-black text-[#B45309]">{totalScore}</p>
            <p className="text-[10px] sm:text-xs font-black uppercase text-[#64748B]">Tổng Điểm</p>
          </div>

          <div className="game-card p-3 sm:p-4 text-center bg-white">
            <div className="flex justify-center mb-1">
              <GameIcon type="puzzle" size="md" theme="emerald" />
            </div>
            <p className="text-xl sm:text-2xl font-display font-black text-[#059669]">{totalClues}/20</p>
            <p className="text-[10px] sm:text-xs font-black uppercase text-[#64748B]">Manh Mối</p>
          </div>

          <div className="game-card p-3 sm:p-4 text-center bg-white">
            <div className="flex justify-center mb-1">
              <GameIcon type="shield" size="md" theme="sapphire" />
            </div>
            <p className="text-xl sm:text-2xl font-display font-black text-[#1D4ED8]">{completedCases}/4</p>
            <p className="text-[10px] sm:text-xs font-black uppercase text-[#64748B]">Phá Án Xong</p>
          </div>
        </div>

        {/* Mode Status Banner: Thông báo chế độ truy cập do Admin cài đặt */}
        <div className={`p-3 sm:p-3.5 rounded-2xl border-2 flex items-center justify-between gap-2.5 sm:gap-3 text-xs font-bold transition-all ${
          caseAccessMode === 'single'
            ? 'bg-[#FEF3C7] border-[#D97706] text-[#92400E]'
            : 'bg-[#EFF6FF] border-[#3B82F6] text-[#1D4ED8]'
        }`}>
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              caseAccessMode === 'single' ? 'bg-[#D97706] text-white' : 'bg-[#3B82F6] text-white'
            }`}>
              {caseAccessMode === 'single' ? <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <LockOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </div>
            <div className="min-w-0">
              <span className="font-display font-black uppercase text-[10px] sm:text-[11px] block truncate">
                {caseAccessMode === 'single' ? 'QUY CHẾ: THI ĐẤU 1 VỤ ÁN DUY NHẤT' : 'CHẾ ĐỘ TỰ DO: PHÁ TẤT CẢ VỤ ÁN'}
              </span>
              <p className="text-[10px] sm:text-[11px] font-semibold opacity-90 truncate">
                {caseAccessMode === 'single'
                  ? chosenSingleCaseId
                    ? `Đã đăng ký Vụ #${chosenSingleCaseId}. Các vụ khác tự động khóa.`
                    : 'Chọn 1 vụ án để phá. Sau khi chọn, các vụ khác sẽ tự động khóa!'
                  : 'Người chơi được tự do tham gia phá tất cả các vụ án.'}
              </p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] sm:text-[10px] font-black uppercase flex-shrink-0 border whitespace-nowrap ${
            caseAccessMode === 'single'
              ? 'bg-[#FDE68A] text-[#78350F] border-[#D97706]'
              : 'bg-[#DBEAFE] text-[#1E40AF] border-[#3B82F6]'
          }`}>
            {caseAccessMode === 'single' ? '🔒 1 VỤ ÁN' : '🔓 TẤT CẢ'}
          </span>
        </div>

        {/* Section Banner Gỗ Nâu Đậm Bắt Mắt */}
        <div className="game-wood-banner px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-black uppercase tracking-wide">
          <div className="flex items-center gap-2">
            <GameIcon type="folder" size="sm" theme="amber" />
            <span>BÀN ĐIỀU TRA: DANH SÁCH 4 VỤ ÁN TRỌNG ĐIỂM</span>
          </div>
          <span className="text-[11px] opacity-90 hidden sm:inline">20 TRẠM THỬ THÁCH</span>
        </div>

        {/* 4 Case Files Cards */}
        <div className="space-y-4">
          {CASES_DATA.map((caseData, index) => {
            const progress = state.caseProgress[caseData.id];
            const isCompleted = progress?.isCompleted;
            const isLocked = caseAccessMode === 'single' && chosenSingleCaseId !== null && chosenSingleCaseId !== caseData.id;

            return (
              <motion.div
                key={caseData.id}
                className={`game-card p-4 sm:p-5 relative overflow-hidden transition-all ${
                  isLocked
                    ? 'bg-[#F8FAFC] border-[#94A3B8] opacity-80 cursor-not-allowed shadow-none'
                    : isCompleted
                    ? 'bg-[#F0FDF4] cursor-pointer'
                    : 'bg-white cursor-pointer'
                }`}
                onClick={() => handleSelectCase(caseData.id)}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={!isLocked ? { scale: 1.015 } : undefined}
                whileTap={!isLocked ? { scale: 0.99 } : undefined}
              >
                {/* Stamp if completed */}
                {isCompleted && (
                  <div className="absolute top-3 right-12 border-2 border-[#059669] text-[#059669] bg-white font-display font-black text-[10px] px-2.5 py-0.5 rounded-lg rotate-12 uppercase shadow-sm">
                    ✓ ĐÃ PHÁ ÁN
                  </div>
                )}

                {/* Lock Stamp / Badge */}
                {isLocked && (
                  <div className="absolute top-2.5 sm:top-3 right-3 sm:right-6 border-2 border-[#D97706] text-[#B45309] bg-[#FEF3C7] font-display font-black text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl uppercase shadow-sm flex items-center gap-1 whitespace-nowrap z-10">
                    <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D97706] flex-shrink-0" />
                    <span className="hidden sm:inline">ĐÃ KHÓA (CHẾ ĐỘ 1 VỤ ÁN)</span>
                    <span className="sm:hidden">ĐÃ KHÓA</span>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Case Icon Avatar Badge */}
                  <div className="relative">
                    <GameIcon
                      type={getCaseIconType(caseData.id)}
                      size="lg"
                      theme={isLocked ? 'amber' : index === 0 ? 'ruby' : index === 1 ? 'sapphire' : index === 2 ? 'amber' : 'emerald'}
                    />
                    {isLocked && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#D97706] text-white flex items-center justify-center border-2 border-white shadow-sm">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Case Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`game-badge text-[10px] ${
                        isLocked ? 'bg-[#E2E8F0] text-[#64748B] border-[#CBD5E1]' : 'game-badge-yellow'
                      }`}>
                        HỒ SƠ {caseData.caseNumber}
                      </span>
                      <span className="text-xs font-bold text-[#64748B] truncate">
                        {caseData.subtitle}
                      </span>
                    </div>

                    <h2 className={`text-base sm:text-lg font-display font-black mb-1 tracking-tight ${
                      isLocked ? 'text-[#64748B]' : 'text-[#1E293B]'
                    }`}>
                      {caseData.title}
                    </h2>

                    <p className={`text-xs line-clamp-2 leading-relaxed mb-3 font-medium ${
                      isLocked ? 'text-[#94A3B8]' : 'text-[#475569]'
                    }`}>
                      {isLocked
                        ? 'Vụ án đã được tự động khóa theo cài đặt Ban Tổ Chức. Bạn chỉ được phá 1 vụ án đã đăng ký tham gia.'
                        : caseData.description}
                    </p>

                    {/* Progress Stats */}
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className={`flex items-center gap-1 ${isLocked ? 'text-[#94A3B8]' : 'text-[#B45309]'}`}>
                        <Search className="w-3.5 h-3.5 stroke-[3]" />
                        {progress?.cluesCollected || 0}/5 manh mối
                      </span>
                      <span className={`flex items-center gap-1 ${isLocked ? 'text-[#94A3B8]' : 'text-[#059669]'}`}>
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {progress?.totalScore || 0}/100 điểm
                      </span>
                    </div>

                    {/* Progress bar with thick border */}
                    <div className="w-full h-3 bg-[#E2E8F0] border-2 border-[#4A2C11] rounded-full overflow-hidden mt-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                      <div
                        className="h-full bg-gradient-to-r from-[#FDE047] to-[#F59E0B] transition-all duration-300"
                        style={{ width: `${progress?.totalScore || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Arrow / Completed Badge / Lock Icon */}
                  <div className="self-center flex-shrink-0">
                    {isLocked ? (
                      <div className="px-3 py-1.5 rounded-xl bg-[#F1F5F9] border-2 border-[#CBD5E1] text-[#64748B] text-[10.5px] font-black uppercase flex items-center gap-1 shadow-sm whitespace-nowrap">
                        <Lock className="w-3.5 h-3.5 text-[#94A3B8]" />
                        <span>ĐÃ KHÓA</span>
                      </div>
                    ) : isCompleted ? (
                      <div className="px-3 py-1.5 rounded-xl bg-[#ECFDF5] border-2 border-[#059669] text-[#059669] text-[10.5px] font-black uppercase flex items-center gap-1 shadow-sm whitespace-nowrap">
                        <span>XEM KẾT QUẢ</span>
                        <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#191AFE] border-2 border-[#000088] flex items-center justify-center shadow-[0_3px_0_#000066] text-white">
                        <ChevronRight className="w-5 h-5 text-white stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Slogan with Admin Link */}
        <div className="game-card p-4 text-center bg-white border-[#1E293B] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs font-display font-black uppercase text-[#191AFE] tracking-wide">
            🛡️ TỈNH TÁO TRƯỚC THÔNG TIN · PHÂN TÍCH BẰNG CHỨNG · LÀM CHỦ KHÔNG GIAN MẠNG
          </p>
          <Link
            href="/admin"
            className="text-[11px] font-bold text-[#64748B] hover:text-[#191AFE] underline flex items-center gap-1"
          >
            <Settings className="w-3.5 h-3.5" />
            Bảng Quản Trị Admin
          </Link>
        </div>
      </div>

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        highlightPlayer={{ name: state.playerName, teamCode: state.teamCode }}
      />

      {/* Access Lock Alert Modal */}
      <AnimatePresence>
        {lockAlert && lockAlert.isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md game-card bg-white border-3 border-[#1E293B] shadow-2xl p-5 sm:p-6 text-center space-y-4"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FEF3C7] border-2 border-[#D97706] text-[#D97706] flex items-center justify-center shadow-[0_3px_0_#D97706]">
                <Lock className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-display font-black text-base uppercase text-[#0F172A]">
                  VỤ ÁN ĐANG BỊ KHÓA
                </h3>
                <p className="text-xs font-bold text-[#64748B] mt-1">
                  Quy chế thi đấu từ Ban Tổ Chức
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FFF7ED] border border-[#FDBA74] text-xs font-semibold text-[#9A3412] leading-relaxed text-left whitespace-pre-line">
                {lockAlert.message}
              </div>

              <button
                onClick={() => {
                  sounds.playClick();
                  setLockAlert(null);
                }}
                className="w-full py-2.5 rounded-xl bg-[#191AFE] text-white font-display font-black text-xs uppercase shadow-[0_3px_0_#000088] active:translate-y-0.5 transition-all"
              >
                ĐÃ HIỂU QUY CHẾ
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
