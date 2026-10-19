// ============================================================================
// BACKEND DB / SUPABASE CLIENT
// Quản lý kết nối cơ sở dữ liệu Supabase cho backend serverless routes
// ============================================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-ref')
);

let supabase: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Supabase initialization failed in backend:', err);
  }
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
  status?: string;
  is_active?: boolean;
  last_active?: string;
  start_time?: string | null;
  completion_time?: string | null;
  duration_seconds?: number | null;
  confirmation_code?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Global serverless memory storage fallback
const getMemorySessions = (): Map<string, DbPlayerSession> => {
  const g = globalThis as any;
  if (!g.__DTS_BACKEND_SESSIONS__) {
    g.__DTS_BACKEND_SESSIONS__ = new Map<string, DbPlayerSession>();
  }
  return g.__DTS_BACKEND_SESSIONS__;
};

const MOCK_TEAMS = new Set(['CYBER-ALPHA', 'SEC-SHIELD', 'FIREWALL-07', 'DEFENDER-X', 'ZERO-TRUST']);
const MOCK_NAMES = new Set(['Nguyễn Văn An', 'Trần Thị Mai', 'Lê Hoàng Minh', 'Phạm Quốc Hùng', 'Hoàng Thùy Linh']);

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
  const withCode: DbPlayerSession = {
    ...session,
    confirmation_code: session.is_completed && !session.confirmation_code
      ? generateBtcCode(session.case_id, session.player_name, session.team_code)
      : session.confirmation_code,
    updated_at: new Date().toISOString(),
    last_active: session.last_active || new Date().toISOString(),
  };

  const key = `${withCode.player_name}_${withCode.team_code}_${withCode.case_id}`;
  const memMap = getMemorySessions();
  memMap.set(key, withCode);

  if (isSupabaseConfigured && supabase) {
    try {
      const { status, is_active, last_active, ...cleanDbSession } = withCode as any;
      const { data, error } = await supabase
        .from('player_sessions')
        .upsert(cleanDbSession, { onConflict: 'player_name,team_code,case_id' })
        .select()
        .single();
      if (!error && data) {
        return data as DbPlayerSession;
      }
    } catch (err: any) {
      console.warn('Supabase upsert error, saved to memory:', err.message);
    }
  }

  return withCode;
}

export async function getPlayerSessions(playerName: string, teamCode: string): Promise<DbPlayerSession[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('player_sessions')
        .select('*')
        .eq('player_name', playerName)
        .eq('team_code', teamCode);
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('Supabase getPlayerSessions error:', e);
    }
  }

  const list = Array.from(getMemorySessions().values());
  return list.filter((s) => s.player_name === playerName && s.team_code === teamCode);
}

export async function getAllDbSessions(): Promise<DbPlayerSession[]> {
  let sessions: DbPlayerSession[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('player_sessions')
        .select('*')
        .order('updated_at', { ascending: false });
      if (!error && data) {
        sessions = data;
      }
    } catch (e: any) {
      console.warn('Supabase getAllDbSessions error:', e.message);
    }
  }

  if (sessions.length === 0) {
    sessions = Array.from(getMemorySessions().values());
  }

  // Lọc chỉ lấy dữ liệu thật: bỏ mock data và các phiên rỗng chưa bắt đầu
  return sessions.filter((s) => {
    if (MOCK_TEAMS.has(s.team_code) || MOCK_NAMES.has(s.player_name)) return false;
    if (!s.start_time && (s.total_score || 0) === 0 && (s.stations_completed || 0) === 0 && !s.is_completed) {
      return false;
    }
    return true;
  });
}

export async function clearAllDbSessions(): Promise<void> {
  const memMap = getMemorySessions();
  memMap.clear();

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('player_sessions').delete().neq('case_id', -999);
    } catch (e: any) {
      console.warn('Supabase clear error:', e.message);
    }
  }
}

export async function getLeaderboard(caseId?: number): Promise<DbPlayerSession[]> {
  const all = await getAllDbSessions();
  const filtered = caseId ? all.filter((s) => s.case_id === caseId) : all;
  
  // Sắp xếp: ưu tiên hoàn thành trước, sau đó theo điểm số cao nhất và thời gian nhanh nhất
  return [...filtered].sort((a, b) => {
    if (a.is_completed !== b.is_completed) return a.is_completed ? -1 : 1;
    if (b.total_score !== a.total_score) return (b.total_score || 0) - (a.total_score || 0);
    return (a.duration_seconds || 999999) - (b.duration_seconds || 999999);
  });
}
