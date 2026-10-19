import { NextResponse } from 'next/server';
import { getAllSessions } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const caseId = searchParams.get('caseId');

  try {
    const all = await getAllSessions();
    if (caseId) {
      const parsedId = parseInt(caseId, 10);
      const filtered = all.filter((s) => s.case_id === parsedId);
      return NextResponse.json({ leaderboard: filtered });
    }
    return NextResponse.json({ leaderboard: all });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
