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
import { multiplayerSync } from '@/lib/multiplayerSync';
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
      // Bắt đầu ghi nhận tham gia thi đấu vụ án khi người chơi thực sự bấm vào giải trạm
      multiplayerSync.broadcastEvent({
        eventType: 'STATION_ENTER',
        playerName: state.playerName,
        teamCode: state.teamCode,
        caseId: caseData.id,
        stationId: index + 1,
        totalScore: progress.totalScore,
      });
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
      {/* Header Bar Xanh Điện #191AFE Chuẩn Thiết Kế */}
      <header className="sticky top-0 z-30 bg-[#191AFE] border-b-4 border-[#000088] px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg text-white">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2.5 sm:gap-3">
          <button
            onClick={handleBack}
            className="p-1.5 rounded-xl bg-white/15 border-2 border-white/40 hover:bg-white/25 active:translate-y-0.5 shadow-[0_2px_0_#000088] transition-all text-white flex-shrink-0"
            title="Quay lại danh sách vụ án"
          >
            <ArrowLeft className="w-5 h-5 text-white stroke-[3]" />
          </button>

          <div className="flex-1 min-w-0">
            {/* Dòng 1: Badge Vụ án + Tiêu đề (cùng 1 hàng, không bao giờ ngắt chữ) */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="px-1.5 py-0.5 sm:px-2 rounded-md bg-[#FDE047] text-[#0F172A] text-[9px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap flex-shrink-0 shadow-xs">
                VỤ {caseData.caseNumber}
              </span>
              <h1 className="font-display font-black text-xs sm:text-sm uppercase text-white truncate drop-shadow-sm leading-tight">
                {caseData.title}
              </h1>
            </div>

            {/* Dòng 2: Thông số tiến trình (luôn trên 1 dòng duy nhất, không nhảy chữ) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 text-[10px] sm:text-xs font-bold text-white/90 mt-0.5 overflow-hidden">
              <span className="whitespace-nowrap">{progress.stationsCompleted}/5 Trạm</span>
              <span className="text-white/40">·</span>
              <span className="whitespace-nowrap">{progress.cluesCollected}/5 Manh mối</span>
              <span className="text-white/40">·</span>
              <span className="text-[#FDE047] font-black whitespace-nowrap">{progress.totalScore}/100 Điểm</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <AudioController />
            <div className="hidden sm:flex w-9 h-9 rounded-xl bg-white/20 border-2 border-white/40 items-center justify-center text-white shadow-[0_2px_0_#000088]">
              <Star className="w-5 h-5 fill-current text-[#FDE047]" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-3 sm:pt-6 space-y-3.5 sm:space-y-4">
        {/* Banner Xanh Chủ Đạo #191AFE (Không bao giờ rớt 1 chữ TRƯỜNG xuống dòng) */}
        <div className="game-blue-banner py-2.5 px-3 sm:p-3.5 text-center flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-black uppercase text-white shadow-md">
          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FDE047] flex-shrink-0" />
          <span className="hidden sm:inline">LỘ TRÌNH ĐIỀU TRA: VƯỢT 5 TRẠM HIỆN TRƯỜNG</span>
          <span className="sm:hidden whitespace-nowrap">LỘ TRÌNH 5 TRẠM HIỆN TRƯỜNG</span>
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
                className={`game-card p-3 sm:p-4 flex items-center gap-2.5 sm:gap-4 cursor-pointer transition-all ${
                  status === 'completed'
                    ? 'bg-[#F0FDF4] border-[#059669]'
                    : status === 'current'
                    ? 'bg-white border-[#191AFE] ring-4 ring-[#191AFE]/25 shadow-lg'
                    : 'bg-[#F8FAFC] opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Number Badge */}
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border-3 border-[#1E293B] flex items-center justify-center font-display font-black text-base sm:text-lg flex-shrink-0 shadow-[0_3px_0_#1E293B] ${
                    status === 'completed'
                      ? 'bg-[#10B981] text-white'
                      : status === 'current'
                      ? 'bg-[#191AFE] text-white animate-bounce'
                      : 'bg-[#CBD5E1] text-[#64748B]'
                  }`}
                >
                  {status === 'completed' ? '✓' : index + 1}
                </div>

                {/* Station Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#64748B] whitespace-nowrap">
                      TRẠM {index + 1} · {station.points} ĐIỂM
                    </span>
                    {status === 'completed' && (
                      <span className="game-badge game-badge-green text-[9px] py-0 whitespace-nowrap flex-shrink-0">
                        ĐÃ XONG
                      </span>
                    )}
                    {status === 'current' && (
                      <span className="inline-block px-1.5 sm:px-2 py-0.5 rounded-md bg-[#191AFE] text-white text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider animate-pulse whitespace-nowrap flex-shrink-0">
                        ĐANG CHỜ
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-black text-xs sm:text-sm text-[#0F172A] truncate">
                    {station.title}
                  </h3>

                  <p className="text-[11px] sm:text-xs text-[#64748B] line-clamp-1 mt-0.5 font-medium">
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
