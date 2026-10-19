// ============================================================================
// API: /api/cases
// Lấy danh sách hồ sơ 4 vụ án và chi tiết từng trạm thử thách
// ============================================================================
import { CASES_DATA, CaseData } from '../data/casesData';

// Standard Vercel Serverless Function Handler
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query || {};

  if (id) {
    const caseId = parseInt(id as string, 10);
    const caseItem = CASES_DATA.find((c) => c.id === caseId);
    if (!caseItem) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ vụ án' });
    }

    // Clean sensitive answer validation data if needed, or return full scenario
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

    return res.status(200).json({
      case: {
        ...caseItem,
        stations: sanitizedStations,
      },
    });
  }

  // Return list of all 4 cases overview
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

  return res.status(200).json({ cases: casesSummary });
}
