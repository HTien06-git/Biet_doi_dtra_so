// ============================================================================
// PLAYING SCREEN - Hiện Trường Điều Tra Chuẩn Bố Cục "Case Hunter"
// Split-view 2 cột trên Laptop, Khay gỗ bằng chứng bên trái, Băng rôn vàng dưới đáy
// ============================================================================
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Search, Eye, X, ChevronRight, CheckCircle, XCircle,
  Lightbulb, Star, Sparkles, MessageSquare, FileSearch, CreditCard,
  Camera, Clock, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { useGame } from '@/lib/gameStore';
import { Station } from '@/data/casesData';
import { sounds } from '@/lib/sounds';
import GameIcon from './GameIcon';
import { CaseHunterRoomStage } from '@/assets/illustrations';

export default function PlayingScreen() {
  const {
    state,
    dispatch,
    getCurrentCase,
    getCurrentStation,
    getCurrentCaseProgress,
  } = useGame();

  const caseData = getCurrentCase();
  const station = getCurrentStation();
  const progress = getCurrentCaseProgress();

  const [showEvidence, setShowEvidence] = useState(false);
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState<number | null>(null);
  const [showWrongFeedback, setShowWrongFeedback] = useState(false);

  if (!caseData || !station || !progress) return null;

  const stationProgress = progress.stations[state.currentStationIndex];
  const isAlreadyCompleted = stationProgress?.completed;

  // Check correctness
  const correctAnswerIds = station.answers.filter((a) => a.isCorrect).map((a) => a.id).sort();
  const selectedSorted = [...state.selectedAnswers].sort();
  const isCurrentAnswerCorrect =
    correctAnswerIds.length === selectedSorted.length &&
    correctAnswerIds.every((a, i) => a === selectedSorted[i]);

  const handleToggleAnswer = (answerId: string) => {
    if (state.isAnswerChecked || isAlreadyCompleted) return;
    sounds.playSelect();
    if (state.selectedAnswers.includes(answerId)) {
      dispatch({ type: 'DESELECT_ANSWER', payload: answerId });
    } else {
      dispatch({ type: 'SELECT_ANSWER', payload: answerId });
    }
  };

  const handleCheckAnswer = () => {
    if (state.selectedAnswers.length === 0) return;

    if (isCurrentAnswerCorrect) {
      sounds.playCorrect();
      dispatch({
        type: 'ANSWER_CORRECT',
        payload: {
          stationIndex: state.currentStationIndex,
          points: station.points,
        },
      });
    } else if (state.gameMode === 'strict') {
      sounds.playWrong();
      dispatch({
        type: 'ANSWER_WRONG_STRICT',
        payload: { stationIndex: state.currentStationIndex },
      });
    } else {
      sounds.playWrong();
      setShowWrongFeedback(true);
      dispatch({ type: 'RESET_STATION_UI' });
    }
  };

  const handleNextStation = () => {
    sounds.playClick();
    setShowWrongFeedback(false);
    dispatch({ type: 'NEXT_STATION' });
  };

  const handleGoBack = () => {
    sounds.playClick();
    setShowWrongFeedback(false);
    dispatch({ type: 'SET_SCREEN', payload: 'stations' });
  };

  const isLastStation = state.currentStationIndex >= caseData.stations.length - 1;

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4 text-[#2563EB]" />;
      case 'document': return <FileSearch className="w-4 h-4 text-[#D97706]" />;
      case 'transaction': return <CreditCard className="w-4 h-4 text-[#059669]" />;
      case 'screenshot': return <Camera className="w-4 h-4 text-[#9333EA]" />;
      default: return <Clock className="w-4 h-4 text-[#DC2626]" />;
    }
  };

  return (
    <div className="min-h-screen bg-game-backdrop text-[#1E293B] pb-8">
      {/* 1. Header Bar Băng Rôn Gỗ */}
      <header className="sticky top-0 z-30 bg-[#FFCA28] border-b-4 border-[#4A2C11] px-4 py-2.5 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoBack}
              className="p-1.5 rounded-xl bg-white border-2 border-[#4A2C11] hover:bg-[#FEF08A] shadow-[0_3px_0_#4A2C11] active:translate-y-0.5 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-[#3E2723] stroke-[3]" />
            </button>
            <div>
              <span className="game-badge game-badge-wood text-[10px] py-0">
                TRẠM {state.currentStationIndex + 1}/5
              </span>
              <h1 className="font-display font-black text-xs sm:text-base text-[#3E2723] truncate max-w-[200px] sm:max-w-md">
                {station.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="game-badge game-badge-green text-xs font-black shadow-[0_2px_0_#064E3B]">
              ⭐ +{station.points} ĐIỂM
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Game Area: Split View 2 Cột Trên Laptop (Max 1100px) */}
      <div className="max-w-[1100px] mx-auto px-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* CỘT TRÁI (Lg: 7 cols): Khung Căn Phòng 2D + Khay Gỗ Trái + Băng Rôn Vàng Đáy */}
          <div className="lg:col-span-7 space-y-3">
            {/* Khung Bao Căn Phòng Kết Hợp Khay Gỗ Bên Trái */}
            <div className="relative game-room-stage flex">
              
              {/* KHAY GỖ BÊN TRÁI (Left Wooden Evidence Tray) */}
              <div className="w-14 sm:w-16 game-wooden-tray flex flex-col items-center py-3 px-1 gap-2.5 flex-shrink-0 z-20">
                {/* Nút Kính Lúp Tròn Màu Vàng Cam */}
                <button
                  onClick={() => {
                    sounds.playMagnify();
                    setShowEvidence(true);
                  }}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-b from-[#FDE047] to-[#F59E0B] border-3 border-[#331A05] flex items-center justify-center shadow-[0_4px_0_#331A05] hover:scale-105 active:translate-y-1 transition-all"
                  title="Soi Kính Lúp Bằng Chứng"
                >
                  <Search className="w-5 h-5 text-[#451A03] stroke-[3]" />
                </button>

                {/* Các ô vuông viền gỗ chứa ảnh bằng chứng */}
                {station.evidence?.slice(0, 3).map((ev, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      sounds.playSelect();
                      setSelectedEvidenceIndex(i);
                      setShowEvidence(true);
                    }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#FFFDF5] border-2 border-[#331A05] flex items-center justify-center shadow-[0_2px_0_#331A05] hover:bg-[#FEF08A] hover:scale-105 transition-all"
                    title={ev.title}
                  >
                    {getEvidenceIcon(ev.type)}
                  </button>
                ))}
              </div>

              {/* KHUNG CĂN PHÒNG HIỆN TRƯỜNG 2D SVG */}
              <div className="flex-1 min-w-0">
                <CaseHunterRoomStage
                  caseId={caseData.id}
                  stationIndex={state.currentStationIndex}
                  onInspectItem={() => {
                    sounds.playMagnify();
                    setShowEvidence(true);
                  }}
                />
              </div>
            </div>

            {/* BĂNG RÔN CÂU HỎI VÀNG DƯỚI ĐÁY KHUNG HÌNH (Iconic Case Hunter Banner) */}
            <div className="game-yellow-banner p-3.5 sm:p-4 text-center">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#8D230F] mb-1 flex items-center justify-center gap-1">
                <Star className="w-3.5 h-3.5 fill-current" />
                {station.isMultipleChoice ? 'CHỌN NHIỀU ĐÁP ÁN ĐÚNG' : 'CHỌN 1 ĐÁP ÁN CHÍNH XÁC NHẤT'}
                <Star className="w-3.5 h-3.5 fill-current" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#5D190A] leading-snug font-display">
                {station.question}
              </h2>
            </div>
          </div>

          {/* CỘT PHẢI (Lg: 5 cols): Tình Huống Điều Tra + Thẻ Đáp Án A, B, C, D + Nút Bấm */}
          <div className="lg:col-span-5 space-y-3.5">
            {/* Tình huống tóm tắt */}
            <div className="game-card p-3.5 bg-white space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#D97706] block">
                📋 HỒ SƠ TÌNH HUỐNG HIỆN TRƯỜNG:
              </span>
              <p className="text-xs font-semibold text-[#334155] leading-relaxed">
                {station.scenario}
              </p>
            </div>

            {/* Danh Sách Thẻ Bài Đáp Án (Màu Trắng/Kem Sáng, Chữ Đậm Nét) */}
            <div className="space-y-2.5">
              {station.answers.map((answer) => {
                const isSelected = state.selectedAnswers.includes(answer.id);
                const isAnswerChecked = state.isAnswerChecked || isAlreadyCompleted;
                const isCorrect = answer.isCorrect;

                let cardClass = '';
                if (isAnswerChecked) {
                  if (isCorrect) cardClass = 'correct';
                  else if (isSelected && !isCorrect) cardClass = 'wrong';
                } else if (isSelected) {
                  cardClass = 'selected';
                }

                return (
                  <motion.div
                    key={answer.id}
                    onClick={() => handleToggleAnswer(answer.id)}
                    whileHover={{ scale: isAnswerChecked ? 1 : 1.01 }}
                    whileTap={{ scale: isAnswerChecked ? 1 : 0.99 }}
                    className={`game-answer-card p-3 sm:p-3.5 flex items-center gap-3 ${cardClass}`}
                  >
                    {/* Badge Chữ Cái A, B, C, D */}
                    <div
                      className={`w-9 h-9 rounded-xl border-2 border-[#4A2C11] flex items-center justify-center font-display font-black text-sm flex-shrink-0 shadow-[0_2px_0_#4A2C11] ${
                        isSelected
                          ? 'bg-[#FFCA28] text-[#5D190A]'
                          : 'bg-[#F1F5F9] text-[#475569]'
                      }`}
                    >
                      {answer.id}
                    </div>

                    <p className="flex-1 text-xs sm:text-sm font-bold text-[#1E293B] leading-snug">
                      {answer.text}
                    </p>

                    {/* Indicator */}
                    <div className="flex-shrink-0">
                      {isAnswerChecked ? (
                        isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-[#059669]" />
                        ) : isSelected ? (
                          <XCircle className="w-5 h-5 text-[#DC2626]" />
                        ) : null
                      ) : (
                        <div
                          className={`w-5 h-5 rounded-md border-2 border-[#4A2C11] flex items-center justify-center ${
                            isSelected ? 'bg-[#FFCA28]' : 'bg-white'
                          }`}
                        >
                          {isSelected && <span className="font-black text-xs text-[#5D190A]">✓</span>}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Hint nếu sai trong chế độ luyện tập */}
            {showWrongFeedback && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="game-card p-3.5 bg-[#FEF2F2] border-[#DC2626] space-y-1.5"
              >
                <div className="flex items-center gap-1.5 text-[#DC2626] font-display font-black text-xs uppercase">
                  <AlertTriangle className="w-4 h-4" />
                  CHƯA CHÍNH XÁC – GỢI Ý ĐIỀU TRA:
                </div>
                <p className="text-xs font-semibold text-[#1E293B] leading-relaxed">
                  {station.wrongHint}
                </p>
              </motion.div>
            )}

            {/* NÚT BẤM CAM VÀNG 3D TACTILE */}
            {!isAlreadyCompleted && !state.showResultDialog && (
              <button
                onClick={handleCheckAnswer}
                disabled={state.selectedAnswers.length === 0}
                className={`w-full py-4 btn-game text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 ${
                  state.selectedAnswers.length > 0
                    ? 'btn-game-amber'
                    : 'bg-[#E2E8F0] border-[#94A3B8] text-[#94A3B8] cursor-not-allowed shadow-none'
                }`}
              >
                <Search className="w-5 h-5 stroke-[3]" />
                KIỂM TRA ĐÁP ÁN
              </button>
            )}

            {isAlreadyCompleted && !state.showResultDialog && (
              <button
                onClick={handleNextStation}
                className="w-full py-4 btn-game btn-game-green text-sm sm:text-base tracking-wide flex items-center justify-center gap-2"
              >
                {isLastStation ? 'XEM BÁO CÁO PHÁ ÁN' : 'TRẠM TIẾP THEO'}
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* DIALOG THÀNH CÔNG / THẤT BẠI 3D */}
      <AnimatePresence>
        {state.showResultDialog && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md game-card p-6 bg-white space-y-4"
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 20 }}
            >
              {state.resultDialogType === 'correct' ? (
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[#D1FAE5] border-3 border-[#4A2C11] flex items-center justify-center text-3xl shadow-[0_4px_0_#4A2C11]">
                    🎉
                  </div>
                  <h3 className="text-2xl font-display font-black uppercase text-[#059669]">
                    PHÁN ĐOÁN XUẤT SẮC!
                  </h3>
                  <div className="game-badge game-badge-yellow text-xs font-black">
                    ⭐ +{station.points} ĐIỂM THƯỞNG
                  </div>

                  <div className="p-3 bg-[#FFFDF5] border-2 border-[#4A2C11] rounded-xl text-left text-xs font-semibold leading-relaxed text-[#1E293B]">
                    <p className="text-[#059669] font-black uppercase mb-1 flex items-center gap-1 font-display">
                      <Lightbulb className="w-3.5 h-3.5" /> Giải thích chi tiết:
                    </p>
                    {station.correctExplanation}
                  </div>

                  {/* Manh mối mở khóa */}
                  <div className="p-3 bg-[#FEF3C7] border-2 border-[#4A2C11] rounded-xl text-left">
                    <div className="flex items-center gap-1 text-xs font-black uppercase text-[#8D230F] mb-1 font-display">
                      <Sparkles className="w-4 h-4" />
                      MANH MỐI MỚI MỞ KHÓA:
                    </div>
                    <p className="font-black text-xs text-[#1E293B] font-display">{station.clue.title}</p>
                    <p className="text-[11px] font-medium text-[#475569] mt-0.5">{station.clue.content}</p>
                  </div>

                  <button
                    onClick={handleNextStation}
                    className="w-full py-3.5 btn-game btn-game-amber text-sm tracking-wider flex items-center justify-center gap-2 mt-2"
                  >
                    {isLastStation ? 'XEM BÁO CÁO PHÁ ÁN' : 'TRẠM TIẾP THEO'}
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[#FEE2E2] border-3 border-[#4A2C11] flex items-center justify-center text-3xl shadow-[0_4px_0_#4A2C11]">
                    ❌
                  </div>
                  <h3 className="text-xl font-display font-black uppercase text-[#DC2626]">
                    CHƯA CHÍNH XÁC
                  </h3>
                  <p className="text-xs font-semibold text-[#64748B]">
                    Chế độ thi đấu: Không được cộng điểm tại trạm này (0/{station.points}đ).
                  </p>
                  <button
                    onClick={handleNextStation}
                    className="w-full py-3.5 btn-game btn-game-red text-sm tracking-wider flex items-center justify-center gap-2"
                  >
                    {isLastStation ? 'XEM KẾT QUẢ VỤ ÁN' : 'TIẾP TỤC ĐIỀU TRA'}
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL SOI KÍNH LÚP HỒ SƠ MẬT */}
      <AnimatePresence>
        {showEvidence && station.evidence && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg game-card p-5 bg-[#FFFDF9] space-y-3 max-h-[85vh] flex flex-col"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="flex items-center justify-between border-b-2 border-[#4A2C11] pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FFCA28] border-2 border-[#4A2C11] flex items-center justify-center">
                    <Search className="w-4 h-4 text-[#451A03] stroke-[3]" />
                  </div>
                  <h3 className="font-display font-black text-sm uppercase text-[#3E2723]">
                    HỒ SƠ CHỨNG CỨ SỐ THU THẬP
                  </h3>
                </div>
                <button
                  onClick={() => setShowEvidence(false)}
                  className="p-1 rounded-lg border-2 border-[#4A2C11] hover:bg-[#FEF08A]"
                >
                  <X className="w-4 h-4 text-[#4A2C11]" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {station.evidence.map((ev, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border-2 border-[#4A2C11] ${
                      selectedEvidenceIndex === i ? 'bg-[#FEF08A]' : 'bg-[#FEF3C7]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-display font-black text-xs text-[#3E2723] mb-1">
                      {getEvidenceIcon(ev.type)}
                      {ev.title}
                    </div>
                    <div className="p-2.5 bg-white border-2 border-[#4A2C11] rounded-lg text-xs font-mono text-[#1E293B] whitespace-pre-line leading-relaxed shadow-sm">
                      {ev.content}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowEvidence(false)}
                className="w-full py-3 btn-game btn-game-amber text-xs tracking-wider"
              >
                ĐÃ THU THẬP BẰNG CHỨNG
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
