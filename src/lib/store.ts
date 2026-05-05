import { create } from 'zustand';

interface Settings {
  apiUrl: string;
  apiKey: string;
  adhId: string;
  channels: string[];
  shifts: Record<string, { s: string; e: string; w: number }>;
  holidays: Record<string, string>;
  autoBreak: Record<string, string[]>;
  fridayBreak: {
    normal: number;
    puasa: number;
    shiftCode: string;
  };
  puasa: { start: string; end: string }[];
  puasaShifts: Record<string, { s: string; e: string; b: number }>;
  roles: Record<string, any>;
  bizRules: {
    operatingHours: Record<string, { start: string; end: string; closed: boolean }>;
    weekendDays: number[];
    holidayClosed: boolean;
    channelShifts?: Record<string, string[]>;
  };
  activities: Record<string, { label: string; color: string; duration?: string; category?: string }>;
}

interface AppState {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  syncSettingsFromDB: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  settings: {
    apiUrl: '',
    apiKey: '',
    adhId: '',
    channels: ['Call', 'Digital Chat', 'Email', 'Leader'],
    shifts: {
      "S1": { s: "07:00", e: "16:00", w: 1 },
      "S2": { s: "15:00", e: "00:00", w: 2 },
      "H": { s: "08:00", e: "17:00", w: 3 },
    },
    holidays: {},
    autoBreak: {},
    fridayBreak: {
      normal: 90,
      puasa: 60,
      shiftCode: 'S2'
    },
    puasa: [],
    puasaShifts: {},
    roles: {
      'Admin': { isAdmin: true, canEditSchedule: true, canSeeAll: true, canSwap: true, allowedUI: ['viewInt', 'viewCal', 'viewAdh', 'viewFor', 'btnApp', 'btnBrk', 'btnSys', 'btnImp', 'btnPub'], allowedActivities: ['REMOVE'] },
      'Manager': { isAdmin: false, canEditSchedule: true, canSeeAll: true, canSwap: true, allowedUI: ['viewInt', 'viewCal', 'viewAdh', 'viewFor', 'btnApp', 'btnBrk'], allowedActivities: [] },
      'Agent': { isAdmin: false, canEditSchedule: false, canSeeAll: false, canSwap: true, allowedUI: ['viewInt', 'viewCal'], allowedActivities: [] },
    },
    bizRules: {
      operatingHours: {},
      weekendDays: [0, 6],
      holidayClosed: true,
      channelShifts: {}
    },
    activities: {
      "LB": { label: "Lunch Break", color: "bg-red-500", duration: "4", category: "break" },
      "SB": { label: "Short Break", color: "bg-amber-400", duration: "1", category: "break" },
      "MT": { label: "Meeting", color: "bg-black", duration: "2", category: "work" },
      "TR": { label: "Training", color: "bg-indigo-600", duration: "4", category: "work" },
    }
  },
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),
  syncSettingsFromDB: async () => {
    console.log("Syncing settings from DB...");
    // Mock sync for now
    return new Promise(resolve => setTimeout(resolve, 1000));
  }
}));
