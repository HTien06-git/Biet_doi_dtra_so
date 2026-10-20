// ============================================================================
// LEADERBOARD MODAL - Bảng Vàng Thám Tử Số (2D Game Rực Rỡ)
// Hỗ trợ Xếp Hạng Cá Nhân & Xếp Hạng Đội (Tổng điểm các thành viên trùng mã đội)
// ============================================================================
'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, X, Sparkles, RefreshCw, Users, Shield, CheckCircle,
  ChevronDown, ChevronUp, UserCheck, Flame, Star, Search, Clock,
  Crown, Medal, Award
} from 'lucide-react';
import { getAllSessions, PlayerSession } from '@/lib/supabase';
import { CASES_DATA } from '@/data/casesData';
import { sounds } from '@/lib/sounds';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightPlayer?: { name: string; teamCode: string };
}

interface TeamMemberBreakdown {
  player_name: string;
  team_code: string;
  case_id: number;
  total_score: number;
  clues_collected: number;
  stations_completed: number;
  is_completed: boolean;
  station_scores?: number[];
  duration_seconds?: number;
}

interface TeamRankingItem {
  team_code: string;
  total_score: number;
  total_clues: number;
  cases_completed: number;
  members: TeamMemberBreakdown[];
  uniqueMembersCount: number;
}

