// ============================================================================
// API: /api/verify-answer
// Thẩm định phán đoán điều tra, chấm điểm và mở khóa manh mối
// ============================================================================
import { CASES_DATA } from '../data/casesData';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { caseId, stationIndex, selectedAnswers, gameMode } = req.body || {};

    if (caseId === undefined || stationIndex === undefined || !Array.isArray(selectedAnswers)) {
      return res.status(400).json({ error: 'Thiếu thông số kiểm tra đáp án' });
    }

    const caseItem = CASES_DATA.find((c) => c.id === Number(caseId));
    if (!caseItem) {
      return res.status(404).json({ error: 'Không tìm thấy vụ án' });
    }

    const station = caseItem.stations[Number(stationIndex)];
    if (!station) {
      return res.status(404).json({ error: 'Không tìm thấy trạm thử thách' });
    }

    // Check correctness
    const correctIds = station.answers.filter((a) => a.isCorrect).map((a) => a.id).sort();
    const userSelected = [...selectedAnswers].sort();

    const isCorrect =
      correctIds.length === userSelected.length &&
      correctIds.every((id, idx) => id === userSelected[idx]);

    const isLastStation = Number(stationIndex) >= caseItem.stations.length - 1;

    if (isCorrect) {
      return res.status(200).json({
        isCorrect: true,
        pointsEarned: station.points,
        explanation: station.correctExplanation,
        clue: station.clue,
        isLastStation,
      });
    }

    // Wrong answer
    return res.status(200).json({
      isCorrect: false,
      pointsEarned: 0,
      hint: station.wrongHint,
      correctExplanation: gameMode === 'strict' ? station.correctExplanation : null,
      isLastStation,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Lỗi xử lý đáp án' });
  }
}
