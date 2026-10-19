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
    const session: PlayerSession = await req.json();
    if (!session.player_name || !session.team_code) {
      return NextResponse.json({ error: 'Dữ liệu phiên chơi không hợp lệ' }, { status: 400 });
    }
    await savePlayerSession(session);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
