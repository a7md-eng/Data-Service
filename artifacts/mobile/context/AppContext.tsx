import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { Device, Session, Settings } from '@/types';

interface AppContextType {
  devices: Device[];
  sessions: Session[];
  settings: Settings;
  tick: number;
  addDevice: (device: Omit<Device, 'id'>) => Promise<void>;
  updateDevice: (device: Device) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  addSession: (session: Omit<Session, 'id' | 'status'>) => Promise<void>;
  closeSession: (sessionId: string, actualEndTime: number) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  getActiveSession: (deviceId: string) => Session | undefined;
  updateSettings: (settings: Settings) => Promise<void>;
  calcEffectiveRate: (players: number, hourlyRate: number, extraControllerRate: number) => number;
  calcCost: (durationMs: number, players: number, hourlyRate: number, extraControllerRate: number) => number;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  DEVICES: 'ps4_devices',
  SESSIONS: 'ps4_sessions',
  SETTINGS: 'ps4_settings',
};

const DEFAULT_SETTINGS: Settings = {
  yellowWarningMinutes: 15,
  redWarningMinutes: 5,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [tick, setTick] = useState(0);
  const alertedSessions = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const activeSessions = sessions.filter(s => s.status === 'active' && !s.isOpen && s.scheduledEndTime);
    const now = Date.now();
    for (const session of activeSessions) {
      if (!session.scheduledEndTime) continue;
      const remaining = session.scheduledEndTime - now;
      if (remaining <= 0 && !alertedSessions.current.has(session.id)) {
        alertedSessions.current.add(session.id);
        const device = devices.find(d => d.id === session.deviceId);
        Alert.alert(
          '⏰ انتهى وقت الجلسة',
          `انتهى وقت جلسة "${session.customerNote}" على ${device?.name ?? 'الجهاز'}`,
          [{ text: 'حسناً', style: 'default' }]
        );
      }
    }
  }, [tick, sessions, devices]);

  async function loadData() {
    try {
      const [devicesRaw, sessionsRaw, settingsRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.DEVICES),
        AsyncStorage.getItem(STORAGE_KEYS.SESSIONS),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      ]);
      if (devicesRaw) setDevices(JSON.parse(devicesRaw));
      if (sessionsRaw) setSessions(JSON.parse(sessionsRaw));
      if (settingsRaw) setSettings(JSON.parse(settingsRaw));
    } catch (e) {
      console.error('Error loading data:', e);
    }
  }

  async function saveDevices(newDevices: Device[]) {
    setDevices(newDevices);
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(newDevices));
  }

  async function saveSessions(newSessions: Session[]) {
    setSessions(newSessions);
    await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(newSessions));
  }

  const addDevice = useCallback(async (device: Omit<Device, 'id'>) => {
    const newDevice: Device = {
      ...device,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    };
    await saveDevices([...devices, newDevice]);
  }, [devices]);

  const updateDevice = useCallback(async (device: Device) => {
    await saveDevices(devices.map(d => d.id === device.id ? device : d));
  }, [devices]);

  const deleteDevice = useCallback(async (id: string) => {
    await saveDevices(devices.filter(d => d.id !== id));
    const remaining = sessions.filter(s => s.deviceId !== id);
    await saveSessions(remaining);
  }, [devices, sessions]);

  const addSession = useCallback(async (session: Omit<Session, 'id' | 'status'>) => {
    const newSession: Session = {
      ...session,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      status: 'active',
    };
    await saveSessions([...sessions, newSession]);
  }, [sessions]);

  const closeSession = useCallback(async (sessionId: string, actualEndTime: number) => {
    await saveSessions(sessions.map(s =>
      s.id === sessionId
        ? { ...s, status: 'closed', actualEndTime }
        : s
    ));
  }, [sessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    await saveSessions(sessions.filter(s => s.id !== sessionId));
  }, [sessions]);

  const getActiveSession = useCallback((deviceId: string) => {
    return sessions.find(s => s.deviceId === deviceId && s.status === 'active');
  }, [sessions]);

  const updateSettings = useCallback(async (newSettings: Settings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  }, []);

  const calcEffectiveRate = useCallback((players: number, hourlyRate: number, extraControllerRate: number) => {
    const extra = Math.max(0, players - 2);
    return hourlyRate + extra * extraControllerRate;
  }, []);

  const calcCost = useCallback((durationMs: number, players: number, hourlyRate: number, extraControllerRate: number) => {
    const hours = durationMs / (1000 * 60 * 60);
    const effectiveRate = calcEffectiveRate(players, hourlyRate, extraControllerRate);
    return Math.ceil(hours * effectiveRate);
  }, [calcEffectiveRate]);

  return (
    <AppContext.Provider value={{
      devices, sessions, settings, tick,
      addDevice, updateDevice, deleteDevice,
      addSession, closeSession, deleteSession,
      getActiveSession, updateSettings,
      calcEffectiveRate, calcCost,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
