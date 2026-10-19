// ============================================================================
// LOBBY SCREEN - Danh Sách Hồ Sơ Vụ Án (2D Game Case Hunter Rực Rỡ)
// ============================================================================
'use client';

import { motion } from 'framer-motion';
import { 
  FileText, Star, Search, RotateCcw, LogOut, ChevronRight, Trophy, Puzzle, Shield
} from 'lucide-react';
import { useGame } from '@/lib/gameStore';
import { CASES_DATA } from '@/data/casesData';
import { sounds } from '@/lib/sounds';
import GameIcon, { GameIconType } from './GameIcon';

export default function LobbyScreen() {
  const { state, dispatch } = useGame();

  const handleSelectCase = (caseId: number) => {
    sounds.playClick();
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
    dispatch({ type: 'LOGOUT' });
  };

  const totalScore = Object.values(state.caseProgress).reduce((sum, cp) => sum + cp.totalScore, 0);
  const totalClues = Object.values(state.caseProgress).reduce((sum, cp) => sum + cp.cluesCollected, 0);
  const completedCases = Object.values(state.caseProgress).filter((cp) => cp.isCompleted).length;

  const getCaseIconType = (caseId: number): GameIconType => {
    switch (caseId) {
      case 2: return 'phone';
      case 3: return 'alert';
      case 4: return 'shopping';
      case 5: return 'trending';
      default: return 'folder';
    }
  };

  return (
    <div className="min-h-screen bg-game-backdrop text-[#1E293B] pb-12">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-[#FFCA28] border-b-4 border-[#4A2C11] px-4 py-2.5 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GameIcon type="search" size="md" theme="wood" />
            <div>
              <h1 className="font-display font-black text-sm sm:text-base uppercase tracking-wide text-[#3E2723]">
                ĐỘI ĐIỀU TRA SỐ
              </h1>
              <p className="text-[11px] font-bold text-[#5D190A]">
                {state.playerName} · Đội <strong className="underline">{state.teamCode}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-1.5 rounded-xl bg-white border-2 border-[#4A2C11] hover:bg-[#FEF08A] shadow-[0_3px_0_#4A2C11] active:translate-y-0.5 transition-all"
              title="Khởi động lại"
            >
              <RotateCcw className="w-4 h-4 text-[#3E2723]" />
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-xl bg-[#FEF2F2] border-2 border-[#4A2C11] hover:bg-[#FEE2E2] shadow-[0_3px_0_#4A2C11] active:translate-y-0.5 transition-all"
              title="Đổi điều tra viên"
            >
              <LogOut className="w-4 h-4 text-[#DC2626]" />
            </button>
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
                    <div className="w-8 h-8 rounded-full bg-[#FFCA28] border-2 border-[#4A2C11] flex items-center justify-center shadow-[0_3px_0_#4A2C11]">
                      <ChevronRight className="w-5 h-5 text-[#3E2723] stroke-[3]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Slogan */}
        <div className="game-card p-4 text-center bg-[#FFFBEB] border-[#FFCA28]">
          <p className="text-xs font-display font-black uppercase text-[#8D230F] tracking-wide">
            TỈNH TÁO TRƯỚC THÔNG TIN · PHÂN TÍCH BẰNG CHỨNG · LÀM CHỦ KHÔNG GIAN MẠNG
          </p>
        </div>
      </div>
    </div>
  );
}
