// ============================================================================
// WELCOME SCREEN - Phong cách 2D Hoạt Hình Case Hunter Tươi Sáng
// ============================================================================
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, User, Users, ShieldAlert } from 'lucide-react';
import { useGame } from '@/lib/gameStore';
import { sounds } from '@/lib/sounds';
import { DetectiveIllustration } from '@/assets/illustrations';
import GameIcon from './GameIcon';

export default function WelcomeScreen() {
  const { dispatch } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dts_game_state');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.playerName) setPlayerName(data.playerName);
          if (data.teamCode) setTeamCode(data.teamCode);
        } catch {}
      }
    }
  }, []);

  const handleStart = () => {
    if (!playerName.trim()) {
      sounds.playWrong();
      setError('Vui lòng nhập tên điều tra viên!');
      return;
    }
    if (!teamCode.trim()) {
      sounds.playWrong();
      setError('Vui lòng nhập mã số đội thi đấu!');
      return;
    }
    sounds.playClick();
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      dispatch({
        type: 'SET_PLAYER',
        payload: { name: playerName.trim(), code: teamCode.trim() },
      });
    }, 450);
  };

  return (
    <div className="min-h-screen bg-game-backdrop flex flex-col items-center justify-center p-4 relative overflow-hidden text-[#1E293B]">
      {/* Sunburst Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full bg-[#FDE68A]/40 pointer-events-none -z-10 blur-2xl" />

      {/* Main Container */}
      <motion.div
        className="w-full max-w-md relative z-10 space-y-4"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 14 }}
      >
        {/* Top Header Title */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 game-badge game-badge-yellow uppercase tracking-wider text-xs px-4 py-1 mb-2 font-black rotate-[-1.5deg]">
            <GameIcon type="star" size="sm" theme="amber" />
            AN TOÀN THÔNG TIN 2026
            <GameIcon type="star" size="sm" theme="amber" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-tight text-[#3E2723] drop-shadow-[0_2px_0_#FFCA28]">
            ĐỘI ĐIỀU TRA SỐ
          </h1>
          <div className="game-yellow-banner inline-block px-5 py-1 text-sm sm:text-base font-black uppercase mt-1 rotate-[1deg]">
            VƯỢT TRẠM PHÁ ÁN
          </div>
        </div>

        {/* Mascot & Speech Bubble */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <DetectiveIllustration className="w-28 h-28 sm:w-32 sm:h-32 drop-shadow-md" />
          </motion.div>

          <div className="bg-white border-3 border-[#4A2C11] rounded-2xl p-3 max-w-[200px] text-xs font-bold text-[#3E2723] leading-snug shadow-[0_3px_0_#4A2C11]">
            Chào đồng chí! Hãy ghi danh để nhận lệnh phá án khẩn cấp!
          </div>
        </div>

        {/* Input Form Card */}
        <div className="game-card p-6 space-y-4 bg-white">
          {error && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#FEF2F2] border-2 border-[#DC2626] rounded-xl p-2.5 text-xs font-bold text-[#DC2626] flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-display font-black uppercase text-[#3E2723] flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#D97706]" />
              Tên Điều Tra Viên
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="VD: Thám tử Minh, Hoàng Nam..."
              className="w-full px-4 py-3 rounded-xl border-3 border-[#4A2C11] bg-[#FFFDF9] font-bold text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#FFCA28] shadow-[0_2px_0_#4A2C11]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-display font-black uppercase text-[#3E2723] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#2563EB]" />
              Mã Số Đội Thi Đấu
            </label>
            <input
              type="text"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
              placeholder="VD: CYBER-01, TEAM-A..."
              className="w-full px-4 py-3 rounded-xl border-3 border-[#4A2C11] bg-[#FFFDF9] font-bold text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#FFCA28] shadow-[0_2px_0_#4A2C11] uppercase"
            />
          </div>

          {/* 3D Tactile Amber Button */}
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full py-4 btn-game btn-game-amber text-base tracking-wide flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <span className="animate-spin text-xl">🔍</span>
            ) : (
              <>
                <Search className="w-5 h-5 stroke-[3]" />
                BẮT ĐẦU ĐIỀU TRA
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] font-bold text-[#64748B]">
          Đại Học / Học Viện An Toàn Số · 4 Vụ Án · 20 Trạm Thử Thách
        </p>
      </motion.div>
    </div>
  );
}