export default function LeaderboardModal({ isOpen, onClose, highlightPlayer }: LeaderboardModalProps) {
  const [sessions, setSessions] = useState<PlayerSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'individual' | 'team'>('individual');
  const [activeTab, setActiveTab] = useState<'all' | number>('all');
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAllSessions();
      setSessions(data || []);
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

  const toggleTeamExpand = (teamCode: string) => {
    sounds.playSelect();
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamCode)) next.delete(teamCode); else next.add(teamCode);
      return next;
    });
  };

  // 1. DỮ LIỆU CÁ NHÂN (INDIVIDUAL RANKINGS)
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (activeTab === 'all') return true;
      return s.case_id === activeTab;
    });
  }, [sessions, activeTab]);

  const individualRankings = useMemo(() => {
    if (activeTab !== 'all') {
      return [...filteredSessions].sort((a, b) => {
        if ((b.total_score || 0) !== (a.total_score || 0)) {
          return (b.total_score || 0) - (a.total_score || 0);
        }
        if ((b.clues_collected || 0) !== (a.clues_collected || 0)) {
          return (b.clues_collected || 0) - (a.clues_collected || 0);
        }
        return (a.duration_seconds || 999999) - (b.duration_seconds || 999999);
      });
    }

    // Toàn bộ giải đấu: Gộp điểm theo từng người chơi (nếu 1 người chơi nhiều vụ án)
    const playerMap: Record<string, {
      player_name: string;
      team_code: string;
      total_score: number;
      clues_collected: number;
      cases_completed: number;
      stations_completed: number;
      cases_played: number[];
      updated_at: string;
    }> = {};

    sessions.forEach((s) => {
      const key = `${s.player_name.trim().toLowerCase()}___${s.team_code.trim().toUpperCase()}`;
      if (!playerMap[key]) {
        playerMap[key] = {
          player_name: s.player_name,
          team_code: s.team_code,
          total_score: 0,
          clues_collected: 0,
          cases_completed: 0,
          stations_completed: 0,
          cases_played: [s.case_id],
          updated_at: s.updated_at || '',
        };
      } else {
        if (!playerMap[key].cases_played.includes(s.case_id)) {
          playerMap[key].cases_played.push(s.case_id);
          playerMap[key].cases_played.sort((a, b) => a - b);
        }
      }
      playerMap[key].total_score += s.total_score || 0;
      playerMap[key].clues_collected += s.clues_collected || 0;
      playerMap[key].stations_completed += s.stations_completed || 0;
      if (s.is_completed || s.stations_completed === 5) {
        playerMap[key].cases_completed += 1;
      }
      if (s.updated_at && (!playerMap[key].updated_at || s.updated_at > playerMap[key].updated_at)) {
        playerMap[key].updated_at = s.updated_at;
      }
    });

    return Object.values(playerMap).sort((a, b) => {
      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      if (b.cases_completed !== a.cases_completed) return b.cases_completed - a.cases_completed;
      return b.clues_collected - a.clues_collected;
    });
  }, [filteredSessions, sessions, activeTab]);

  // 2. DỮ LIỆU ĐỘI (TEAM RANKINGS - CỘNG ĐIỂM TẤT CẢ CÁC USER CÙNG MÃ ĐỘI)
  const teamRankings: TeamRankingItem[] = useMemo(() => {
    const teamMap = new Map<string, TeamRankingItem>();

    sessions.forEach((s) => {
      if (!s.team_code || !s.team_code.trim()) return;
      const teamKey = s.team_code.trim().toUpperCase();

      if (!teamMap.has(teamKey)) {
        teamMap.set(teamKey, {
          team_code: s.team_code,
          total_score: 0,
          total_clues: 0,
          cases_completed: 0,
          members: [],
          uniqueMembersCount: 0,
        });
      }

      const team = teamMap.get(teamKey)!;
      team.members.push({
        player_name: s.player_name,
        team_code: s.team_code,
        case_id: s.case_id,
        total_score: s.total_score || 0,
        clues_collected: s.clues_collected || 0,
        stations_completed: s.stations_completed || 0,
        is_completed: s.is_completed || s.stations_completed === 5,
        station_scores: s.station_scores || [],
        duration_seconds: s.duration_seconds,
      });

      team.total_score += s.total_score || 0;
      team.total_clues += s.clues_collected || 0;
      if (s.is_completed || s.stations_completed === 5) {
        team.cases_completed += 1;
      }
    });

    // Tính số lượng thành viên độc lập
    teamMap.forEach((team) => {
      const uniqueNames = new Set(team.members.map((m) => m.player_name.trim().toLowerCase()));
      team.uniqueMembersCount = uniqueNames.size;
    });

    // Sắp xếp Đội: Điểm cao nhất -> Số vụ phá xong nhiều nhất -> Manh mối nhiều nhất
    return Array.from(teamMap.values()).sort((a, b) => {
      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      if (b.cases_completed !== a.cases_completed) return b.cases_completed - a.cases_completed;
      return b.total_clues - a.total_clues;
    });
  }, [sessions]);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#FEF08A] to-[#F59E0B] border-2 border-[#854D0E] flex items-center justify-center font-display font-black text-xs text-[#451A03] shadow-[0_2px_0_#854D0E] gap-0.5 flex-shrink-0">
            <Crown className="w-3.5 h-3.5 text-[#854D0E] fill-current" />
            <span>1</span>
          </div>
        );
      case 2:
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#F1F5F9] to-[#CBD5E1] border-2 border-[#475569] flex items-center justify-center font-display font-black text-xs text-[#1E293B] shadow-[0_2px_0_#475569] gap-0.5 flex-shrink-0">
            <Medal className="w-3.5 h-3.5 text-[#475569] fill-current" />
            <span>2</span>
          </div>
        );
      case 3:
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#FFEDD5] to-[#FB923C] border-2 border-[#9A3412] flex items-center justify-center font-display font-black text-xs text-[#7C2D12] shadow-[0_2px_0_#9A3412] gap-0.5 flex-shrink-0">
            <Award className="w-3.5 h-3.5 text-[#9A3412] fill-current" />
            <span>3</span>
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-[#F1F5F9] border-2 border-[#CBD5E1] flex items-center justify-center font-display font-black text-xs text-[#64748B] flex-shrink-0">
            #{rank}
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-3xl game-card bg-white overflow-hidden flex flex-col max-h-[92vh] border-3 border-[#1E293B] shadow-2xl"
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
          >
            {/* Header Xanh Điện #191AFE Chuẩn Nhận Diện */}
            <div className="bg-[#191AFE] border-b-4 border-[#000088] p-3 sm:p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white shadow-[0_2px_0_#000088] flex-shrink-0">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-[#FDE047]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-lg font-display font-black uppercase tracking-tight flex items-center gap-1.5 text-white truncate">
                    BẢNG VÀNG THÀNH TÍCH GIẢI ĐẤU
                    <Sparkles className="w-4 h-4 text-[#FDE047] flex-shrink-0" />
                  </h2>
                  <p className="text-[10px] sm:text-[11px] font-bold text-white/80 truncate">
                    Vinh danh thành tích cá nhân & xếp hạng liên minh đội
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
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

            {/* View Mode Switcher: Cá Nhân vs Đội */}
            <div className="bg-[#0F172A] p-2 flex items-center justify-between gap-2 border-b-2 border-[#1E293B]">
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
                <button
                  onClick={() => {
                    sounds.playSelect();
                    setViewMode('individual');
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-display font-black text-[11px] sm:text-xs uppercase flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    viewMode === 'individual'
                      ? 'bg-[#FDE047] text-[#0F172A] shadow-[0_2px_0_#854D0E]'
                      : 'bg-[#1E293B] text-white/80 hover:bg-[#334155]'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="whitespace-nowrap">Xếp Hạng Cá Nhân</span>
                </button>

                <button
                  onClick={() => {
                    sounds.playSelect();
                    setViewMode('team');
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-display font-black text-[11px] sm:text-xs uppercase flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    viewMode === 'team'
                      ? 'bg-[#FDE047] text-[#0F172A] shadow-[0_2px_0_#854D0E]'
                      : 'bg-[#1E293B] text-white/80 hover:bg-[#334155]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="whitespace-nowrap">Xếp Hạng Đội ({teamRankings.length})</span>
                </button>
              </div>

              <span className="text-[10px] font-bold text-white/70 hidden sm:inline whitespace-nowrap">
                {viewMode === 'individual' ? 'Thành tích theo điều tra viên' : 'Tổng điểm các user cùng mã đội'}
              </span>
            </div>

            {/* Sub Filter Tabs (Chỉ hiển thị khi ở tab Cá Nhân) */}
            {viewMode === 'individual' && (
              <div className="flex gap-2 p-2.5 bg-[#F8FAFC] border-b-2 border-[#E2E8F0] overflow-x-auto text-xs">
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
            )}

            {/* ================================================================ */}
            {/* NỘI DUNG 1: BẢNG XẾP HẠNG CÁ NHÂN */}
            {/* ================================================================ */}
            {viewMode === 'individual' && (
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-[#F8FAFC]">
                {isLoading ? (
                  <div className="py-16 text-center text-[#64748B] flex flex-col items-center gap-2">
                    <RefreshCw className="w-8 h-8 animate-spin text-[#191AFE]" />
                    <p className="font-bold text-xs">Đang tải hồ sơ bảng vàng...</p>
                  </div>
                ) : individualRankings.length === 0 ? (
                  <div className="py-16 text-center text-[#64748B] flex flex-col items-center gap-2">
                    <Shield className="w-12 h-12 text-[#CBD5E1] mb-1" />
                    <p className="font-display font-black text-sm text-[#1E293B]">Chưa có dữ liệu phá án nào được ghi nhận</p>
                    <p className="text-xs">Hãy hoàn thành trạm và trở thành người đầu tiên ghi tên lên bảng vàng!</p>
                  </div>
                ) : (
                  individualRankings.map((item, idx) => {
                    const isCurrent =
                      highlightPlayer &&
                      item.player_name.trim().toLowerCase() === highlightPlayer.name.trim().toLowerCase() &&
                      item.team_code.trim().toUpperCase() === highlightPlayer.teamCode.trim().toUpperCase();

                    const totalScore = 'total_score' in item ? (item.total_score || 0) : 0;
                    const clues = 'clues_collected' in item ? (item.clues_collected || 0) : 0;
                    const durationSec = 'duration_seconds' in item ? item.duration_seconds : undefined;

                    return (
                      <div
                        key={`${item.player_name}-${item.team_code}-${idx}`}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                          isCurrent
                            ? 'bg-[#FEF08A] border-[#D97706] shadow-[0_3px_0_#D97706]'
                            : 'bg-white border-[#CBD5E1] hover:border-[#94A3B8] shadow-sm'
                        }`}
                      >
                        {getRankBadge(idx + 1)}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display font-black text-sm text-[#0F172A] truncate">
                              {item.player_name}
                            </span>
                            {isCurrent && (
                              <span className="game-badge game-badge-yellow text-[9px] py-0 font-black">
                                BẠN
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] mt-1 flex-wrap">
                            <span className="flex items-center gap-1 bg-[#EFF6FF] text-[#1E40AF] px-2 py-0.5 rounded-md font-mono border border-[#BFDBFE]">
                              <Users className="w-3 h-3" />
                              {item.team_code}
                            </span>
                            {activeTab === 'all' && 'cases_completed' in item && (
                              <span className="text-[#059669] flex items-center gap-1 font-semibold">
                                <CheckCircle className="w-3.5 h-3.5" />
                                {item.cases_completed} vụ hoàn thành
                              </span>
                            )}
                            {durationSec && durationSec > 0 && (
                              <span className="text-[#191AFE] flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" />
                                {Math.floor(durationSec / 60)}p {durationSec % 60}s
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-base sm:text-lg font-display font-black text-[#191AFE]">
                            {totalScore} <span className="text-xs font-bold text-[#64748B]">đ</span>
                          </div>
                          <div className="text-[10px] font-black text-[#B45309]">
                            🔍 {clues} manh mối
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ================================================================ */}
            {/* NỘI DUNG 2: BẢNG XẾP HẠNG ĐỘI (TEAM RANKING & SCORE BREAKDOWN) */}
            {/* ================================================================ */}
            {viewMode === 'team' && (
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#F8FAFC]">
                {/* Banner giải thích tính điểm minh bạch */}
                <div className="p-3 rounded-xl bg-[#EFF6FF] border-2 border-[#BFDBFE] text-xs text-[#1E40AF] font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#191AFE] flex-shrink-0" />
                    <span>
                      <strong>Quy chế tính điểm Đội:</strong> Tổng điểm toàn đội được cộng dồn từ <strong>tất cả các thành viên cùng mã đội</strong> khi phá các vụ án.
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-[#191AFE] uppercase hidden sm:inline">
                    So Sánh Cao Thấp
                  </span>
                </div>

                {isLoading ? (
                  <div className="py-16 text-center text-[#64748B] flex flex-col items-center gap-2">
                    <RefreshCw className="w-8 h-8 animate-spin text-[#191AFE]" />
                    <p className="font-bold text-xs">Đang tổng hợp điểm số các đội...</p>
                  </div>
                ) : teamRankings.length === 0 ? (
                  <div className="py-16 text-center text-[#64748B] flex flex-col items-center gap-2">
                    <Shield className="w-12 h-12 text-[#CBD5E1] mb-1" />
                    <p className="font-display font-black text-sm text-[#1E293B]">Chưa có đội nào tham gia thi đấu</p>
                    <p className="text-xs">Các đội đăng ký và phá án sẽ hiển thị tại đây!</p>
                  </div>
                ) : (
                  teamRankings.map((team, idx) => {
                    const isExpanded = expandedTeams.has(team.team_code);
                    const isHighlight =
                      highlightPlayer &&
                      team.team_code.trim().toUpperCase() === highlightPlayer.teamCode.trim().toUpperCase();

                    return (
                      <div
                        key={team.team_code}
                        className={`rounded-2xl border-2 overflow-hidden transition-all ${
                          isHighlight
                            ? 'bg-[#FFFBEB] border-[#F59E0B] shadow-md'
                            : 'bg-white border-[#CBD5E1] shadow-sm hover:border-[#94A3B8]'
                        }`}
                      >
                        {/* Main Team Row */}
                        <div
                          onClick={() => toggleTeamExpand(team.team_code)}
                          className="p-3.5 flex items-center gap-3 cursor-pointer hover:bg-[#F8FAFC]/80 transition-colors"
                        >
                          {getRankBadge(idx + 1)}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display font-black text-base text-[#0F172A] tracking-tight">
                                ĐỘI {team.team_code}
                              </span>
                              {isHighlight && (
                                <span className="game-badge game-badge-yellow text-[9px] py-0 font-black">
                                  ĐỘI CỦA BẠN
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs font-bold text-[#64748B] mt-1 flex-wrap">
                              <span className="flex items-center gap-1 text-[#0F172A]">
                                <Users className="w-3.5 h-3.5 text-[#191AFE]" />
                                {team.uniqueMembersCount} thành viên
                              </span>
                              <span className="flex items-center gap-1 text-[#059669]">
                                <CheckCircle className="w-3.5 h-3.5" />
                                {team.cases_completed} vụ hoàn tất
                              </span>
                              <span className="flex items-center gap-1 text-[#B45309]">
                                🔍 {team.total_clues} manh mối
                              </span>
                            </div>
                          </div>

                          {/* Total Score & Expand toggle button */}
                          <div className="text-right flex items-center gap-2 flex-shrink-0">
                            <div>
                              <div className="text-xl sm:text-2xl font-display font-black text-[#191AFE]">
                                {team.total_score} <span className="text-xs font-bold text-[#64748B]">đ</span>
                              </div>
                              <span className="text-[10px] font-bold text-[#64748B]">
                                Tổng điểm đội
                              </span>
                            </div>

                            <button
                              type="button"
                              className="p-1.5 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] transition-all ml-1"
                              title="Xem chi tiết các thành viên đóng góp"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-[#191AFE]" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Chi Tiết Vì Sao Ra Con Số Đó (Breakdown Detail) */}
                        {isExpanded && (
                          <div className="border-t-2 border-[#E2E8F0] bg-[#F8FAFC] p-3 sm:p-4 space-y-3 animate-in fade-in duration-200">
                            {/* Công thức tổng điểm */}
                            <div className="p-2.5 rounded-xl bg-white border border-[#CBD5E1] text-xs font-bold text-[#0F172A]">
                              <span className="text-[#64748B] text-[10px] uppercase font-black block mb-0.5">
                                📊 Chi tiết công thức điểm tổng:
                              </span>
                              <div className="font-mono text-xs text-[#191AFE] flex items-center gap-1 flex-wrap">
                                <span className="font-black text-sm">{team.total_score}đ</span> =
                                {team.members.map((m, mIdx) => (
                                  <span key={mIdx} className="bg-[#EFF6FF] px-1.5 py-0.5 rounded border border-[#BFDBFE] text-[11px]">
                                    {m.player_name}: <strong>{m.total_score}đ</strong> (Vụ #{m.case_id})
                                    {mIdx < team.members.length - 1 ? ' +' : ''}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Danh sách thành viên đóng góp */}
                            <div className="overflow-x-auto rounded-xl border border-[#CBD5E1] bg-white">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-[#F1F5F9] text-[#475569] font-black uppercase text-[10px]">
                                  <tr>
                                    <th className="py-2 px-3">Thành Viên</th>
                                    <th className="py-2 px-2 text-center">Vụ Án</th>
                                    <th className="py-2 px-2 text-center">Trạm Hoàn Thành</th>
                                    <th className="py-2 px-3 text-center">Điểm Đóng Góp</th>
                                    <th className="py-2 px-2 text-center">Manh Mối</th>
                                    <th className="py-2 px-2 text-center">Trạng Thái</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E8F0] font-semibold text-[#1E293B]">
                                  {team.members.map((m, mIdx) => {
                                    const mCase = CASES_DATA.find((c) => c.id === m.case_id);
                                    return (
                                      <tr key={mIdx} className="hover:bg-[#F8FAFC]">
                                        <td className="py-2 px-3 font-bold text-[#0F172A]">
                                          {m.player_name}
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                          <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] font-black text-[10px]">
                                            Vụ #{m.case_id}
                                          </span>
                                        </td>
                                        <td className="py-2 px-2 text-center font-bold">
                                          {m.stations_completed || 0}/5 trạm
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          <span className="font-display font-black text-[#059669]">
                                            +{m.total_score}đ
                                          </span>
                                        </td>
                                        <td className="py-2 px-2 text-center text-[#B45309] font-bold">
                                          🔍 {m.clues_collected}
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                          {m.is_completed ? (
                                            <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-[#059669] text-[#064E3B] text-[9px] font-black">
                                              ✓ PHÁ ÁN XONG
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 rounded-full bg-[#FEF2F2] border border-[#DC2626] text-[#991B1B] text-[9px] font-black">
                                              CHƯA HOÀN TẤT
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Footer */}
            <div className="p-3 bg-white border-t-2 border-[#CBD5E1] flex items-center justify-between text-xs font-bold">
              <span className="text-[#059669] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping inline-block" />
                Dữ liệu xếp hạng cập nhật thời gian thực
              </span>
              <button
                onClick={() => {
                  sounds.playClick();
                  onClose();
                }}
                className="btn-game btn-game-white text-xs px-4 py-1.5 border-2 border-[#1E293B]"
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
