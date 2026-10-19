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
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    // Xử lý khi user out / rời trận
    if (body.action === 'leave' || body.status === 'left' || body.is_active === false) {
      const { player_name, team_code } = body;
      if (player_name && team_code) {
        try {
          const existing = await getPlayerSessions(String(player_name), String(team_code));
          for (const s of existing) {
            if (!s.is_completed) {
              await upsertSession({
                ...s,
                is_active: false,
                status: 'left',
                updated_at: new Date().toISOString(),
              });
            }
          }
          return res.status(200).json({ success: true, message: 'Đã cập nhật trạng thái rời trận' });
        } catch (e: any) {
          return res.status(500).json({ error: e.message });
        }
      }
    }

    const sessionData: DbPlayerSession = body;
    if (!sessionData.player_name || !sessionData.team_code || sessionData.case_id === undefined) {
      return res.status(400).json({ error: 'Dữ liệu phiên chơi không hợp lệ' });
    }

    // Nếu Ban Quản Trị đã Reset, từ chối lưu và yêu cầu thiết bị đăng xuất ngay lập tức
    const resetAt = (globalThis as any).__DTS_SYSTEM_RESET_AT__;
    if (resetAt && sessionData.start_time) {
      const sessionStart = new Date(sessionData.start_time).getTime();
      if (sessionStart < resetAt) {
        return res.status(200).json({
          force_logout: true,
          error: 'Giải đấu đã được thiết lập lại bởi Ban Quản Trị.',
        });
      }
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
