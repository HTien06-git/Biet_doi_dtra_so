// ============================================================================
// API: /api/sessions
// Lưu trữ và đồng bộ hóa tiến trình điều tra viên với Supabase / Database
// ============================================================================
import { upsertSession, getPlayerSessions, DbPlayerSession } from '../db/supabase';

export default async function handler(req: any, res: any) {
  // GET /api/sessions?playerName=...&teamCode=...
  if (req.method === 'GET') {
    const { playerName, teamCode } = req.query || {};
    if (!playerName || !teamCode) {
      return res.status(400).json({ error: 'Yêu cầu playerName và teamCode' });
    }

    try {
      const sessions = await getPlayerSessions(String(playerName), String(teamCode));
      return res.status(200).json({ sessions });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST /api/sessions
  if (req.method === 'POST') {
    const sessionData: DbPlayerSession = req.body;
    if (!sessionData.player_name || !sessionData.team_code || sessionData.case_id === undefined) {
      return res.status(400).json({ error: 'Dữ liệu phiên chơi không hợp lệ' });
    }

    try {
      const saved = await upsertSession(sessionData);
      return res.status(200).json({ success: true, session: saved });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
