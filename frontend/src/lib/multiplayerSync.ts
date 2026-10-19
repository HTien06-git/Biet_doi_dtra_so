// ============================================================================
// LIB/MULTIPLAYERSYNC.TS
// REAL-TIME MULTIPLAYER SYNC & LIVE TELEMETRY ENGINE
// Supports 50+ concurrent active devices with low-latency Supabase Realtime
// Broadcast & local BroadcastChannel fallback for multi-tenant sessions.
// ============================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { TelemetryEvent, ConnectedDevice, SyncEventType } from '@/types/case';

const BROADCAST_CHANNEL_NAME = 'dts-live-telemetry';
const LOCAL_CHANNEL_KEY = 'dts_broadcast_channel';

// Generate stable or session device id
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server_device';
  let id = sessionStorage.getItem('dts_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    sessionStorage.setItem('dts_device_id', id);
  }
  return id;
}

class MultiplayerSyncManager {
  private localBroadcastChannel: BroadcastChannel | null = null;
  private supabaseChannel: any = null;
  private listeners: Set<(event: TelemetryEvent) => void> = new Set();
  private deviceListeners: Set<(devices: ConnectedDevice[]) => void> = new Set();
  private activeDevices: Map<string, ConnectedDevice> = new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private currentDevice: ConnectedDevice | null = null;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Initialize local HTML5 BroadcastChannel for multi-tab zero-config sync
    try {
      if ('BroadcastChannel' in window) {
        this.localBroadcastChannel = new BroadcastChannel(LOCAL_CHANNEL_KEY);
        this.localBroadcastChannel.onmessage = (e) => {
          if (e.data && e.data.__dts_telemetry) {
            this.handleIncomingEvent(e.data.event);
          }
        };
      }
    } catch (err) {
      console.warn('BroadcastChannel not supported:', err);
    }

