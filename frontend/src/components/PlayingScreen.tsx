// ============================================================================
// PLAYING SCREEN - Hiện Trường Điều Tra Chuẩn Bố Cục "Case Hunter"
// Split-view 2 cột trên Laptop, Khay gỗ bằng chứng bên trái, Băng rôn vàng dưới đáy
// ============================================================================
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Search, X, ChevronRight,
  Lightbulb, Sparkles, MessageSquare, FileSearch, CreditCard,
  Camera, Clock, CheckCircle, XCircle, AlertTriangle, Star
} from 'lucide-react';
import { useGame } from '@/lib/gameStore';
import { sounds } from '@/lib/sounds';
import StationCanvas from '@/components/game/StationCanvas';
import { multiplayerSync } from '@/lib/multiplayerSync';
import AudioController from '@/components/ui/AudioController';

export default function PlayingScreen() {
  const {
    state,
    dispatch,
    getCurrentCase,
    getCurrentStation,
    getCurrentCaseProgress,
    saveProgress,
  } = useGame();

  const caseData = getCurrentCase();
  const station = getCurrentStation();
  const progress = getCurrentCaseProgress();

  const [showEvidence, setShowEvidence] = useState(false);
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState<number | null>(null);
  const [showWrongFeedback, setShowWrongFeedback] = useState(false);
  const [wrongCountdown, setWrongCountdown] = useState<number>(3);

  const currentTotalScore = progress?.totalScore || 0;

  // Multi-device real-time sync & presence registration
  useEffect(() => {
    if (caseData && state.playerName) {
      multiplayerSync.registerDevice({
        playerName: state.playerName,
        teamCode: state.teamCode,
        caseId: caseData.id,
        stationId: state.currentStationIndex + 1,
        score: currentTotalScore,
      });

      multiplayerSync.broadcastEvent({
        eventType: 'STATION_ENTER',
        playerName: state.playerName,
        teamCode: state.teamCode,
        caseId: caseData.id,
        stationId: state.currentStationIndex + 1,
        totalScore: currentTotalScore,
      });

      const handleBeforeUnload = () => {
        multiplayerSync.markDeviceOffline({
          playerName: state.playerName,
          teamCode: state.teamCode,
          caseId: caseData.id,
          stationId: state.currentStationIndex + 1,
          score: currentTotalScore,
        });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            '/api/sessions',
            JSON.stringify({
              action: 'leave',
              player_name: state.playerName,
              team_code: state.teamCode,
              case_id: caseData.id,
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
    }
  }, [caseData?.id, state.currentStationIndex, state.playerName, state.teamCode, currentTotalScore]);

  const handleNextStation = () => {
    sounds.playClick();
    setShowWrongFeedback(false);
    if (caseData) {
      multiplayerSync.broadcastEvent({
        eventType: 'STATION_COMPLETED',
        playerName: state.playerName,
        teamCode: state.teamCode,
        caseId: caseData.id,
        stationId: state.currentStationIndex + 1,
        totalScore: currentTotalScore,
      });
    }
    dispatch({ type: 'NEXT_STATION' });
    setTimeout(() => {
      saveProgress();
    }, 120);
  };

  // Tự động chuyển câu sau 3 giây khi trả lời sai
  useEffect(() => {
    if (state.showResultDialog && state.resultDialogType === 'wrong') {
      const timer = setInterval(() => {
        setWrongCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleNextStation();
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setWrongCountdown(3);
    }
  }, [state.showResultDialog, state.resultDialogType, state.currentStationIndex]);

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
      const updatedScore = currentTotalScore + station.points;
      
      multiplayerSync.broadcastEvent({
        eventType: 'ANSWER_ATTEMPT',
        playerName: state.playerName,
        teamCode: state.teamCode,
        caseId: caseData.id,
        stationId: state.currentStationIndex + 1,
        scoreDelta: station.points,
        totalScore: updatedScore,
      });

      dispatch({
        type: 'ANSWER_CORRECT',
        payload: {
          stationIndex: state.currentStationIndex,
          points: station.points,
        },
      });

      if (isLastStation) {
        multiplayerSync.broadcastEvent({
          eventType: 'CASE_FINISHED',
          playerName: state.playerName,
          teamCode: state.teamCode,
          caseId: caseData.id,
          stationId: state.currentStationIndex + 1,
          totalScore: updatedScore,
        });
      }
      setTimeout(() => saveProgress(), 100);
    } else {
      // TRẢ LỜI SAI: Tự động qua câu khác, coi như câu đó KHÔNG hoàn thành (0đ, không manh mối)
      sounds.playWrong();
      multiplayerSync.broadcastEvent({
        eventType: 'ANSWER_ATTEMPT',
        playerName: state.playerName,
        teamCode: state.teamCode,
        caseId: caseData.id,
        stationId: state.currentStationIndex + 1,
        scoreDelta: 0,
        totalScore: currentTotalScore,
      });

      dispatch({
        type: 'ANSWER_WRONG_SKIP',
        payload: { stationIndex: state.currentStationIndex },
      });

      if (isLastStation) {
        multiplayerSync.broadcastEvent({
          eventType: 'CASE_FINISHED',
          playerName: state.playerName,
          teamCode: state.teamCode,
          caseId: caseData.id,
          stationId: state.currentStationIndex + 1,
          totalScore: currentTotalScore,
        });
      }
      setTimeout(() => saveProgress(), 100);
    }
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
    <div className="min-h-screen bg-game-backdrop text-[#0F172A] pb-8">
      {/* 1. Header Bar Xanh Chủ Đạo #1A1AFF Chuẩn Thiết Kế */}
      <header className="sticky top-0 z-30 bg-[#1A1AFF] border-b-4 border-[#000088] px-4 py-2.5 shadow-lg text-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoBack}
              className="p-1.5 rounded-xl bg-white/15 border-2 border-white/40 hover:bg-white/25 active:translate-y-0.5 shadow-[0_2px_0_#000088] transition-all text-white"
              title="Quay lại lộ trình"
            >
              <ArrowLeft className="w-5 h-5 text-white stroke-[3]" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block px-2 py-0.5 rounded-md bg-[#FDE047] text-[#0F172A] text-[10px] font-black uppercase tracking-wider">
                  TRẠM {state.currentStationIndex + 1}/5
                </span>
                <span className="text-[11px] font-bold text-white/80 hidden sm:inline-block">
                  {state.playerName} · Đội <strong>{state.teamCode}</strong>
                </span>
              </div>
              <h1 className="font-display font-black text-xs sm:text-base text-white truncate max-w-[200px] sm:max-w-md drop-shadow-sm">
                {station.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút Âm Thanh BGM Toàn Cục */}
            <AudioController showVolumeSlider />

            {/* Badge Điểm Thưởng Trạm */}
            <div className="px-3 py-1 rounded-xl bg-[#FDE047] border-2 border-[#000088] text-[#0F172A] text-xs font-black shadow-[0_2px_0_#000088] flex items-center gap-1 font-display">
              ⭐ +{station.points} ĐIỂM
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Game Area: Split View 2 Cột Trên Laptop (Max 1100px) */}
      <div className="max-w-[1100px] mx-auto px-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* CỘT TRÁI (Lg: 7 cols): Khung Căn Phòng 2D + Khay Gỗ Trái + Băng Rôn Xanh Đáy */}
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

              {/* KHUNG CĂN PHÒNG HIỆN TRƯỜNG 2D DYNAMIC ENGINE */}
              <div className="flex-1 min-w-0">
                <StationCanvas
                  caseId={caseData.id}
                  stationIndex={state.currentStationIndex}
                  onClueInspected={(clue) => {
                    multiplayerSync.broadcastEvent({
                      eventType: 'CLUE_DISCOVERED',
                      playerName: state.playerName,
                      teamCode: state.teamCode,
                      caseId: caseData.id,
                      stationId: state.currentStationIndex + 1,
                      clueId: clue.id,
                      totalScore: currentTotalScore,
                    });
                  }}
                />
              </div>
            </div>

            {/* BĂNG RÔN CÂU HỎI XANH CHỦ ĐẠO #1A1AFF DƯỚI ĐÁY KHUNG HÌNH */}
            <div className="game-blue-banner p-3.5 sm:p-4 text-center">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#FDE047] mb-1 flex items-center justify-center gap-1">
                <Star className="w-3.5 h-3.5 fill-current" />
                {station.isMultipleChoice ? 'CHỌN NHIỀU ĐÁP ÁN ĐÚNG' : 'CHỌN 1 ĐÁP ÁN CHÍNH XÁC NHẤT'}
                <Star className="w-3.5 h-3.5 fill-current" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-snug font-display drop-shadow-sm">
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
                      className={`w-9 h-9 rounded-xl border-2 border-[#1E293B] flex items-center justify-center font-display font-black text-sm flex-shrink-0 shadow-[0_2px_0_#1E293B] ${
                        isSelected
                          ? 'bg-[#1A1AFF] text-white border-[#000088]'
                          : 'bg-[#F1F5F9] text-[#475569]'
                      }`}
                    >
                      {answer.id}
                    </div>

                    <p className="flex-1 text-xs sm:text-sm font-bold text-[#0F172A] leading-snug">
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
                          className={`w-5 h-5 rounded-md border-2 border-[#1E293B] flex items-center justify-center ${
                            isSelected ? 'bg-[#1A1AFF] border-[#000088]' : 'bg-white'
                          }`}
                        >
                          {isSelected && <span className="font-black text-xs text-white">✓</span>}
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

            {/* NÚT BẤM XANH ĐIỆN #1A1AFF 3D TACTILE */}
            {!isAlreadyCompleted && !state.showResultDialog && (
              <button
                onClick={handleCheckAnswer}
                disabled={state.selectedAnswers.length === 0}
                className={`w-full py-4 btn-game text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 ${
                  state.selectedAnswers.length > 0
                    ? 'btn-game-primary'
                    : 'bg-[#CBD5E1] border-[#94A3B8] text-[#64748B] cursor-not-allowed shadow-none'
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
                  <div className="w-16 h-16 mx-auto rounded-full bg-[#FEE2E2] border-3 border-[#DC2626] flex items-center justify-center text-3xl shadow-[0_4px_0_#991B1B]">
                    ❌
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-black uppercase text-[#DC2626]">
                      CHƯA CHÍNH XÁC!
                    </h3>
                    <p className="text-xs font-black uppercase text-[#991B1B] mt-0.5">
                      Coi như không hoàn thành câu này (+0đ · Không có manh mối)
                    </p>
                  </div>

                  <div className="p-3 bg-[#FEF2F2] border-2 border-[#F87171] rounded-xl text-left text-xs font-semibold leading-relaxed text-[#1E293B]">
                    <p className="text-[#DC2626] font-black uppercase mb-1 flex items-center gap-1 font-display">
                      <Lightbulb className="w-3.5 h-3.5" /> Giải thích đáp án chính xác:
                    </p>
                    {station.correctExplanation}
                  </div>

                  <div className="p-2.5 bg-[#FFF1F2] border border-[#FECDD3] rounded-lg text-xs font-bold text-[#E11D48] flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 animate-spin text-[#E11D48]" />
                    <span>
                      Tự động chuyển câu tiếp theo sau <strong className="font-mono text-sm px-1.5 py-0.5 bg-white rounded border border-[#FDA4AF]">{wrongCountdown}s</strong>...
                    </span>
                  </div>

                  <button
                    onClick={handleNextStation}
                    className="w-full py-3.5 btn-game btn-game-red text-sm tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_0_#991B1B]"
                  >
                    {isLastStation ? 'XEM BÁO CÁO KẾT QUẢ VỤ ÁN' : 'CHUYỂN CÂU TIẾP THEO NGAY'}
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
