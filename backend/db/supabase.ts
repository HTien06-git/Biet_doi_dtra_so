// ============================================================================
// BACKEND DB / SUPABASE CLIENT
// Quản lý kết nối cơ sở dữ liệu Supabase cho backend serverless routes
// ============================================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let supabase: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

export interface DbPlayerSession {
  id?: string;
  player_name: string;
  team_code: string;
  case_id: number;
  station_scores: number[];
  total_score: number;
  clues_collected: number;
  stations_completed: number;
  is_completed: boolean;
  start_time?: string | null;
  completion_time?: string | null;
  duration_seconds?: number | null;
  confirmation_code?: string | null;
  created_at?: string;
  updated_at?: string;
}

// In-memory fallback for local development if Supabase not configured
const memorySessions: DbPlayerSession[] = [];

export function generateBtcCode(caseId: number, playerName: string, teamCode: string): string {
  const seed = `${playerName}-${teamCode}-${caseId}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(6, '0').slice(0, 6);
  return `DTS-${caseId}${hex}`;
}

export async function upsertSession(session: DbPlayerSession): Promise<DbPlayerSession> {
  const withCode = {
    ...session,
    confirmation_code: session.is_completed && !session.confirmation_code
      ? generateBtcCode(session.case_id, session.player_name, session.team_code)
      : session.confirmation_code,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('player_sessions')
      .upsert(withCode, { onConflict: 'player_name,team_code,case_id' })
      .select()
      .single();
    if (error) {
      console.warn('Supabase upsert error, using fallback:', error.message);
      return saveInMemory(withCode);
    }
    return data as DbPlayerSession;
  }

  return saveInMemory(withCode);
}

export async function getPlayerSessions(playerName: string, teamCode: string): Promise<DbPlayerSession[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('player_sessions')
      .select('*')
      .eq('player_name', playerName)
      .eq('team_code', teamCode);
    if (!error && data) return data;
  }
  return memorySessions.filter((s) => s.player_name === playerName && s.team_code === teamCode);
}

export async function getLeaderboard(caseId?: number): Promise<DbPlayerSession[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('player_sessions').select('*').order('total_score', { ascending: false });
    if (caseId) {
      query = query.eq('case_id', caseId);
    }
    const { data, error } = await query;
    if (!error && data) return data;
  }

  const list = caseId ? memorySessions.filter((s) => s.case_id === caseId) : memorySessions;
  return [...list].sort((a, b) => b.total_score - a.total_score);
}

function saveInMemory(session: DbPlayerSession): DbPlayerSession {
  const idx = memorySessions.findIndex(
    (s) => s.player_name === session.player_name &&
           s.team_code === session.team_code &&
           s.case_id === session.case_id
  );
  if (idx >= 0) {
    memorySessions[idx] = { ...session };
    return memorySessions[idx];
  }
  const created = { ...session, created_at: new Date().toISOString() };
  memorySessions.push(created);
  return created;
}