    // 2. Initialize Supabase Realtime Broadcast Channel (Low Latency WebSocket)
    if (isSupabaseConfigured && supabase) {
      try {
        this.supabaseChannel = supabase.channel(BROADCAST_CHANNEL_NAME, {
          config: { broadcast: { self: false } },
        });

        this.supabaseChannel
          .on('broadcast', { event: 'telemetry' }, (payload: any) => {
            if (payload && payload.payload) {
              this.handleIncomingEvent(payload.payload);
            }
          })
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              console.log('📡 Connected to Supabase Realtime Telemetry Broadcast');
            }
          });
      } catch (err) {
        console.warn('Supabase Realtime subscription error:', err);
      }
    }

    // 3. Heartbeat sweep timer to prune devices that haven't responded in 30s
    this.cleanupTimer = setInterval(() => {
      this.pruneStaleDevices();
    }, 10000);
  }

  // Handle incoming event from any device
  private handleIncomingEvent(event: TelemetryEvent) {
    if (!event || !event.id) return;

    // Update active device registry
    const deviceId = event.deviceInfo || 'dev_' + event.teamCode + '_' + event.playerName;
    const existing = this.activeDevices.get(deviceId);

    const updatedDevice: ConnectedDevice = {
      deviceId,
      playerName: event.playerName || (existing?.playerName ?? 'Unknown Investigator'),
      teamCode: event.teamCode || (existing?.teamCode ?? 'GUEST'),
      currentCaseId: event.caseId,
      currentStationId: event.stationId,
      lastActive: event.timestamp || new Date().toISOString(),
      currentScore: event.totalScore ?? (existing?.currentScore ?? 0),
      isOnline: true,
    };

    this.activeDevices.set(deviceId, updatedDevice);

    // Notify event subscribers
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error('Error in telemetry listener:', e);
      }
    });

    // Notify device list subscribers
    this.notifyDeviceSubscribers();
  }

  private pruneStaleDevices() {
    const now = Date.now();
    let hasChanges = false;
    this.activeDevices.forEach((dev, key) => {
      const lastActiveTime = new Date(dev.lastActive).getTime();
      // If inactive for > 45 seconds, mark offline or remove
      if (now - lastActiveTime > 45000) {
        if (dev.isOnline) {
          dev.isOnline = false;
          hasChanges = true;
        }
      }
    });
    if (hasChanges) {
      this.notifyDeviceSubscribers();
    }
  }

  private notifyDeviceSubscribers() {
    const list = Array.from(this.activeDevices.values());
    this.deviceListeners.forEach((listener) => {
      try {
        listener(list);
      } catch (e) {
        console.error('Error in device listener:', e);
      }
    });
  }

  // Register / update current player device and start heartbeats
  public registerDevice(params: {
    playerName: string;
    teamCode: string;
    caseId: number | string;
    stationId: number;
    score: number;
  }) {
    const deviceId = getOrCreateDeviceId();
    this.currentDevice = {
      deviceId,
      playerName: params.playerName,
      teamCode: params.teamCode,
      currentCaseId: params.caseId,
      currentStationId: params.stationId,
      lastActive: new Date().toISOString(),
      currentScore: params.score,
      isOnline: true,
    };

    // Store in active devices
    this.activeDevices.set(deviceId, this.currentDevice);
    this.notifyDeviceSubscribers();

    // Broadcast online event
    this.broadcastEvent({
      eventType: 'DEVICE_ONLINE',
      playerName: params.playerName,
      teamCode: params.teamCode,
      caseId: params.caseId,
      stationId: params.stationId,
      totalScore: params.score,
    });

    // Start 12-second periodic heartbeat
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.currentDevice) {
        this.broadcastEvent({
          eventType: 'DEVICE_ONLINE',
          playerName: this.currentDevice.playerName,
          teamCode: this.currentDevice.teamCode,
          caseId: this.currentDevice.currentCaseId,
          stationId: this.currentDevice.currentStationId,
          totalScore: this.currentDevice.currentScore,
        });
      }
    }, 12000);
  }

  // Broadcast a high-speed telemetry event to all connected peers
  public broadcastEvent(eventData: Omit<TelemetryEvent, 'id' | 'timestamp' | 'deviceInfo'>) {
    if (typeof window === 'undefined') return;

    const deviceId = getOrCreateDeviceId();
    const fullEvent: TelemetryEvent = {
      ...eventData,
      id: 'evt_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
      timestamp: new Date().toISOString(),
      deviceInfo: deviceId,
    };

    // Update local self state
    if (this.currentDevice) {
      this.currentDevice.currentCaseId = eventData.caseId;
      this.currentDevice.currentStationId = eventData.stationId;
      this.currentDevice.currentScore = eventData.totalScore;
      this.currentDevice.lastActive = fullEvent.timestamp;
      this.activeDevices.set(deviceId, this.currentDevice);
      this.notifyDeviceSubscribers();
    }

    // 1. Send via local BroadcastChannel
    if (this.localBroadcastChannel) {
      try {
        this.localBroadcastChannel.postMessage({
          __dts_telemetry: true,
          event: fullEvent,
        });
      } catch (e) {
        console.warn('BroadcastChannel postMessage error:', e);
      }
    }

    // 2. Send via Supabase Realtime WebSocket broadcast
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'telemetry',
          payload: fullEvent,
        });
      } catch (e) {
        console.warn('Supabase Realtime broadcast send error:', e);
      }
    }

    // 3. Trigger local listeners
    this.listeners.forEach((l) => l(fullEvent));
  }

  // Subscribe to raw telemetry stream (for Admin & Debugger)
  public onTelemetry(listener: (event: TelemetryEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Subscribe to active devices list
  public onDevicesChange(listener: (devices: ConnectedDevice[]) => void): () => void {
    this.deviceListeners.add(listener);
    // Send immediate snapshot
    listener(Array.from(this.activeDevices.values()));
    return () => {
      this.deviceListeners.delete(listener);
    };
  }

  // Concurrency Simulation: Spawns simulated active devices to test 50+ concurrent load
  public simulateHighConcurrency(targetCount: number = 55): () => void {
    const teams = ['CYBER-ALPHA', 'SEC-SHIELD', 'FIREWALL-07', 'DEFENDER-X', 'NET-SENTINEL', 'CODE-FORCE', 'PHISH-BUSTER'];
    const names = [
      'Nguyễn Văn A', 'Trần Thị B', 'Lê Hoàng C', 'Phạm Quốc D', 'Hoàng Gia E',
      'Đặng Thu H', 'Vũ Minh K', 'Bùi Ngọc L', 'Đỗ Thành M', 'Hồ Quang P',
      'Ngô Bảo Q', 'Dương Thái R', 'Lý Hải S', 'Mai Phương T', 'Cao Văn V'
    ];

    const simDeviceIds: string[] = [];

    for (let i = 1; i <= targetCount; i++) {
      const simId = `sim_device_${i.toString().padStart(2, '0')}`;
      simDeviceIds.push(simId);
      const randomTeam = teams[i % teams.length];
      const randomName = `${names[i % names.length]} (#${i})`;
      const randomStation = Math.floor(Math.random() * 5) + 1;
      const randomCase = Math.floor(Math.random() * 4) + 1;
      const randomScore = (randomStation - 1) * 20;

      const dev: ConnectedDevice = {
        deviceId: simId,
        playerName: randomName,
        teamCode: randomTeam,
        currentCaseId: randomCase,
        currentStationId: randomStation,
        lastActive: new Date(Date.now() - Math.floor(Math.random() * 15000)).toISOString(),
        currentScore: randomScore,
        isOnline: true,
      };

      this.activeDevices.set(simId, dev);
    }

    this.notifyDeviceSubscribers();

    // Simulate occasional random activity (progressing, finding clues)
    const interval = setInterval(() => {
      if (simDeviceIds.length === 0) return;
      const pickId = simDeviceIds[Math.floor(Math.random() * simDeviceIds.length)];
      const dev = this.activeDevices.get(pickId);
      if (dev && dev.isOnline) {
        dev.lastActive = new Date().toISOString();
        if (Math.random() > 0.6 && dev.currentStationId < 5) {
          dev.currentStationId += 1;
          dev.currentScore += 20;
          this.broadcastEvent({
            eventType: 'STATION_COMPLETED',
            playerName: dev.playerName,
            teamCode: dev.teamCode,
            caseId: dev.currentCaseId,
            stationId: dev.currentStationId,
            totalScore: dev.currentScore,
          });
        }
      }
    }, 4000);

    // Return cleanup function
    return () => {
      clearInterval(interval);
      simDeviceIds.forEach((id) => this.activeDevices.delete(id));
      this.notifyDeviceSubscribers();
    };
  }
}

// Global Singleton Instance
export const multiplayerSync = new MultiplayerSyncManager();
