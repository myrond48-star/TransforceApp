import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { format } from 'date-fns';
import { checkConnection, updateDbConfig, fetchMasterShifts, upsertMasterShifts, fetchUniqueProjects, fetchUniqueChannelsForProject } from '../lib/api';
import { 
  Settings as SettingsIcon, 
  Database, 
  Clock, 
  Users, 
  Calendar, 
  Plus, 
  Trash2, 
  Save, 
  X,
  ShieldCheck,
  Globe,
  Utensils,
  Zap,
  ArrowLeftRight,
  AlertCircle,
  Briefcase,
  Moon,
  Sun,
  RefreshCw,
  Layout,
  HardDrive,
  FileCheck,
  Wifi,
  Palette,
  Lock
} from 'lucide-react';

interface SettingsProps {
  initialModule?: string;
  initialTab?: string;
  hideModuleSwitcher?: boolean;
}

const SHIFT_DEFAULTS: Record<string, { s: string; e: string; w: number }> = {
  P1: { s: "06:00", e: "15:00", w: 1 },
  P2: { s: "07:00", e: "16:00", w: 2 },
  P3: { s: "08:00", e: "17:00", w: 3 },
  P4: { s: "09:00", e: "18:00", w: 4 },
  P9: { s: "10:00", e: "19:00", w: 5 },
  S1: { s: "11:00", e: "20:00", w: 6 },
  S2: { s: "12:00", e: "21:00", w: 7 },
  S3: { s: "12:30", e: "21:30", w: 8 },
  S4: { s: "13:00", e: "22:00", w: 9 },
  S6: { s: "14:00", e: "23:00", w: 10 },
  S7: { s: "15:00", e: "00:00", w: 11 },
  S5: { s: "16:00", e: "01:00", w: 12 },
  M3: { s: "21:00", e: "06:00", w: 13 },
  M1: { s: "22:00", e: "07:00", w: 14 }
};

const SHIFT_COLORS_OPTIONS = [
  { value: "bg-slate-500", label: "Slate" },
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-indigo-500", label: "Indigo" },
  { value: "bg-emerald-500", label: "Emerald" },
  { value: "bg-green-500", label: "Green" },
  { value: "bg-amber-500", label: "Amber" },
  { value: "bg-orange-500", label: "Orange" },
  { value: "bg-purple-500", label: "Purple" },
  { value: "bg-rose-500", label: "Rose" },
  { value: "bg-teal-500", label: "Teal" },
  { value: "bg-cyan-500", label: "Cyan" },
  { value: "bg-pink-500", label: "Pink" },
];

const DEFAULT_PROJECT_CHANNELS: Record<string, string[]> = {
  "Project Alpha": ["Voice", "Email", "Leader"],
  "Project Beta": ["Voice", "Non-Voice", "Chat"],
  "Customer Care": ["Chat", "Email", "Digital"],
  "Technical Support": ["Voice", "Chat", "Email"],
  "VIP Concierge": ["Digital", "Call", "Email"],
};

