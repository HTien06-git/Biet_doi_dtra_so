// ============================================================================
// API: /api/check-name
// Kiểm tra tên điều tra viên xem đã bị trùng lặp chưa
// ============================================================================
import { getAllDbSessions, isSupabaseConfigured, supabase } from '../db/supabase';

const MOCK_NAMES = new Set([
  'nguyễn văn an',
  'trần thị mai',
  'lê hoàng minh',
  'phạm quốc hùng',
  'hoàng thùy linh',
]);

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name } = req.query || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ available: false, error: 'Thiếu tên điều tra viên' });
  }

  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('player_sessions')
        .select('player_name')
        .ilike('player_name', trimmed)
        .limit(1);

      if (!error && data && data.length > 0) {
        return res.status(200).json({
          available: false,
          error: `Tên điều tra viên "${trimmed}" đã được đăng ký! Quy định giải đấu không được đặt tên trùng nhau, vui lòng chọn tên khác.`,
        });
      }
    }

    const sessions = await getAllDbSessions();
    const isTaken = sessions.some(
      (s) =>
        s.player_name &&
        s.player_name.trim().toLowerCase() === lower &&
        !MOCK_NAMES.has(s.player_name.trim().toLowerCase())
    );

    if (isTaken) {
      return res.status(200).json({
        available: false,
        error: `Tên điều tra viên "${trimmed}" đã được đăng ký! Quy định giải đấu không được đặt tên trùng nhau, vui lòng chọn tên khác.`,
      });
    }

    return res.status(200).json({ available: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Lỗi server' });
  }
}
