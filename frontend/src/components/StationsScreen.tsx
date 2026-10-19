// ============================================================================
// STATIONS SCREEN - Lộ Trình 5 Trạm Thử Thách (2D Game Case Hunter Rực Rỡ)
// ============================================================================
'use client';

import { motion } from 'framer-motion';
import { 
  ArrowLeft, Lock, Star, Play, MapPin
} from 'lucide-react';
import { useGame } from '@/lib/gameStore';
import { sounds } from '@/lib/sounds';
import GameIcon from './GameIcon';
import AudioController from '@/components/ui/AudioController';

export default function StationsScreen() {
  const { state, dispatch, getCurrentCase, getCurrentCaseProgress } = useGame();
  const caseData = getCurrentCase();
  const progress = getCurrentCaseProgress();

  if (!caseData || !progress) return null;

  const handleBack = () => {
    sounds.playClick();
    dispatch({ type: 'SET_SCREEN', payload: 'lobby' });
  };

  const handleSelectStation = (index: number) => {
    const canPlay = index === 0 || progress.stations[index - 1]?.completed;
    if (canPlay) {
      sounds.playClick();
      dispatch({ type: 'SET_STATION', payload: index });
    } else {
      sounds.playWrong();
    }
  };

  const getStationStatus = (index: number): 'completed' | 'current' | 'locked' => {
    if (progress.stations[index]?.completed) return 'completed';
    if (index === 0 || progress.stations[index - 1]?.completed) return 'current';
    return 'locked';
  };

  return (
    <div className="min-h-screen bg-game-backdrop text-[#0F172A] pb-12">
      {/* Header Bar Xanh Điện #1A1AFF Chuẩn Thiết Kế */}
      <header className="sticky top-0 z-30 bg-[#1A1AFF] border-b-4 border-[#000088] px-4 py-3 shadow-lg text-white">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-1.5 rounded-xl bg-white/15 border-2 border-white/40 hover:bg-white/25 active:translate-y-0.5 shadow-[0_2px_0_#000088] transition-all text-white"
            title="Quay lại danh sách vụ án"
          >
            <ArrowLeft className="w-5 h-5 text-white stroke-[3]" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#FDE047] text-[#0F172A] text-[10px] font-black uppercase tracking-wider">
                VỤ ÁN {caseData.caseNumber}
              </span>
              <h1 className="font-display font-black text-sm uppercase text-white truncate drop-shadow-sm">
                {caseData.title}
              </h1>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-white/90 mt-0.5">
              <span>{progress.stationsCompleted}/5 Trạm</span>
              <span>·</span>
              <span>{progress.cluesCollected}/5 Manh mối</span>
              <span>·</span>
              <span className="text-[#FDE047] font-black">{progress.totalScore}/100 Điểm</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AudioController />
            <div className="w-9 h-9 rounded-xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white">
              <Star className="w-5 h-5 fill-current text-[#FDE047]" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
        {/* Banner Xanh Chủ Đạo #1A1AFF */}
        <div className="game-blue-banner p-3.5 text-center flex items-center justify-center gap-2 text-xs sm:text-sm font-black uppercase text-white">
          <MapPin className="w-4 h-4 text-[#FDE047]" />
          LỘ TRÌNH ĐIỀU TRA: VƯỢT 5 TRẠM HIỆN TRƯỜNG
        </div>

        {/* 5 Stations Roadmap Cards */}
        <div className="space-y-3">
          {caseData.stations.map((station, index) => {
            const status = getStationStatus(index);
            const stProgress = progress.stations[index];

            return (
              <motion.div
                key={station.id}
                onClick={() => handleSelectStation(index)}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.07 }}
                className={`game-card p-4 flex items-center gap-4 cursor-pointer transition-all ${
                  status === 'completed'
                    ? 'bg-[#F0FDF4] border-[#059669]'
                    : status === 'current'
                    ? 'bg-white border-[#1A1AFF] ring-4 ring-[#1A1AFF]/25 shadow-lg'
                    : 'bg-[#F8FAFC] opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Number Badge */}
                <div
                  className={`w-12 h-12 rounded-2xl border-3 border-[#1E293B] flex items-center justify-center font-display font-black text-lg flex-shrink-0 shadow-[0_3px_0_#1E293B] ${
                    status === 'completed'
                      ? 'bg-[#10B981] text-white'
                      : status === 'current'
                      ? 'bg-[#1A1AFF] text-white animate-bounce'
                      : 'bg-[#CBD5E1] text-[#64748B]'
                  }`}
                >
                  {status === 'completed' ? '✓' : index + 1}
                </div>

                {/* Station Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#64748B]">
                      TRẠM {index + 1} · {station.points} ĐIỂM
                    </span>
                    {status === 'completed' && (
                      <span className="game-badge game-badge-green text-[9px] py-0">
                        ĐÃ XONG
                      </span>
                    )}
                    {status === 'current' && (
                      <span className="inline-block px-2 py-0.5 rounded-md bg-[#1A1AFF] text-white text-[9px] font-black uppercase tracking-wider animate-pulse">
                        ĐANG CHỜ
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-black text-sm text-[#0F172A] truncate">
                    {station.title}
                  </h3>

                  <p className="text-xs text-[#64748B] line-clamp-1 mt-0.5 font-medium">
                    {station.scenario}
                  </p>
                </div>

                {/* Action Indicator */}
                <div className="flex-shrink-0">
                  {status === 'completed' ? (
                    <div className="text-right">
                      <span className="text-xs font-black text-[#059669] block">
                        +{stProgress.score}đ
                      </span>
                      <span className="text-[10px] text-[#64748B] font-bold">
                        Đã mở manh mối
                      </span>
                    </div>
                  ) : status === 'current' ? (
                    <button className="btn-game btn-game-primary text-xs px-3.5 py-2 flex items-center gap-1 shadow-[0_3px_0_#000066]">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      VÀO TRẠM
                    </button>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#E2E8F0] border-2 border-[#1E293B] flex items-center justify-center">
                      <Lock className="w-4 h-4 text-[#64748B]" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
