// ============================================================================
// API: /api/admin-sessions
// Endpoint backend serverless cho trang quản trị Admin
// ============================================================================
import { supabase, isSupabaseConfigured, DbPlayerSession } from '../db/supabase';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const { caseId } = req.query || {};

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('player_sessions').select('*').order('duration_seconds', { ascending: true, nullsFirst: false });
        if (caseId && caseId !== 'all') {
          query = query.eq('case_id', parseInt(caseId, 10));
        }
        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json({ success: true, sessions: data || [] });
      } catch (e: any) {
        return res.status(500).json({ error: e.message });
      }
    }

    return res.status(200).json({ success: true, sessions: [] });
  }

  if (req.method === 'POST') {
    const { action, password } = req.body || {};
    if (action === 'verify') {
      if (password === ADMIN_PASSWORD) {
        return res.status(200).json({ success: true, verified: true });
      }
      return res.status(401).json({ success: false, error: 'Mật khẩu Admin không đúng' });
    }
    return res.status(400).json({ error: 'Action không hợp lệ' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
