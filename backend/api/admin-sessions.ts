// ============================================================================
// API: /api/admin-sessions
// Endpoint backend serverless cho trang quản trị Admin
// Hỗ trợ truy vấn tiến độ người chơi, xác thực mật khẩu, và dọn sạch dữ liệu thi đấu
// ============================================================================
import {
  getAllDbSessions,
  clearAllDbSessions,
  isSupabaseConfigured,
  DbPlayerSession,
} from '../db/supabase';

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD ||
  process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
  'Admin@2026';

export default async function handler(req: any, res: any) {
  // Bật CORS cho các yêu cầu từ Web App
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET: Lấy danh sách toàn bộ phiên chơi thực tế
  if (req.method === 'GET') {
    try {
      const { caseId } = req.query || {};

      let sessions: DbPlayerSession[] = await getAllDbSessions();

      if (caseId && caseId !== 'all') {
        const cid = parseInt(caseId, 10);
        sessions = sessions.filter((s) => s.case_id === cid);
      }

      return res.status(200).json({
        success: true,
        sessions,
        isSupabase: isSupabaseConfigured,
        totalCount: sessions.length,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Lỗi server' });
    }
  }

  // 2. POST: Xác thực mật khẩu hoặc dọn sạch dữ liệu
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { action, password } = body;

      // Xác thực Admin PIN/Password
      if (action === 'verify') {
        if (password === ADMIN_PASSWORD) {
          return res.status(200).json({ success: true, verified: true });
        }
        return res.status(401).json({ success: false, error: 'Mật khẩu Admin không chính xác!' });
      }

      // Dọn sạch toàn bộ dữ liệu (Reset giải đấu về 0)
      if (action === 'clear') {
        if (password && password !== ADMIN_PASSWORD) {
          return res.status(401).json({ success: false, error: 'Chưa được cấp quyền Admin' });
        }
        (globalThis as any).__DTS_SYSTEM_RESET_AT__ = Date.now();
        await clearAllDbSessions();
        return res.status(200).json({
          success: true,
          message: 'Đã dọn sạch toàn bộ dữ liệu máy chủ. Bảng thi đấu đã về 0!',
          resetAt: (globalThis as any).__DTS_SYSTEM_RESET_AT__,
        });
      }

      return res.status(400).json({ error: 'Action không hợp lệ' });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Lỗi server' });
    }
  }

  // 3. DELETE: Xóa toàn bộ dữ liệu phiên chơi
  if (req.method === 'DELETE') {
    try {
      await clearAllDbSessions();
      return res.status(200).json({
        success: true,
        message: 'Đã dọn sạch toàn bộ dữ liệu phiên chơi',
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Lỗi server' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
