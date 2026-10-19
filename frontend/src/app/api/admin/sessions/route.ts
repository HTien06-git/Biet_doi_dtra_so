import { NextResponse } from 'next/server';
import {
  getAllSessions,
  savePlayerSession,
  PlayerSession,
  isSupabaseConfigured,
  supabase,
  getGlobalServerSessions,
} from '@/lib/supabase';

// Admin PIN/Password check
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

const MOCK_TEAMS = new Set(['CYBER-ALPHA', 'SEC-SHIELD', 'FIREWALL-07', 'DEFENDER-X', 'ZERO-TRUST']);
const MOCK_NAMES = new Set(['Nguyễn Văn An', 'Trần Thị Mai', 'Lê Hoàng Minh', 'Phạm Quốc Hùng', 'Hoàng Thùy Linh']);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');

    let sessions = await getAllSessions();

    // CHỈ LẤY DỮ LIỆU THẬT - Lọc bỏ dữ liệu ảo/demo và phiên trống ghost
    sessions = sessions.filter((s) => {
      if (MOCK_TEAMS.has(s.team_code) || MOCK_NAMES.has(s.player_name)) return false;
      if (!s.start_time && (s.total_score || 0) === 0 && (s.stations_completed || 0) === 0 && !s.is_completed) return false;
      return true;
    });

    if (caseId && caseId !== 'all') {
      const cid = parseInt(caseId, 10);
      sessions = sessions.filter((s) => s.case_id === cid);
    }

    return NextResponse.json({
      success: true,
      sessions,
      isSupabase: isSupabaseConfigured,
      totalCount: sessions.length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, password } = body;

    // Verify Password
    if (action === 'verify') {
      if (password === ADMIN_PASSWORD) {
        return NextResponse.json({ success: true, verified: true });
      }
      return NextResponse.json({ success: false, error: 'Mật khẩu Admin không chính xác!' }, { status: 401 });
    }

      // Clear All Sessions (Dọn sạch để chuẩn bị giải đấu mới)
    if (action === 'clear') {
      if (password && password !== ADMIN_PASSWORD) {
        return NextResponse.json({ success: false, error: 'Chưa được cấp quyền Admin' }, { status: 401 });
      }

      (globalThis as any).__DTS_SYSTEM_RESET_AT__ = Date.now();

      const serverMap = getGlobalServerSessions();
      serverMap.clear();

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('player_sessions').delete().neq('case_id', -999);
        } catch (e) {
          console.warn('Supabase clear failed:', e);
        }
      }

      return NextResponse.json({ success: true, message: 'Đã dọn sạch toàn bộ dữ liệu máy chủ!', resetAt: (globalThis as any).__DTS_SYSTEM_RESET_AT__ });
    }

    return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Lỗi server' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const serverMap = getGlobalServerSessions();
    serverMap.clear();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('player_sessions').delete().neq('case_id', -999);
      } catch (e) {
        console.warn('Supabase clear failed:', e);
      }
    }

    return NextResponse.json({ success: true, message: 'Đã xóa toàn bộ dữ liệu phiên chơi' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Lỗi server' }, { status: 500 });
  }
}
