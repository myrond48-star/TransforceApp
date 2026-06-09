import { create } from 'zustand';
import { fetchPortalSettings, upsertPortalSettings } from './api';

interface Settings {
  apiUrl: string;
  apiKey: string;
  adhId: string;
  channels: string[];
  shifts: Record<string, { s: string; e: string; w: number; color?: string }>;
  holidays: Record<string, string>;
  autoBreak: Record<string, string[]>;
  fridayBreak: {
    normal: number;
    short: number;
    friday: number;
    puasa?: number;
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
  shiftBarColor?: string;
}

interface AppState {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  syncSettingsFromDB: () => Promise<void>;
}

const DEFAULT_SETTINGS: Settings = {
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
    normal: 60,
    short: 15,
    friday: 90,
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
  },
  shiftBarColor: "bg-slate-200/70"
};

const getInitialSettings = (): Settings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem('portal_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      const merged = { ...DEFAULT_SETTINGS, ...parsed };
      if (parsed.fridayBreak) {
        merged.fridayBreak = { ...DEFAULT_SETTINGS.fridayBreak, ...parsed.fridayBreak };
      }
      return merged;
    }
  } catch (e) {
    console.warn("Failed to load settings from localStorage:", e);
  }
  return DEFAULT_SETTINGS;
};

export const useAppStore = create<AppState>((set) => ({
  settings: getInitialSettings(),
  updateSettings: (newSettings) => set((state) => {
    const updatedSettings = { ...state.settings, ...newSettings };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('portal_settings', JSON.stringify(updatedSettings));
      } catch (e) {
        console.warn("Failed to save settings to localStorage:", e);
      }
    }
    // Persist to Supabase in the background
    upsertPortalSettings(updatedSettings).catch((err) => {
      console.warn("Asynchronous settings saving to Supabase failed:", err?.message || err);
    });
    return { settings: updatedSettings };
  }),
  syncSettingsFromDB: async () => {
    console.log("Syncing settings from DB...");
    try {
      const dbSettings = await fetchPortalSettings();
      if (dbSettings && typeof dbSettings === 'object') {
        set((state) => {
          const merged = { ...state.settings, ...dbSettings };
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('portal_settings', JSON.stringify(merged));
            } catch (e) {
              console.warn("localStorage save failed during sync:", e);
            }
          }
          return { settings: merged };
        });
        console.log("Settings successfully synced from Supabase.");
      } else {
        console.log("No settings found in Supabase. Using local settings.");
      }
    } catch (err) {
      console.error("Error setting sync from DB:", err);
    }
  }
}));
