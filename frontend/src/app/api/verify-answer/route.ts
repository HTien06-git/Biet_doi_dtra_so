import { NextResponse } from 'next/server';
import { CASES_DATA } from '@/data/casesData';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { caseId, stationIndex, selectedAnswers, gameMode } = body || {};

    if (caseId === undefined || stationIndex === undefined || !Array.isArray(selectedAnswers)) {
      return NextResponse.json({ error: 'Thiếu thông số kiểm tra đáp án' }, { status: 400 });
    }

    const caseItem = CASES_DATA.find((c) => c.id === Number(caseId));
    if (!caseItem) {
      return NextResponse.json({ error: 'Không tìm thấy vụ án' }, { status: 404 });
    }

    const station = caseItem.stations[Number(stationIndex)];
    if (!station) {
      return NextResponse.json({ error: 'Không tìm thấy trạm thử thách' }, { status: 404 });
    }

    const correctIds = station.answers.filter((a) => a.isCorrect).map((a) => a.id).sort();
    const userSelected = [...selectedAnswers].sort();

    const isCorrect =
      correctIds.length === userSelected.length &&
      correctIds.every((id, idx) => id === userSelected[idx]);

    const isLastStation = Number(stationIndex) >= caseItem.stations.length - 1;

    if (isCorrect) {
      return NextResponse.json({
        isCorrect: true,
        pointsEarned: station.points,
        explanation: station.correctExplanation,
        clue: station.clue,
        isLastStation,
      });
    }

    return NextResponse.json({
      isCorrect: false,
      pointsEarned: 0,
      hint: station.wrongHint,
      correctExplanation: gameMode === 'strict' ? station.correctExplanation : null,
      isLastStation,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi xử lý đáp án' }, { status: 500 });
  }
}
