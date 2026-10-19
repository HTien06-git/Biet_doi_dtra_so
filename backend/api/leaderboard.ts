// ============================================================================
// API: /api/leaderboard
// Bảng xếp hạng thám tử số và thẩm định mã báo cáo BTC
// ============================================================================
import { getLeaderboard, supabase, isSupabaseConfigured } from '../db/supabase';

export default async function handler(req: any, res: any) {
  // GET /api/leaderboard?caseId=...
  if (req.method === 'GET') {
    const { caseId } = req.query || {};
    try {
      const parsedCaseId = caseId ? parseInt(caseId as string, 10) : undefined;
      const data = await getLeaderboard(parsedCaseId);
      return res.status(200).json({ leaderboard: data });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST /api/leaderboard (Xác thực mã xác nhận BTC)
  if (req.method === 'POST') {
    const { confirmationCode } = req.body || {};
    if (!confirmationCode) {
      return res.status(400).json({ error: 'Vui lòng cung cấp mã xác nhận' });
    }

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('player_sessions')
          .select('*')
          .eq('confirmation_code', confirmationCode)
          .single();

        if (error || !data) {
          return res.status(404).json({ valid: false, message: 'Mã xác nhận không tồn tại hoặc không hợp lệ' });
        }

        return res.status(200).json({
          valid: true,
          player: data.player_name,
          team: data.team_code,
          caseId: data.case_id,
          totalScore: data.total_score,
          completedAt: data.completion_time || data.updated_at,
        });
      }

      // Memory check format validation: e.g. DTS-2XXXXX
      const isValidFormat = /^DTS-[2-5][A-F0-9]{6}$/i.test(confirmationCode);
      return res.status(200).json({
        valid: isValidFormat,
        message: isValidFormat ? 'Mã hợp lệ theo chuẩn định dạng DTS' : 'Định dạng mã không đúng',
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
