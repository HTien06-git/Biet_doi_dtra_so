import { NextResponse } from 'next/server';
import { getAllSessions, savePlayerSession, PlayerSession, isSupabaseConfigured, supabase } from '@/lib/supabase';

// Admin PIN/Password check
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');

    let sessions = await getAllSessions();

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
    const { action, password, demoSessions } = body;

    // Verify Password
    if (action === 'verify') {
      if (password === ADMIN_PASSWORD) {
        return NextResponse.json({ success: true, verified: true });
      }
      return NextResponse.json({ success: false, error: 'Mật khẩu Admin không chính xác!' }, { status: 401 });
    }

    // Seed Demo Sessions
    if (action === 'seed') {
      if (password !== ADMIN_PASSWORD) {
        return NextResponse.json({ success: false, error: 'Chưa được cấp quyền Admin' }, { status: 401 });
      }

      if (Array.isArray(demoSessions)) {
        for (const s of demoSessions) {
          await savePlayerSession(s);
        }
      }

      return NextResponse.json({ success: true, message: 'Đã nạp dữ liệu mẫu thành công!' });
    }

    return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Lỗi server' }, { status: 500 });
  }
}
