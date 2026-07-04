export interface Device {
  id: string;
  name: string;
  hourlyRate: number;
  extraControllerRate: number;
  maxPlayers: number;
}

export interface Session {
  id: string;
  deviceId: string;
  customerNote: string;
  players: number;
  startTime: number;
  isOpen: boolean;
  scheduledEndTime?: number;
  actualEndTime?: number;
  status: 'active' | 'closed';
  hourlyRate: number;
  extraControllerRate: number;
}

export interface Settings {
  yellowWarningMinutes: number;
  redWarningMinutes: number;
}

export type DeviceStatus = 'available' | 'active' | 'warning' | 'danger' | 'expired';
