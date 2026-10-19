// ============================================================================
// LOBBY SCREEN - Danh Sách Hồ Sơ Vụ Án (2D Game Case Hunter Rực Rỡ)
// ============================================================================
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Star, Search, RotateCcw, LogOut, ChevronRight, Trophy, Puzzle, Shield,
  ShieldCheck, ExternalLink, Settings, MoreVertical
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
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Cập nhật hiện diện trực tuyến khi vào Lobby và xử lý khi người chơi tắt trình duyệt
  useEffect(() => {
    if (!state.playerName) return;

    multiplayerSync.registerDevice({
      playerName: state.playerName,
      teamCode: state.teamCode,
      caseId: 0,
      stationId: 0,
      score: totalScore,
    });

    const handleBeforeUnload = () => {
      multiplayerSync.markDeviceOffline({
        playerName: state.playerName,
        teamCode: state.teamCode,
        caseId: 0,
        stationId: 0,
        score: totalScore,
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/sessions',
          JSON.stringify({
            action: 'leave',
            player_name: state.playerName,
            team_code: state.teamCode,
            is_active: false,
            status: 'left',
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [state.playerName, state.teamCode, totalScore]);

  const handleSelectCase = (caseId: number) => {
    sounds.playClick();
    
    // Broadcast active in-progress session to Admin immediately
    const initialSession: PlayerSession = {
      player_name: state.playerName,
      team_code: state.teamCode,
      case_id: caseId,
      station_scores: [0, 0, 0, 0, 0],
      total_score: 0,
      clues_collected: 0,
      stations_completed: 0,
      is_completed: false,
      is_active: true,
      status: 'playing',
      start_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    savePlayerSession(initialSession);

    multiplayerSync.broadcastEvent({
      eventType: 'CASE_STARTED',
      playerName: state.playerName,
      teamCode: state.teamCode,
      caseId: caseId,
      stationId: 1,
      totalScore: 0,
    });

    dispatch({ type: 'SELECT_CASE', payload: caseId });
  };

  const handleReset = () => {
    sounds.playWrong();
    if (confirm('Đồng chí có chắc muốn khởi động lại toàn bộ tiến trình điều tra?')) {
      sounds.playClick();
      dispatch({ type: 'RESET_PROGRESS' });
    }
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
      {/* Header Bar Xanh Điện #1A1AFF Chuẩn Thiết Kế */}
      <header className="sticky top-0 z-30 bg-[#1A1AFF] border-b-4 border-[#000088] px-3 sm:px-4 py-2 sm:py-2.5 shadow-lg text-white">
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
                onClick={handleReset}
                className="p-1.5 rounded-xl bg-white/15 border-2 border-white/40 hover:bg-white/25 text-white active:translate-y-0.5 shadow-[0_2px_0_#000088] transition-all"
                title="Khởi động lại tiến trình"
              >
                <RotateCcw className="w-4 h-4 text-white" />
              </button>
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
                    ? 'bg-white text-[#1A1AFF] border-white'
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
                      handleReset();
                    }}
                    className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold hover:bg-[#F8FAFC] text-[#1E293B] transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>Chơi Lại Từ Đầu</span>
                  </button>
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

            return (
              <motion.div
                key={caseData.id}
                className={`game-card p-4 sm:p-5 cursor-pointer relative overflow-hidden transition-all ${
                  isCompleted ? 'bg-[#F0FDF4]' : 'bg-white'
                }`}
                onClick={() => handleSelectCase(caseData.id)}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.99 }}
              >
                {/* Stamp if completed */}
                {isCompleted && (
                  <div className="absolute top-3 right-12 border-2 border-[#059669] text-[#059669] bg-white font-display font-black text-[10px] px-2.5 py-0.5 rounded-lg rotate-12 uppercase shadow-sm">
                    ✓ ĐÃ PHÁ ÁN
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Case Icon Avatar Badge */}
                  <GameIcon
                    type={getCaseIconType(caseData.id)}
                    size="lg"
                    theme={index === 0 ? 'ruby' : index === 1 ? 'sapphire' : index === 2 ? 'amber' : 'emerald'}
                  />

                  {/* Case Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="game-badge game-badge-yellow text-[10px]">
                        HỒ SƠ {caseData.caseNumber}
                      </span>
                      <span className="text-xs font-bold text-[#64748B] truncate">
                        {caseData.subtitle}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-display font-black text-[#1E293B] mb-1 tracking-tight">
                      {caseData.title}
                    </h2>

                    <p className="text-xs text-[#475569] line-clamp-2 leading-relaxed mb-3 font-medium">
                      {caseData.description}
                    </p>

                    {/* Progress Stats */}
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="flex items-center gap-1 text-[#B45309]">
                        <Search className="w-3.5 h-3.5 stroke-[3]" />
                        {progress?.cluesCollected || 0}/5 manh mối
                      </span>
                      <span className="flex items-center gap-1 text-[#059669]">
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

                  {/* Action Arrow */}
                  <div className="self-center flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-[#1A1AFF] border-2 border-[#000088] flex items-center justify-center shadow-[0_3px_0_#000066] text-white">
                      <ChevronRight className="w-5 h-5 text-white stroke-[3]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Slogan with Admin Link */}
        <div className="game-card p-4 text-center bg-white border-[#1E293B] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs font-display font-black uppercase text-[#1A1AFF] tracking-wide">
            🛡️ TỈNH TÁO TRƯỚC THÔNG TIN · PHÂN TÍCH BẰNG CHỨNG · LÀM CHỦ KHÔNG GIAN MẠNG
          </p>
          <Link
            href="/admin"
            className="text-[11px] font-bold text-[#64748B] hover:text-[#1A1AFF] underline flex items-center gap-1"
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
      />
    </div>
  );
}
