// ============================================================================
// LIB/MULTIPLAYERSYNC.TS
// REAL-TIME MULTIPLAYER SYNC & CROSS-DEVICE TELEMETRY ENGINE
// Connects devices across the internet via Public Cloud WebSocket Relay (EMQX/HiveMQ)
// + Supabase Realtime + local BroadcastChannel fallback for multi-tenant sessions.
// ============================================================================

import { supabase, isSupabaseConfigured, PlayerSession } from './supabase';
import { TelemetryEvent, ConnectedDevice } from '@/types/case';
import mqtt, { MqttClient } from 'mqtt';

const LOCAL_CHANNEL_KEY = 'dts_broadcast_channel';
const MQTT_BROKER_URL = 'wss://broker.emqx.io:8084/mqtt';
const MQTT_FALLBACK_URL = 'wss://broker.hivemq.com:8884/mqtt';

const TOPIC_TELEMETRY = 'dts/v1/telemetry';
const TOPIC_SESSIONS = 'dts/v1/sessions';
const TOPIC_SYNC = 'dts/v1/sync';
const TOPIC_SYSTEM = 'dts/v1/system';

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
  private mqttClient: MqttClient | null = null;

  private telemetryListeners: Set<(event: TelemetryEvent) => void> = new Set();
  private deviceListeners: Set<(devices: ConnectedDevice[]) => void> = new Set();
  private sessionListeners: Set<(session: PlayerSession) => void> = new Set();
  private systemResetListeners: Set<() => void> = new Set();

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

    // 1. Initialize local HTML5 BroadcastChannel (fast local tab sync)
    try {
      if ('BroadcastChannel' in window) {
        this.localBroadcastChannel = new BroadcastChannel(LOCAL_CHANNEL_KEY);
        this.localBroadcastChannel.onmessage = (e) => {
          if (e.data) {
            if (e.data.__dts_system_reset) {
              this.handleIncomingSystemReset();
            } else if (e.data.__dts_telemetry) {
              this.handleIncomingTelemetry(e.data.event);
            } else if (e.data.__dts_session) {
              this.handleIncomingSession(e.data.session);
            }
          }
        };
      }
    } catch (err) {
      console.warn('BroadcastChannel not supported:', err);
    }

    // 2. Initialize Global Public Cloud WebSocket Relay (EMQX Broker)
    // Allows phones, laptops, and tablets across the internet to sync instantly
    try {
      const clientId = 'dts_' + getOrCreateDeviceId();
      const client = mqtt.connect(MQTT_BROKER_URL, {
        clientId,
        clean: true,
        connectTimeout: 8000,
        reconnectPeriod: 5000,
      });

      client.on('connect', () => {
        console.log('📡 Connected to Global Cloud Relay (EMQX WebSocket)');
        client.subscribe([TOPIC_TELEMETRY, TOPIC_SESSIONS, TOPIC_SYNC, TOPIC_SYSTEM], (err) => {
          if (err) console.warn('MQTT Subscribe error:', err);
        });
      });

      client.on('message', (topic, payload) => {
        try {
          const raw = payload.toString();
          const data = JSON.parse(raw);

          if (topic === TOPIC_SYSTEM || data.type === 'SYSTEM_RESET') {
            this.handleIncomingSystemReset();
          } else if (topic === TOPIC_TELEMETRY && data.id) {
            this.handleIncomingTelemetry(data);
          } else if (topic === TOPIC_SESSIONS && data.player_name) {
            this.handleIncomingSession(data);
          } else if (topic === TOPIC_SYNC && data.type === 'SYNC_REQUEST') {
            // If we have an active device or saved sessions, respond to help the joining Admin
            this.respondToSyncRequest();
          }
        } catch {
          // Ignore malformed packet
        }
      });

      client.on('error', (err) => {
        console.warn('MQTT Connection error, switching to fallback:', err);
      });

      this.mqttClient = client;
    } catch (err) {
      console.warn('Could not initialize Cloud WebSocket Relay:', err);
    }

    // 3. Initialize Supabase Realtime if configured
    if (isSupabaseConfigured && supabase) {
      try {
        this.supabaseChannel = supabase.channel('dts-live-telemetry', {
          config: { broadcast: { self: false } },
        });

        this.supabaseChannel
          .on('broadcast', { event: 'system_reset' }, () => {
            this.handleIncomingSystemReset();
          })
          .on('broadcast', { event: 'telemetry' }, (payload: any) => {
            if (payload && payload.payload) {
              this.handleIncomingTelemetry(payload.payload);
            }
          })
          .on('broadcast', { event: 'session' }, (payload: any) => {
            if (payload && payload.payload) {
              this.handleIncomingSession(payload.payload);
            }
          })
          .subscribe();
      } catch (err) {
        console.warn('Supabase Realtime subscription error:', err);
      }
    }

    // 4. Heartbeat sweep timer to prune devices that haven't responded in 45s
    this.cleanupTimer = setInterval(() => {
      this.pruneStaleDevices();
    }, 10000);
  }

  // Handle incoming telemetry event from any device
  private handleIncomingTelemetry(event: TelemetryEvent) {
    if (!event || !event.id) return;

    // Update active device registry
    const deviceId = event.deviceInfo || 'dev_' + event.teamCode + '_' + event.playerName;
    const existing = this.activeDevices.get(deviceId);
    const isDisconnectEvent = event.eventType === 'USER_LEFT' || event.eventType === 'DEVICE_OFFLINE';

    const updatedDevice: ConnectedDevice = {
      deviceId,
      playerName: event.playerName || (existing?.playerName ?? 'Unknown Investigator'),
      teamCode: event.teamCode || (existing?.teamCode ?? 'GUEST'),
      currentCaseId: event.caseId,
      currentStationId: event.stationId,
      lastActive: event.timestamp || new Date().toISOString(),
      currentScore: event.totalScore ?? (existing?.currentScore ?? 0),
      isOnline: !isDisconnectEvent,
    };

    this.activeDevices.set(deviceId, updatedDevice);

    // If player left, also update any devices matching this player name
    if (isDisconnectEvent && event.playerName) {
      const pNameLower = event.playerName.trim().toLowerCase();
      this.activeDevices.forEach((d) => {
        if (d.playerName.trim().toLowerCase() === pNameLower) {
          d.isOnline = false;
        }
      });
    }

    // Notify telemetry subscribers
    this.telemetryListeners.forEach((l) => {
      try { l(event); } catch (e) { console.error(e); }
    });

    // Notify device list subscribers
    this.notifyDeviceSubscribers();
  }

  // Handle incoming completed session record from any device
  private handleIncomingSession(session: PlayerSession) {
    if (!session || !session.player_name || !session.team_code) return;

    // Notify session listeners (e.g. Admin Dashboard)
    this.sessionListeners.forEach((l) => {
      try { l(session); } catch (e) { console.error(e); }
    });
  }

  private pruneStaleDevices() {
    const now = Date.now();
    let hasChanges = false;
    this.activeDevices.forEach((dev) => {
      const lastActiveTime = new Date(dev.lastActive).getTime();
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
      try { listener(list); } catch (e) { console.error(e); }
    });
  }

  // Register device presence & start periodic heartbeats
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

    this.activeDevices.set(deviceId, this.currentDevice);
    this.notifyDeviceSubscribers();

    // Broadcast online event across network
    this.broadcastEvent({
      eventType: 'DEVICE_ONLINE',
      playerName: params.playerName,
      teamCode: params.teamCode,
      caseId: params.caseId,
      stationId: params.stationId,
      totalScore: params.score,
    });

    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.currentDevice && this.currentDevice.isOnline) {
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

  // Mark the device and player as offline/left
  public markDeviceOffline(params?: {
    playerName?: string;
    teamCode?: string;
    caseId?: number | string;
    stationId?: number;
    score?: number;
  }) {
    if (typeof window === 'undefined') return;
    const deviceId = getOrCreateDeviceId();

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    const dev = this.activeDevices.get(deviceId) || this.currentDevice;
    if (dev) {
      dev.isOnline = false;
      dev.lastActive = new Date().toISOString();
    }
    if (this.currentDevice) {
      this.currentDevice.isOnline = false;
    }

    const pName = params?.playerName || dev?.playerName || '';
    const tCode = params?.teamCode || dev?.teamCode || '';

    if (pName) {
      // Also mark all devices of this player as offline
      const pNameLower = pName.trim().toLowerCase();
      this.activeDevices.forEach((d) => {
        if (d.playerName.trim().toLowerCase() === pNameLower) {
          d.isOnline = false;
        }
      });

      this.broadcastEvent({
        eventType: 'USER_LEFT',
        playerName: pName,
        teamCode: tCode,
        caseId: params?.caseId ?? dev?.currentCaseId ?? 0,
        stationId: params?.stationId ?? dev?.currentStationId ?? 0,
        totalScore: params?.score ?? dev?.currentScore ?? 0,
      });
    }

    this.notifyDeviceSubscribers();
  }

  // Check if a player is currently online and active within 45s
  public isPlayerOnline(playerName: string): boolean {
    if (!playerName) return false;
    const target = playerName.trim().toLowerCase();
    const now = Date.now();
    for (const dev of this.activeDevices.values()) {
      if (dev.playerName.trim().toLowerCase() === target && dev.isOnline) {
        const lastActiveTime = new Date(dev.lastActive).getTime();
        if (now - lastActiveTime <= 45000) {
          return true;
        }
      }
    }
    return false;
  }

  // Broadcast a high-speed telemetry event to ALL connected peers across the globe
  public broadcastEvent(eventData: Omit<TelemetryEvent, 'id' | 'timestamp' | 'deviceInfo'>) {
    if (typeof window === 'undefined') return;

    const deviceId = getOrCreateDeviceId();
    const fullEvent: TelemetryEvent = {
      ...eventData,
      id: 'evt_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
      timestamp: new Date().toISOString(),
      deviceInfo: deviceId,
    };

    // Update self state
    if (this.currentDevice) {
      this.currentDevice.currentCaseId = eventData.caseId;
      this.currentDevice.currentStationId = eventData.stationId;
      this.currentDevice.currentScore = eventData.totalScore;
      this.currentDevice.lastActive = fullEvent.timestamp;
      this.activeDevices.set(deviceId, this.currentDevice);
      this.notifyDeviceSubscribers();
    }

    // 1. Send via Global MQTT Cloud WebSocket Relay (EMQX)
    if (this.mqttClient && this.mqttClient.connected) {
      try {
        this.mqttClient.publish(TOPIC_TELEMETRY, JSON.stringify(fullEvent));
      } catch (err) {
        console.warn('MQTT publish error:', err);
      }
    }

    // 2. Send via local BroadcastChannel
    if (this.localBroadcastChannel) {
      try {
        this.localBroadcastChannel.postMessage({
          __dts_telemetry: true,
          event: fullEvent,
        });
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    // 3. Send via Supabase Realtime WebSocket if connected
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'telemetry',
          payload: fullEvent,
        });
      } catch {}
    }

    // 4. Trigger local self listeners
    this.telemetryListeners.forEach((l) => l(fullEvent));
  }

  // Broadcast completed player session across all devices online
  public broadcastSession(session: PlayerSession) {
    if (typeof window === 'undefined') return;

    // 1. Send via Global MQTT Cloud WebSocket Relay (EMQX)
    if (this.mqttClient && this.mqttClient.connected) {
      try {
        this.mqttClient.publish(TOPIC_SESSIONS, JSON.stringify(session));
      } catch (err) {
        console.warn('MQTT session publish error:', err);
      }
    }

    // 2. Send via local BroadcastChannel
    if (this.localBroadcastChannel) {
      try {
        this.localBroadcastChannel.postMessage({
          __dts_session: true,
          session,
        });
      } catch {}
    }

    // 3. Send via Supabase Realtime if connected
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'session',
          payload: session,
        });
      } catch {}
    }
  }

  private respondToSyncRequest() {
    try {
      const data = localStorage.getItem('dts_player_sessions');
      if (data) {
        const list: PlayerSession[] = JSON.parse(data);
        if (Array.isArray(list)) {
          list.forEach((s) => this.broadcastSession(s));
        }
      }
    } catch {}
  }

  public requestSync() {
    if (this.mqttClient && this.mqttClient.connected) {
      try {
        this.mqttClient.publish(TOPIC_SYNC, JSON.stringify({ type: 'SYNC_REQUEST' }));
      } catch {}
    }
  }

  public onTelemetry(listener: (event: TelemetryEvent) => void): () => void {
    this.telemetryListeners.add(listener);
    return () => {
      this.telemetryListeners.delete(listener);
    };
  }

  public onDevicesChange(listener: (devices: ConnectedDevice[]) => void): () => void {
    this.deviceListeners.add(listener);
    listener(Array.from(this.activeDevices.values()));
    return () => {
      this.deviceListeners.delete(listener);
    };
  }

  public onSessionUpdate(listener: (session: PlayerSession) => void): () => void {
    this.sessionListeners.add(listener);
    return () => {
      this.sessionListeners.delete(listener);
    };
  }

  // Listen to system reset and remote force logout events
  public onSystemReset(callback: () => void): () => void {
    this.systemResetListeners.add(callback);
    return () => {
      this.systemResetListeners.delete(callback);
    };
  }

  // Handle incoming system reset from Admin
  private handleIncomingSystemReset() {
    console.log('🚨 SYSTEM RESET RECEIVED - Clearing all local data and forcing logout!');
    this.activeDevices.clear();
    this.notifyDeviceSubscribers();
    this.systemResetListeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.warn('System reset listener error:', err);
      }
    });
  }

  // Admin triggers global reset to clear database and force logout all player devices
  public broadcastSystemReset() {
    this.handleIncomingSystemReset();

    // 1. MQTT
    if (this.mqttClient && this.mqttClient.connected) {
      try {
        this.mqttClient.publish(
          TOPIC_SYSTEM,
          JSON.stringify({ type: 'SYSTEM_RESET', timestamp: Date.now() }),
          { qos: 1 }
        );
      } catch (e) {
        console.warn('MQTT system reset publish error:', e);
      }
    }

    // 2. Local BroadcastChannel
    if (this.localBroadcastChannel) {
      try {
        this.localBroadcastChannel.postMessage({
          __dts_system_reset: true,
          timestamp: Date.now(),
        });
      } catch (e) {
        console.warn('BroadcastChannel system reset error:', e);
      }
    }

    // 3. Supabase Realtime Broadcast
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'system_reset',
          payload: { timestamp: Date.now() },
        });
      } catch (e) {
        console.warn('Supabase Realtime system reset error:', e);
      }
    }
  }

  // Concurrency Simulation for testing 50+ devices
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

    return () => {
      clearInterval(interval);
      simDeviceIds.forEach((id) => this.activeDevices.delete(id));
      this.notifyDeviceSubscribers();
    };
  }
}

export const multiplayerSync = new MultiplayerSyncManager();
