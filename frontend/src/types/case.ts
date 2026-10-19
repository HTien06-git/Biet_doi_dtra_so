// ============================================================================
// TYPES/CASE.TS – TYPED DEFINITIONS FOR DYNAMIC STATION RENDERING & MULTIPLAYER
// ============================================================================

export type CharacterExpression = 'shocked' | 'fearful' | 'suspicious' | 'neutral' | 'investigating';

export type ClueIconType = 'sos' | 'pdf' | 'qr' | 'chat_log' | 'document' | 'call_log';

export type BackgroundTheme = 'office' | 'bedroom' | 'cyber_lab' | 'phone_screen' | 'bank_interface';

export interface ClueItem {
  id: string;
  label: string;
  iconType: ClueIconType;
  actionPayload: {
    title: string;
    category?: string;
    description: string;
    details?: string[];
    riskLevel?: 'safe' | 'warning' | 'critical';
    metadata?: Record<string, any>;
    previewData?: {
      sender?: string;
      timestamp?: string;
      accountNumber?: string;
      bankName?: string;
      fileSize?: string;
      url?: string;
      qrRawData?: string;
    };
  };
}

export interface StationCharacter {
  name: string;
  avatarUrl?: string;
  roleTitle?: string;
  expression: CharacterExpression;
  dialogueText: string;
}

export interface StationConfig {
  caseId: string;       // e.g., 'case_02', 'case_03', 'case_04', 'case_05'
  stationId: number;    // 1 through 5
  title: string;
  victimName: string;
  character: StationCharacter;
  backgroundTheme: BackgroundTheme;
  interactiveClues: ClueItem[];
  ambientSoundEffect?: 'phone_ring' | 'keyboard_type' | 'notification' | 'siren' | 'heartbeat';
}

// Multiplayer Telemetry & Sync Types
export type SyncEventType = 
  | 'DEVICE_ONLINE'
  | 'USER_JOINED'
  | 'CASE_STARTED'
  | 'STATION_ENTER'
  | 'CLUE_DISCOVERED'
  | 'ANSWER_ATTEMPT'
  | 'STATION_COMPLETED'
  | 'CASE_FINISHED';

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  eventType: SyncEventType;
  playerName: string;
  teamCode: string;
  caseId: string | number;
  stationId: number;
  scoreDelta?: number;
  totalScore: number;
  durationSeconds?: number;
  clueId?: string;
  deviceInfo?: string;
}

export interface ConnectedDevice {
  deviceId: string;
  playerName: string;
  teamCode: string;
  currentCaseId: number | string;
  currentStationId: number;
  lastActive: string;
  currentScore: number;
  isOnline: boolean;
}
