// ============================================================================
// GAME STORE - Quản lý toàn bộ state trò chơi
// ============================================================================
'use client';

import { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { CASES_DATA, GAME_CONFIG, CaseData, Station } from '@/data/casesData';
import { savePlayerSession, loadPlayerSessions, PlayerSession } from '@/lib/supabase';
import { multiplayerSync } from '@/lib/multiplayerSync';

// ============================================================================
// Types
// ============================================================================
export type GameScreen = 'welcome' | 'lobby' | 'stations' | 'playing' | 'summary';

export interface StationProgress {
  completed: boolean;
  score: number;
  attempts: number;
  clueUnlocked: boolean;
}

export interface CaseProgress {
  caseId: number;
  stations: StationProgress[];
  totalScore: number;
  cluesCollected: number;
  stationsCompleted: number;
  isCompleted: boolean;
  startTime?: string;
  completionTime?: string;
  durationSeconds?: number;
}

export interface GameState {
  // Player Info
  playerName: string;
  teamCode: string;
  isLoggedIn: boolean;
  
  // Navigation
  currentScreen: GameScreen;
  currentCaseId: number | null;
  currentStationIndex: number;
  
  // Progress
  caseProgress: Record<number, CaseProgress>;
  
  // UI State
  showEvidencePanel: boolean;
  showResultDialog: boolean;
  resultDialogType: 'correct' | 'wrong' | null;
  selectedAnswers: string[];
  isAnswerChecked: boolean;
  
  // Config
  gameMode: 'practice' | 'strict';
}

const initialState: GameState = {
  playerName: '',
  teamCode: '',
  isLoggedIn: false,
  currentScreen: 'welcome',
  currentCaseId: null,
  currentStationIndex: 0,
  caseProgress: {},
  showEvidencePanel: false,
  showResultDialog: false,
  resultDialogType: null,
  selectedAnswers: [],
  isAnswerChecked: false,
  gameMode: GAME_CONFIG.gameMode,
};

// Initialize default progress for all cases
function initCaseProgress(): Record<number, CaseProgress> {
  const progress: Record<number, CaseProgress> = {};
  CASES_DATA.forEach((c) => {
    progress[c.id] = {
      caseId: c.id,
      stations: Array(5).fill(null).map(() => ({
        completed: false,
        score: 0,
        attempts: 0,
        clueUnlocked: false,
      })),
      totalScore: 0,
      cluesCollected: 0,
      stationsCompleted: 0,
      isCompleted: false,
    };
  });
  return progress;
}

// ============================================================================
// Actions
// ============================================================================
type GameAction =
  | { type: 'SET_PLAYER'; payload: { name: string; code: string } }
  | { type: 'SET_SCREEN'; payload: GameScreen }
  | { type: 'SELECT_CASE'; payload: number }
  | { type: 'SET_STATION'; payload: number }
  | { type: 'SELECT_ANSWER'; payload: string }
  | { type: 'DESELECT_ANSWER'; payload: string }
  | { type: 'CHECK_ANSWER' }
  | { type: 'ANSWER_CORRECT'; payload: { stationIndex: number; points: number } }
  | { type: 'ANSWER_WRONG_STRICT'; payload: { stationIndex: number } }
  | { type: 'ANSWER_WRONG_SKIP'; payload: { stationIndex: number } }
  | { type: 'NEXT_STATION' }
  | { type: 'COMPLETE_CASE' }
  | { type: 'TOGGLE_EVIDENCE' }
  | { type: 'CLOSE_RESULT_DIALOG' }
  | { type: 'RESET_STATION_UI' }
  | { type: 'RESET_PROGRESS' }
  | { type: 'LOAD_PROGRESS'; payload: Record<number, CaseProgress> }
  | { type: 'LOGOUT' };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PLAYER':
      return {
        ...state,
        playerName: action.payload.name,
        teamCode: action.payload.code,
        isLoggedIn: true,
        currentScreen: 'lobby',
        caseProgress: Object.keys(state.caseProgress).length > 0
          ? state.caseProgress
          : initCaseProgress(),
      };

    case 'SET_SCREEN':
      return { ...state, currentScreen: action.payload };

    case 'SELECT_CASE': {
      const caseId = action.payload;
      const cp = { ...state.caseProgress };
      if (cp[caseId] && !cp[caseId].startTime) {
        cp[caseId] = {
          ...cp[caseId],
          startTime: new Date().toISOString(),
        };
      }
      return {
        ...state,
        currentCaseId: caseId,
        currentStationIndex: 0,
        currentScreen: 'stations',
        caseProgress: cp,
        selectedAnswers: [],
        isAnswerChecked: false,
        showResultDialog: false,
        resultDialogType: null,
      };
    }

    case 'SET_STATION': {
      const cp = { ...state.caseProgress };
      if (state.currentCaseId && cp[state.currentCaseId] && !cp[state.currentCaseId].startTime) {
        cp[state.currentCaseId] = {
          ...cp[state.currentCaseId],
          startTime: new Date().toISOString(),
        };
      }
      return {
        ...state,
        caseProgress: cp,
        currentStationIndex: action.payload,
        currentScreen: 'playing',
        selectedAnswers: [],
        isAnswerChecked: false,
        showResultDialog: false,
        resultDialogType: null,
        showEvidencePanel: false,
      };
    }

    case 'SELECT_ANSWER': {
      const caseData = CASES_DATA.find((c) => c.id === state.currentCaseId);
      if (!caseData) return state;
      const station = caseData.stations[state.currentStationIndex];
      if (station.isMultipleChoice) {
        return {
          ...state,
          selectedAnswers: [...state.selectedAnswers, action.payload],
        };
      }
      return { ...state, selectedAnswers: [action.payload] };
    }

    case 'DESELECT_ANSWER':
      return {
        ...state,
        selectedAnswers: state.selectedAnswers.filter((a) => a !== action.payload),
      };

    case 'CHECK_ANSWER':
      return { ...state, isAnswerChecked: true };

    case 'ANSWER_CORRECT': {
      if (!state.currentCaseId) return state;
      const cp = { ...state.caseProgress };
      const caseP = { ...cp[state.currentCaseId] };
      const stations = [...caseP.stations];
      stations[action.payload.stationIndex] = {
        ...stations[action.payload.stationIndex],
        completed: true,
        score: action.payload.points,
        clueUnlocked: true,
        attempts: stations[action.payload.stationIndex].attempts + 1,
      };
      caseP.stations = stations;
      caseP.totalScore = stations.reduce((sum, s) => sum + s.score, 0);
      caseP.cluesCollected = stations.filter((s) => s.clueUnlocked).length;
      caseP.stationsCompleted = stations.filter((s) => s.completed).length;
      caseP.isCompleted = caseP.stationsCompleted === 5;
      if (caseP.isCompleted && !caseP.completionTime) {
        caseP.completionTime = new Date().toISOString();
        const startMs = caseP.startTime ? new Date(caseP.startTime).getTime() : Date.now() - 60000;
        caseP.durationSeconds = Math.max(1, Math.round((new Date(caseP.completionTime).getTime() - startMs) / 1000));
      }
      cp[state.currentCaseId] = caseP;
      return {
        ...state,
        caseProgress: cp,
        showResultDialog: true,
        resultDialogType: 'correct',
      };
    }

    case 'ANSWER_WRONG_STRICT': {
      if (!state.currentCaseId) return state;
      const cp2 = { ...state.caseProgress };
      const caseP2 = { ...cp2[state.currentCaseId] };
      const stations2 = [...caseP2.stations];
      stations2[action.payload.stationIndex] = {
        ...stations2[action.payload.stationIndex],
        completed: true,
        score: 0,
        clueUnlocked: false,
        attempts: stations2[action.payload.stationIndex].attempts + 1,
      };
      caseP2.stations = stations2;
      caseP2.stationsCompleted = stations2.filter((s) => s.completed).length;
      caseP2.isCompleted = caseP2.stationsCompleted === 5;
      if (caseP2.isCompleted && !caseP2.completionTime) {
        caseP2.completionTime = new Date().toISOString();
        const startMs = caseP2.startTime ? new Date(caseP2.startTime).getTime() : Date.now() - 60000;
        caseP2.durationSeconds = Math.max(1, Math.round((new Date(caseP2.completionTime).getTime() - startMs) / 1000));
      }
      cp2[state.currentCaseId] = caseP2;
      return {
        ...state,
        caseProgress: cp2,
        showResultDialog: true,
        resultDialogType: 'wrong',
      };
    }

    case 'ANSWER_WRONG_SKIP': {
      if (!state.currentCaseId) return state;
      const cpSkip = { ...state.caseProgress };
      const casePSkip = { ...cpSkip[state.currentCaseId] };
      const stationsSkip = [...casePSkip.stations];
      stationsSkip[action.payload.stationIndex] = {
        ...stationsSkip[action.payload.stationIndex],
        completed: false, // Marked as NOT completed
        score: 0,         // 0 points
        clueUnlocked: false,
        attempts: stationsSkip[action.payload.stationIndex].attempts + 1,
      };
      casePSkip.stations = stationsSkip;
      casePSkip.stationsCompleted = stationsSkip.filter((s) => s.completed).length;
      cpSkip[state.currentCaseId] = casePSkip;
      return {
        ...state,
        caseProgress: cpSkip,
        showResultDialog: true,
        resultDialogType: 'wrong',
        isAnswerChecked: true,
      };
    }

    case 'NEXT_STATION': {
      const nextIdx = state.currentStationIndex + 1;
      if (nextIdx >= 5) {
        const cp3 = { ...state.caseProgress };
        if (state.currentCaseId && cp3[state.currentCaseId]) {
          const caseP3 = { ...cp3[state.currentCaseId] };
          caseP3.isCompleted = true;
          if (!caseP3.completionTime) {
            caseP3.completionTime = new Date().toISOString();
            const startMs = caseP3.startTime ? new Date(caseP3.startTime).getTime() : Date.now() - 60000;
            caseP3.durationSeconds = Math.max(1, Math.round((new Date(caseP3.completionTime).getTime() - startMs) / 1000));
          }
          cp3[state.currentCaseId] = caseP3;
        }
        return {
          ...state,
          caseProgress: cp3,
          currentScreen: 'summary',
          showResultDialog: false,
          resultDialogType: null,
          selectedAnswers: [],
          isAnswerChecked: false,
        };
      }
      return {
        ...state,
        currentStationIndex: nextIdx,
        currentScreen: 'playing',
        selectedAnswers: [],
        isAnswerChecked: false,
        showResultDialog: false,
        resultDialogType: null,
        showEvidencePanel: false,
      };
    }

    case 'COMPLETE_CASE':
      return {
        ...state,
        currentScreen: 'lobby',
        currentCaseId: null,
        currentStationIndex: 0,
        selectedAnswers: [],
        isAnswerChecked: false,
      };

    case 'TOGGLE_EVIDENCE':
      return { ...state, showEvidencePanel: !state.showEvidencePanel };

    case 'CLOSE_RESULT_DIALOG':
      return { ...state, showResultDialog: false, resultDialogType: null };

    case 'RESET_STATION_UI':
      return {
        ...state,
        selectedAnswers: [],
        isAnswerChecked: false,
        showResultDialog: false,
        resultDialogType: null,
      };

    case 'RESET_PROGRESS':
      return {
        ...state,
        caseProgress: initCaseProgress(),
        currentCaseId: null,
        currentStationIndex: 0,
        currentScreen: 'lobby',
      };

    case 'LOAD_PROGRESS':
      return {
        ...state,
        caseProgress: action.payload,
      };

    case 'LOGOUT':
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dts_game_state');
        localStorage.removeItem('dts_player_sessions');
      }
      return { ...initialState, caseProgress: initCaseProgress() };

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================
interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  getCurrentCase: () => CaseData | undefined;
  getCurrentStation: () => Station | undefined;
  getCurrentCaseProgress: () => CaseProgress | undefined;
  checkAnswer: () => void;
  saveProgress: () => Promise<void>;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, {
    ...initialState,
    caseProgress: initCaseProgress(),
  });

  const getCurrentCase = useCallback(() => {
    return CASES_DATA.find((c) => c.id === state.currentCaseId);
  }, [state.currentCaseId]);

  const getCurrentStation = useCallback(() => {
    const caseData = getCurrentCase();
    if (!caseData) return undefined;
    return caseData.stations[state.currentStationIndex];
  }, [getCurrentCase, state.currentStationIndex]);

  const getCurrentCaseProgress = useCallback(() => {
    if (!state.currentCaseId) return undefined;
    return state.caseProgress[state.currentCaseId];
  }, [state.currentCaseId, state.caseProgress]);

  const checkAnswer = useCallback(() => {
    const station = getCurrentStation();
    if (!station || !state.currentCaseId) return;

    dispatch({ type: 'CHECK_ANSWER' });

    const correctAnswers = station.answers
      .filter((a) => a.isCorrect)
      .map((a) => a.id)
      .sort();
    const selected = [...state.selectedAnswers].sort();
    const isCorrect =
      correctAnswers.length === selected.length &&
      correctAnswers.every((a, i) => a === selected[i]);

    if (isCorrect) {
      dispatch({
        type: 'ANSWER_CORRECT',
        payload: {
          stationIndex: state.currentStationIndex,
          points: station.points,
        },
      });
    } else if (state.gameMode === 'strict') {
      dispatch({
        type: 'ANSWER_WRONG_STRICT',
        payload: { stationIndex: state.currentStationIndex },
      });
    } else {
      // Practice mode – show wrong dialog, let user retry
      dispatch({
        type: 'CHECK_ANSWER',
      });
    }
  }, [getCurrentStation, state.currentCaseId, state.selectedAnswers, state.currentStationIndex, state.gameMode]);

  const saveProgress = useCallback(async () => {
    if (!state.isLoggedIn) return;
    const activeCases = Object.values(state.caseProgress).filter(
      (cp) => cp.startTime || cp.totalScore > 0 || cp.stationsCompleted > 0 || cp.caseId === state.currentCaseId
    );
    const promises = activeCases.map((cp) => {
      const session: PlayerSession = {
        player_name: state.playerName,
        team_code: state.teamCode,
        case_id: cp.caseId,
        station_scores: cp.stations.map((s) => s.score),
        total_score: cp.totalScore,
        clues_collected: cp.cluesCollected,
        stations_completed: cp.stationsCompleted,
        is_completed: cp.isCompleted,
        start_time: cp.startTime,
        completion_time: cp.completionTime || (cp.isCompleted ? new Date().toISOString() : undefined),
        duration_seconds: cp.durationSeconds,
      };
      return savePlayerSession(session);
    });
    await Promise.all(promises);
  }, [state.isLoggedIn, state.playerName, state.teamCode, state.caseProgress, state.currentCaseId]);

  // Load progress from DB on login
  useEffect(() => {
    if (state.isLoggedIn && state.playerName && state.teamCode) {
      loadPlayerSessions(state.playerName, state.teamCode).then((sessions) => {
        if (sessions.length > 0) {
          const progress = { ...state.caseProgress };
          sessions.forEach((s) => {
            if (progress[s.case_id]) {
              progress[s.case_id] = {
                caseId: s.case_id,
                stations: s.station_scores.map((score, i) => ({
                  completed: score > 0 || (s.stations_completed > i),
                  score,
                  attempts: score > 0 ? 1 : 0,
                  clueUnlocked: score > 0,
                })),
                totalScore: s.total_score,
                cluesCollected: s.clues_collected,
                stationsCompleted: s.stations_completed,
                isCompleted: s.is_completed,
                startTime: s.start_time,
                completionTime: s.completion_time,
                durationSeconds: s.duration_seconds,
              };
            }
          });
          dispatch({ type: 'LOAD_PROGRESS', payload: progress });
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isLoggedIn]);

  // Auto-save on progress change
  useEffect(() => {
    if (state.isLoggedIn) {
      const timeout = setTimeout(() => {
        saveProgress();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [state.caseProgress, state.isLoggedIn, saveProgress]);

  // Save to localStorage for offline support
  useEffect(() => {
    if (state.isLoggedIn && typeof window !== 'undefined') {
      localStorage.setItem('dts_game_state', JSON.stringify({
        playerName: state.playerName,
        teamCode: state.teamCode,
        caseProgress: state.caseProgress,
      }));
    }
  }, [state.isLoggedIn, state.playerName, state.teamCode, state.caseProgress]);

  // Listen to Admin Global System Reset & Remote Force Logout
  useEffect(() => {
    const unsub = multiplayerSync.onSystemReset(() => {
      console.log('🚨 Received Admin System Reset – Clearing game state & logging out');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dts_game_state');
        localStorage.removeItem('dts_player_sessions');
      }
      dispatch({ type: 'LOGOUT' });
      alert('⚠️ Ban Quản Trị đã dọn sạch toàn bộ dữ liệu giải đấu. Thiết bị của bạn đã được tự động đăng xuất để chuẩn bị cho lượt đấu mới!');
    });
    return () => unsub();
  }, []);

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        getCurrentCase,
        getCurrentStation,
        getCurrentCaseProgress,
        checkAnswer,
        saveProgress,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
