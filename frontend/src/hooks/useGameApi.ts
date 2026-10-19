// ============================================================================
// HOOKS: useGameApi
// Hook tương tác với hệ thống Serverless API Backend (/api/*)
// Tự động fallback dữ liệu offline mượt mà khi mất kết nối mạng
// ============================================================================
import { useState, useCallback } from 'react';
import { CASES_DATA, CaseData } from '@/data/casesData';

export interface VerifyResult {
  isCorrect: boolean;
  pointsEarned: number;
  explanation?: string;
  hint?: string;
  clue?: {
    title: string;
    content: string;
  };
  isLastStation: boolean;
}

export function useGameApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Lấy danh sách vụ án từ API
  const fetchCases = useCallback(async (): Promise<CaseData[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cases');
      if (!res.ok) throw new Error('Không thể tải dữ liệu từ máy chủ');
      const data = await res.json();
      return data.cases || CASES_DATA;
    } catch {
      // Fallback sang local dataset
      return CASES_DATA;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Thẩm định đáp án qua backend API
  const verifyAnswer = useCallback(async (
    caseId: number,
    stationIndex: number,
    selectedAnswers: string[],
    gameMode: 'practice' | 'strict'
  ): Promise<VerifyResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/verify-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, stationIndex, selectedAnswers, gameMode }),
      });

      if (res.ok) {
        const result = await res.json();
        return result;
      }
      throw new Error('API verify failed');
    } catch {
      // Fallback chấm điểm offline tại client
      const caseItem = CASES_DATA.find((c) => c.id === caseId);
      const station = caseItem?.stations[stationIndex];
      if (!station) {
        return { isCorrect: false, pointsEarned: 0, isLastStation: false };
      }

      const correctIds = station.answers.filter((a) => a.isCorrect).map((a) => a.id).sort();
      const userSorted = [...selectedAnswers].sort();
      const isCorrect =
        correctIds.length === userSorted.length &&
        correctIds.every((id, i) => id === userSorted[i]);

      return {
        isCorrect,
        pointsEarned: isCorrect ? station.points : 0,
        explanation: station.correctExplanation,
        hint: station.wrongHint,
        clue: isCorrect ? station.clue : undefined,
        isLastStation: stationIndex >= (caseItem?.stations.length || 5) - 1,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 3. Đồng bộ tiến trình người chơi
  const syncSession = useCallback(async (sessionData: any) => {
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });
    } catch (e) {
      console.warn('Backend sync session failed, using client storage:', e);
    }
  }, []);

  // 4. Lấy bảng xếp hạng
  const fetchLeaderboard = useCallback(async (caseId?: number) => {
    try {
      const url = caseId ? `/api/leaderboard?caseId=${caseId}` : '/api/leaderboard';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return data.leaderboard || [];
      }
    } catch {
      // Fallback
    }
    return [];
  }, []);

  return {
    isLoading,
    error,
    fetchCases,
    verifyAnswer,
    syncSession,
    fetchLeaderboard,
  };
}
