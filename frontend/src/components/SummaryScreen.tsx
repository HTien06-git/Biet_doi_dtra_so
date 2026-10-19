// ============================================================================
// SUMMARY SCREEN - Báo Cáo Phá Án & Vinh Danh Thám Tử (2D Game Rực Rỡ)
// ============================================================================
'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Award, ShieldCheck, Copy, Check, RotateCcw,
  ChevronRight, Eye, Star, Sparkles, FileText, AlertOctagon, Download, X
} from 'lucide-react';
import { useGame } from '@/lib/gameStore';
import { CASES_DATA } from '@/data/casesData';
import { sounds } from '@/lib/sounds';
import { SolvedStamp } from '@/assets/illustrations';
import GameIcon from './GameIcon';
import LeaderboardModal from './LeaderboardModal';

export default function SummaryScreen() {
  const { state, dispatch, getCurrentCase, getCurrentCaseProgress } = useGame();
  const caseData = getCurrentCase();
  const progress = getCurrentCaseProgress();

  const [copiedCode, setCopiedCode] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [selectedClue, setSelectedClue] = useState<number | null>(null);

  useEffect(() => {
    sounds.playVictory();
  }, []);

  if (!caseData || !progress) {
    return (
      <div className="min-h-screen bg-game-backdrop flex items-center justify-center p-4">
        <div className="game-card p-6 text-center max-w-sm">
          <p className="font-bold text-sm text-[#64748B] mb-4">Không tìm thấy dữ liệu vụ án.</p>
          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'lobby' })}
            className="btn-game btn-game-amber text-xs px-4 py-2"
          >
            Trở về danh sách vụ án
          </button>
        </div>
      </div>
    );
  }

  const totalScore = progress.totalScore;
  const cluesCount = progress.cluesCollected;

  const rankInfo = useMemo(() => {
    if (totalScore >= 90) {
      return {
        rank: 'SSS',
        title: 'ĐẠI THÁM TỬ HUYỀN THOẠI',
        desc: 'Tư duy sắc bén, vạch trần mọi chiêu trò lừa đảo công nghệ cao!',
        bgColor: 'bg-[#FFCA28]',
        textColor: 'text-[#5D190A]',
        stars: 5,
        icon: '👑',
      };
    }
    if (totalScore >= 70) {
      return {
        rank: 'SS',
        title: 'CHUYÊN GIA AN NINH MẠNG',
        desc: 'Kiến thức an toàn số vững vàng, phán đoán chính xác các bẫy tinh vi!',
        bgColor: 'bg-[#93C5FD]',
        textColor: 'text-[#1E3A8A]',
        stars: 4,
        icon: '🛡️',
      };
    }
    if (totalScore >= 50) {
      return {
        rank: 'A',
        title: 'TRINH SÁT SỐ TIÊN PHONG',
        desc: 'Nhận diện được đa số thủ đoạn lừa đảo phổ biến!',
        bgColor: 'bg-[#6EE7B7]',
        textColor: 'text-[#064E3B]',
        stars: 3,
        icon: '⭐',
      };
    }
    return {
      rank: 'B',
      title: 'TẬP SỰ ĐIỀU TRA',
      desc: 'Cần nâng cao cảnh giác hơn trước những bẫy lừa đảo!',
      bgColor: 'bg-[#E2E8F0]',
      textColor: 'text-[#334155]',
      stars: 2,
      icon: '🔍',
    };
  }, [totalScore]);

  const confirmationCode = useMemo(() => {
    const seed = `${state.playerName}-${state.teamCode}-CASE${caseData.id}-${totalScore}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(6, '0').slice(0, 6);
    return `DTS-${caseData.id}${hex}`;
  }, [state.playerName, state.teamCode, caseData.id, totalScore]);

  const handleCopyCode = () => {
    sounds.playClick();
    navigator.clipboard.writeText(confirmationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleReplayCase = () => {
    sounds.playClick();
    dispatch({ type: 'SET_STATION', payload: 0 });
  };

  return (
    <div className="min-h-screen bg-game-backdrop text-[#0F172A] pb-16">
      {/* Header Bar Xanh Điện #1A1AFF */}
      <header className="sticky top-0 z-30 bg-[#1A1AFF] border-b-4 border-[#000088] px-4 py-2.5 shadow-lg text-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#FDE047] text-[#0F172A] text-xs font-black uppercase">
              VỤ ÁN #{caseData.caseNumber}
            </span>
            <h1 className="font-display font-black text-sm uppercase text-white truncate drop-shadow-sm">
              HỒ SƠ PHÁ ÁN HOÀN TẤT
            </h1>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              dispatch({ type: 'COMPLETE_CASE' });
            }}
            className="p-1.5 px-3 rounded-xl bg-white/15 border-2 border-white/40 hover:bg-white/25 active:translate-y-0.5 shadow-[0_2px_0_#000088] transition-all text-white font-display font-black text-xs"
          >
            Về Danh Sách Vụ
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-5">
        {/* Hero Card: Rank & Solved Stamp */}
        <div className="game-card p-6 bg-white relative overflow-hidden text-center space-y-4">
          <div className="absolute top-3 right-4 rotate-12 opacity-90 pointer-events-none">
            <SolvedStamp className="w-24 h-24 sm:w-28 sm:h-28" />
          </div>

          <div className="inline-block game-badge game-badge-yellow uppercase text-xs px-3.5 py-1 font-black">
            🎉 CHÚC MỪNG CHIẾN CÔNG ĐIỀU TRA
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-black uppercase text-[#3E2723] tracking-tight">
              {caseData.title}
            </h2>
            <p className="text-xs font-bold text-[#64748B] mt-0.5">
              Điều tra viên: <strong className="text-[#1E293B]">{state.playerName}</strong> · Đội: <strong className="text-[#1E293B]">{state.teamCode}</strong>
            </p>
          </div>

          {/* Rank Badge Emblem */}
          <div className="inline-flex flex-col items-center">
            <div className={`w-24 h-24 rounded-3xl border-4 border-[#4A2C11] ${rankInfo.bgColor} flex flex-col items-center justify-center shadow-[0_4px_0_#4A2C11] mb-2`}>
              <span className="text-3xl">{rankInfo.icon}</span>
              <span className="text-xl font-display font-black text-[#3E2723] tracking-wider">{rankInfo.rank}</span>
            </div>

            <div className="flex gap-1 mb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < rankInfo.stars
                      ? 'text-[#F59E0B] fill-current'
                      : 'text-[#CBD5E1]'
                  }`}
                />
              ))}
            </div>

            <h3 className="text-lg font-display font-black uppercase text-[#3E2723]">{rankInfo.title}</h3>
            <p className="text-xs text-[#64748B] font-semibold max-w-sm mt-0.5">{rankInfo.desc}</p>
          </div>

          {/* 4 Metric Badges including Duration */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t-2 border-[#1E293B]/20">
            <div className="p-3 bg-[#F1F5F9] border-2 border-[#1E293B] rounded-xl text-center">
              <span className="text-xl sm:text-2xl font-display font-black text-[#1A1AFF]">{totalScore}/100</span>
              <span className="text-[10px] font-black uppercase text-[#64748B] block">Tổng Điểm</span>
            </div>
            <div className="p-3 bg-[#F1F5F9] border-2 border-[#1E293B] rounded-xl text-center">
              <span className="text-xl sm:text-2xl font-display font-black text-[#D97706]">{cluesCount}/5</span>
              <span className="text-[10px] font-black uppercase text-[#64748B] block">Manh Mối</span>
            </div>
            <div className="p-3 bg-[#F1F5F9] border-2 border-[#1E293B] rounded-xl text-center">
              <span className="text-xl sm:text-2xl font-display font-black text-[#059669]">5/5</span>
              <span className="text-[10px] font-black uppercase text-[#64748B] block">Trạm Đã Qua</span>
            </div>
            <div className="p-3 bg-[#F1F5F9] border-2 border-[#1E293B] rounded-xl text-center">
              <span className="text-xl sm:text-2xl font-display font-black text-[#7C3AED]">
                {progress.durationSeconds ? `${Math.floor(progress.durationSeconds / 60)}p ${progress.durationSeconds % 60}s` : 'Vừa xong'}
              </span>
              <span className="text-[10px] font-black uppercase text-[#64748B] block">Thời Gian Phá Án</span>
            </div>
          </div>
        </div>

        {/* BTC Confirmation Code Box */}
        <div className="game-card p-5 bg-[#F8FAFC] border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-black uppercase text-[#1A1AFF]">
              <ShieldCheck className="w-4 h-4" />
              MÃ BÁO CÁO KẾT QUẢ CHO BAN TỔ CHỨC
            </div>
            <div className="font-mono text-2xl font-black text-[#0F172A] tracking-widest mt-1">
              {confirmationCode}
            </div>
            <p className="text-[11px] font-bold text-[#64748B]">
              Gửi mã này cho Trọng tài / BTC để xác thực điểm số lên Bảng Vàng.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopyCode}
              className="btn-game btn-game-primary text-xs px-4 py-2.5 flex items-center gap-1.5 shadow-[0_3px_0_#000066]"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  ĐÃ SAO CHÉP!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-white" />
                  SAO CHÉP MÃ
                </>
              )}
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setShowCertificate(true);
              }}
              className="btn-game btn-game-white text-xs px-4 py-2.5 flex items-center gap-1.5"
            >
              <Award className="w-4 h-4 text-[#D97706]" />
              CHỨNG NHẬN
            </button>
          </div>
        </div>

        {/* Investigation Conclusion & Safety Lessons (3 KHÔNG - 2 NÊN) */}
        <div className="game-card p-5 bg-white space-y-3">
          <h3 className="font-display font-black text-sm uppercase text-[#3E2723] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#2563EB]" />
            KẾT LUẬN ĐIỀU TRA & BÀI HỌC AN TOÀN SỐ
          </h3>

          <div className="p-3 bg-[#FFFDF9] border-2 border-[#4A2C11] rounded-xl text-xs leading-relaxed font-semibold text-[#1E293B]">
            <p className="text-[#DC2626] font-display font-black uppercase mb-1">Thủ đoạn phạm tội:</p>
            Kẻ gian thường tạo sức ép tâm lý hoang mang, dùng cuộc gọi mạo danh cơ quan chức năng, gửi giấy tờ giả hoặc dẫn dụ cài app độc hại để chiếm quyền kiểm soát thiết bị và tẩu tán tiền qua tài khoản không chính chủ.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-[#FEF2F2] border-2 border-[#DC2626] rounded-xl space-y-1.5">
              <h4 className="font-display font-black text-xs uppercase text-[#DC2626] flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4" />
                QUY TẮC 3 KHÔNG
              </h4>
              <ul className="text-xs font-bold text-[#1E293B] space-y-1 list-disc list-inside">
                <li><strong>KHÔNG</strong> chuyển tiền theo yêu cầu qua điện thoại.</li>
                <li><strong>KHÔNG</strong> cung cấp mã OTP, mật khẩu cho bất kỳ ai.</li>
                <li><strong>KHÔNG</strong> click link lạ hoặc cài app ngoài cửa hàng ứng dụng.</li>
              </ul>
            </div>

            <div className="p-3.5 bg-[#ECFDF5] border-2 border-[#059669] rounded-xl space-y-1.5">
              <h4 className="font-display font-black text-xs uppercase text-[#059669] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                QUY TẮC 2 NÊN
              </h4>
              <ul className="text-xs font-bold text-[#1E293B] space-y-1 list-disc list-inside">
                <li><strong>NÊN</strong> gọi xác minh qua số hotline chính thức cơ quan.</li>
                <li><strong>NÊN</strong> liên hệ ngân hàng khóa tài khoản ngay khi nghi ngờ.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Evidence Board (5 Clues Unlocked) */}
        <div className="game-card p-5 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-sm uppercase text-[#3E2723] flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#D97706]" />
              SỔ TAY BẰNG CHỨNG ĐÃ THU THẬP ({cluesCount}/5)
            </h3>
            <span className="text-[11px] font-bold text-[#64748B]">Bấm vào để đọc chi tiết</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {caseData.stations.map((st, idx) => {
              const isUnlocked = progress.stations[idx]?.clueUnlocked;
              return (
                <button
                  key={st.id}
                  onClick={() => {
                    sounds.playSelect();
                    setSelectedClue(idx);
                  }}
                  disabled={!isUnlocked}
                  className={`p-3 rounded-xl border-2 border-[#4A2C11] text-center transition-all ${
                    isUnlocked
                      ? 'bg-[#FFFDF9] hover:bg-[#FEF08A] shadow-[0_3px_0_#4A2C11]'
                      : 'bg-[#F1F5F9] opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex justify-center mb-1">
                    <GameIcon type={isUnlocked ? 'folder' : 'lock'} size="sm" theme={isUnlocked ? 'amber' : 'wood'} />
                  </div>
                  <div className="text-xs font-display font-black text-[#1E293B]">Trạm {idx + 1}</div>
                  <div className="text-[10px] font-bold text-[#64748B] truncate mt-0.5">
                    {isUnlocked ? st.clue.title : 'Chưa mở'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              setShowLeaderboard(true);
            }}
            className="flex-1 py-3.5 btn-game btn-game-primary text-sm tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_0_#000066]"
          >
            <Trophy className="w-4 h-4" />
            BẢNG XẾP HẠNG
          </button>

          <button
            onClick={handleReplayCase}
            className="py-3.5 px-6 btn-game btn-game-white text-sm tracking-wide flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            CHƠI LẠI
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              dispatch({ type: 'COMPLETE_CASE' });
            }}
            className="flex-1 py-3.5 btn-game btn-game-green text-sm tracking-wide flex items-center justify-center gap-2"
          >
            HỒ SƠ VỤ TIẾP THEO
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Clue Inspector Modal */}
      <AnimatePresence>
        {selectedClue !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md game-card p-5 bg-white space-y-3"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="flex items-center justify-between border-b-2 border-[#4A2C11] pb-2">
                <span className="font-display font-black text-xs uppercase text-[#DC2626]">
                  📂 Manh Mối Trạm #{selectedClue + 1}
                </span>
                <button
                  onClick={() => setSelectedClue(null)}
                  className="p-1 rounded-lg border-2 border-[#4A2C11] hover:bg-[#FEF08A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h4 className="font-display font-black text-sm text-[#1E293B]">
                {caseData.stations[selectedClue].clue.title}
              </h4>
              <p className="p-3 bg-[#FFFDF9] border-2 border-[#4A2C11] rounded-xl text-xs font-semibold leading-relaxed text-[#1E293B]">
                {caseData.stations[selectedClue].clue.content}
              </p>

              <button
                onClick={() => setSelectedClue(null)}
                className="w-full py-2.5 btn-game btn-game-amber text-xs"
              >
                ĐÃ HIỂU
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Digital Certificate Modal */}
      <AnimatePresence>
        {showCertificate && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg bg-[#FFFDF9] border-4 border-[#4A2C11] rounded-3xl p-6 sm:p-8 shadow-[0_8px_0_#4A2C11] relative overflow-hidden space-y-4"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="text-center space-y-1">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#FFCA28] border-3 border-[#4A2C11] flex items-center justify-center text-3xl mb-1 shadow-[0_3px_0_#4A2C11]">
                  🏅
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                  BAN CHỈ HUY ĐIỀU TRA KỸ THUẬT SỐ
                </div>
                <h2 className="text-2xl font-display font-black uppercase text-[#3E2723]">
                  CHỨNG NHẬN PHÁ ÁN
                </h2>
                <div className="w-24 h-1 bg-[#4A2C11] mx-auto rounded-full" />
              </div>

              <div className="text-center space-y-2 py-2">
                <p className="text-xs font-bold text-[#64748B] uppercase">Trao tặng điều tra viên</p>
                <div className="text-2xl font-display font-black text-[#1E293B]">
                  {state.playerName}
                </div>
                <p className="text-xs font-bold text-[#64748B]">
                  Đội thi đấu: <strong className="text-[#1E293B]">{state.teamCode}</strong>
                </p>
                <p className="text-xs font-semibold text-[#1E293B] leading-relaxed max-w-sm mx-auto pt-2">
                  Đã hoàn thành xuất sắc điều tra và phá thành công vụ án{' '}
                  <strong className="text-[#DC2626]">#{caseData.caseNumber}: {caseData.title}</strong>,
                  đạt tổng điểm <strong className="text-[#059669]">{totalScore}/100</strong> và được phong tặng danh hiệu:
                </p>
                <div className="inline-block px-4 py-1.5 rounded-full bg-[#FFCA28] border-2 border-[#4A2C11] text-xs font-display font-black uppercase shadow-[0_2px_0_#4A2C11]">
                  {rankInfo.title}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t-2 border-[#4A2C11]/20 text-xs font-bold">
                <div>
                  <p className="text-[#64748B]">Mã chứng nhận: <strong className="text-[#1E293B] font-mono">{confirmationCode}</strong></p>
                  <p className="text-[10px] text-[#94A3B8]">Ngày cấp: {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="text-center rotate-[-10deg]">
                  <SolvedStamp className="w-16 h-16" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 btn-game btn-game-amber text-xs flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  IN / LƯU PDF
                </button>
                <button
                  onClick={() => setShowCertificate(false)}
                  className="px-5 py-2.5 btn-game btn-game-white text-xs"
                >
                  ĐÓNG
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        highlightPlayer={{ name: state.playerName, teamCode: state.teamCode }}
      />
    </div>
  );
}
