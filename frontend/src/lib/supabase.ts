// ============================================================================
// SUPABASE CLIENT & CLOUD SESSION REPOSITORY
// Kết nối Supabase PostgreSQL + Fallback Server-Side Memory + Client LocalStorage + API Sync
// Đảm bảo dữ liệu đồng bộ xuyên suốt tất cả thiết bị trên toàn mạng Internet
// ============================================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-ref'));

let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Supabase initialization failed:', err);
  }
}

export { supabase };

// ============================================================================
// Database Model & Types
// ============================================================================
export interface PlayerSession {
  id?: string;
  player_name: string;
  team_code: string;
  case_id: number;
  station_scores: number[];     // Điểm từng trạm [15, 15, 20, 0, 0]
  total_score: number;
  clues_collected: number;
  stations_completed: number;
  is_completed: boolean;
  start_time?: string;          // ISO string
  completion_time?: string;     // ISO string
  duration_seconds?: number;    // Thời gian hoàn thành tính theo giây
  confirmation_code?: string;   // Mã xác nhận BTC
  created_at?: string;
  updated_at?: string;
}

// Global server-side in-memory session cache (persists during server lifetime)
export const getGlobalServerSessions = (): Map<string, PlayerSession> => {
  const g = globalThis as any;
  if (!g.__DTS_SERVER_SESSIONS__) {
    g.__DTS_SERVER_SESSIONS__ = new Map<string, PlayerSession>();
  }
  return g.__DTS_SERVER_SESSIONS__;
};

export function generateConfirmationCode(caseId?: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = `DTS-${caseId || 2}-`;
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================================================
// Save Session (Cloud -> Server API -> LocalStorage)
// ============================================================================
export async function savePlayerSession(session: PlayerSession): Promise<void> {
  const enrichedSession: PlayerSession = {
    ...session,
    confirmation_code: session.is_completed && !session.confirmation_code
      ? generateConfirmationCode(session.case_id)
      : session.confirmation_code,
    updated_at: new Date().toISOString(),
  };

  // 1. If running on Server: Save to Global Server Cache
  if (typeof window === 'undefined') {
    const serverMap = getGlobalServerSessions();
    const key = `${enrichedSession.player_name}_${enrichedSession.team_code}_${enrichedSession.case_id}`;
    serverMap.set(key, enrichedSession);
  }

  // 2. If Supabase is configured: Save to Supabase Cloud PostgreSQL
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('player_sessions')
        .upsert(enrichedSession, {
          onConflict: 'player_name,team_code,case_id',
        });
      if (error) throw error;
    } catch (e) {
      console.warn('Supabase save failed, using server/local fallback:', e);
    }
  }

  // 3. If running on Client Browser (e.g. mobile phone):
  if (typeof window !== 'undefined') {
    // Save to device's localStorage
    saveToLocalStorage(enrichedSession);

    // Sync to Next.js API Server (`/api/sessions`)
    try {
      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedSession),
      }).catch(() => {
        // Ignore offline network error
      });
    } catch {
      // Ignore
    }

    // Dynamic import to avoid circular dependency
    import('./multiplayerSync').then(({ multiplayerSync }) => {
      multiplayerSync.broadcastSession(enrichedSession);
    }).catch(() => {});
  }
}

// ============================================================================
// Load Player Sessions
// ============================================================================
export async function loadPlayerSessions(playerName: string, teamCode: string): Promise<PlayerSession[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('player_sessions')
        .select('*')
        .eq('player_name', playerName)
        .eq('team_code', teamCode);
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('Supabase load failed:', e);
    }
  }

  if (typeof window !== 'undefined') {
    return loadFromLocalStorage(playerName, teamCode);
  }

  const serverMap = getGlobalServerSessions();
  return Array.from(serverMap.values()).filter(
    (s) => s.player_name === playerName && s.team_code === teamCode
  );
}

// ============================================================================
// Get All Sessions (Used by Admin Dashboard & Leaderboard)
// ============================================================================
export async function getAllSessions(): Promise<PlayerSession[]> {
  // 1. If Supabase is configured: query Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('player_sessions')
        .select('*')
        .order('updated_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('Supabase load all failed:', e);
    }
  }

  // 2. If running on Client: Try fetching from Next.js Server API
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/admin/sessions', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.sessions && Array.isArray(json.sessions) && json.sessions.length > 0) {
          // Merge with local storage
          const localList = getAllFromLocalStorage();
          const mergedMap = new Map<string, PlayerSession>();
          json.sessions.forEach((s: PlayerSession) => {
            mergedMap.set(`${s.player_name}_${s.team_code}_${s.case_id}`, s);
          });
          localList.forEach((s) => {
            const k = `${s.player_name}_${s.team_code}_${s.case_id}`;
            if (!mergedMap.has(k)) mergedMap.set(k, s);
          });
          return Array.from(mergedMap.values());
        }
      }
    } catch (err) {
      console.warn('Fetch /api/admin/sessions failed:', err);
    }

    return getAllFromLocalStorage();
  }

  // 3. If running on Server: Return from Global Server Cache
  const serverMap = getGlobalServerSessions();
  return Array.from(serverMap.values());
}

// ============================================================================
// LocalStorage Fallback (Client only)
// ============================================================================
const STORAGE_KEY = 'dts_player_sessions';

function saveToLocalStorage(session: PlayerSession): void {
  try {
    if (typeof window === 'undefined') return;
    const sessions = getAllFromLocalStorage();
    const idx = sessions.findIndex(
      (s) => s.player_name === session.player_name && 
             s.team_code === session.team_code && 
             s.case_id === session.case_id
    );
    if (idx >= 0) {
      sessions[idx] = session;
    } else {
      sessions.push({ ...session, created_at: new Date().toISOString() });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('LocalStorage save failed:', e);
  }
}

function loadFromLocalStorage(playerName: string, teamCode: string): PlayerSession[] {
  try {
    const sessions = getAllFromLocalStorage();
    return sessions.filter(
      (s) => s.player_name === playerName && s.team_code === teamCode
    );
  } catch {
    return [];
  }
}

function getAllFromLocalStorage(): PlayerSession[] {
  try {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