export const Settings: React.FC<SettingsProps> = ({ initialModule, initialTab, hideModuleSwitcher }) => {
  const { settings, updateSettings, syncSettingsFromDB } = useAppStore();
  const [activeModule, setActiveModule] = useState(initialModule || 'workforce');
  const [activeTab, setActiveTab] = useState(initialTab || 'shift');
  
  // Update state if props change (for deep linking from App)
  useEffect(() => {
    if (initialModule) setActiveModule(initialModule);
    if (initialTab) setActiveTab(initialTab);
  }, [initialModule, initialTab]);
  
  // Refined module switcher logic to handle tab resets correctly
  const handleModuleSwitch = (moduleId: string) => {
    setActiveModule(moduleId);
    if (moduleId === 'workforce') {
      setActiveTab('shift');
    } else {
      // For modules without specific tabs, we reset to a safe default
      // but it doesn't matter much as they don't check activeTab for rendering content
      setActiveTab('none'); 
    }
  };
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  const [sessionRole, setSessionRole] = useState<"Admin" | "Manager" | "Agent" | string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('portal_active_session_role');
      if (saved) return saved;
    }
    return "Admin";
  });

  interface RegisteredShift {
    code: string;
    s: string;
    e: string;
  }

  // Registered Shift Codes for consistent registry
  const [registeredShiftCodes, setRegisteredShiftCodes] = useState<RegisteredShift[]>(() => {
    if (typeof window !== 'undefined') {
      const savedV2 = localStorage.getItem('portal_registered_shift_codes_v2');
      if (savedV2) {
        try {
          return JSON.parse(savedV2);
        } catch (e) {
          console.warn("Failed to parse registered shift codes v2:", e);
        }
      }
      
      const oldSaved = localStorage.getItem('portal_registered_shift_codes');
      if (oldSaved) {
        try {
          const oldList = JSON.parse(oldSaved);
          if (Array.isArray(oldList)) {
            return oldList.map((item: any) => {
              if (item && typeof item === 'object' && item.code) {
                return { code: item.code, s: item.s || "08:00", e: item.e || "17:00" };
              }
              const codeStr = String(item).toUpperCase();
              const def = SHIFT_DEFAULTS[codeStr] || { s: '08:00', e: '17:00' };
              return { code: codeStr, s: def.s, e: def.e };
            });
          }
        } catch (e) {
          console.warn("Failed to parse old registered shift codes:", e);
        }
      }
    }
    return [
      { code: "P1", s: "06:00", e: "15:00" },
      { code: "P2", s: "07:00", e: "16:00" },
      { code: "P3", s: "08:00", e: "17:00" },
      { code: "P4", s: "09:00", e: "18:00" },
      { code: "P9", s: "10:00", e: "19:00" },
      { code: "S1", s: "11:00", e: "20:00" },
      { code: "S2", s: "12:00", e: "21:00" },
      { code: "S3", s: "12:30", e: "21:30" },
      { code: "S4", s: "13:00", e: "22:00" },
      { code: "S5", s: "16:00", e: "01:00" },
      { code: "S6", s: "14:00", e: "23:00" },
      { code: "S7", s: "15:00", e: "00:00" },
      { code: "M3", s: "21:00", e: "06:00" },
      { code: "M1", s: "22:00", e: "07:00" }
    ];
  });

  const saveRegisteredShiftCodes = (newCodes: RegisteredShift[]) => {
    setRegisteredShiftCodes(newCodes);
    if (typeof window !== 'undefined') {
      localStorage.setItem('portal_registered_shift_codes_v2', JSON.stringify(newCodes));
      localStorage.setItem('portal_registered_shift_codes', JSON.stringify(newCodes.map(x => x.code)));
    }
  };

  // API State
  const [url, setUrl] = useState(settings.apiUrl);
  const [key, setKey] = useState(settings.apiKey);
  const [channels, setChannels] = useState(settings.channels.join(', '));

  // Shift State
  const [shifts, setShifts] = useState(Object.entries(settings.shifts).map(([k, v]) => ({ code: k, ...(v as any) })));
  const [selectedShiftProject, setSelectedShiftProject] = useState("Project Alpha");
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [PROJECTS, setPROJECTS] = useState<string[]>(["Project Alpha", "Project Beta", "Customer Care", "Technical Support", "VIP Concierge"]);

  // Fetch unique project list dynamically on mount
  React.useEffect(() => {
    const fetchProjList = async () => {
      try {
        const pList = await fetchUniqueProjects();
        if (pList && pList.length > 0) {
          setPROJECTS(pList);
          // Auto select first dynamic project if current one is not in database pool
          if (!pList.includes(selectedShiftProject)) {
            setSelectedShiftProject(pList[0]);
          }
          if (!pList.includes(selectedBreakProject)) {
            setSelectedBreakProject(pList[0]);
          }
          if (!pList.includes(selectedFastingProject)) {
            setSelectedFastingProject(pList[0]);
          }
          if (!pList.includes(selectedOpsProject)) {
            setSelectedOpsProject(pList[0]);
          }
          if (!pList.includes(selectedActivityProject)) {
            setSelectedActivityProject(pList[0]);
          }
        }
      } catch (err) {
        console.warn("Could not load database project list, using defaults.", err);
      }
    };
    fetchProjList();
  }, []);

  // Fetch shifts for selected project
  React.useEffect(() => {
    let active = true;
    if (activeTab === 'shift') {
      const loadShifts = async () => {
        setIsLoadingShifts(true);
        try {
          const fetched = await fetchMasterShifts(selectedShiftProject);
          if (active) {
            if (fetched && fetched.length > 0) {
              const mapped = fetched.map((s: any) => ({
                code: s.code,
                s: s.start_time,
                e: s.end_time,
                w: s.weight || 1,
                color: settings.shifts?.[s.code]?.color || '',
                crosses_day: (settings.shifts?.[s.code] as any)?.crosses_day || false
              }));
              setShifts(mapped);
            } else {
              // Fallback default shifts depending on project
              const defaultShifts = Object.entries(settings.shifts).map(([k, v]) => ({
                code: k,
                ...(v as any),
                crosses_day: (v as any).crosses_day || false
              }));
              setShifts(defaultShifts);
            }
          }
        } catch (error) {
          console.error("Failed to load project master shifts from Supabase:", error);
        } finally {
          if (active) setIsLoadingShifts(false);
        }
      };
      loadShifts();
    }
    return () => {
      active = false;
    };
  }, [activeTab, selectedShiftProject]);

  // Holiday State Helpers
  const parseHolidayValue = (v: any): { desc: string; type: 'public' | 'cuti' } => {
    if (!v) return { desc: '', type: 'public' };
    if (typeof v === 'object' && v !== null) {
      return {
        desc: v.desc || '',
        type: v.type === 'cuti' ? 'cuti' : 'public'
      };
    }
    const str = String(v);
    if (str.startsWith('{') && str.endsWith('}')) {
      try {
        const parsed = JSON.parse(str);
        return {
          desc: parsed.desc || '',
          type: parsed.type === 'cuti' ? 'cuti' : 'public'
        };
      } catch (_) {}
    }
    if (str.startsWith('CUTI:')) {
      return { desc: str.slice(5), type: 'cuti' };
    }
    if (str.startsWith('PUBLIC:')) {
      return { desc: str.slice(7), type: 'public' };
    }
    if (str.toLowerCase().includes('cuti bersama') || str.toLowerCase().includes('cuti')) {
      return { desc: str, type: 'cuti' };
    }
    return { desc: str, type: 'public' };
  };

  const [holidays, setHolidays] = useState(() => {
    return Object.entries(settings.holidays || {}).map(([k, v]) => {
      const parsed = parseHolidayValue(v);
      return { date: k, desc: parsed.desc, type: parsed.type };
    });
  });
  const [newHolDate, setNewHolDate] = useState('');
  const [newHolDesc, setNewHolDesc] = useState('');
  const [newHolType, setNewHolType] = useState<'public' | 'cuti'>('public');
  const [showBulkHol, setShowBulkHol] = useState(false);
  const [bulkHolText, setBulkHolText] = useState('');

  // Auto Break State
  const [selectedBreakProject, setSelectedBreakProject] = useState("Project Alpha");
  const [isLoadingBreakShifts, setIsLoadingBreakShifts] = useState(false);
  const [breakShifts, setBreakShifts] = useState<{code: string; s: string; e: string; w: number}[]>(() =>
    Object.entries(settings.shifts).map(([k, v]) => ({ code: k, ...(v as any) }))
  );

  const [autoBreakStrings, setAutoBreakStrings] = useState<Record<string, string>>(() => {
    const res: Record<string, string> = {};
    Object.keys(settings.shifts).forEach(code => {
      res[code] = (settings.autoBreak[code] || []).join(', ');
    });
    return res;
  });
  const [fridayBreak, setFridayBreak] = useState(settings.fridayBreak);

  // Fetch shifts for selected break project dynamically when project or activeTab matches autobreak
  React.useEffect(() => {
    let active = true;
    if (activeTab === 'autobreak') {
      const loadBreakShifts = async () => {
        setIsLoadingBreakShifts(true);
        try {
          const fetched = await fetchMasterShifts(selectedBreakProject);
          if (active) {
            if (fetched && fetched.length > 0) {
              const mapped = fetched.map((s: any) => ({
                code: s.code,
                s: s.start_time,
                e: s.end_time,
                w: s.weight || 1
              }));
              setBreakShifts(mapped);
              
              // Ensure autoBreakStrings has these keys in state so typing in them works
              setAutoBreakStrings(prev => {
                const updated = { ...prev };
                mapped.forEach((s: any) => {
                  if (updated[s.code] === undefined) {
                    updated[s.code] = (settings.autoBreak[s.code] || []).join(', ');
                  }
                });
                return updated;
              });
            } else {
              // Fallback default shifts depending on project
              const defaultShifts = Object.entries(settings.shifts).map(([k, v]) => ({ code: k, ...(v as any) }));
              setBreakShifts(defaultShifts);
            }
          }
        } catch (error) {
          console.error("Failed to load project master shifts from Supabase for break:", error);
          if (active) {
            const defaultShifts = Object.entries(settings.shifts).map(([k, v]) => ({ code: k, ...(v as any) }));
            setBreakShifts(defaultShifts);
          }
        } finally {
          if (active) setIsLoadingBreakShifts(false);
        }
      };
      loadBreakShifts();
    }
    return () => {
      active = false;
    };
  }, [activeTab, selectedBreakProject]);

  // Ops Hour (Biz) Project Channels State
  const [selectedOpsProject, setSelectedOpsProject] = useState("Project Alpha");
  const [isLoadingOpsChannels, setIsLoadingOpsChannels] = useState(false);
  const [opsChannels, setOpsChannels] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    
    if (activeTab === 'biz') {
      const loadProjectChannels = async () => {
        setIsLoadingOpsChannels(true);
        try {
          const fetchedChannels = await fetchUniqueChannelsForProject(selectedOpsProject);
          if (active) {
            setOpsChannels(fetchedChannels || []);
          }
        } catch (error) {
          console.error("Failed to load project unique channels: ", error);
          if (active) {
            setOpsChannels([]);
          }
        } finally {
          if (active) {
            setIsLoadingOpsChannels(false);
          }
        }
      };
      loadProjectChannels();
    } else {
      setOpsChannels([]);
    }
    return () => {
      active = false;
    };
  }, [activeTab, selectedOpsProject]);

  // Puasa State
  const [selectedFastingProject, setSelectedFastingProject] = useState("Project Alpha");
  const [isLoadingFastingShifts, setIsLoadingFastingShifts] = useState(false);
  const [fastingProjectShifts, setFastingProjectShifts] = useState<{code: string; s: string; e: string; w: number}[]>(() =>
    Object.entries(settings.shifts).map(([k, v]) => ({ code: k, ...(v as any) }))
  );
  const [autoReduceMinutes, setAutoReduceMinutes] = useState(60);
  const [autoReduceBreakMinutes, setAutoReduceBreakMinutes] = useState(30);

  const [puasa, setPuasa] = useState(settings.puasa);
  const [puasaShifts, setPuasaShifts] = useState(settings.puasaShifts);
  const [newPuasaStart, setNewPuasaStart] = useState('');
  const [newPuasaEnd, setNewPuasaEnd] = useState('');

  // Subtract minutes utility for automatic duration calculation
  const subtractMinutesFromTime = (timeStr: string, mins: number): string => {
    if (!timeStr || !timeStr.includes(':')) return timeStr;
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return timeStr;
    
    let totalMins = h * 60 + m - mins;
    if (totalMins < 0) {
      totalMins += 24 * 60; // wrap around day
    }
    const newH = Math.floor(totalMins / 60) % 24;
    const newM = totalMins % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  };

  // Auto applies fasting schedules by reducing daily shift duration and break duration
  const handleAutoApplyFastingRules = () => {
    const updatedPuasaShifts = { ...puasaShifts };
    fastingProjectShifts.forEach(s => {
      // Start time remains unchanged
      const fastingStart = s.s;
      // End time is cut by autoReduceMinutes (automatic work hour discount)
      const fastingEnd = subtractMinutesFromTime(s.e, autoReduceMinutes);
      // Break is set to autoReduceBreakMinutes 
      updatedPuasaShifts[s.code] = {
        s: fastingStart,
        e: fastingEnd,
        b: autoReduceBreakMinutes
      };
    });
    setPuasaShifts(updatedPuasaShifts);
    showStatus("Fasting work hours & break times computed automatically! Please click 'Update Sync' to save.");
  };

  // Fetch shifts for selected fasting project dynamically when activeTab is puasa or selectedFastingProject changes
  React.useEffect(() => {
    let active = true;
    if (activeTab === 'puasa') {
      const loadFastingShifts = async () => {
        setIsLoadingFastingShifts(true);
        try {
          const fetched = await fetchMasterShifts(selectedFastingProject);
          if (active) {
            if (fetched && fetched.length > 0) {
              const mapped = fetched.map((s: any) => ({
                code: s.code,
                s: s.start_time,
                e: s.end_time,
                w: s.weight || 1
              }));
              setFastingProjectShifts(mapped);
            } else {
              // Fallback
              const defaultShifts = Object.entries(settings.shifts).map(([k, v]) => ({ code: k, ...(v as any) }));
              setFastingProjectShifts(defaultShifts);
            }
          }
        } catch (error) {
          console.error("Failed to load project master shifts for fasting page:", error);
          if (active) {
            const defaultShifts = Object.entries(settings.shifts).map(([k, v]) => ({ code: k, ...(v as any) }));
            setFastingProjectShifts(defaultShifts);
          }
        } finally {
          if (active) setIsLoadingFastingShifts(false);
        }
      };
      loadFastingShifts();
    }
    return () => {
      active = false;
    };
  }, [activeTab, selectedFastingProject]);

  // Roles State
  const [roles, setRoles] = useState(settings.roles);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<string>('Admin');
  const [newRoleName, setNewRoleName] = useState('');
  const [newActivityTag, setNewActivityTag] = useState('');

  // Activities State
  const [selectedActivityProject, setSelectedActivityProject] = useState("Project Alpha");
  const [shiftBarColor, setShiftBarColor] = useState(settings.shiftBarColor || "bg-slate-200/70");
  const [newActivityCode, setNewActivityCode] = useState('');
  const [newActivityLabel, setNewActivityLabel] = useState('');
  const [newActivityDuration, setNewActivityDuration] = useState('2'); // 30 mins
  const [newActivityColor, setNewActivityColor] = useState('bg-rose-500');
  const [newActivityCategory, setNewActivityCategory] = useState('work'); // 'work' or 'break'

  const [activities, setActivities] = useState<Record<string, Record<string, { label: string; color: string; duration?: string; category?: string }>>>(() => {
    const raw = settings.activities || {};
    const testProjects = ["Project Alpha", "Project Beta", "Customer Care", "Technical Support", "VIP Concierge"];
    const initial: Record<string, any> = {};
    testProjects.forEach(proj => {
      const projRaw = raw[proj] || {};
      initial[proj] = {
        "LB": { label: projRaw["LB"]?.label || "Lunch Break", color: projRaw["LB"]?.color || "bg-active-red", duration: projRaw["LB"]?.duration || "4", category: "break" },
        "SB": { label: projRaw["SB"]?.label || "Short Break", color: projRaw["SB"]?.color || "bg-amber-400", duration: projRaw["SB"]?.duration || "1", category: "break" },
        "MT": { label: projRaw["MT"]?.label || "Meeting", color: projRaw["MT"]?.color || "bg-black", duration: projRaw["MT"]?.duration || "2", category: "work" },
        "TR": { label: projRaw["TR"]?.label || "Training", color: projRaw["TR"]?.color || "bg-indigo-600", duration: projRaw["TR"]?.duration || "4", category: "work" },
      };
    });
    return initial;
  });

  // SQL Infrastructure State (Now Supabase)
  const [supabaseConfig, setSupabaseConfig] = useState(() => {
    const savedUrl = typeof window !== 'undefined' ? localStorage.getItem('supabase_url') : null;
    const savedKey = typeof window !== 'undefined' ? localStorage.getItem('supabase_key') : null;
    
    return {
      url: savedUrl || (import.meta.env.VITE_SUPABASE_URL as string) || '',
      anonKey: savedKey || (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '',
      status: 'Cloud Backend'
    };
  });

  // Business Rules State
  const [bizRules, setBizRules] = useState(settings.bizRules);

  // HC Management State (Placeholders)
  const [employeeTypes, setEmployeeTypes] = useState(['Permanent', 'Probation', 'Contract', 'Outsource']);
  const [departments, setDepartments] = useState(['Operations', 'IT', 'Finance', 'HR', 'Facility']);

  // ID Security State (Placeholders)
  const [idPrefixes, setIdPrefixes] = useState({ LDAP: 'TCM_', SAP: 'P_', EMAIL: 'corp_' });
  const [approvalFlows, setApprovalFlows] = useState(['Standard', 'Escalated', 'VIP']);

  // Analytics State (Placeholders)
  const [kpiTargets, setKpiTargets] = useState({ ServiceLevel: 85, Occupancy: 80, AHT: 280 });

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{ status: string; connected?: boolean; service?: string; error?: string } | null>(null);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbUrlInput, setDbUrlInput] = useState('');
  const [isSavingDb, setIsSavingDb] = useState(false);

  // PostgreSQL Automatic Table Provisioner State
  const [postgresConnectionString, setPostgresConnectionString] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('postgres_connection_string') || '';
    }
    return '';
  });
  const [isInitializingTables, setIsInitializingTables] = useState(false);
  const [initResult, setInitResult] = useState<{ status: 'idle' | 'success' | 'error'; message?: string }>({ status: 'idle' });

  const handleInitializeTables = async () => {
    if (!postgresConnectionString.trim()) {
      alert("Please enter the PostgreSQL Connection URI (DATABASE_URL) first!");
      return;
    }
    
    setIsInitializingTables(true);
    setInitResult({ status: 'idle' });
    showStatus("Connecting to PostgreSQL & Creating tables... ⏳");

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('postgres_connection_string', postgresConnectionString.trim());
      }

      const response = await fetch("/api/db/initialize-tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ connectionString: postgresConnectionString.trim() })
      });

      const resData = await response.json();
      if (resData.status === "success") {
        setInitResult({ status: 'success', message: resData.message });
        showStatus("Tables successfully created in Supabase! 🎉");
        alert(resData.message);
      } else {
        setInitResult({ status: 'error', message: resData.error });
        showStatus("Failed to initialize tables ❌");
        alert("Failed to initialize tables: " + resData.error);
      }
    } catch (err: any) {
      console.error(err);
      setInitResult({ status: 'error', message: err.message || "Failed to contact setup API" });
      showStatus("Connection failed ❌");
      alert("Error: " + (err.message || "Failed to contact backend API"));
    } finally {
      setIsInitializingTables(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingDb(true);
    setDbStatus(null);
    try {
      // Sanitize URL before testing
      let cleanUrl = supabaseConfig.url.trim();
      if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
      if (cleanUrl.endsWith('/rest/v1')) cleanUrl = cleanUrl.slice(0, -8);

      const result = await checkConnection(cleanUrl, supabaseConfig.anonKey);
      setDbStatus(result);
      if (result.status === 'ok' && result.service) {
        showStatus(`Connection complete: ${result.service} active! ✅`);
      } else if (result.status === 'ok' && !result.service) {
        showStatus("Service reachable, but configuration check failed ⚠️");
      } else {
        showStatus("Connection test failed ❌");
      }
    } catch (err) {
      setDbStatus({ status: 'error', error: 'Failed to reach backend' });
    } finally {
      setIsTestingDb(false);
    }
  };

  const handleSaveDbUrl = async () => {
    if (isSavingDb) return;
    setIsSavingDb(true);
    setSaveStatus("Initializing infrastructure sync...");
    
    try {
      // 1. Sanitize the inputs
      const cleanUrl = supabaseConfig.url.trim().split('/rest/v1')[0].replace(/\/$/, "");
      const cleanKey = supabaseConfig.anonKey.trim();

      if (!cleanUrl.startsWith('http')) {
        throw new Error("Invalid URL: Must start with http:// or https://");
      }

      console.log("Saving new configuration:", { url: cleanUrl });
      
      // 2. Perform the update - this writes to localStorage and swaps the active client instance
      await updateDbConfig(cleanUrl, cleanKey);
      
      // 3. Update local state to reflect cleaned values
      setSupabaseConfig(prev => ({ ...prev, url: cleanUrl, anonKey: cleanKey }));
      
      showStatus("Configuration committed! Synchronizing nodes... ✅");
      
      // No reload needed; the Supabase client replaces itself in memory
      setIsSavingDb(false);
      setSaveStatus(null);
      
    } catch (err: any) {
      console.error("Save error:", err);
      alert("Failed to commit infrastructure: " + err.message);
      setIsSavingDb(false);
    }
  };

  // Sync back local state if global settings change (e.g. from Cloud Sync)
  React.useEffect(() => {
    setUrl(settings.apiUrl);
    setKey(settings.apiKey);
    setChannels(settings.channels.join(', '));
    setShifts(Object.entries(settings.shifts).map(([k, v]) => ({ code: k, ...(v as any) })));
    setHolidays(Object.entries(settings.holidays || {}).map(([k, v]) => {
      const parsed = parseHolidayValue(v);
      return { date: k, desc: parsed.desc, type: parsed.type };
    }));
    setFridayBreak(settings.fridayBreak);
    setPuasa(settings.puasa);
    setPuasaShifts(settings.puasaShifts);
    setRoles(settings.roles);
    setBizRules(settings.bizRules);
    
    const rawActs = settings.activities || {};
    const hasProjectKeys = Object.keys(rawActs).some(key => PROJECTS.includes(key));
    if (!hasProjectKeys) {
      const nested: Record<string, any> = {};
      PROJECTS.forEach(proj => {
        nested[proj] = JSON.parse(JSON.stringify(rawActs));
      });
      setActivities(nested);
    } else {
      const parsed: Record<string, any> = {};
      PROJECTS.forEach(proj => {
        parsed[proj] = rawActs[proj] || {
          "LB": { label: "Lunch Break", color: "bg-rose-500", duration: "4", category: "break" },
          "SB": { label: "Short Break", color: "bg-amber-400", duration: "1", category: "break" },
          "MT": { label: "Meeting", color: "bg-slate-950", duration: "2", category: "work" },
          "TR": { label: "Training", color: "bg-indigo-600", duration: "4", category: "work" },
        };
      });
      setActivities(parsed);
    }
    
    // Auto break strings need special handling
    const res: Record<string, string> = {};
    Object.keys(settings.shifts).forEach(code => {
      res[code] = (settings.autoBreak[code] || []).join(', ');
    });
    setAutoBreakStrings(res);

    // Robustly re-sync Supabase configuration from localStorage on refresh or setting sync
    if (typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem('supabase_url');
      const savedKey = localStorage.getItem('supabase_key');
      if (savedUrl || savedKey) {
        setSupabaseConfig(prev => ({
          ...prev,
          url: savedUrl || prev.url,
          anonKey: savedKey || prev.anonKey
        }));
      }
    }
  }, [settings, PROJECTS]);

  const showStatus = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleRefreshFromCloud = async () => {
    setIsSyncing(true);
    await syncSettingsFromDB();
    setIsSyncing(false);
    showStatus("Settings refreshed from Cloud! ☁️");
  };

  const handlePushToCloud = async () => {
    setIsPushing(true);
    try {
      updateSettings({
        apiUrl: url,
        apiKey: key,
        channels: channels.split(',').map(c => c.trim()).filter(Boolean),
        shifts: shifts.reduce((acc: any, s: any) => {
          if (s.code) acc[s.code] = { s: s.s, e: s.e, w: s.w };
          return acc;
        }, {}),
        holidays: holidays.reduce((acc: any, h: any) => {
          if (h.date) acc[h.date] = h.desc;
          return acc;
        }, {}),
        fridayBreak,
        puasa,
        puasaShifts,
        roles,
        bizRules,
        activities
      });
      showStatus("All settings pushed to Cloud! 🚀");
    } catch (err) {
      console.error("Manual push failed:", err);
    }
    setIsPushing(false);
  };

  const normalizeTime = (t: string) => {
    if (!t) return '';
    let clean = t.replace('.', ':').replace(' ', '').trim();
    if (!clean.includes(':')) {
      const num = parseInt(clean);
      if (!isNaN(num)) return num.toString().padStart(2, '0') + ':00';
      return '';
    }
    const parts = clean.split(':');
    const h = Math.min(23, Math.max(0, parseInt(parts[0]) || 0));
    const m = Math.min(59, Math.max(0, parseInt(parts[1]) || 0));
    return h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0');
  };

  const handleSaveApi = () => {
    updateSettings({ 
      apiUrl: url, 
      apiKey: key,
      channels: channels.split(',').map(c => c.trim()).filter(Boolean)
    });
    showStatus("API Settings saved successfully! ✅");
  };

  const handleSaveShifts = async () => {
    setIsPushing(true);
    const newShifts: any = {};
    const shiftsToUpload: any[] = [];
    
    shifts.forEach(s => {
      if (s.code) {
        const start = normalizeTime(s.s);
        const end = normalizeTime(s.e);
        if (start && end) {
          newShifts[s.code] = { s: start, e: end, w: s.w, color: s.color, crosses_day: !!s.crosses_day };
          shiftsToUpload.push({
            code: s.code,
            s: start,
            e: end,
            w: s.w
          });
        }
      }
    });

    try {
      // 1. Update local settings
      updateSettings({ shifts: newShifts, bizRules });

      // 2. Save directly to Supabase master_shifts table for the selected project
      await upsertMasterShifts(selectedShiftProject, shiftsToUpload);
      
      showStatus(`Shifts for project "${selectedShiftProject}" saved successfully to Supabase! ✅`);
    } catch (err: any) {
      console.error("Failed to save shifts to Supabase:", err);
      showStatus(`Saved locally. Supabase error: ${err.message || 'Check database connection'} ⚠️`);
    } finally {
      setIsPushing(false);
    }
  };

  const handleSaveRoles = () => {
    updateSettings({ roles });
    showStatus("Roles Settings saved successfully! ✅");
  };

  const handleSaveActivities = () => {
    updateSettings({ activities, shiftBarColor });
    showStatus("Activity Settings saved successfully! ✅");
  };

  const handleSaveHolidays = () => {
    const newHolidays: any = {};
    holidays.forEach(h => {
      if (h.date && h.desc) {
        newHolidays[h.date] = { desc: h.desc, type: h.type || 'public' };
      }
    });
    updateSettings({ holidays: newHolidays });
    showStatus("Holiday Settings saved successfully! ✅");
  };

  const handleBulkImportHolidays = () => {
    const lines = bulkHolText.split('\n').filter(l => l.trim());
    const newItems = lines.map(line => {
      const parts = line.split(/[;\t]/);
      const fallbackParts = line.includes(',') ? line.split(',') : parts;
      const finalParts = parts.length >= 2 ? parts : fallbackParts;

      if (finalParts.length >= 2) {
        const dateStr = finalParts[0].trim().replace(/\//g, '-');
        const descStr = finalParts[1].trim();
        let type: 'public' | 'cuti' = 'public';
        
        // checking third element or checking contains "cuti" or "bersama"
        if (finalParts[2]) {
          const typeStr = finalParts[2].trim().toLowerCase();
          if (typeStr === 'cuti' || typeStr === 'cuti_bersama' || typeStr.includes('bersama')) {
            type = 'cuti';
          }
        } else if (descStr.toLowerCase().includes('cuti bersama') || descStr.toLowerCase().includes('cuti')) {
          type = 'cuti';
        }
        
        return { date: dateStr, desc: descStr, type };
      }
      return null;
    }).filter(item => item !== null && !isNaN(new Date(item.date).getTime())) as {date: string, desc: string, type: 'public' | 'cuti'}[];
    
    if (newItems.length > 0) {
      const mergedHolidays = [...holidays, ...newItems];
      setHolidays(mergedHolidays);
      
      const newHolidaysObj: Record<string, any> = {};
      mergedHolidays.forEach(h => {
        if (h.date && h.desc) {
          newHolidaysObj[h.date] = { desc: h.desc, type: h.type || 'public' };
        }
      });
      updateSettings({ holidays: newHolidaysObj });
      
      setBulkHolText('');
      setShowBulkHol(false);
      showStatus(`Imported & Saved ${newItems.length} holidays successfully! ✅`);
    } else {
      alert("Incorrect or invalid format. Use format: YYYY-MM-DD,Holiday Name,Type (Example: 2026-06-05,Christmas Day,public or 2026-06-05,Joint Leave,cuti)");
    }
  };

  const handleSaveAutoBreak = () => {
    try {
      const newAutoBreak: Record<string, string[]> = {};
      Object.keys(autoBreakStrings).forEach(code => {
        const val = autoBreakStrings[code] || '';
        newAutoBreak[code] = val
          .split(/[,;]/)
          .map(s => s.trim())
          .filter(Boolean)
          .map(s => normalizeTime(s))
          .filter(Boolean);
      });
      updateSettings({ autoBreak: newAutoBreak, fridayBreak });
      showStatus("Auto Break Settings saved successfully! ✅");
    } catch (err: any) {
      alert("Error saving break rules: " + err.message);
    }
  };

  const handleSavePuasa = () => {
    updateSettings({ puasa, puasaShifts });
    showStatus("Puasa Settings saved successfully! ✅");
  };

  const handleSaveBiz = () => {
    updateSettings({ bizRules });
    showStatus("Business Rules saved successfully! ✅");
  };

  const toggleRolePermission = (roleName: string, perm: string) => {
    setRoles((prev: any) => ({
      ...prev,
      [roleName]: {
        ...prev[roleName],
        [perm]: !prev[roleName][perm]
      }
    }));
  };

  const toggleRoleUI = (roleName: string, uiCode: string) => {
    setRoles((prev: any) => {
      const allowedUI = prev[roleName].allowedUI || [];
      const newAllowedUI = allowedUI.includes(uiCode) 
        ? allowedUI.filter((c: string) => c !== uiCode)
        : [...allowedUI, uiCode];
      return {
        ...prev,
        [roleName]: {
          ...prev[roleName],
          allowedUI: newAllowedUI
        }
      };
    });
  };

  const uiOptions = [
    { code: 'viewInt', label: 'Interval View' },
    { code: 'viewCal', label: 'Calendar View' },
    { code: 'viewAdh', label: 'Adherence View' },
    { code: 'viewFor', label: 'Forecast View' },
    { code: 'btnApp', label: 'Approval Button' },
    { code: 'btnBrk', label: 'Auto Break Button' },
    { code: 'btnSys', label: 'System Settings' },
    { code: 'btnImp', label: 'Import Schedule' },
    { code: 'btnPub', label: 'Publish Schedule' },
  ];

  const modules = [
    { id: 'workforce', label: 'Workforce', icon: Briefcase },
    { id: 'infra', label: 'API & Core', icon: Database },
    { id: 'hc', label: 'HC Management', icon: Users },
    { id: 'security', label: 'ID Security', icon: ShieldCheck },
    { id: 'analytics', label: 'Analytics', icon: Zap },
  ];

  return (
    <div className="h-full bg-slate-50 overflow-y-auto p-4 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Module Switcher Header & Save Button aligned at top */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-10">
          {!hideModuleSwitcher ? (
            <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-fit sticky top-0 md:relative z-30">
              {modules.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModuleSwitch(m.id)}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeModule === m.id ? 'bg-slate-950/[0.08] text-slate-950 scale-105' : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'}`}
                >
                  <m.icon size={16} />
                  {m.label}
                </button>
              ))}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3 w-full lg:w-auto px-1">
            {activeModule === 'workforce' && (
              <>
                {activeTab === 'shift' && <button onClick={handleSaveShifts} className="flex-1 lg:flex-none px-6 py-3 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-nowrap"><Save size={16} /> Save Shift Rules</button>}
                {activeTab === 'roles' && <button onClick={handleSaveRoles} className="flex-1 lg:flex-none px-6 py-3 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-nowrap"><Save size={16} /> Update Permissions</button>}
                {activeTab === 'holiday' && <button onClick={handleSaveHolidays} className="flex-1 lg:flex-none px-6 py-3 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-nowrap"><Save size={16} /> Update Calendar</button>}
                {activeTab === 'autobreak' && <button onClick={handleSaveAutoBreak} className="flex-1 lg:flex-none px-6 py-3 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-nowrap"><Save size={16} /> Save Break Rules</button>}
                {activeTab === 'puasa' && <button onClick={handleSavePuasa} className="flex-1 lg:flex-none px-6 py-3 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-nowrap"><Save size={16} /> Update Sync</button>}
                {activeTab === 'biz' && <button onClick={handleSaveBiz} className="flex-1 lg:flex-none px-6 py-3 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-nowrap"><Save size={16} /> Save Business Rules</button>}
                {activeTab === 'activities' && <button onClick={handleSaveActivities} className="flex-1 lg:flex-none px-6 py-3 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-nowrap"><Save size={16} /> Save Activities</button>}
              </>
            )}
            {activeModule !== 'workforce' && (
              <button 
                disabled={activeModule === 'infra' && isSavingDb}
                onClick={activeModule === 'infra' ? handleSaveDbUrl : () => showStatus("Module configuration updated!")} 
                className="flex-1 lg:flex-none px-6 py-3 bg-slate-950 text-white font-black rounded-xl hover:bg-black shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-nowrap"
              >
                {activeModule === 'infra' && isSavingDb ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                Commit Configuration
              </button>
            )}
          </div>
        </div>

        {saveStatus && (
          <div className="bg-slate-950 text-white px-8 py-3.5 rounded-2xl mb-8 text-[10px] font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-top-3 duration-300 flex items-center justify-center gap-2 shadow-2xl shadow-slate-200 border border-slate-800">
            {saveStatus}
          </div>
        )}

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          {activeModule === 'workforce' && (
            <>
              <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1 overflow-x-auto items-center sticky top-0 z-20 no-scrollbar">
                {[
                  { id: 'shift', icon: Clock, label: 'Shifts' },
                  { id: 'roles', icon: Users, label: 'Access Roles' },
                  { id: 'holiday', icon: Calendar, label: 'Holiday Cal' },
                  { id: 'autobreak', icon: Utensils, label: 'Auto Break' },
                  { id: 'puasa', icon: Moon, label: 'Fasting' },
                  { id: 'biz', icon: Briefcase, label: 'Ops Hours' },
                  { id: 'activities', icon: Zap, label: 'Activities' },
                ].map(tab => (
                  <button 
                    key={tab.id}
                    className={`min-w-fit px-5 py-3 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all whitespace-nowrap flex items-center gap-2.5 ${activeTab === tab.id ? 'bg-slate-950/[0.08] text-slate-950 shadow-none' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`} 
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6 md:p-10">
                {activeTab === 'biz' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 max-w-5xl mx-auto space-y-6">
                {/* Header & Filter Project */}
                <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h4 className="m-0 font-black text-rose-950 text-base uppercase tracking-widest flex items-center gap-2.5">
                      <Clock size={18} className="text-rose-600 animate-pulse" /> CHANNEL OPERATIONAL HOURS
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1.5 px-7">
                      Set active operational hours for communication channels based on your selected project
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Select Project:</span>
                    <select
                      className="p-2.5 px-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-rose-600 uppercase tracking-widest cursor-pointer focus:ring-1 focus:ring-rose-500 outline-none shadow-sm"
                      value={selectedOpsProject}
                      onChange={(e) => setSelectedOpsProject(e.target.value)}
                    >
                      {PROJECTS.map((pj) => (
                        <option key={pj} value={pj}>{pj}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Content Area */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                  {isLoadingOpsChannels ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-rose-600" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading channel database...</span>
                    </div>
                  ) : opsChannels.length === 0 ? (
                    <div className="py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                      No active communication channels registered for this project.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {opsChannels.map(ch => {
                         const key = `${selectedOpsProject}_${ch}`;
                         const rule = bizRules.operatingHours[key] || bizRules.operatingHours[ch] || { start: '00:00', end: '23:59', closed: false };
                         return (
                           <div key={ch} className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8 items-center bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:bg-slate-100">
                             <div className="font-black text-slate-900 text-[11px] uppercase tracking-widest flex items-center gap-1.5">
                               <div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></div>
                               {ch}
                             </div>
                             <div className="flex items-center gap-3">
                               <Sun size={14} className="text-rose-600 shrink-0" />
                               <input 
                                 type="time" 
                                 className={`flex-1 p-2.5 border rounded-xl text-xs font-black font-mono outline-none focus:border-rose-500 ${rule.closed ? 'opacity-20 pointer-events-none bg-slate-50' : 'bg-white border-slate-200'}`}
                                 value={rule.start}
                                 onChange={e => setBizRules({
                                   ...bizRules,
                                   operatingHours: { ...bizRules.operatingHours, [key]: { ...rule, start: e.target.value } }
                                 })}
                               />
                             </div>
                             <div className="flex items-center gap-3">
                               <Moon size={14} className="text-slate-400 shrink-0" />
                               <input 
                                 type="time" 
                                 className={`flex-1 p-2.5 border rounded-xl text-xs font-black font-mono outline-none focus:border-rose-500 ${rule.closed ? 'opacity-20 pointer-events-none bg-slate-50' : 'bg-white border-slate-200'}`}
                                 value={rule.end}
                                 onChange={e => setBizRules({
                                   ...bizRules,
                                   operatingHours: { ...bizRules.operatingHours, [key]: { ...rule, end: e.target.value } }
                                 })}
                               />
                             </div>
                             <div className="flex justify-end">
                               <label className="flex items-center gap-3 cursor-pointer group">
                                 <span className={`text-[10px] font-black uppercase tracking-widest ${rule.closed ? 'text-rose-600' : 'text-slate-300'}`}>Closed</span>
                                 <input 
                                   type="checkbox"
                                   checked={rule.closed}
                                   onChange={e => setBizRules({
                                     ...bizRules,
                                     operatingHours: { ...bizRules.operatingHours, [key]: { ...rule, closed: e.target.checked } }
                                   })}
                                   className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                                 />
                               </label>
                             </div>
                           </div>
                         );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
            
             {activeTab === 'activities' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 max-w-5xl mx-auto space-y-6">
                {/* Header & Filter Project */}
                <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h4 className="m-0 font-black text-rose-950 text-base uppercase tracking-widest flex items-center gap-2.5">
                      <Zap size={18} className="text-rose-600 animate-pulse" /> ACTIVITY CONFIGURATION
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1.5 px-7">
                      Manage special activities available for each project
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Select Project:</span>
                    <select
                      className="p-2.5 px-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-rose-600 uppercase tracking-widest cursor-pointer focus:ring-1 focus:ring-rose-500 outline-none shadow-sm"
                      value={selectedActivityProject}
                      onChange={(e) => setSelectedActivityProject(e.target.value)}
                    >
                      {PROJECTS.map((pj) => (
                        <option key={pj} value={pj}>{pj}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Shift Bar Color Section */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                  <h5 className="m-0 font-black text-[11px] uppercase tracking-widest text-slate-900 mb-5 flex items-center gap-2">
                    <Palette size={16} className="text-rose-600" /> SHIFT BAR COLOR (WORK BACKGROUND)
                  </h5>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight -mt-3.5 mb-5 leading-normal">
                    Choose background color for roster work shifts shown on the main grid:
                  </p>

                  <div className="flex items-center gap-3 bg-slate-50 p-5 rounded-2xl border border-slate-100 flex-wrap">
                    {[
                      { class: 'bg-slate-200/70', label: 'Default Slate/Gray' },
                      { class: 'bg-slate-300/85', label: 'Aesthetic Gray' },
                      { class: 'bg-blue-200/60', label: 'Light Blue' },
                      { class: 'bg-indigo-200/60', label: 'Light Indigo' },
                      { class: 'bg-teal-200/60', label: 'Light Teal' },
                      { class: 'bg-emerald-200/60', label: 'Light Emerald' },
                      { class: 'bg-rose-200/60', label: 'Light Rose' },
                      { class: 'bg-amber-200/60', label: 'Light Amber' },
                      { class: 'bg-violet-200/60', label: 'Light Violet' },
                      { class: 'bg-orange-200/60', label: 'Light Orange' }
                    ].map(col => (
                      <button
                        key={col.class}
                        onClick={() => {
                          setShiftBarColor(col.class);
                          showStatus(`Shift Bar Color changed to ${col.label}. Click 'Save Activities' to save.`);
                        }}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center border ${
                          shiftBarColor === col.class 
                            ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-105' 
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full ${col.class} border border-black/10`} />
                        <span>{col.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add New Activity Form */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                  <h5 className="m-0 font-black text-[11px] uppercase tracking-widest text-slate-900 mb-5 flex items-center gap-2">
                    <Plus size={16} className="text-rose-600" /> ADD NEW ACTIVITY ({selectedActivityProject})
                  </h5>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight -mt-3.5 mb-5 leading-normal">
                    Create a new activity code (e.g. CO, QA, DS) to assign in the daily schedule sheet:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Code (Max 4 Letters)</label>
                      <input 
                        type="text"
                        maxLength={4}
                        placeholder="e.g., CO"
                        value={newActivityCode}
                        onChange={e => setNewActivityCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black font-mono uppercase focus:ring-1 focus:ring-rose-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Activity Label</label>
                      <input 
                        type="text"
                        placeholder="e.g., Coaching"
                        value={newActivityLabel}
                        onChange={e => setNewActivityLabel(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black focus:ring-1 focus:ring-rose-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Default Duration</label>
                      <select
                        value={newActivityDuration}
                        onChange={e => setNewActivityDuration(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black focus:ring-1 focus:ring-rose-500 outline-none cursor-pointer"
                      >
                        <option value="1">15 Minutes</option>
                        <option value="2">30 Minutes</option>
                        <option value="4">1 Hour</option>
                        <option value="full">Full Day</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Category</label>
                      <select
                        value={newActivityCategory}
                        onChange={e => setNewActivityCategory(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black focus:ring-1 focus:ring-rose-500 outline-none cursor-pointer"
                      >
                        <option value="work">Work (Prod)</option>
                        <option value="break">Break (Non-Prod)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Select Color</label>
                      <div className="flex gap-1 items-center bg-white p-1.5 rounded-xl border border-slate-200 flex-wrap">
                        {['bg-active-red', 'bg-rose-500', 'bg-amber-400', 'bg-emerald-500', 'bg-teal-500', 'bg-sky-500', 'bg-indigo-600', 'bg-violet-700', 'bg-slate-900', 'bg-black', 'bg-orange-500'].map(col => (
                          <button
                            key={col}
                            onClick={() => setNewActivityColor(col)}
                            className={`w-4 h-4 rounded-md ${col} transition-all ${newActivityColor === col ? 'ring-2 ring-rose-500 scale-110 shadow-sm' : 'opacity-80 hover:opacity-100'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        if (!newActivityCode.trim() || !newActivityLabel.trim()) {
                          alert("Please enter code and activity label first!");
                          return;
                        }
                        const currentProjActs = activities[selectedActivityProject] || {};
                        if (currentProjActs[newActivityCode]) {
                          alert(`Activity code '${newActivityCode}' already exists for project ${selectedActivityProject}!`);
                          return;
                        }
                        
                        const updated = {
                          ...activities,
                          [selectedActivityProject]: {
                            ...currentProjActs,
                            [newActivityCode]: {
                              label: newActivityLabel,
                              color: newActivityColor,
                              duration: newActivityDuration,
                              category: newActivityCategory
                            }
                          }
                        };
                        setActivities(updated);
                        setNewActivityCode('');
                        setNewActivityLabel('');
                        showStatus("Activity registered! Click 'Save Activities' above to save permanently.");
                      }}
                      className="px-5 py-2.5 bg-slate-950 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-black hover:scale-105 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Plus size={14} /> Add Activity
                    </button>
                  </div>
                </div>

                {/* Active Activities List */}
                <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                  <h5 className="m-0 font-black text-[11px] uppercase tracking-widest text-slate-900 mb-5 flex items-center gap-2">
                    <Zap size={16} className="text-rose-600" /> ACTIVE ACTIVITIES LIST ({selectedActivityProject})
                  </h5>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight -mt-3.5 mb-6 leading-normal">
                    Active activities list for this project. You can edit or delete them directly from this list:
                  </p>

                  <div className="space-y-3">
                    {Object.entries(activities[selectedActivityProject] || {}).length === 0 ? (
                      <div className="py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                        No activities registered for this project yet. Use the form above to add.
                      </div>
                    ) : (
                      Object.entries(activities[selectedActivityProject] || {}).map(([code, act]: [string, any]) => (
                        <div key={code} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-slate-200 group">
                          {/* Code */}
                          <div className="font-mono font-black text-rose-600 text-[10px] bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl w-fit uppercase tracking-widest shadow-sm">
                            {code}
                          </div>
                          
                          {/* Label */}
                          <div className="col-span-2">
                            <input 
                              placeholder="Label"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-tight outline-none focus:border-rose-500 transition-all focus:bg-white"
                              value={act.label}
                              onChange={(e) => {
                                const updated = {
                                  ...activities,
                                  [selectedActivityProject]: {
                                    ...(activities[selectedActivityProject] || {}),
                                    [code]: { ...act, label: e.target.value }
                                  }
                                };
                                setActivities(updated);
                              }}
                            />
                          </div>

                          {/* Duration */}
                          <div>
                            <select 
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-tight outline-none focus:border-rose-500 cursor-pointer"
                              value={act.duration || 'custom'}
                              onChange={(e) => {
                                const updated = {
                                  ...activities,
                                  [selectedActivityProject]: {
                                    ...(activities[selectedActivityProject] || {}),
                                    [code]: { ...act, duration: e.target.value }
                                  }
                                };
                                setActivities(updated);
                              }}
                            >
                              <option value="1">15 mins</option>
                              <option value="2">30 mins</option>
                              <option value="4">1 hour</option>
                              <option value="full">Full Day</option>
                              <option value="custom">Custom</option>
                            </select>
                          </div>

                          {/* Color Select & Delete */}
                          <div className="flex gap-2 items-center col-span-2 justify-end">
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1.5 rounded-xl flex-wrap">
                              {['bg-active-red', 'bg-rose-500', 'bg-amber-400', 'bg-emerald-500', 'bg-teal-500', 'bg-sky-500', 'bg-indigo-600', 'bg-violet-700', 'bg-slate-900', 'bg-black', 'bg-orange-500'].map(col => (
                                <button
                                  key={col}
                                  onClick={() => {
                                    const updated = {
                                      ...activities,
                                      [selectedActivityProject]: {
                                        ...(activities[selectedActivityProject] || {}),
                                        [code]: { ...act, color: col }
                                      }
                                    };
                                    setActivities(updated);
                                  }}
                                  className={`w-3.5 h-3.5 rounded-md ${col} transition-all ${act.color === col ? 'ring-2 ring-rose-500 scale-110 shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                                />
                              ))}
                            </div>
                            <button 
                              onClick={() => {
                                const newProjActs = { ...(activities[selectedActivityProject] || {}) };
                                delete newProjActs[code];
                                const updated = {
                                  ...activities,
                                  [selectedActivityProject]: newProjActs
                                };
                                setActivities(updated);
                                showStatus("Activity deleted. Click 'Save Activities' above to save.");
                              }} 
                              className="p-2 text-slate-300 hover:text-rose-600 transition-all hover:bg-rose-50 rounded-xl"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'shift' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 max-w-5xl mx-auto">
                <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-5">
                     <div>
                       <h4 className="m-0 text-slate-900 text-base font-black flex items-center gap-2.5 tracking-widest uppercase">
                         <Clock size={18} className="text-rose-600" />
                         MASTER SHIFT REGISTRY
                       </h4>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                         Connected to projects in the workforce database
                       </p>
                     </div>
                     <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Select Project:</span>
                       <select
                         className="p-2 px-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-rose-600 uppercase tracking-widest cursor-pointer focus:ring-1 focus:ring-rose-500 outline-none"
                         value={selectedShiftProject}
                         onChange={(e) => setSelectedShiftProject(e.target.value)}
                       >
                         {PROJECTS.map((pj) => (
                           <option key={pj} value={pj}>{pj}</option>
                         ))}
                       </select>
                     </div>
                   </div>

                   {isLoadingShifts ? (
                     <div className="py-12 flex flex-col items-center justify-center gap-2">
                       <RefreshCw size={24} className="animate-spin text-rose-600" />
                       <span className="text-[10px] font-black text-slate-400 tracking-widest">LOADING SHIFTS FROM SUPABASE...</span>
                     </div>
                   ) : (
                      <div className="space-y-3">
                        {shifts.length > 0 && (
                          <div className="hidden md:flex gap-3 px-4 text-[9px] font-black text-rose-500 uppercase tracking-widest leading-none mb-1">
                            <span className="w-[100px] text-center">Shift Code</span>
                            <span className="flex-1 text-center">Start Time</span>
                            <span className="w-4 shrink-0"></span>
                            <span className="flex-1 text-center">End Time</span>
                            <span className="w-[90px] text-center">Color</span>
                            <span className="w-[70px] text-center">Priority</span>
                            <span className="w-[100px] text-center">Cross Day</span>
                            <span className="w-10 shrink-0"></span>
                          </div>
                        )}

                       {shifts.map((s, i) => (
                         <div key={i} className="flex gap-3 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all group">
                           <select
                              className="w-[100px] p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-black font-mono text-[10px] text-rose-600 uppercase text-center focus:outline-none focus:ring-1 focus:ring-rose-500"
                              value={s.code || ""}
                              onChange={e => {
                                const code = e.target.value.toUpperCase();
                                const newS = [...shifts];
                                newS[i].code = code;
                                
                                const reg = registeredShiftCodes.find(x => x.code === code);
                                if (reg) {
                                  newS[i].s = reg.s;
                                  newS[i].e = reg.e;
                                  newS[i].w = i + 1; // logical default order
                                } else if (SHIFT_DEFAULTS[code]) {
                                  newS[i].s = SHIFT_DEFAULTS[code].s;
                                  newS[i].e = SHIFT_DEFAULTS[code].e;
                                  newS[i].w = SHIFT_DEFAULTS[code].w;
                                }
                                setShifts(newS);
                              }}
                            >
                              <option value="">Code</option>
                              {registeredShiftCodes.map(item => (
                                <option key={item.code} value={item.code}>{item.code}</option>
                              ))}
                              {s.code && !registeredShiftCodes.some(x => x.code === s.code) && (
                                <option value={s.code}>{s.code}</option>
                              )}
                            </select>
                           <input type="text" placeholder="08:00" className="flex-1 p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-black text-[10px] text-center font-mono" value={s.s} onChange={e => { const newS = [...shifts]; newS[i].s = e.target.value; setShifts(newS); }} />
                           <ArrowLeftRight size={12} className="text-slate-300 shrink-0" />
                           <input type="text" placeholder="17:00" className="flex-1 p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-black text-[10px] text-center font-mono" value={s.e} onChange={e => { const newS = [...shifts]; newS[i].e = e.target.value; setShifts(newS); }} />
                            <select
                              className="w-[90px] p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-black text-[10px] text-center focus:outline-none focus:ring-1 focus:ring-rose-500"
                              value={s.color || "bg-slate-500"}
                              onChange={e => { const newS = [...shifts]; newS[i].color = e.target.value; setShifts(newS); }}
                            >
                              {SHIFT_COLORS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <input 
                              type="number" 
                              placeholder="Sort" 
                              title="Sort Priority (Smaller numbers appear first)"
                              className="w-[70px] p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-black text-[10px] text-center font-mono focus:outline-none focus:ring-1 focus:ring-rose-500" 
                              value={s.w === undefined ? 1 : s.w} 
                              onChange={e => { const newS = [...shifts]; newS[i].w = parseInt(e.target.value, 10) || 1; setShifts(newS); }} 
                            />
                            <div className="w-[100px] flex items-center justify-center gap-1.5 px-1 shrink-0">
                              <input 
                                type="checkbox" 
                                id={`crosses_day-${i}`}
                                className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                                checked={!!s.crosses_day}
                                onChange={e => {
                                  const newS = [...shifts];
                                  newS[i].crosses_day = e.target.checked;
                                  setShifts(newS);
                                }}
                              />
                              <label htmlFor={`crosses_day-${i}`} className="text-[9px] font-black tracking-wider text-slate-500 uppercase cursor-pointer select-none">
                                Yes
                              </label>
                            </div>
                           <button className="p-2.5 text-slate-300 hover:text-rose-600 transition-colors" onClick={() => setShifts(shifts.filter((_, idx) => idx !== i))}>
                             <Trash2 size={16} />
                           </button>
                         </div>
                       ))}
                       <button className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3" onClick={() => setShifts([...shifts, { code: '', s: '08:00', e: '17:00', w: shifts.length + 1 }])}>
                         <Plus size={16} /> Add Shift Definition
                       </button>
                     </div>
                   )}
                </div>

                 {/* Registered Shift Codes Registry (Consistently populated in Dropdown) */}
                 <div className="mt-8 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200/80 shadow-sm relative overflow-hidden">
                   <h5 className="m-0 text-slate-800 text-xs font-black flex items-center gap-2.5 tracking-widest uppercase font-sans">
                     <Palette size={16} className="text-rose-600" />
                     REGISTERED SHIFT CODES DROPDOWN REGISTRY
                   </h5>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 mb-5 font-sans leading-relaxed">
                     Configure dynamic shift codes with customized start & end hours. Only system Administrators have editing access.
                   </p>

                   <div className="flex flex-wrap gap-2.5 items-center mb-6 border-t border-slate-100 pt-5">
                      {/* Interactive Profile Simulator */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full mb-3 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                        <span className="text-[9px] font-black tracking-wider text-slate-500 uppercase font-sans flex items-center gap-1.5 leading-none">
                          <Lock size={11} className="text-slate-400 shrink-0" /> Simulasi Profil Pengguna (Demo):
                        </span>
                        <select
                          value={sessionRole}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSessionRole(val);
                            localStorage.setItem('portal_active_session_role', val);
                            showStatus(`Simulasi profil aktif sebagai: ${val.toUpperCase()}`);
                          }}
                          className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase text-rose-600 focus:outline-none cursor-pointer font-sans"
                        >
                          <option value="Admin">Admin (Full Editing Access)</option>
                          <option value="Manager">Manager (Read Only Access)</option>
                          <option value="Agent">Agent (Read Only Access)</option>
                        </select>
                      </div>
                     {registeredShiftCodes.map((c) => (
                       <span 
                         key={c.code} 
                         className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black font-mono text-rose-600 uppercase tracking-wider group transition-all hover:bg-rose-50/50"
                       >
                          <span className="font-extrabold">{c.code}</span>
                          <span className="text-[9px] text-slate-400 font-medium font-sans lowercase">({c.s}–{c.e})</span>
                         <button
                           type="button"
                           onClick={() => {
                             if (registeredShiftCodes.length <= 1) {
                               showStatus("Must keep at least one registered shift code!");
                               return;
                             }
                             const updated = registeredShiftCodes.filter(x => x.code !== c.code);
                             saveRegisteredShiftCodes(updated);
                             showStatus(`Removed shift code ${c.code} from registered list.`);
                           }}
                           className="text-slate-300 hover:text-rose-500 transition-colors pointer-events-auto"
                           title={`Remove ${c.code}`}
                         >
                           <X size={10} className="stroke-[3]" />
                         </button>
                       </span>
                     ))}
                   </div>

                   {sessionRole !== "Admin" ? (
                      <div className="bg-rose-50/50 border border-rose-100/50 rounded-2xl p-4 flex items-center gap-3 text-rose-800">
                        <Lock size={14} className="text-rose-600 shrink-0" />
                        <div className="text-[10px] font-black uppercase tracking-wider font-sans leading-none">
                          Hanya Admin yang dapat register kode shift baru. Ganti profile ke "Admin" di profile simulator box untuk mengedit.
                        </div>
                      </div>
                    ) : (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          const form = e.currentTarget;
                          const codeInput = form.elements.namedItem("newCode") as HTMLInputElement;
                          const startInput = form.elements.namedItem("newStart") as HTMLInputElement;
                          const endInput = form.elements.namedItem("newEnd") as HTMLInputElement;

                          const code = codeInput.value.trim().toUpperCase();
                          const s = startInput.value.trim();
                          const eTime = endInput.value.trim();

                          if (!code || !s || !eTime) return;
                          
                          if (registeredShiftCodes.some(x => x.code === code)) {
                            showStatus(`This shift code is already registered.`);
                            return;
                          }
                          const updated = [...registeredShiftCodes, { code, s, e: eTime }];
                          saveRegisteredShiftCodes(updated);
                          showStatus(`Successfully registered shift "${code}" (${s} - ${eTime}).`);
                          form.reset();
                        }}
                        className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-100/60 p-4 rounded-2xl items-end w-full"
                      >
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase tracking-wider text-slate-400 font-sans block">Shift Code</label>
                          <input 
                            type="text" 
                            name="newCode"
                            placeholder="e.g., P5, S8" 
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-black font-mono text-[10px] uppercase text-center focus:outline-none focus:ring-1 focus:ring-rose-500"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase tracking-wider text-slate-400 font-sans block">Start Time</label>
                          <input 
                            type="time" 
                            name="newStart"
                            defaultValue="08:00"
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-black font-mono text-[10px] text-center focus:outline-none focus:ring-1 focus:ring-rose-500"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase tracking-wider text-slate-400 font-sans block">End Time</label>
                          <input 
                            type="time" 
                            name="newEnd"
                            defaultValue="17:00"
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-black font-mono text-[10px] text-center focus:outline-none focus:ring-1 focus:ring-rose-500"
                            required
                          />
                        </div>
                        <button 
                          type="submit"
                          className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-colors shrink-0"
                        >
                          Register Code
                        </button>
                      </form>
                    )}
                 </div>
              </div>
            )}

             {activeTab === 'roles' && (() => {
               // Fallback if selectedRoleForEdit was deleted or is not set
               const roleKeys = Object.keys(roles);
               const activeRoleKey = roleKeys.includes(selectedRoleForEdit) ? selectedRoleForEdit : (roleKeys[0] || 'Admin');
               const activeRoleData = roles[activeRoleKey] || {
                 isAdmin: false,
                 canEditSchedule: false,
                 canSeeAll: false,
                 canSwap: false,
                 allowedUI: [],
                 allowedActivities: []
               };

               const isDefaultRole = ['Admin', 'Manager', 'Agent'].includes(activeRoleKey);

               const handleAddCustomRole = () => {
                 if (!newRoleName.trim()) {
                   alert("Please enter a role name!");
                   return;
                 }
                 const cleanName = newRoleName.trim();
                 if (roles[cleanName]) {
                   alert("A role with this name already exists!");
                   return;
                 }
                 setRoles((prev: any) => ({
                   ...prev,
                   [cleanName]: {
                     isAdmin: false,
                     canEditSchedule: false,
                     canSeeAll: false,
                     canSwap: true,
                     allowedUI: ['viewInt', 'viewCal'],
                     allowedActivities: []
                   }
                 }));
                 setSelectedRoleForEdit(cleanName);
                 setNewRoleName('');
                 showStatus(`Custom role "${cleanName}" created! Click 'Update Permissions' to save permanently.`);
               };

               const handleDeleteCustomRole = (roleToDelete: string) => {
                 if (isDefaultRole) {
                   alert("Default system roles cannot be deleted.");
                   return;
                 }
                 if (window.confirm(`Are you sure you want to delete the role "${roleToDelete}"?`)) {
                   setRoles((prev: any) => {
                     const copy = { ...prev };
                     delete copy[roleToDelete];
                     return copy;
                   });
                   setSelectedRoleForEdit('Admin');
                   showStatus(`Role "${roleToDelete}" deleted. Click 'Update Permissions' to save permanently.`);
                 }
               };

               const handleToggleRolePermission = (permName: string) => {
                 setRoles((prev: any) => ({
                   ...prev,
                   [activeRoleKey]: {
                     ...prev[activeRoleKey],
                     [permName]: !prev[activeRoleKey][permName]
                   }
                 }));
               };

               const handleToggleRoleUI = (uiCode: string) => {
                 setRoles((prev: any) => {
                   const allowedUI = prev[activeRoleKey].allowedUI || [];
                   const newAllowedUI = allowedUI.includes(uiCode)
                     ? allowedUI.filter((c: string) => c !== uiCode)
                     : [...allowedUI, uiCode];
                   return {
                     ...prev,
                     [activeRoleKey]: {
                       ...prev[activeRoleKey],
                       allowedUI: newAllowedUI
                     }
                   };
                 });
               };

               const handleAddActivityTag = () => {
                 if (!newActivityTag.trim()) return;
                 const cleanTag = newActivityTag.trim().toUpperCase();
                 const currentTags = activeRoleData.allowedActivities || [];
                 if (currentTags.includes(cleanTag)) {
                   alert("This activity tag is already permitted!");
                   return;
                 }
                 setRoles((prev: any) => ({
                   ...prev,
                   [activeRoleKey]: {
                     ...prev[activeRoleKey],
                     allowedActivities: [...currentTags, cleanTag]
                   }
                 }));
                 setNewActivityTag('');
               };

               const handleRemoveActivityTag = (tagToRemove: string) => {
                 setRoles((prev: any) => ({
                   ...prev,
                   [activeRoleKey]: {
                     ...prev[activeRoleKey],
                     allowedActivities: (prev[activeRoleKey].allowedActivities || []).filter((t: string) => t !== tagToRemove)
                   }
                 }));
               };

               return (
                 <div className="animate-in fade-in slide-in-from-top-4 duration-300 max-w-6xl mx-auto space-y-10">
                   {/* Header panel */}
                   <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <div>
                       <h4 className="m-0 font-black text-slate-950 text-base uppercase tracking-widest flex items-center gap-2.5">
                         <ShieldCheck size={18} className="text-rose-600 animate-pulse" /> ACCESS & ROLE SETTINGS
                       </h4>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1.5 px-7">
                         Modify permission kernels, feature rights, and activity allowances for workforce entities
                       </p>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                     {/* Left panel: Roles List */}
                     <div className="lg:col-span-1 space-y-6">
                       <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                         <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest px-1 block font-sans">Role Registry</span>
                         <div className="space-y-2">
                           {roleKeys.map(role => {
                             const isActive = role === activeRoleKey;
                             return (
                               <button
                                 key={role}
                                 onClick={() => setSelectedRoleForEdit(role)}
                                 className={`w-full p-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider text-left transition-all flex items-center justify-between ${
                                   isActive 
                                     ? 'bg-slate-950 text-white shadow-md scale-[1.02]' 
                                     : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                 }`}
                               >
                                 <span className="truncate">{role}</span>
                                 {!['Admin', 'Manager', 'Agent'].includes(role) && (
                                   <span className="text-[8px] bg-rose-500 text-white px-1.5 py-0.5 rounded uppercase font-bold ml-1">Custom</span>
                                 )}
                               </button>
                             );
                           })}
                         </div>

                         {/* Add custom role input */}
                         <div className="pt-4 border-t border-slate-100 space-y-2">
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1 block font-sans">Create Custom Role</span>
                           <input
                             type="text"
                             value={newRoleName}
                             onChange={e => setNewRoleName(e.target.value)}
                             placeholder="e.g., Supervisor"
                             className="w-full p-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-wider outline-none focus:border-rose-500 font-mono"
                           />
                           <button
                             onClick={handleAddCustomRole}
                             className="w-full p-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                           >
                             <Plus size={12} /> Add Custom Role
                           </button>
                         </div>
                       </div>
                     </div>

                     {/* Right panel: Details of selected role */}
                     <div className="lg:col-span-3">
                       <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-lg space-y-8">
                         {/* Header inside detail area */}
                         <div className="flex justify-between items-center border-b border-slate-100 pb-5">
                           <div>
                             <h4 className="text-sm font-black text-slate-950 uppercase tracking-widest flex items-center gap-2 font-mono">
                               🛡️ {activeRoleKey} ROLE DETAILS
                             </h4>
                             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 font-sans">
                               {isDefaultRole ? "System Reserved Default Access Role" : "User-Defined Custom Security Profile"}
                             </p>
                           </div>
                           {!isDefaultRole && (
                             <button
                               onClick={() => handleDeleteCustomRole(activeRoleKey)}
                               className="px-3.5 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                             >
                               <Trash2 size={12} /> Delete Role
                             </button>
                           )}
                         </div>

                         {/* Section 1: Kernels / Capabilities */}
                         <div className="space-y-4">
                           <h5 className="text-[9px] font-black text-rose-600 uppercase tracking-widest px-1 font-sans">
                             Core Permission Kernels / General Capabilities
                           </h5>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {[
                               { id: 'isAdmin', label: 'System Admin Mode', desc: 'Grants master permissions override across all infrastructure logs and setups' },
                               { id: 'canEditSchedule', label: 'Manage & Generate Schedules', desc: 'Allows generation, modification, and bulk updates of roster schedules' },
                               { id: 'canSeeAll', label: 'Global Data Visibility', desc: 'Permits viewing operational KPIs, financial models, and cross-project metrics' },
                               { id: 'canSwap', label: 'Schedule Swap Permission', desc: 'Allows submitting and approving shift trade transactions between rosters' },
                             ].map(item => (
                               <label
                                 key={item.id}
                                 className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition-all cursor-pointer select-none"
                               >
                                 <input
                                   type="checkbox"
                                   checked={!!activeRoleData[item.id]}
                                   onChange={() => handleToggleRolePermission(item.id)}
                                   className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 focus:ring-1"
                                 />
                                 <div>
                                   <p className="text-[10px] font-black uppercase tracking-wider text-slate-900">{item.label}</p>
                                   <p className="text-[8.5px] text-slate-400 font-bold uppercase mt-1 leading-normal">{item.desc}</p>
                                 </div>
                               </label>
                             ))}
                           </div>
                         </div>

                         {/* Section 2: UI Feature Access */}
                         <div className="space-y-4 pt-4 border-t border-slate-100">
                           <h5 className="text-[9px] font-black text-rose-600 uppercase tracking-widest px-1 font-sans">
                             Page View & Active Action Privileges (allowedUI)
                           </h5>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                             {uiOptions.map(opt => {
                               const isChecked = (activeRoleData.allowedUI || []).includes(opt.code);
                               return (
                                 <label
                                   key={opt.code}
                                   className={`flex items-center justify-between p-3.5 px-4 rounded-xl border transition-all cursor-pointer select-none ${
                                     isChecked 
                                       ? 'bg-rose-50/40 border-rose-100/80 text-rose-950 font-black' 
                                       : 'bg-slate-50/50 border-slate-100 text-slate-500'
                                   }`}
                                 >
                                   <span className="text-[9px] font-black uppercase tracking-wider">{opt.label}</span>
                                   <input
                                     type="checkbox"
                                     checked={isChecked}
                                     onChange={() => handleToggleRoleUI(opt.code)}
                                     className="w-3.5 h-3.5 text-rose-600 rounded border-slate-300 focus:ring-rose-500 focus:ring-1"
                                   />
                                 </label>
                               );
                             })}
                           </div>
                         </div>

                         {/* Section 3: Custom allowedActivities tags */}
                         <div className="space-y-4 pt-4 border-t border-slate-100">
                           <h5 className="text-[9px] font-black text-rose-600 uppercase tracking-widest px-1 font-sans">
                             Permitted Administrative Operations (allowedActivities)
                           </h5>
                           <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wide leading-relaxed px-1 font-sans">
                             Specific custom permission hooks assigned to this role. Type a code (e.g. "REMOVE" or "OVERRIDE") and press enter.
                           </p>

                           <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 min-h-[64px] items-center">
                             {(activeRoleData.allowedActivities || []).length === 0 ? (
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic px-1 font-sans">
                                 No custom activity permissions mapped to this profile.
                               </span>
                             ) : (
                               (activeRoleData.allowedActivities || []).map(tag => (
                                 <span
                                   key={tag}
                                   className="inline-flex items-center gap-1.5 bg-slate-900 text-white rounded-lg p-1.5 px-3 font-mono text-[9px] font-black uppercase tracking-widest"
                                 >
                                   <span>{tag}</span>
                                   <button
                                     onClick={() => handleRemoveActivityTag(tag)}
                                     className="text-slate-400 hover:text-white transition-colors text-xs font-semibold px-0.5"
                                   >
                                     &times;
                                   </button>
                                 </span>
                               ))
                             )}
                           </div>

                           <div className="flex gap-2.5 max-w-sm">
                             <input
                               type="text"
                               value={newActivityTag}
                               onChange={e => setNewActivityTag(e.target.value)}
                               onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddActivityTag(); } }}
                               placeholder="e.g. REMOVE, OVERRIDE"
                               className="flex-1 p-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:border-rose-500 font-mono"
                             />
                             <button
                               type="button"
                               onClick={handleAddActivityTag}
                               className="px-5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center gap-1"
                             >
                               <Plus size={14} /> Add Tag
                             </button>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               );
             })()}

            {activeTab === 'holiday' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 max-w-5xl mx-auto">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 shadow-sm mb-10">
                   <h4 className="m-0 font-black text-base uppercase tracking-widest text-slate-950 flex items-center gap-2.5"><Calendar size={18} className="text-rose-600" /> CALENDAR EXCEPTIONS</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1.5 px-7">National holidays and service blackouts (Public Holidays & Cuti Bersama)</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                  {holidays.map((h, i) => {
                    const isCuti = h.type === 'cuti';
                    return (
                      <div key={i} className={`flex gap-4 items-center bg-white p-5 rounded-2xl border border-slate-200 border-l-4 ${isCuti ? 'border-l-amber-500' : 'border-l-rose-600'} shadow-sm transition-all group hover:shadow-md`}>
                        <div className="flex-1">
                          <div className="font-black text-slate-900 text-[11px] uppercase tracking-widest flex items-center gap-1.5 flex-wrap">
                            <span>{format(new Date(h.date), 'dd MMM yyyy')}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${isCuti ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}>
                              {isCuti ? 'Cuti Bersama' : 'Public Holiday'}
                            </span>
                          </div>
                          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-tight opacity-70 mt-1">{h.desc}</div>
                        </div>
                        <button className="text-slate-300 hover:text-rose-600 transition-colors cursor-pointer" onClick={() => {
                          const filtered = holidays.filter((_, idx) => idx !== i);
                          setHolidays(filtered);
                          const newHolidaysObj: Record<string, any> = {};
                          filtered.forEach(item => {
                            if (item.date && item.desc) {
                              newHolidaysObj[item.date] = { desc: item.desc, type: item.type || 'public' };
                            }
                          });
                          updateSettings({ holidays: newHolidaysObj });
                          showStatus("Holiday deleted! 🗑️");
                        }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="mb-6 flex gap-3 max-w-[400px]">
                  <button 
                    type="button"
                    onClick={() => setShowBulkHol(false)}
                    className={`flex-1 py-3 px-4 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all border text-center ${!showBulkHol ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-900'}`}
                  >
                    Add Satu-Satu
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowBulkHol(true)}
                    className={`flex-1 py-3 px-4 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all border text-center ${showBulkHol ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-900'}`}
                  >
                    Bulk Import
                  </button>
                </div>

                {showBulkHol ? (
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-lg animate-in fade-in duration-300">
                    <div className="mb-6">
                      <label className="text-[9px] font-black text-rose-600 uppercase tracking-widest block mb-2 px-1">Bulk Import Holidays</label>
                      <span className="text-[10px] font-bold text-slate-400 block mb-3 leading-normal px-1">
                        Enter holidays per line with the format: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-600 font-mono font-black">YYYY-MM-DD,Holiday Name,Type</code> (Optional type: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">public</code> or <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">cuti</code>. Example: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">2026-06-05,Joint Leave,cuti</code> or <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">2026-12-25,Christmas Day,public</code>).
                      </span>
                      <textarea
                        rows={6}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-mono font-black outline-none focus:border-rose-500 placeholder:text-slate-300"
                        placeholder="Example:&#10;2026-12-25,Christmas Day,public&#10;2026-06-05,Joint Leave,cuti"
                        value={bulkHolText}
                        onChange={e => setBulkHolText(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button 
                        type="button"
                        onClick={() => { setBulkHolText(''); setShowBulkHol(false); }}
                        className="px-6 py-3 border border-slate-200 text-slate-400 hover:text-slate-900 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        onClick={handleBulkImportHolidays}
                        className="px-6 py-3 bg-rose-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <Save size={14} /> Import & Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-lg animate-in fade-in duration-300">
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                      <div className="flex-1 w-full">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Effective Date</label>
                        <input type="date" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-rose-500" value={newHolDate} onChange={e => setNewHolDate(e.target.value)} />
                      </div>
                      <div className="flex-1 w-full">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Type</label>
                        <select 
                          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-rose-500"
                          value={newHolType}
                          onChange={e => setNewHolType(e.target.value as 'public' | 'cuti')}
                        >
                          <option value="public">Public Holiday (Libur Nasional)</option>
                          <option value="cuti">Cuti Bersama (Joint Leave)</option>
                        </select>
                      </div>
                      <div className="flex-[1.5] w-full">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Description</label>
                        <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-rose-500 placeholder:text-slate-300" placeholder="e.g. Independence Day / Cuti Lebaran" value={newHolDesc} onChange={e => setNewHolDesc(e.target.value)} />
                      </div>
                      <button type="button" className="bg-rose-600 text-white font-black px-8 py-4 rounded-2xl hover:bg-rose-700 shadow-lg shadow-rose-100 active:scale-95 transition-all flex items-center justify-center cursor-pointer h-[52px]" onClick={() => { 
                        if(newHolDate && newHolDesc) { 
                          const merged = [...holidays, {date: newHolDate, desc: newHolDesc, type: newHolType}];
                          setHolidays(merged); 
                          const newHolidaysObj: Record<string, any> = {};
                          merged.forEach(item => {
                            if (item.date && item.desc) {
                              newHolidaysObj[item.date] = { desc: item.desc, type: item.type || 'public' };
                            }
                          });
                          updateSettings({ holidays: newHolidaysObj });
                          setNewHolDate(''); 
                          setNewHolDesc(''); 
                          setNewHolType('public');
                          showStatus("Holiday Saved Successfully! ✅");
                        } 
                      }}>
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'autobreak' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 max-w-5xl mx-auto">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 shadow-sm mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h4 className="m-0 font-black text-base uppercase tracking-widest flex items-center gap-2.5 text-slate-950">
                      <Utensils size={18} className="text-rose-600" /> BREAK RULESETS
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1.5 px-7">
                      Automated meal and recovery allocations
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Select Project:</span>
                    <select
                      className="p-2 px-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-rose-600 uppercase tracking-widest cursor-pointer focus:ring-1 focus:ring-rose-500 outline-none"
                      value={selectedBreakProject}
                      onChange={(e) => setSelectedBreakProject(e.target.value)}
                    >
                      {PROJECTS.map((pj) => (
                        <option key={pj} value={pj}>{pj}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <label className="text-[9px] font-black text-rose-600 uppercase tracking-widest block mb-4">Standard Break (MIN)</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-rose-500" value={fridayBreak?.normal || 60} onChange={e => setFridayBreak({...fridayBreak, normal: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <label className="text-[9px] font-black text-rose-600 uppercase tracking-widest block mb-4">Short Break (MIN)</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-rose-500" value={fridayBreak?.short || 15} onChange={e => setFridayBreak({...fridayBreak, short: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <label className="text-[9px] font-black text-rose-600 uppercase tracking-widest block mb-4">Special Friday Break (MIN)</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-rose-500" value={fridayBreak?.friday || 90} onChange={e => setFridayBreak({...fridayBreak, friday: parseInt(e.target.value) || 0})} />
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-lg">
                  <h5 className="m-0 font-black text-xs uppercase tracking-widest text-slate-950 mb-6 flex items-center gap-2.5">
                    🕢 SHIFT BREAK TIME SETTINGS PER PROJECT
                  </h5>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight -mt-4 mb-6 leading-relaxed">
                    Define automatic break times for each Shift in this project <span className="text-rose-600 font-black">"{selectedBreakProject}"</span>. 
                    Separate with commas if there are multiple break times (Example: <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono text-[9px] font-black">11:30, 15:00</code>)
                  </p>

                  {isLoadingBreakShifts ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                       <RefreshCw size={24} className="animate-spin text-rose-600" />
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading shift database...</span>
                    </div>
                  ) : breakShifts.length === 0 ? (
                    <div className="py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                       No shifts registered for this project yet. Please register shifts first under the Shift Rules tab.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {breakShifts.map((s) => (
                        <div key={s.code} className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all group">
                          <div className="w-[100px] shrink-0 font-black font-mono text-xs uppercase text-slate-900 border-r border-slate-200 py-1 flex flex-col">
                            <span className="text-rose-600 font-black text-sm">{s.code}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5 tracking-tight font-sans">
                              {s.s} - {s.e}
                            </span>
                          </div>
                          <div className="flex-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                              Waktu Break (Hour Istirahat)
                            </label>
                            <input 
                              type="text" 
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-rose-500 placeholder:text-slate-300 font-mono"
                              placeholder="e.g. 11:30, 15:00"
                              value={autoBreakStrings[s.code] || ''}
                              onChange={e => {
                                setAutoBreakStrings(prev => ({
                                  ...prev,
                                  [s.code]: e.target.value
                                }));
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'puasa' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 max-w-5xl mx-auto space-y-10">
                {/* Header & Filter Project */}
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h4 className="m-0 font-black text-base uppercase tracking-widest flex items-center gap-2.5 text-slate-950">
                      <Moon size={18} className="text-rose-600 animate-pulse" /> FASTING & SPECIAL EVENT CALENDAR
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1.5 px-7">
                      Set fasting periods, automated work hour deductions, and break time reductions
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Select Project:</span>
                    <select
                      className="p-2 px-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-rose-600 uppercase tracking-widest cursor-pointer focus:ring-1 focus:ring-rose-500 outline-none"
                      value={selectedFastingProject}
                      onChange={(e) => setSelectedFastingProject(e.target.value)}
                    >
                      {PROJECTS.map((pj) => (
                        <option key={pj} value={pj}>{pj}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Periode Puasa (Fasting Calendar Periods) */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-lg">
                  <h5 className="m-0 font-black text-xs uppercase tracking-widest text-slate-950 mb-6 flex items-center gap-2">
                    <Calendar size={16} className="text-rose-600" /> 📅 ADD FASTING PERIOD / SPECIAL EVENT
                  </h5>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight -mt-4 mb-6 leading-relaxed">
                    Register date ranges to enable automatic work hour deductions and break reductions in the dashboard:
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 items-end mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="flex-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Start Date</label>
                      <input 
                        type="date" 
                        value={newPuasaStart} 
                        onChange={e => setNewPuasaStart(e.target.value)} 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-rose-500" 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">End Date</label>
                      <input 
                        type="date" 
                        value={newPuasaEnd} 
                        onChange={e => setNewPuasaEnd(e.target.value)} 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-rose-500" 
                      />
                    </div>
                    <button 
                      onClick={() => {
                        if (!newPuasaStart || !newPuasaEnd) {
                          alert("Select start and end date first!");
                          return;
                        }
                        if (new Date(newPuasaStart) > new Date(newPuasaEnd)) {
                          alert("Start date cannot exceed end date!");
                          return;
                        }
                        setPuasa([...puasa, { start: newPuasaStart, end: newPuasaEnd }]);
                        setNewPuasaStart('');
                        setNewPuasaEnd('');
                        showStatus("Event period added! Please click 'Commit Configuration' to save permanently. ✅");
                      }}
                      className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-md hover:scale-105"
                    >
                      <Plus size={15} /> Add Period
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {puasa.length === 0 ? (
                      <div className="sm:col-span-2 py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                        No fasting periods registered. Create above to enable automatic work hours reductions.
                      </div>
                    ) : (
                      puasa.map((p, i) => (
                        <div key={i} className="flex gap-4 items-center bg-slate-50 p-4 px-5 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all shadow-sm group">
                          <Moon size={15} className="text-rose-600 animate-pulse shrink-0" />
                          <div className="font-mono text-xs font-black text-slate-800 flex-1 flex items-center gap-2">
                            <span>{p.start}</span>
                            <span className="text-slate-300 font-sans">to</span>
                            <span>{p.end}</span>
                          </div>
                          <button 
                            className="text-slate-300 hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-slate-100" 
                            onClick={() => {
                              setPuasa(puasa.filter((_, idx) => idx !== i));
                              showStatus("Fasting period deleted. Click 'Commit Configuration' to save.");
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Auto-Reduction Settings (Auto-Reduction Calculators) */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-lg">
                  <h5 className="m-0 font-black text-xs uppercase tracking-widest text-slate-950 mb-6 flex items-center gap-2">
                    <Zap size={16} className="text-rose-600" /> ⚡ AUTOMATIC WORK HOURS & BREAK REDUCTION CALCULATOR
                  </h5>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight -mt-4 mb-6 leading-relaxed">
                    Define constraints below to shorten work hours for all shifts and reduce break times instantly:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div>
                      <label className="text-[9px] font-black text-rose-600 uppercase tracking-widest block mb-2">Shorten Work Hours (MINUTES)</label>
                      <input 
                        type="number" 
                        value={autoReduceMinutes} 
                        onChange={e => setAutoReduceMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full p-4.5 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-rose-500 font-mono" 
                        placeholder="e.g., 60"
                      />
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight mt-1.5 block">Work hours reduced (e.g., Finish 1 hour earlier)</span>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-rose-600 uppercase tracking-widest block mb-2">Fasting Break Duration (MINUTES)</label>
                      <input 
                        type="number" 
                        value={autoReduceBreakMinutes} 
                        onChange={e => setAutoReduceBreakMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full p-4.5 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-rose-500 font-mono" 
                        placeholder="e.g., 30"
                      />
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight mt-1.5 block">Break hours reduced to this limit (e.g., 30 minutes)</span>
                    </div>

                    <button
                      onClick={handleAutoApplyFastingRules}
                      className="w-full p-4 bg-slate-950 text-white hover:bg-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] border border-slate-800"
                    >
                      <Zap size={14} className="text-yellow-400 fill-yellow-400" /> Auto Apply
                    </button>
                  </div>
                </div>

                {/* Work Hours & Break Settings Per Shift */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-lg">
                  <h5 className="m-0 font-black text-xs uppercase tracking-widest text-slate-950 mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-rose-600 animate-pulse" /> 🕜 FASTING SHIFT WORK HOURS & BREAK DETAILS (PROJECT: {selectedFastingProject})
                  </h5>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-8 leading-relaxed">
                    List of special work hours & break durations (in minutes) for each shift during active fasting periods. You can edit them manually or use the recalculation button above.
                  </p>

                  {isLoadingFastingShifts ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-rose-600" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading shift database...</span>
                    </div>
                  ) : fastingProjectShifts.length === 0 ? (
                    <div className="py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                      No shifts registered for this project yet. Please register shifts first under the Shift Rules tab.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {fastingProjectShifts.map((s) => {
                        const fastS = puasaShifts[s.code]?.s || s.s;
                        const fastE = puasaShifts[s.code]?.e || s.e;
                        const fastB = puasaShifts[s.code]?.b || 60;
                        
                        return (
                          <div key={s.code} className="flex flex-col lg:flex-row gap-4 items-start lg:items-center bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all hover:shadow-sm">
                            {/* Shift Info */}
                            <div className="w-[140px] shrink-0 font-black font-mono uppercase text-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pr-4 flex flex-col justify-center">
                              <span className="text-rose-600 font-black text-sm">{s.code}</span>
                              <span className="text-[8.5px] font-bold text-slate-400 uppercase mt-1 tracking-wider font-sans whitespace-nowrap">
                                Normal: {s.s} - {s.e}
                              </span>
                            </div>

                            {/* Shift Adjustments */}
                            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                  Fasting Shift Start
                                </label>
                                <input 
                                  type="text" 
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-rose-500 font-mono text-center"
                                  value={fastS}
                                  placeholder="07:00"
                                  onChange={e => {
                                    setPuasaShifts(prev => ({
                                      ...prev,
                                      [s.code]: {
                                        s: e.target.value,
                                        e: prev[s.code]?.e || s.e,
                                        b: prev[s.code]?.b || 60
                                      }
                                    }));
                                  }}
                                />
                              </div>

                              <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                  Fasting Shift End (Cut Hour)
                                </label>
                                <input 
                                  type="text" 
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-rose-500 font-mono text-center"
                                  value={fastE}
                                  placeholder="15:00"
                                  onChange={e => {
                                    setPuasaShifts(prev => ({
                                      ...prev,
                                      [s.code]: {
                                        s: prev[s.code]?.s || s.s,
                                        e: e.target.value,
                                        b: prev[s.code]?.b || 60
                                      }
                                    }));
                                  }}
                                />
                              </div>

                              <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                  Fasting Break (MINUTES)
                                  <span className="text-rose-600 ml-1">(-Break)</span>
                                </label>
                                <input 
                                  type="number" 
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-rose-500 font-mono text-center text-rose-600"
                                  value={fastB}
                                  placeholder="30"
                                  onChange={e => {
                                    setPuasaShifts(prev => ({
                                      ...prev,
                                      [s.code]: {
                                        s: prev[s.code]?.s || s.s,
                                        e: prev[s.code]?.e || s.e,
                                        b: parseInt(e.target.value) || 0
                                      }
                                    }));
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeModule === 'infra' && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300 p-6 md:p-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
            <div className="flex-1">
              <h4 className="m-0 mb-2 text-slate-900 text-base font-black flex items-center gap-2.5 tracking-widest uppercase">
                <Database size={18} className="text-rose-600" />
                SUPABASE INFRASTRUCTURE
              </h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Cloud Firestore & Auth Protocol (PostgREST)</p>
              <div className="mt-8 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Project Endpoint (URL)</label>
                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-tighter italic">Found in Settings {'>'} API</span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="https://your-project.supabase.co"
                    value={supabaseConfig.url}
                    onChange={(e) => setSupabaseConfig({...supabaseConfig, url: e.target.value})}
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-slate-900 text-xs font-black outline-none focus:border-rose-500 transition-all font-mono placeholder:text-slate-300" 
                  />
                  <p className="text-[8px] text-slate-400 font-bold mt-3 px-1 uppercase tracking-tight">Warning: Core system uses environment variables for live connections. UI updates metadata only.</p>
                </div>
              </div>
              {dbStatus && (
                <div className={`mt-6 p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 ${dbStatus.status === 'ok' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-rose-500/10 border-rose-500/30 text-rose-600'}`}>
                  <AlertCircle size={15} />
                  {dbStatus.status === 'ok' ? `${dbStatus.service} Connection Active & Secured` : dbStatus.error || 'Connection Failed'}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto self-end">
              <button 
                disabled={isTestingDb}
                onClick={handleTestConnection} 
                className="flex-1 md:flex-none px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all bg-white border border-slate-200 text-slate-950 hover:bg-slate-50 shadow-xl active:scale-95 disabled:opacity-50"
              >
                {isTestingDb ? <RefreshCw size={14} className="animate-spin" /> : null}
                {isTestingDb ? 'Verifying...' : 'Check Status'}
              </button>
              <button 
                disabled={isSavingDb}
                onClick={handleSaveDbUrl}
                className="flex-1 md:flex-none px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all bg-rose-600 text-white hover:bg-rose-700 shadow-xl shadow-rose-900/10 active:scale-95 disabled:opacity-50"
              >
                {isSavingDb ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {isSavingDb ? 'Updating...' : 'Commit Configuration'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-3 px-1">Anon Public Key</label>
                <input 
                  type="password" 
                  value={supabaseConfig.anonKey} 
                  onChange={e => setSupabaseConfig({...supabaseConfig, anonKey: e.target.value})} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-black outline-none focus:border-rose-500 transition-all font-mono" 
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-3 px-1">Service Tier</label>
                <input type="text" readOnly value="Supabase Enterprise" className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-400 text-[10px] font-black outline-none transition-all font-mono" />
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-3 px-1">Auth Provider</label>
                <input type="text" readOnly value="GoTrue / Identity" className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-400 text-[10px] font-black outline-none transition-all font-mono" />
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase tracking-tight">
                  System ensures connectivity via Supabase-JS SDK. Anon key allows public access based on RLS (Row Level Security) policies defined in the portal.
                </p>
              </div>
            </div>
          </div>

          {/* Automated PostgreSQL Table Creator via Backend Server Script */}
          <div className="mt-12 p-8 bg-indigo-50/50 border border-indigo-100 rounded-[2.5rem] relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div>
                <h5 className="text-xs font-black uppercase tracking-wider text-indigo-950 flex items-center gap-2">
                  <Database size={18} className="text-indigo-600 animate-pulse" />
                  AUTOMATIC TABLE INSTALLATION (ONE-CLICK DATABASE INITIALIZER)
                </h5>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Safe method to construct the entire workforce database schemas instantly in Supabase
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-indigo-100/60 shadow-sm space-y-5 relative z-10">
              <div>
                <label className="text-[9px] font-black text-indigo-950 uppercase tracking-widest block mb-1.5 px-1">
                  PostgreSQL Connection URI (DATABASE_URL)
                </label>
                <input 
                  type="password" 
                  placeholder="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
                  value={postgresConnectionString}
                  onChange={(e) => setPostgresConnectionString(e.target.value)}
                  className="w-full p-4.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-black outline-none focus:border-indigo-500 transition-all font-mono placeholder:text-slate-300"
                />
                <p className="text-[8.5px] text-slate-400 font-bold leading-normal mt-2.5 px-1 uppercase tracking-tight">
                  TIPS: You can copy this URI from your Supabase dashboard at <span className="text-indigo-600 font-black">Project Settings &gt; Database &gt; Connection string &gt; URI</span> (Use Session Pooler or Transaction Pooler mode and replace your password).
                </p>
              </div>

              {initResult.status !== 'idle' && (
                <div className={`p-4.5 rounded-2xl border text-[10px] font-black uppercase tracking-wider leading-relaxed ${initResult.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700' : 'bg-rose-500/10 border-rose-500/30 text-rose-600'}`}>
                  {initResult.status === 'success' ? 'Completed: ' : 'Error: '}
                  {initResult.message}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  disabled={isInitializingTables}
                  onClick={handleInitializeTables}
                  className="w-full sm:w-auto px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 disabled:opacity-50 shadow-md shadow-indigo-100 cursor-pointer text-center"
                >
                  {isInitializingTables ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />}
                  {isInitializingTables ? 'Processing Migration...' : 'Run Supabase Table Initialization'}
                </button>
              </div>
            </div>
          </div>

          {/* New Guided SQL Setup Tool */}
          <div className="mt-12 pt-8 border-t border-slate-100 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <FileCheck size={16} className="text-[#6366f1]" />
                  SUPABASE SQL EDITOR SCHEMAS (MIGRATION STACK)
                </h5>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">
                  Copy the entire SQL query below to create the 'workforce', 'interval_requirements', and 'master_shifts' tables instantly
                </p>
              </div>
              <button
                onClick={() => {
                  const sqlText = `-- SQL Schema for 'workforce', 'interval_requirements', 'roster_schedule', and 'master_shifts' on Supabase\n` +
                    `-- Supabase Dashboard -> SQL Editor -> New Query -> Paste -> Run\n\n` +
                    `-- 1. Buat Tabel 'workforce'\n` +
                    `CREATE TABLE IF NOT EXISTS public.workforce (\n` +
                    `    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\n` +
                    `    nip VARCHAR(255) NOT NULL,\n` +
                    `    name VARCHAR(255) NOT NULL,\n` +
                    `    skill VARCHAR(255) DEFAULT 'English',\n` +
                    `    channel VARCHAR(255) DEFAULT 'Voice',\n` +
                    `    gender VARCHAR(255) DEFAULT 'Male',\n` +
                    `    religion VARCHAR(255) DEFAULT 'Islam',\n` +
                    `    project VARCHAR(255) DEFAULT 'Project Alpha',\n` +
                    `    unit VARCHAR(255) DEFAULT 'Unit A',\n` +
                    `    site VARCHAR(255) DEFAULT 'Jakarta',\n` +
                    `    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n` +
                    `);\n\n` +
                    `-- 2. Aktifkan RLS for workforce\n` +
                    `ALTER TABLE public.workforce ENABLE ROW LEVEL SECURITY;\n\n` +
                    `-- 3. Kebijakan RLS workforce\n` +
                    `CREATE POLICY "Allow public read access" ON public.workforce FOR SELECT USING (true);\n` +
                    `CREATE POLICY "Allow public insert access" ON public.workforce FOR INSERT WITH CHECK (true);\n` +
                    `CREATE POLICY "Allow public update access" ON public.workforce FOR UPDATE USING (true) WITH CHECK (true);\n` +
                    `CREATE POLICY "Allow public delete access" ON public.workforce FOR DELETE USING (true);\n\n` +
                    `-- 4. Buat Tabel 'interval_requirements'\n` +
                    `CREATE TABLE IF NOT EXISTS public.interval_requirements (\n` +
                    `    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\n` +
                    `    project VARCHAR(255) DEFAULT 'default' NOT NULL,\n` +
                    `    date DATE NOT NULL,\n` +
                    `    time_slot VARCHAR(255) NOT NULL,\n` +
                    `    required_agents INTEGER DEFAULT 0 NOT NULL,\n` +
                    `    interval_type VARCHAR(50) DEFAULT '1h' NOT NULL,\n` +
                    `    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,\n` +
                    `    CONSTRAINT unique_requirement UNIQUE (date, time_slot, interval_type, project)\n` +
                    `);\n\n` +
                    `-- 5. Aktifkan RLS for interval_requirements\n` +
                    `ALTER TABLE public.interval_requirements ENABLE ROW LEVEL SECURITY;\n\n` +
                    `-- 6. Kebijakan RLS interval_requirements\n` +
                    `CREATE POLICY "Allow public read interval_requirements" ON public.interval_requirements FOR SELECT USING (true);\n` +
                    `CREATE POLICY "Allow public insert interval_requirements" ON public.interval_requirements FOR INSERT WITH CHECK (true);\n` +
                    `CREATE POLICY "Allow public update interval_requirements" ON public.interval_requirements FOR UPDATE USING (true) WITH CHECK (true);\n` +
                    `CREATE POLICY "Allow public delete interval_requirements" ON public.interval_requirements FOR DELETE USING (true);\n\n` +
                    `-- 7. Buat Tabel 'roster_schedule'\n` +
                    `CREATE TABLE IF NOT EXISTS public.roster_schedule (\n` +
                    `    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\n` +
                    `    date DATE NOT NULL,\n` +
                    `    emp_id VARCHAR(255) NOT NULL,\n` +
                    `    project VARCHAR(255) NOT NULL,\n` +
                    `    shift_code VARCHAR(50) NOT NULL,\n` +
                    `    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,\n` +
                    `    CONSTRAINT unique_roster_record UNIQUE (date, emp_id, project)\n` +
                    `);\n\n` +
                    `-- 8. Aktifkan RLS for roster_schedule\n` +
                    `ALTER TABLE public.roster_schedule ENABLE ROW LEVEL SECURITY;\n\n` +
                    `-- 9. Kebijakan RLS roster_schedule\n` +
                    `CREATE POLICY "Allow public read roster_schedule" ON public.roster_schedule FOR SELECT USING (true);\n` +
                    `CREATE POLICY "Allow public insert roster_schedule" ON public.roster_schedule FOR INSERT WITH CHECK (true);\n` +
                    `CREATE POLICY "Allow public update roster_schedule" ON public.roster_schedule FOR UPDATE USING (true) WITH CHECK (true);\n` +
                    `CREATE POLICY "Allow public delete roster_schedule" ON public.roster_schedule FOR DELETE USING (true);\n\n` +
                    `-- 10. Buat Tabel 'master_shifts' (Tabel Terpisah for Master Shift Registry)\n` +
                    `CREATE TABLE IF NOT EXISTS public.master_shifts (\n` +
                    `    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\n` +
                    `    project VARCHAR(255) NOT NULL,\n` +
                    `    code VARCHAR(50) NOT NULL,\n` +
                    `    start_time VARCHAR(10) NOT NULL,\n` +
                    `    end_time VARCHAR(10) NOT NULL,\n` +
                    `    weight INTEGER DEFAULT 1 NOT NULL,\n` +
                    `    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,\n` +
                    `    CONSTRAINT unique_project_shift_code UNIQUE (project, code)\n` +
                    `);\n\n` +
                    `-- 11. Aktifkan RLS for master_shifts\n` +
                    `ALTER TABLE public.master_shifts ENABLE ROW LEVEL SECURITY;\n\n` +
                    `-- 12. Kebijakan RLS master_shifts\n` +
                    `CREATE POLICY "Allow public read master_shifts" ON public.master_shifts FOR SELECT USING (true);\n` +
                    `CREATE POLICY "Allow public insert master_shifts" ON public.master_shifts FOR INSERT WITH CHECK (true);\n` +
                    `CREATE POLICY "Allow public update master_shifts" ON public.master_shifts FOR UPDATE USING (true) WITH CHECK (true);\n` +
                    `CREATE POLICY "Allow public delete master_shifts" ON public.master_shifts FOR DELETE USING (true);\n\n` +
                    `-- 13. Buat Tabel 'portal_settings' (Penyimpanan Konfigurasi Workforce di Supabase)\n` +
                    `CREATE TABLE IF NOT EXISTS public.portal_settings (\n` +
                    `    id VARCHAR(255) PRIMARY KEY,\n` +
                    `    settings JSONB NOT NULL,\n` +
                    `    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n` +
                    `);\n\n` +
                    `-- 14. Aktifkan RLS for portal_settings\n` +
                    `ALTER TABLE public.portal_settings ENABLE ROW LEVEL SECURITY;\n\n` +
                    `-- 15. Kebijakan RLS portal_settings\n` +
                    `CREATE POLICY "Allow public read portal_settings" ON public.portal_settings FOR SELECT USING (true);\n` +
                    `CREATE POLICY "Allow public insert portal_settings" ON public.portal_settings FOR INSERT WITH CHECK (true);\n` +
                    `CREATE POLICY "Allow public update portal_settings" ON public.portal_settings FOR UPDATE USING (true) WITH CHECK (true);\n` +
                    `CREATE POLICY "Allow public delete portal_settings" ON public.portal_settings FOR DELETE USING (true);`;
                  navigator.clipboard.writeText(sqlText);
                  alert("SQL Schema successfully copied to clipboard! 👍");
                }}
                className="px-4 py-2 bg-[#6366f1] text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#4f46e5] transition-colors shadow-md flex items-center gap-1.5"
              >
                <Database size={12} /> Copy SQL Script
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-950 rounded-2xl p-5 relative font-mono text-[10px] text-slate-300 leading-relaxed overflow-x-auto max-h-[350px] space-y-4">
              <div className="text-slate-500 font-sans border-b border-white/5 pb-2 uppercase tracking-wide flex justify-between select-none">
                <span>Schema Migration Stack</span>
                <span>SQL RAW</span>
              </div>
              <pre className="select-all">
{`-- 1. Buat Tabel 'workforce'
CREATE TABLE IF NOT EXISTS public.workforce (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    nip VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    skill VARCHAR(255) DEFAULT 'English',
    channel VARCHAR(255) DEFAULT 'Voice',
    gender VARCHAR(255) DEFAULT 'Male',
    religion VARCHAR(255) DEFAULT 'Islam',
    project VARCHAR(255) DEFAULT 'Project Alpha',
    unit VARCHAR(255) DEFAULT 'Unit A',
    site VARCHAR(255) DEFAULT 'Jakarta',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Aktifkan RLS (Row Level Security)
ALTER TABLE public.workforce ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan Keamanan (RLS Policies)
CREATE POLICY "Allow public read access" ON public.workforce FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.workforce FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.workforce FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access" ON public.workforce FOR DELETE USING (true);

-- 4. Buat Tabel 'interval_requirements'
CREATE TABLE IF NOT EXISTS public.interval_requirements (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    project VARCHAR(255) DEFAULT 'default' NOT NULL,
    date DATE NOT NULL,
    time_slot VARCHAR(255) NOT NULL,
    required_agents INTEGER DEFAULT 0 NOT NULL,
    interval_type VARCHAR(50) DEFAULT '1h' NOT NULL, -- '15m', '30m', '1h'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_requirement UNIQUE (date, time_slot, interval_type, project)
);

-- 5. Aktifkan RLS
ALTER TABLE public.interval_requirements ENABLE ROW LEVEL SECURITY;

-- 6. Kebijakan Keamanan (RLS Policies)
CREATE POLICY "Allow public read interval_requirements" ON public.interval_requirements FOR SELECT USING (true);
CREATE POLICY "Allow public insert interval_requirements" ON public.interval_requirements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update interval_requirements" ON public.interval_requirements FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete interval_requirements" ON public.interval_requirements FOR DELETE USING (true);

-- 7. Buat Tabel 'roster_schedule'
CREATE TABLE IF NOT EXISTS public.roster_schedule (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    date DATE NOT NULL,
    emp_id VARCHAR(255) NOT NULL,
    project VARCHAR(255) NOT NULL,
    shift_code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_roster_record UNIQUE (date, emp_id, project)
);

-- 8. Aktifkan RLS for roster_schedule
ALTER TABLE public.roster_schedule ENABLE ROW LEVEL SECURITY;

-- 9. Kebijakan Keamanan (RLS Policies)
CREATE POLICY "Allow public read roster_schedule" ON public.roster_schedule FOR SELECT USING (true);
CREATE POLICY "Allow public insert roster_schedule" ON public.roster_schedule FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update roster_schedule" ON public.roster_schedule FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete roster_schedule" ON public.roster_schedule FOR DELETE USING (true);

-- 10. Buat Tabel 'master_shifts' (Tabel Terpisah for Master Shift Registry)
CREATE TABLE IF NOT EXISTS public.master_shifts (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    project VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    weight INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_project_shift_code UNIQUE (project, code)
);

-- 11. Aktifkan RLS for master_shifts
ALTER TABLE public.master_shifts ENABLE ROW LEVEL SECURITY;

-- 12. Kebijakan Keamanan (RLS Policies)
CREATE POLICY "Allow public read master_shifts" ON public.master_shifts FOR SELECT USING (true);
CREATE POLICY "Allow public insert master_shifts" ON public.master_shifts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update master_shifts" ON public.master_shifts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete master_shifts" ON public.master_shifts FOR DELETE USING (true);

-- 13. Buat Tabel 'portal_settings'
CREATE TABLE IF NOT EXISTS public.portal_settings (
    id VARCHAR(255) PRIMARY KEY,
    settings JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. Aktifkan RLS for portal_settings
ALTER TABLE public.portal_settings ENABLE ROW LEVEL SECURITY;

-- 15. Kebijakan Keamanan (RLS Policies)
CREATE POLICY "Allow public read portal_settings" ON public.portal_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert portal_settings" ON public.portal_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update portal_settings" ON public.portal_settings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete portal_settings" ON public.portal_settings FOR DELETE USING (true);`}
              </pre>
            </div>

            <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl flex items-start gap-3">
              <span className="text-sky-600 font-bold shrink-0 mt-0.5 font-sans">💡 Step:</span>
              <p className="text-[10px] text-sky-950 font-bold uppercase tracking-wider leading-relaxed">
                Please open your Supabase dashboard at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline font-black hover:text-sky-700">supabase.com</a>, enter your active project, select the <strong>SQL Editor</strong> menu, click <strong>"New Query"</strong>, paste the above SQL script entirely, and press the <strong>"Run"</strong> button. The automation interval tabular data will be cloud-accessible and saved instantly!
              </p>
            </div>
          </div>
        </div>
      )}

        {activeModule === 'hc' && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300 p-6 md:p-10">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                 <h4 className="text-[11px] font-black uppercase tracking-widest mb-6 border-b border-slate-200 pb-4">Employment Classifications</h4>
                 <div className="space-y-3">
                   {employeeTypes.map((type, i) => (
                     <div key={i} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 font-black text-[10px] uppercase tracking-widest">
                       {type}
                       <Trash2 size={14} className="text-slate-300 cursor-pointer hover:text-rose-600 transition-colors" />
                     </div>
                   ))}
                   <button className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-sm">+ Add Classification</button>
                 </div>
               </div>
               <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                 <h4 className="text-[11px] font-black uppercase tracking-widest mb-6 border-b border-slate-200 pb-4">Organizational Departments</h4>
                 <div className="space-y-3">
                   {departments.map((dept, i) => (
                     <div key={i} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 font-black text-[10px] uppercase tracking-widest">
                       {dept}
                       <Trash2 size={14} className="text-slate-300 cursor-pointer hover:text-rose-600 transition-colors" />
                     </div>
                   ))}
                   <button className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-sm">+ Add Department</button>
                 </div>
               </div>
             </div>
          </div>
        )}

        {activeModule === 'security' && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300 p-6 md:p-10">
             <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 mb-8">
                <h4 className="text-[11px] font-black uppercase tracking-widest mb-6 border-b border-slate-200 pb-4">Standard Account Prefixes</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {Object.entries(idPrefixes).map(([key, val]) => (
                     <div key={key}>
                       <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block">{key} System ID</label>
                       <input type="text" value={val} onChange={(e) => setIdPrefixes({...idPrefixes, [key]: e.target.value})} className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-rose-500 transition-all font-mono" />
                     </div>
                   ))}
                </div>
             </div>
             <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                <h4 className="text-[11px] font-black uppercase tracking-widest mb-6 border-b border-slate-200 pb-4">Approval Matrix Presets</h4>
                <div className="space-y-2">
                   {approvalFlows.map(flow => (
                     <div key={flow} className="p-4 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{flow} Flow Path</span>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500" />
                           <span className="text-[9px] font-black text-emerald-600 uppercase">Production Active</span>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeModule === 'analytics' && (
           <div className="animate-in fade-in slide-in-from-top-4 duration-300 p-6 md:p-10">
              <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200 shadow-sm mb-10">
                 <h4 className="text-slate-900 text-xs font-black uppercase tracking-[0.2em] mb-8">Performance Target Kernels</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {Object.entries(kpiTargets).map(([key, val]) => (
                       <div key={key} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-4">{key}</label>
                          <div className="flex items-end gap-2">
                             <input type="number" value={val} onChange={(e) => setKpiTargets({...kpiTargets, [key]: parseInt(e.target.value)})} className="bg-transparent text-slate-900 text-3xl font-black outline-none w-20" />
                             <span className="text-rose-600 font-black mb-1">{key === 'AHT' ? 's' : '%'}</span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

         </div>
        </div>
      </div>
  );
};
export default Settings;
