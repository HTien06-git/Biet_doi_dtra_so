// ============================================================================
// LEADERBOARD MODAL - Bảng Vàng Thám Tử Số (2D Game Rực Rỡ)
// ============================================================================
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Sparkles, RefreshCw, Users, Shield, CheckCircle } from 'lucide-react';
import { getAllSessions, PlayerSession } from '@/lib/supabase';
import { CASES_DATA } from '@/data/casesData';
import { sounds } from '@/lib/sounds';
import GameIcon from './GameIcon';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightPlayer?: { name: string; teamCode: string };
}

export default function LeaderboardModal({ isOpen, onClose, highlightPlayer }: LeaderboardModalProps) {
  const [sessions, setSessions] = useState<PlayerSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | number>('all');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAllSessions();
      setSessions(data);
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === 'all') return true;
    return s.case_id === activeTab;
  });

  const rankings = (() => {
    if (activeTab !== 'all') {
      return [...filteredSessions].sort((a, b) => {
        if (b.total_score !== a.total_score) return b.total_score - a.total_score;
        return (b.clues_collected || 0) - (a.clues_collected || 0);
      });
    }

    const playerMap: Record<string, {
      player_name: string;
      team_code: string;
      total_score: number;
      clues_collected: number;
      cases_completed: number;
      updated_at: string;
    }> = {};

    sessions.forEach((s) => {
      const key = `${s.player_name}___${s.team_code}`;
      if (!playerMap[key]) {
        playerMap[key] = {
          player_name: s.player_name,
          team_code: s.team_code,
          total_score: 0,
          clues_collected: 0,
          cases_completed: 0,
          updated_at: s.updated_at || '',
        };
      }
      playerMap[key].total_score += s.total_score || 0;
      playerMap[key].clues_collected += s.clues_collected || 0;
      if (s.is_completed) {
        playerMap[key].cases_completed += 1;
      }
      if (s.updated_at && (!playerMap[key].updated_at || s.updated_at > playerMap[key].updated_at)) {
        playerMap[key].updated_at = s.updated_at;
      }
    });

    return Object.values(playerMap).sort((a, b) => {
      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      return b.clues_collected - a.clues_collected;
    });
  })();

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#FDE047] to-[#F59E0B] border-2 border-[#4A2C11] flex items-center justify-center font-display font-black text-sm text-[#451A03] shadow-[0_2px_0_#4A2C11]">
            🥇
          </div>
        );
      case 2:
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#E2E8F0] to-[#CBD5E1] border-2 border-[#4A2C11] flex items-center justify-center font-display font-black text-sm text-[#334155] shadow-[0_2px_0_#4A2C11]">
            🥈
          </div>
        );
      case 3:
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#FED7AA] to-[#F97316] border-2 border-[#4A2C11] flex items-center justify-center font-display font-black text-sm text-[#7C2D12] shadow-[0_2px_0_#4A2C11]">
            🥉
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-[#F1F5F9] border-2 border-[#4A2C11] flex items-center justify-center font-display font-black text-xs text-[#64748B]">
            #{rank}
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-2xl game-card bg-white overflow-hidden flex flex-col max-h-[90vh]"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Header Xanh Điện #1A1AFF */}
            <div className="bg-[#1A1AFF] border-b-4 border-[#000088] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white">
                  <Trophy className="w-6 h-6 fill-current text-[#FDE047]" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-display font-black uppercase tracking-tight flex items-center gap-2 text-white">
                    BẢNG VÀNG THÁM TỬ SỐ
                    <Sparkles className="w-4 h-4 text-[#FDE047]" />
                  </h2>
                  <p className="text-xs font-bold text-white/80">
                    Vinh danh các điều tra viên phá án xuất sắc nhất
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    sounds.playClick();
                    loadData();
                  }}
                  className="p-1.5 bg-white/15 rounded-lg border-2 border-white/40 hover:bg-white/25 text-white shadow-[0_2px_0_#000088] transition-all"
                  title="Làm mới"
                >
                  <RefreshCw className={`w-4 h-4 text-white ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onClose();
                  }}
                  className="p-1.5 bg-white/15 rounded-lg border-2 border-white/40 hover:bg-white/25 text-white shadow-[0_2px_0_#000088] transition-all"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 p-3 bg-[#F8FAFC] border-b-2 border-[#1E293B] overflow-x-auto text-xs">
              <button
                onClick={() => {
                  sounds.playSelect();
                  setActiveTab('all');
                }}
                className={`game-badge ${
                  activeTab === 'all'
                    ? 'game-badge-blue py-1 text-xs'
                    : 'bg-white text-[#64748B] py-1 border-[#CBD5E1]'
                }`}
              >
                🏆 Toàn bộ giải đấu
              </button>
              {CASES_DATA.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    sounds.playSelect();
                    setActiveTab(c.id);
                  }}
                  className={`game-badge ${
                    activeTab === c.id
                      ? 'game-badge-blue py-1 text-xs'
                      : 'bg-white text-[#64748B] py-1 border-[#CBD5E1]'
                  }`}
                >
                  Vụ #{c.caseNumber}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#F8FAFC]">
              {isLoading ? (
                <div className="py-16 text-center text-[#64748B] flex flex-col items-center gap-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#D97706]" />
                  <p className="font-bold text-xs">Đang tải hồ sơ bảng vàng...</p>
                </div>
              ) : rankings.length === 0 ? (
                <div className="py-16 text-center text-[#64748B] flex flex-col items-center gap-2">
                  <Shield className="w-12 h-12 text-[#CBD5E1] mb-1" />
                  <p className="font-display font-black text-sm text-[#1E293B]">Chưa có dữ liệu phá án nào được ghi nhận</p>
                  <p className="text-xs">Hãy hoàn thành trạm và trở thành người đầu tiên ghi tên lên bảng vàng!</p>
                </div>
              ) : (
                rankings.map((item, idx) => {
                  const isCurrent =
                    highlightPlayer &&
                    item.player_name === highlightPlayer.name &&
                    item.team_code === highlightPlayer.teamCode;

                  const totalScore = 'total_score' in item ? item.total_score : 0;
                  const clues = 'clues_collected' in item ? item.clues_collected : 0;

                  return (
                    <div
                      key={`${item.player_name}-${item.team_code}-${idx}`}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 border-[#4A2C11] transition-all ${
                        isCurrent
                          ? 'bg-[#FEF08A] shadow-[0_4px_0_#EA580C]'
                          : 'bg-white shadow-[0_3px_0_#4A2C11]'
                      }`}
                    >
                      {getRankBadge(idx + 1)}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-sm text-[#1E293B] truncate">
                            {item.player_name}
                          </span>
                          {isCurrent && (
                            <span className="game-badge game-badge-yellow text-[9px] py-0">
                              BẠN
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] mt-0.5">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            Đội: {item.team_code}
                          </span>
                          {activeTab === 'all' && 'cases_completed' in item && (
                            <span className="text-[#059669] flex items-center gap-1 font-semibold">
                              <CheckCircle className="w-3.5 h-3.5" />
                              {item.cases_completed}/4 Vụ
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-display font-black text-[#1E293B]">
                          {totalScore} <span className="text-xs font-bold text-[#64748B]">đ</span>
                        </div>
                        <div className="text-[10px] font-bold text-[#B45309]">
                          🔍 {clues} manh mối
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-white border-t-2 border-[#4A2C11] flex items-center justify-between text-xs font-bold">
              <span className="text-[#059669] flex items-center gap-1">
                ● Trạng thái: Trực tuyến
              </span>
              <button
                onClick={() => {
                  sounds.playClick();
                  onClose();
                }}
                className="btn-game btn-game-white text-xs px-4 py-1.5"
              >
                ĐÓNG
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
