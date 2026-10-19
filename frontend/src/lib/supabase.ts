// ============================================================================
// SUPABASE CLIENT - Kết nối cơ sở dữ liệu
// Tự động fallback sang localStorage nếu chưa config biến môi trường
// ============================================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

// ============================================================================
// Database Operations with Fallback
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
  completion_time?: string;     // ISO string
  confirmation_code?: string;   // Mã xác nhận cho BTC
  created_at?: string;
  updated_at?: string;
}

function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'DTS-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function savePlayerSession(session: PlayerSession): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('player_sessions')
        .upsert({
          ...session,
          confirmation_code: session.is_completed ? generateConfirmationCode() : null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'player_name,team_code,case_id',
        });
      if (error) throw error;
    } catch (e) {
      console.warn('Supabase save failed, falling back to localStorage:', e);
      saveToLocalStorage(session);
    }
  } else {
    saveToLocalStorage(session);
  }
}

export async function loadPlayerSessions(playerName: string, teamCode: string): Promise<PlayerSession[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('player_sessions')
        .select('*')
        .eq('player_name', playerName)
        .eq('team_code', teamCode);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase load failed, falling back to localStorage:', e);
      return loadFromLocalStorage(playerName, teamCode);
    }
  }
  return loadFromLocalStorage(playerName, teamCode);
}

export async function getAllSessions(): Promise<PlayerSession[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('player_sessions')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase load all failed:', e);
      return [];
    }
  }
  return getAllFromLocalStorage();
}

// ============================================================================
// localStorage Fallback
// ============================================================================
const STORAGE_KEY = 'dts_player_sessions';

function saveToLocalStorage(session: PlayerSession): void {
  try {
    const sessions = getAllFromLocalStorage();
    const idx = sessions.findIndex(
      (s) => s.player_name === session.player_name && 
             s.team_code === session.team_code && 
             s.case_id === session.case_id
    );
    const updated = {
      ...session,
      confirmation_code: session.is_completed ? generateConfirmationCode() : undefined,
      updated_at: new Date().toISOString(),
    };
    if (idx >= 0) {
      sessions[idx] = updated;
    } else {
      sessions.push({ ...updated, created_at: new Date().toISOString() });
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
