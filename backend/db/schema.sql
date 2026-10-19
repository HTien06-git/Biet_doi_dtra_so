-- ============================================================================
-- SCHEMA.SQL: HỆ THỐNG CƠ SỞ DỮ LIỆU ĐỘI ĐIỀU TRA SỐ
-- Sử dụng với Supabase (PostgreSQL)
-- ============================================================================

-- Bật extension UUID nếu chưa có
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Bảng lưu trữ phiên chơi của điều tra viên
CREATE TABLE IF NOT EXISTS player_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_name VARCHAR(100) NOT NULL,
    team_code VARCHAR(50) NOT NULL,
    case_id INTEGER NOT NULL,
    station_scores INTEGER[] DEFAULT '{0,0,0,0,0}',
    total_score INTEGER DEFAULT 0,
    clues_collected INTEGER DEFAULT 0,
    stations_completed INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    start_time TIMESTAMPTZ,
    completion_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    confirmation_code VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Đảm bảo mỗi (tên, đội, vụ án) là duy nhất để upsert
    CONSTRAINT unique_player_case UNIQUE (player_name, team_code, case_id)
);

-- Index tăng tốc truy vấn bảng xếp hạng
CREATE INDEX IF NOT EXISTS idx_player_sessions_scores 
ON player_sessions (total_score DESC, clues_collected DESC, updated_at ASC);

CREATE INDEX IF NOT EXISTS idx_player_sessions_speed
ON player_sessions (duration_seconds ASC, total_score DESC);

CREATE INDEX IF NOT EXISTS idx_player_sessions_lookup
ON player_sessions (player_name, team_code);

CREATE INDEX IF NOT EXISTS idx_player_sessions_case
ON player_sessions (case_id);

-- 2. View Bảng xếp hạng tốc độ giải 5 trạm (Nhanh nhất đến chậm nhất)
CREATE OR REPLACE VIEW v_leaderboard_5stations_speed AS
SELECT 
    player_name,
    team_code,
    case_id,
    stations_completed,
    total_score,
    duration_seconds,
    start_time,
    completion_time,
    confirmation_code
FROM player_sessions
WHERE is_completed = TRUE
ORDER BY duration_seconds ASC, total_score DESC;

-- 3. View Bảng xếp hạng tổng hợp (Toàn bộ giải đấu)
CREATE OR REPLACE VIEW v_leaderboard_all AS
SELECT 
    player_name,
    team_code,
    SUM(total_score) AS grand_total_score,
    SUM(clues_collected) AS grand_clues_collected,
    COUNT(CASE WHEN is_completed THEN 1 END) AS cases_completed_count,
    MIN(duration_seconds) AS best_duration_seconds,
    MAX(updated_at) AS last_active
FROM player_sessions
GROUP BY player_name, team_code
ORDER BY grand_total_score DESC, grand_clues_collected DESC, last_active ASC;

-- 3. Row Level Security (RLS) cho phép ghi/đọc công khai (Game thi đấu)
ALTER TABLE player_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép đọc dữ liệu phiên chơi" 
ON player_sessions FOR SELECT 
USING (true);

CREATE POLICY "Cho phép ghi/cập nhật phiên chơi" 
ON player_sessions FOR ALL 
USING (true) 
WITH CHECK (true);
