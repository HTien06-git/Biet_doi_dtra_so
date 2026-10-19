import { NextResponse } from 'next/server';
import {
  getAllSessions,
  getGlobalServerSessions,
  isSupabaseConfigured,
  supabase,
} from '@/lib/supabase';

const MOCK_NAMES = new Set([
  'nguyễn văn an',
  'trần thị mai',
  'lê hoàng minh',
  'phạm quốc hùng',
  'hoàng thùy linh',
]);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawName = searchParams.get('name');

    if (!rawName || !rawName.trim()) {
      return NextResponse.json({ available: false, error: 'Vui lòng nhập tên điều tra viên' }, { status: 400 });
    }

    const trimmedName = rawName.trim();
    const lowerName = trimmedName.toLowerCase();

    // 1. Kiểm tra trong bộ nhớ máy chủ (Global Server Sessions)
    const serverMap = getGlobalServerSessions();
    for (const session of serverMap.values()) {
      if (session.player_name && session.player_name.trim().toLowerCase() === lowerName) {
        return NextResponse.json({
          available: false,
          error: `Tên điều tra viên "${trimmedName}" đã được đăng ký! Quy định giải đấu không được đặt tên trùng nhau, vui lòng chọn tên khác.`,
        });
      }
    }

    // 2. Kiểm tra trong Supabase PostgreSQL nếu được cấu hình
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('player_sessions')
          .select('player_name')
          .ilike('player_name', trimmedName)
          .limit(1);

        if (!error && data && data.length > 0) {
          return NextResponse.json({
            available: false,
            error: `Tên điều tra viên "${trimmedName}" đã được đăng ký! Quy định giải đấu không được đặt tên trùng nhau, vui lòng chọn tên khác.`,
          });
        }
      } catch (err) {
        console.warn('Supabase check-name error:', err);
      }
    }

    // 3. Kiểm tra qua getAllSessions (hợp nhất server + local)
    const all = await getAllSessions();
    const isTaken = all.some(
      (s) =>
        s.player_name &&
        s.player_name.trim().toLowerCase() === lowerName &&
        !MOCK_NAMES.has(s.player_name.trim().toLowerCase())
    );

    if (isTaken) {
      return NextResponse.json({
        available: false,
        error: `Tên điều tra viên "${trimmedName}" đã được đăng ký! Quy định giải đấu không được đặt tên trùng nhau, vui lòng chọn tên khác.`,
      });
    }

    return NextResponse.json({
      available: true,
      message: 'Tên điều tra viên hợp lệ và chưa ai sử dụng.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Lỗi server' }, { status: 500 });
  }
}
