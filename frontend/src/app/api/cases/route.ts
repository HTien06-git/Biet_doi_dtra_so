import { NextResponse } from 'next/server';
import { CASES_DATA } from '@/data/casesData';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const caseId = parseInt(id, 10);
    const caseItem = CASES_DATA.find((c) => c.id === caseId);
    if (!caseItem) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ vụ án' }, { status: 404 });
    }

    const sanitizedStations = caseItem.stations.map((st) => ({
      id: st.id,
      title: st.title,
      points: st.points,
      scenario: st.scenario,
      sceneDescription: st.sceneDescription,
      question: st.question,
      isMultipleChoice: st.isMultipleChoice,
      answers: st.answers.map((a) => ({ id: a.id, text: a.text })),
      wrongHint: st.wrongHint,
      evidence: st.evidence,
      clueTitle: st.clue.title,
    }));

    return NextResponse.json({
      case: {
        ...caseItem,
        stations: sanitizedStations,
      },
    });
  }

  const casesSummary = CASES_DATA.map((c) => ({
    id: c.id,
    caseNumber: c.caseNumber,
    title: c.title,
    subtitle: c.subtitle,
    description: c.description,
    icon: c.icon,
    color: c.color,
    totalStations: c.stations.length,
    maxPoints: 100,
  }));

  return NextResponse.json({ cases: casesSummary });
}
