import { NextResponse } from 'next/server';
import { savePlayerSession, loadPlayerSessions, PlayerSession } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const playerName = searchParams.get('playerName');
  const teamCode = searchParams.get('teamCode');

  if (!playerName || !teamCode) {
    return NextResponse.json({ error: 'Thiếu playerName hoặc teamCode' }, { status: 400 });
  }

  try {
    const sessions = await loadPlayerSessions(playerName, teamCode);
    return NextResponse.json({ sessions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Xử lý khi user rời trận / out không chơi nữa
    if (body.action === 'leave' || body.status === 'left' || body.is_active === false) {
      const { player_name, team_code } = body;
      if (player_name && team_code) {
        const existing = await loadPlayerSessions(player_name, team_code);
        for (const s of existing) {
          if (!s.is_completed) {
            await savePlayerSession({
              ...s,
              is_active: false,
              status: 'left',
              updated_at: new Date().toISOString(),
            });
          }
        }
        return NextResponse.json({ success: true, message: 'Đã cập nhật trạng thái rời trận' });
      }
    }

    const session: PlayerSession = body;
    if (!session.player_name || !session.team_code) {
      return NextResponse.json({ error: 'Dữ liệu phiên chơi không hợp lệ' }, { status: 400 });
    }

    // Nếu Ban Tổ Chức vừa Reset hệ thống, từ chối lưu và yêu cầu thiết bị đăng xuất ngay lập tức
    const resetAt = (globalThis as any).__DTS_SYSTEM_RESET_AT__;
    if (resetAt && session.start_time) {
      const sessionStart = new Date(session.start_time).getTime();
      if (sessionStart < resetAt) {
        return NextResponse.json({
          force_logout: true,
          error: 'Giải đấu đã được thiết lập lại bởi Ban Quản Trị.',
        });
      }
    }

    await savePlayerSession(session);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
