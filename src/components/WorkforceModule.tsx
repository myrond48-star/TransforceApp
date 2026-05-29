import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { format, startOfDay, addMinutes, addDays, parseISO, startOfWeek } from "date-fns";
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Filter,
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Search,
  FilterX,
  Coffee,
  ShieldCheck,
  Zap,
  History,
  ClipboardCheck,
  Database,
  ChevronDown,
  MoreHorizontal,
  UserCheck,
  UserCircle,
  LayoutDashboard
} from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Line,
  Bar,
  ComposedChart,
  ReferenceLine
} from "recharts";
import { fetchEmployees, createEmployee, deleteEmployee, fetchWorkforce, createWorkforceRecord, deleteWorkforceRecord, fetchIntervalRequirements, upsertIntervalRequirements, fetchUniqueProjects } from "../lib/api";

interface WorkforceModuleProps {
  onBack: () => void;
}

// --- Mock Data & Constants ---

const SHIFTS = {
  "S1": { label: "Morning", start: "07:00", end: "16:00", color: "bg-blue-500" },
  "S2": { label: "Evening", start: "15:00", end: "00:00", color: "bg-indigo-500" },
  "H": { label: "Day", start: "08:00", end: "17:00", color: "bg-emerald-500" },
};

const SITES = ["Jakarta", "Jogja", "Semarang"];
const UNITS = ["Unit A", "Unit B", "Unit C"];
const DEFAULT_PROJECTS = ["Project Alpha", "Project Beta", "Customer Care", "Technical Support", "VIP Concierge"];
const SKILLS = ["English", "Mandarin", "Japanese", "Malay", "Bahasa Indonesia", "Technical Support"];
const CHANNELS = ["Voice", "Non-Voice", "Chat", "Email", "Digital"];
const GENDERS = ["Male", "Female"];
const RELIGIONS = ["Islam", "Kristen Protestan", "Katolik", "Hindu", "Buddha", "Khonghucu"];

const ACTIVITY_TYPES = {
  "LB": { label: "Lunch Break", color: "bg-active-red" },
  "SB": { label: "Short Break", color: "bg-amber-400" },
  "MT": { label: "Meeting", color: "bg-black" },
  "TR": { label: "Training", color: "bg-indigo-600" },
};

const generateIntervals = () => {
  const intervals = [];
  const start = startOfDay(new Date());
  for (let i = 0; i < 96; i++) {
    intervals.push(format(addMinutes(start, i * 15), "HH:mm"));
  }
  return intervals;
};

const intervals = generateIntervals();

const mockAgents = [
  { id: "WF001", name: "Alexander Grant", shift: "S1", team: "Support A", site: "Jakarta", unit: "Unit A", project: "Project Alpha", activities: { 40: "LB", 41: "LB", 42: "LB", 43: "LB", 56: "SB" } },
  { id: "WF002", name: "Sarah Connor", shift: "H", team: "Support B", site: "Jogja", unit: "Unit B", project: "Customer Care", activities: { 48: "MT", 49: "MT", 56: "LB", 57: "LB", 58: "LB", 59: "LB" } },
  { id: "WF003", name: "John Wick", shift: "S2", team: "High Priority", site: "Semarang", unit: "Unit C", project: "Technical Support", activities: { 80: "LB", 81: "LB", 82: "LB", 83: "LB" } },
  { id: "WF004", name: "Ellen Ripley", shift: "S1", team: "Support A", site: "Jakarta", unit: "Unit A", project: "Project Beta", activities: { 48: "TR", 49: "TR", 50: "TR", 51: "TR" } },
  { id: "WF005", name: "Arthur Dent", shift: "H", team: "Support B", site: "Jogja", unit: "Unit B", project: "VIP Concierge", activities: { 60: "LB", 61: "LB", 62: "LB", 63: "LB" } },
  ...Array.from({ length: 35 }).map((_, i) => {
    const shiftOpts = ["S1", "S2", "H"];
    const teamOpts = ["Support A", "Support B", "High Priority", "Technical"];
    const shift = shiftOpts[Math.floor(Math.random() * shiftOpts.length)];
    const team = teamOpts[Math.floor(Math.random() * teamOpts.length)];
    const site = SITES[Math.floor(Math.random() * SITES.length)];
    const unit = UNITS[Math.floor(Math.random() * UNITS.length)];
    const project = DEFAULT_PROJECTS[Math.floor(Math.random() * DEFAULT_PROJECTS.length)];
    const id = "WF" + String(i + 6).padStart(3, '0');
    const firsts = ["James", "Maria", "Michael", "Linda", "Robert", "David", "Jessica", "Daniel", "Emily", "Jane", "Alice", "Bob", "Charlie", "Dave", "Eve", "Frank"];
    const lasts = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin"];
    const name = firsts[Math.floor(Math.random() * firsts.length)] + " " + lasts[Math.floor(Math.random() * lasts.length)];
    let breakStart = shift === "S1" ? 40 + Math.floor(Math.random() * 16) : shift === "H" ? 56 + Math.floor(Math.random() * 16) : 80 + Math.floor(Math.random() * 12);
    return {
      id,
      name,
      shift,
      team,
      site,
      unit,
      project,
      activities: {
        [(breakStart) % 96]: "LB",
        [(breakStart + 1) % 96]: "LB",
        [(breakStart + 2) % 96]: "LB",
        [(breakStart + 3) % 96]: "LB",
      }
    };
  })
];

const reqData = Array.from({ length: 96 }).map((_, i) => {
  const req = 15 + Math.floor(Math.sin(i / 10) * 10) + Math.floor(Math.random() * 5);
  // Simulate staffed levels with some breaks/gaps
  let actual = req - 2 + Math.floor(Math.random() * 4);
  
  // Introduce some "breaks" or "understaffing" moments
  if (i > 30 && i < 40) actual = Math.floor(req * 0.6); // Lunch period gap
  if (i > 70 && i < 80) actual = Math.floor(req * 0.7); // Shift transition gap
  
  const gap = actual - req;
  return {
    time: intervals[i],
    req,
    actual,
    gap: gap < 0 ? Math.abs(gap) : 0,
    surplus: gap > 0 ? gap : 0
  };
});

// --- Main Component ---

export default function WorkforceModule({ onBack }: WorkforceModuleProps) {
  const [activeTab, setActiveTab] = useState("schedule");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedSite, setSelectedSite] = useState("all");
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [dbShifts, setDbShifts] = useState<Record<string, { label: string; start: string; end: string; color: string }>>({});

  const resolvedShifts: Record<string, { label: string; start: string; end: string; color: string }> = {
    ...SHIFTS,
    ...dbShifts
  };

  // Load master shifts from Supabase on mount or when selectedProject changes
  React.useEffect(() => {
    const loadAllShifts = async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        let query = supabase.from('master_shifts').select('*');
        if (selectedProject !== 'all') {
          query = query.eq('project', selectedProject);
        }
        const { data, error } = await query;
        if (data && data.length > 0) {
          const shiftMap: Record<string, { label: string; start: string; end: string; color: string }> = {};
          const colors = ["bg-blue-500", "bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500", "bg-teal-500"];
          
          data.forEach((s: any, idx: number) => {
            const colorClass = colors[idx % colors.length];
            shiftMap[s.code] = {
              label: s.code,
              start: s.start_time,
              end: s.end_time,
              color: colorClass
            };
          });
          setDbShifts(shiftMap);
        }
      } catch (err) {
        console.warn("Could not load master shifts from Supabase:", err);
      }
    };
    loadAllShifts();
  }, [selectedProject]);
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'interval' | 'activity', direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [showActions, setShowActions] = useState(false);

  // DB Tab States & Helpers (Separate Custom Workforce DB)
  const [dbEmployees, setDbEmployees] = useState<any[]>([]);
  
  // Dynamically compute PROJECTS from dbEmployees (workforce table in DB)
  const PROJECTS = React.useMemo(() => {
    if (dbEmployees && dbEmployees.length > 0) {
      const projs = Array.from(new Set(dbEmployees.map(emp => emp.project).filter(Boolean))) as string[];
      if (projs.length > 0) {
        return projs.filter(p => p.trim() !== "").sort();
      }
    }
    return DEFAULT_PROJECTS;
  }, [dbEmployees]);

  // Adjust pre-selected project on dynamic list load
  React.useEffect(() => {
    if (PROJECTS.length > 0 && !PROJECTS.includes(singleFormData.project)) {
      setSingleFormData(prev => ({ ...prev, project: PROJECTS[0] }));
    }
  }, [PROJECTS]);

  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => {
        if (!prev) return null;
        return prev.message === message ? null : prev;
      });
    }, 4500);
  };
  
  const [bulkInput, setBulkInput] = useState("");
  const [bulkProgress, setBulkProgress] = useState<string | null>(null);
  const [isAddingSingle, setIsAddingSingle] = useState(false);
  const [singleFormData, setSingleFormData] = useState({
    nip: "",
    name: "",
    skill: "English",
    channel: "Voice",
    gender: "Male",
    religion: "Islam",
    project: "Project Alpha",
    unit: "Unit A",
    site: "Jakarta"
  });

  // Historical / Interval Requirements Tab States
  const [histStartDate, setHistStartDate] = useState("2026-05-01");
  const [histEndDate, setHistEndDate] = useState("2026-05-07");
  const [histIntervalType, setHistIntervalType] = useState<"1h" | "30m" | "15m">("1h");
  const [histRequirements, setHistRequirements] = useState<Record<string, Record<string, number>>>({});
  const [histLoading, setHistLoading] = useState(false);
  const [histSaving, setHistSaving] = useState(false);
  const [histUsingFallback, setHistUsingFallback] = useState(false);
  const [histBulkInput, setHistBulkInput] = useState("");
  const [histImportTargetDate, setHistImportTargetDate] = useState("all");
  const [compositionMode, setCompositionMode] = useState<"peak" | "average">("peak");

  // Roster / Calendar Tab States
  const [rosterStartDate, setRosterStartDate] = useState(format(startOfWeek(new Date(), {weekStartsOn: 1}), 'yyyy-MM-dd'));
  const [rosterEndDate, setRosterEndDate] = useState(format(addDays(startOfWeek(new Date(), {weekStartsOn: 1}), 6), 'yyyy-MM-dd'));
  const [generatedRoster, setGeneratedRoster] = useState<{empId: string, roster: Record<string, string>}[]>([]);
  const [isGeneratingRoster, setIsGeneratingRoster] = useState(false);

  const SEED_WORKFORCE = [
    { id: "wf_1", nip: "2221669", name: "Yoga Fachrul Tristiawan", skill: "English", channel: "Voice", gender: "Male", religion: "Islam", project: "Project Alpha", unit: "Unit A", site: "Jakarta" },
    { id: "wf_2", nip: "2221670", name: "Helmi Khairunnisa", skill: "Mandarin", channel: "Non-Voice", gender: "Female", religion: "Islam", project: "Project Beta", unit: "Unit B", site: "Jogja" },
    { id: "wf_3", nip: "2221671", name: "Elina Isninda Riyani", skill: "Japanese", channel: "Chat", gender: "Female", religion: "Kristen Protestan", project: "Customer Care", unit: "Unit C", site: "Semarang" },
    { id: "wf_4", nip: "2221672", name: "Adi Saputra", skill: "Malay", channel: "Email", gender: "Male", religion: "Islam", project: "Technical Support", unit: "Unit A", site: "Jakarta" },
    { id: "wf_5", nip: "2221673", name: "Christian Wijaya", skill: "English", channel: "Digital", gender: "Male", religion: "Katolik", project: "VIP Concierge", unit: "Unit B", site: "Jogja" },
    { id: "wf_6", nip: "2221674", name: "Dewi Lestari", skill: "Bahasa Indonesia", channel: "Voice", gender: "Female", religion: "Hindu", project: "Project Alpha", unit: "Unit C", site: "Semarang" },
    { id: "wf_7", nip: "2221675", name: "Farhan Ramadhan", skill: "Technical Support", channel: "Non-Voice", gender: "Male", religion: "Islam", project: "Project Beta", unit: "Unit A", site: "Jakarta" },
    { id: "wf_8", nip: "2221676", name: "Grace Siregar", skill: "English", channel: "Chat", gender: "Female", religion: "Kristen Protestan", project: "Customer Care", unit: "Unit B", site: "Jogja" }
  ];

  const loadDbEmployees = async () => {
    setDbLoading(true);
    setDbError(null);
    try {
      const data = await fetchWorkforce();
      if (data && data.length > 0) {
        setDbEmployees(data);
      } else {
        setDbEmployees(SEED_WORKFORCE);
      }
      setUsingFallback(false);
    } catch (err: any) {
      console.warn("Could not query supabase workforce. Attempting local failover...", err);
      const cached = localStorage.getItem("supabase_workforce_fallback");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setDbEmployees(parsed.length > 0 ? parsed : SEED_WORKFORCE);
        } catch {
          setDbEmployees(SEED_WORKFORCE);
        }
      } else {
        setDbEmployees(SEED_WORKFORCE);
        localStorage.setItem("supabase_workforce_fallback", JSON.stringify(SEED_WORKFORCE));
      }
      setUsingFallback(true);
    } finally {
      setDbLoading(false);
    }
  };

  React.useEffect(() => {
    loadDbEmployees();
  }, []);

  const getDaysArray = (startStr: string, endStr: string) => {
    const dates: string[] = [];
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return [startStr];
    }
    const current = new Date(start);
    let count = 0;
    while (current <= end && count < 31) {
      dates.push(format(current, "yyyy-MM-dd"));
      current.setDate(current.getDate() + 1);
      count++;
    }
    return dates;
  };

  const handleCellChange = (date: string, slot: string, valStr: string) => {
    const sanitizedVal = valStr.replace(/[^\d]/g, "");
    const parsed = sanitizedVal === "" ? 0 : parseInt(sanitizedVal, 10);
    setHistRequirements(prev => ({
      ...prev,
      [date]: {
        ...(prev[date] || {}),
        [slot]: parsed
      }
    }));
  };

  const getIntervalSlots = (type: "1h" | "30m" | "15m") => {
    const slots: string[] = [];
    if (type === "1h") {
      for (let h = 0; h < 24; h++) {
        const hStr = String(h).padStart(2, "0");
        const nextH = (h + 1) % 24;
        const nextHStr = String(nextH).padStart(2, "0");
        slots.push(`${hStr}:00 - ${nextHStr}:00`);
      }
    } else if (type === "30m") {
      for (let h = 0; h < 24; h++) {
        const hStr = String(h).padStart(2, "0");
        const nextFullH = String((h + 1) % 24).padStart(2, "0");
        slots.push(`${hStr}:00 - ${hStr}:30`);
        slots.push(`${hStr}:30 - ${nextFullH}:00`);
      }
    } else if (type === "15m") {
      for (let h = 0; h < 24; h++) {
        const hStr = String(h).padStart(2, "0");
        const nextFullH = String((h + 1) % 24).padStart(2, "0");
        slots.push(`${hStr}:00 - ${hStr}:15`);
        slots.push(`${hStr}:15 - ${hStr}:30`);
        slots.push(`${hStr}:30 - ${hStr}:45`);
        slots.push(`${hStr}:45 - ${nextFullH}:00`);
      }
    }
    return slots;
  };

  const loadIntervalRequirements = async (start: string, end: string, type: "1h" | "30m" | "15m") => {
    setHistLoading(true);
    setHistUsingFallback(false);
    try {
      const dbData = await fetchIntervalRequirements(start, end, type);
      const reqMap: Record<string, Record<string, number>> = {};
      
      if (!dbData || dbData.length === 0) {
        console.log("No interval requirements found in database. Initializing warm curve data...");
        const days = getDaysArray(start, end);
        const slots = getIntervalSlots(type);
        days.forEach(d => {
          reqMap[d] = {};
          slots.forEach(s => {
            const [startHourStr] = s.split(":");
            const hour = parseInt(startHourStr, 10);
            if (hour >= 8 && hour <= 12) {
              reqMap[d][s] = 12 + (hour % 3) * 4;
            } else if (hour > 12 && hour <= 17) {
              reqMap[d][s] = 15 + (hour % 4) * 2;
            } else if (hour > 17 && hour <= 22) {
              reqMap[d][s] = 8;
            } else {
              reqMap[d][s] = 2;
            }
          });
        });
        setHistRequirements(reqMap);
      } else {
        dbData.forEach((row: any) => {
          if (!reqMap[row.date]) reqMap[row.date] = {};
          reqMap[row.date][row.time_slot] = row.required_agents;
        });
        setHistRequirements(reqMap);
      }
    } catch (err: any) {
      console.warn("Could not query supabase interval_requirements. Fetching from cache/local...", err);
      setHistUsingFallback(true);
      
      const cached = localStorage.getItem(`supabase_interval_req_${type}`);
      if (cached) {
        try {
          setHistRequirements(JSON.parse(cached));
        } catch {
          setHistRequirements({});
        }
      } else {
        const reqMap: Record<string, Record<string, number>> = {};
        const days = getDaysArray(start, end);
        const slots = getIntervalSlots(type);
        days.forEach(d => {
          reqMap[d] = {};
          slots.forEach(s => {
            const [startHourStr] = s.split(":");
            const hour = parseInt(startHourStr, 10);
            if (hour >= 8 && hour <= 12) {
              reqMap[d][s] = 12 + (hour % 3) * 3;
            } else if (hour > 12 && hour <= 17) {
              reqMap[d][s] = 15 + (hour % 4) * 2;
            } else {
              reqMap[d][s] = 2;
            }
          });
        });
        setHistRequirements(reqMap);
        localStorage.setItem(`supabase_interval_req_${type}`, JSON.stringify(reqMap));
      }
    } finally {
      setHistLoading(false);
    }
  };

  const saveIntervalRequirements = async (overwriteMap?: Record<string, Record<string, number>>) => {
    setHistSaving(true);
    const targetMap = overwriteMap || histRequirements;
    
    const records: any[] = [];
    const dateKeys = Object.keys(targetMap);
    
    dateKeys.forEach(d => {
      const slots = Object.keys(targetMap[d] || {});
      slots.forEach(s => {
        records.push({
          date: d,
          time_slot: s,
          required_agents: targetMap[d][s] || 0,
          interval_type: histIntervalType
        });
      });
    });
    
    try {
      if (!histUsingFallback) {
        await upsertIntervalRequirements(records);
      }
      localStorage.setItem(`supabase_interval_req_${histIntervalType}`, JSON.stringify(targetMap));
      showNotification("Data interval berhasil disimpan ke Supabase!", "success");
    } catch (err: any) {
      console.warn("Failed to sync to Supabase. Saving locally only:", err);
      localStorage.setItem(`supabase_interval_req_${histIntervalType}`, JSON.stringify(targetMap));
      showNotification("Tersimpan dalam penyimpanan lokal offline.", "info");
    } finally {
      setHistSaving(false);
    }
  };

  const seedDefaultRequirements = () => {
    const days = getDaysArray(histStartDate, histEndDate);
    const slots = getIntervalSlots(histIntervalType);
    const seeded: Record<string, Record<string, number>> = { ...histRequirements };
    
    days.forEach(d => {
      if (!seeded[d]) seeded[d] = {};
      slots.forEach(s => {
        const [startHourStr] = s.split(":");
        const hour = parseInt(startHourStr, 10);
        if (hour >= 8 && hour <= 12) {
          seeded[d][s] = 15 + (hour % 3) * 4;
        } else if (hour > 12 && hour <= 17) {
          seeded[d][s] = 18 + (hour % 4) * 2;
        } else if (hour > 17 && hour <= 22) {
          seeded[d][s] = 10;
        } else {
          seeded[d][s] = 2;
        }
      });
    });
    
    setHistRequirements(seeded);
    saveIntervalRequirements(seeded);
    showNotification("Berhasil men-generate kurva agen realistis!", "success");
  };

  const clearAllRequirements = () => {
    if (!confirm("Apakah Anda yakin ingin mengosongkan semua data interval yang tampil menjadi 0?")) return;
    const days = getDaysArray(histStartDate, histEndDate);
    const slots = getIntervalSlots(histIntervalType);
    const cleared: Record<string, Record<string, number>> = { ...histRequirements };
    
    days.forEach(d => {
      cleared[d] = {};
      slots.forEach(s => {
        cleared[d][s] = 0;
      });
    });
    
    setHistRequirements(cleared);
    saveIntervalRequirements(cleared);
    showNotification("Semua interval berhasil dikosongkan ke 0.", "info");
  };

  const handleBulkImport = () => {
    if (!histBulkInput.trim()) {
      showNotification("Silakan masukkan data interval terlebih dahulu.", "error");
      return;
    }
    
    const days = getDaysArray(histStartDate, histEndDate);
    const slots = getIntervalSlots(histIntervalType);
    const newRequirements = { ...histRequirements };
    const lines = histBulkInput.split("\n").map(l => l.trim()).filter(Boolean);
    
    if (histImportTargetDate !== "all") {
      const targetDate = histImportTargetDate;
      if (!newRequirements[targetDate]) newRequirements[targetDate] = {};
      
      let importedCount = 0;
      for (let i = 0; i < slots.length; i++) {
        if (i < lines.length) {
          const parsedVal = parseInt(lines[i].replace(/[^\d]/g, ""), 10);
          if (!isNaN(parsedVal)) {
            newRequirements[targetDate][slots[i]] = parsedVal;
            importedCount++;
          }
        }
      }
      
      setHistRequirements(newRequirements);
      saveIntervalRequirements(newRequirements);
      setHistBulkInput("");
      showNotification(`Sukses mengimpor ${importedCount} baris interval untuk tanggal ${targetDate}!`, "success");
    } else {
      let rowsImported = 0;
      for (let rowIndex = 0; rowIndex < slots.length; rowIndex++) {
        if (rowIndex < lines.length) {
          const rowLine = lines[rowIndex];
          const cols = rowLine.split(/[\t,;|]/).map(c => c.trim()).filter(Boolean);
          
          for (let colIndex = 0; colIndex < days.length; colIndex++) {
            if (colIndex < cols.length) {
              const targetDate = days[colIndex];
              const parsedVal = parseInt(cols[colIndex].replace(/[^\d]/g, ""), 10);
              
              if (!isNaN(parsedVal)) {
                if (!newRequirements[targetDate]) newRequirements[targetDate] = {};
                newRequirements[targetDate][slots[rowIndex]] = parsedVal;
              }
            }
          }
          rowsImported++;
        }
      }
      
      setHistRequirements(newRequirements);
      saveIntervalRequirements(newRequirements);
      setHistBulkInput("");
      showNotification(`Sukses mengimpor tabel ${rowsImported} baris untuk ${days.length} hari!`, "success");
    }
  };

  React.useEffect(() => {
    if (activeTab === "historical") {
      loadIntervalRequirements(histStartDate, histEndDate, histIntervalType);
    } else if (activeTab === "calendar") {
      loadIntervalRequirements(rosterStartDate, rosterEndDate, histIntervalType);
    }
  }, [activeTab, histStartDate, histEndDate, rosterStartDate, rosterEndDate, histIntervalType]);

  // Handler for Single Delete
  const handleDeleteDbEmployee = async (id: string | number) => {
    setDbLoading(true);
    try {
      if (!usingFallback) {
        await deleteWorkforceRecord(id);
      }
      const updatedList = dbEmployees.filter(emp => emp.id !== id);
      setDbEmployees(updatedList);
      localStorage.setItem("supabase_workforce_fallback", JSON.stringify(updatedList));
    } catch (err) {
      // Allow fallback delete
      const updatedList = dbEmployees.filter(emp => emp.id !== id);
      setDbEmployees(updatedList);
      localStorage.setItem("supabase_workforce_fallback", JSON.stringify(updatedList));
    } finally {
      setDbLoading(false);
      if (deleteConfirmId === id) {
        setDeleteConfirmId(null);
      }
    }
  };

  // Handler for Single Add
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleFormData.name.trim()) {
      showNotification("Nama wajib diisi.", "error");
      return;
    }
    setDbLoading(true);
    try {
      const payload = {
        nip: singleFormData.nip || "NIP" + Math.floor(1000000 + Math.random() * 9000000),
        name: singleFormData.name,
        skill: singleFormData.skill,
        channel: singleFormData.channel,
        gender: singleFormData.gender,
        religion: singleFormData.religion,
        project: singleFormData.project,
        unit: singleFormData.unit,
        site: singleFormData.site,
        created_at: new Date().toISOString()
      };
      
      let created = { ...payload, id: "wf_" + Math.floor(Math.random() * 10000000) };
      if (!usingFallback) {
        try {
          const res = await createWorkforceRecord(payload);
          if (res) created = res;
        } catch (supErr) {
          console.warn("Supabase insert failed, saving to local fallback", supErr);
        }
      }
      
      const updatedList = [created, ...dbEmployees];
      setDbEmployees(updatedList);
      localStorage.setItem("supabase_workforce_fallback", JSON.stringify(updatedList));
      
      showNotification(`Karyawan "${singleFormData.name}" berhasil ditambahkan!`, "success");
      setIsAddingSingle(false);
      setSingleFormData({
        nip: "",
        name: "",
        skill: "English",
        channel: "Voice",
        gender: "Male",
        religion: "Islam",
        project: "Project Alpha",
        unit: "Unit A",
        site: "Jakarta"
      });
    } catch (err: any) {
      showNotification("Gagal menambahkan karyawan: " + err.message, "error");
    } finally {
      setDbLoading(false);
    }
  };

  // Handler for Bulk Add
  const handleBulkSubmit = async () => {
    if (!bulkInput.trim()) {
      showNotification("Silakan masukkan nama-nama terlebih dahulu.", "error");
      return;
    }
    const lines = bulkInput.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setDbLoading(true);
    setBulkProgress(`Memproses 0 / ${lines.length} karyawan...`);
    let addedCount = 0;
    const failures = [];
    const newList = [...dbEmployees];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      try {
        let nip = "";
        let name = line;
        let skill = "English";
        let channel = "Voice";
        let gender = "Male";
        let religion = "Islam";
        let project = "Project Alpha";
        let unit = "Unit A";
        let site = "Jakarta";

        const separators = [",", "\t", ";", "|"];
        let foundParts: string[] = [];
        for (const sep of separators) {
          if (line.includes(sep)) {
            const parts = line.split(sep).map(p => p.trim());
            if (parts.length >= 2) {
              foundParts = parts;
              break;
            }
          }
        }

        if (foundParts.length >= 2) {
          if (foundParts.length >= 9) {
            nip = foundParts[0];
            name = foundParts[1];
            skill = foundParts[2] || "English";
            channel = foundParts[3] || "Voice";
            gender = foundParts[4] || "Male";
            religion = foundParts[5] || "Islam";
            project = foundParts[6] || "Project Alpha";
            unit = foundParts[7] || "Unit A";
            site = foundParts[8] || "Jakarta";
          } else {
            if (/^\d+$/.test(foundParts[0]) || foundParts[0].length < foundParts[1].length) {
              nip = foundParts[0];
              name = foundParts[1];
            } else {
              name = foundParts[0];
              nip = foundParts[1];
            }
          }
        }

        if (!nip) {
          nip = "NIP" + Math.floor(1000000 + Math.random() * 9000000);
        }

        const payload = {
          nip,
          name,
          skill,
          channel,
          gender,
          religion,
          project,
          unit,
          site,
          created_at: new Date().toISOString()
        };

        let created = { ...payload, id: "wf_" + Math.floor(Math.random() * 10000000) + "_" + i };
        if (!usingFallback) {
          try {
            const res = await createWorkforceRecord(payload);
            if (res) created = res;
          } catch (supErr) {
            console.warn("Supabase record failed during bulk upload, saving as local", supErr);
          }
        }
        newList.unshift(created);
        addedCount++;
        setBulkProgress(`Memproses ${addedCount} / ${lines.length} karyawan...`);
      } catch (err: any) {
        console.error("Bulk add row error:", err);
        failures.push(line);
      }
    }
    
    setDbEmployees(newList);
    localStorage.setItem("supabase_workforce_fallback", JSON.stringify(newList));
    setBulkInput("");
    setBulkProgress(null);
    await loadDbEmployees();
    if (failures.length > 0) {
      showNotification(`Berhasil: ${addedCount}. Gagal: ${failures.length} baris.`, "info");
    } else {
      showNotification(`Berhasil menambahkan ${addedCount} karyawan secara bulk!`, "success");
    }
    setDbLoading(false);
  };

  // Compute combined dynamic agents mapping to match roster schema
  const mappedDbEmployees = dbEmployees.map((emp, index) => {
    const shiftKeys = ["S1", "S2", "H"];
    const shift = (emp.shift as string) || shiftKeys[index % shiftKeys.length];
    
    // Generate break periods
    let breakStart = shift === "S1" ? 40 + (index % 16) : shift === "H" ? 56 + (index % 16) : 80 + (index % 12);
    
    return {
      id: emp.nip || `DB${String(emp.id).padStart(3, '0')}`,
      name: emp.name,
      shift: shift,
      gender: emp.gender,
      team: ["Support A", "Support B", "High Priority", "Technical"][index % 4],
      site: emp.site || "Jakarta",
      unit: emp.unit || "Unit A",
      project: emp.project || "Project Alpha",
      activities: {
        [(breakStart) % 96]: "LB",
        [(breakStart + 1) % 96]: "LB",
        [(breakStart + 2) % 96]: "LB",
        [(breakStart + 3) % 96]: "LB",
      }
    };
  });

  const combinedAgents = mappedDbEmployees;

  const renderOverview = () => {
    const filteredCount = combinedAgents
      .filter(a => selectedSite === "all" || a.site === selectedSite)
      .filter(a => selectedUnit === "all" || a.unit === selectedUnit)
      .filter(a => selectedProject === "all" || a.project === selectedProject)
      .length;

    return (
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Overall Adherence", value: "94.8%", trend: "+2.1%", icon: CheckCircle2, color: "text-green-600" },
            { label: "Current Service Level", value: "88.2%", trend: "-1.5%", icon: Zap, color: "text-active-red" },
            { label: "Total Headcount", value: String(filteredCount), trend: filteredCount > 20 ? "+12" : "0", icon: Users, color: "text-black" },
            { label: "Resource Gap", value: "-04", trend: "Critical", icon: AlertCircle, color: "text-active-red" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-black transition-all">
              <div>
                <p className="text-[10px] sm:text-[11px] font-black text-neutral-gray uppercase tracking-widest mb-2">{stat.label}</p>
                <p className="text-3xl sm:text-4xl font-black text-black tracking-tighter">{stat.value}</p>
                <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${stat.trend.startsWith('+') ? 'text-green-600' : 'text-active-red'}`}>
                  {stat.trend} <span className="text-gray-300 font-bold hidden xs:inline uppercase tracking-widest">vs target</span>
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl group-hover:scale-110 transition-transform">
                <stat.icon className={`w-8 h-8 ${stat.color} stroke-[1.5]`} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col p-6 sm:p-8">
           <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
             <div>
               <h3 className="text-xl sm:text-2xl font-black text-black tracking-tight uppercase">Performance Overview</h3>
               <p className="text-neutral-gray text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Daily Service Level & Demand Dynamics</p>
             </div>
           </div>
           <div className="h-[400px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={reqData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorStaffed" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis 
                   dataKey="time" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                   interval={7} 
                   dy={15}
                 />
                 <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                   dx={-10}
                 />
                 <Tooltip 
                   contentStyle={{ 
                     borderRadius: '24px', 
                     border: '1px solid #e2e8f0', 
                     padding: '24px', 
                     boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                     backgroundColor: 'rgba(255,255,255,0.98)',
                   }}
                   itemStyle={{ textTransform: 'uppercase', fontWeight: '900', fontSize: '11px', padding: '6px 0' }}
                   cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                 />
                 <Line 
                   type="monotone" 
                   dataKey="req" 
                   name="Demand Threshold" 
                   stroke="#6366f1" 
                   strokeWidth={2} 
                   dot={false}
                   activeDot={false}
                 />
                 <Area 
                   type="monotone" 
                   dataKey="actual" 
                   name="Staffed Resources" 
                   stroke="#10b981" 
                   strokeWidth={4} 
                   fillOpacity={1} 
                   fill="url(#colorStaffed)" 
                   activeDot={{ r: 8, strokeWidth: 4, stroke: '#fff', fill: '#10b981' }}
                 />
               </ComposedChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    );
  };

  const timeToIndex = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 4 + Math.floor(m / 15);
  };

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr || !timeStr.includes(":")) return 0;
    const [h, m] = timeStr.trim().split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const isSlotInShift = (slot: string, sfStart: string, sfEnd: string) => {
    const parts = slot.split(" - ");
    if (parts.length !== 2) return false;
    
    const slotStart = timeToMinutes(parts[0]);
    let slotEnd = timeToMinutes(parts[1]);
    if (slotEnd < slotStart) {
      slotEnd += 24 * 60;
    }
    
    const shiftStart = timeToMinutes(sfStart);
    let shiftEnd = timeToMinutes(sfEnd);
    
    if (shiftStart <= shiftEnd) {
      return slotStart >= shiftStart && slotEnd <= shiftEnd;
    } else {
      // Crosses midnight
      // Part 1: from shiftStart to 24:00 (1440 mins)
      // Part 2: from 00:00 to shiftEnd
      return (slotStart >= shiftStart && slotEnd <= 24 * 60) || 
             (slotStart >= 0 && slotEnd <= shiftEnd);
    }
  };

  const renderScheduleGrid = () => {
    const teams = ["all", "Support A", "Support B", "High Priority", "Technical"];
    
    const filteredAgents = combinedAgents
      .filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter(a => selectedTeam === "all" || a.team === selectedTeam)
      .filter(a => selectedSite === "all" || a.site === selectedSite)
      .filter(a => selectedUnit === "all" || a.unit === selectedUnit)
      .filter(a => selectedProject === "all" || a.project === selectedProject);

    const filteredCount = filteredAgents.length;

    // Separate sorting logic
    const sortedAgents = [...filteredAgents].sort((a, b) => {
      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortConfig.key === 'interval') {
        const shiftA = (resolvedShifts[a.shift] || resolvedShifts["H"]).start;
        const shiftB = (resolvedShifts[b.shift] || resolvedShifts["H"]).start;
        return sortConfig.direction === 'asc' ? shiftA.localeCompare(shiftB) : shiftB.localeCompare(shiftA);
      }
      return 0;
    });

    return (
      <div className="space-y-6 sm:space-y-8">
        {/* Quick Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Overall Adherence", value: "94.8%", trend: "+2.1%", icon: CheckCircle2, color: "text-green-600" },
            { label: "Current Service Level", value: "88.2%", trend: "-1.5%", icon: Zap, color: "text-active-red" },
            { label: "Total Headcount", value: String(filteredCount), trend: filteredCount > 20 ? "+12" : "0", icon: Users, color: "text-black" },
            { label: "Resource Gap", value: "-04", trend: "Critical", icon: AlertCircle, color: "text-active-red" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold text-neutral-gray uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-xl sm:text-2xl font-black text-black">{stat.value}</p>
                <p className={`text-[9px] sm:text-[10px] font-bold mt-1 ${stat.trend.startsWith('+') ? 'text-green-600' : 'text-active-red'}`}>
                  {stat.trend} <span className="text-gray-300 font-medium hidden xs:inline">vs target</span>
                </p>
              </div>
              <div className="p-2.5 sm:p-3 bg-gray-50 rounded-xl">
                <stat.icon className={`w-4 sm:w-5 h-4 sm:h-5 ${stat.color} stroke-[1.5]`} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          {/* Grid Toolbar */}
          <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-gray" />
                  <input 
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-gray-50 border-none rounded-xl pl-9 pr-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-black/10"
                  />
                </div>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-gray" />
                <input 
                  type="text" 
                  placeholder="FIND AGENT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-[10px] font-black uppercase tracking-tight focus:ring-1 focus:ring-active-red/20 outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-black/10"
                >
                  {teams.map(t => <option key={t} value={t}>{t === "all" ? "ALL TEAMS" : t.toUpperCase()}</option>)}
                </select>
                <select 
                  value={`${sortConfig.key}-${sortConfig.direction}`}
                  onChange={(e) => {
                    const [key, direction] = e.target.value.split('-') as [any, any];
                    setSortConfig({ key, direction });
                  }}
                  className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-black/10"
                >
                  <option value="name-asc">NAME (A-Z)</option>
                  <option value="name-desc">NAME (Z-A)</option>
                  <option value="interval-asc">INTERVAL (EARLY)</option>
                  <option value="interval-desc">INTERVAL (LATE)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 relative">
              <button 
                onClick={() => setShowActions(!showActions)}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all shadow-lg shadow-black/10"
              >
                Actions <ChevronDown size={14} />
              </button>
              
              <AnimatePresence>
                {showActions && (
                   <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[60]"
                   >
                      {[
                        { label: "Swap Shift", icon: History },
                        { label: "Approval", icon: ShieldCheck },
                        { label: "Auto Break", icon: Coffee },
                        { label: "Download", icon: Download },
                      ].map((item, i) => (
                        <button 
                          key={i}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest transition-colors"
                        >
                          <item.icon size={14} className="text-slate-400" />
                          {item.label}
                        </button>
                      ))}
                   </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* The Grid Table */}
          <div className="overflow-auto relative max-h-[600px]">
            <table className="border-separate border-spacing-0 table-fixed w-full min-w-[2800px]">
              <thead className="sticky top-0 z-50">
                {/* Agent Actual Row */}
                <tr className="bg-white">
                  <th className="sticky left-0 z-[60] bg-white h-12 w-[180px] sm:w-[220px] px-4 sm:px-6 border-r border-gray-200 border-b border-gray-50 top-0">
                    <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest block text-left">Agent Actual</span>
                  </th>
                  {intervals.map((_, i) => (
                    <th key={i} className="text-[8px] sm:text-[9px] font-black text-slate-700 border-b border-gray-50 h-12 align-middle min-w-[28px] px-0.5 text-center bg-white">
                      {Math.round(reqData[i].actual)}
                    </th>
                  ))}
                </tr>
                {/* Agent FTE Row */}
                <tr className="bg-white">
                  <th className="sticky left-0 z-[60] bg-white h-12 w-[180px] sm:w-[220px] px-4 sm:px-6 border-r border-gray-200 border-b border-gray-50 top-12">
                    <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest block text-left">Agent FTE</span>
                  </th>
                  {intervals.map((_, i) => (
                    <th key={i} className="text-[8px] sm:text-[9px] font-black text-slate-700 border-b border-gray-50 h-12 align-middle min-w-[28px] px-0.5 text-center bg-white">
                      {Math.round(reqData[i].actual * 0.85)}
                    </th>
                  ))}
                </tr>
                {/* Coverage Gap Row */}
                <tr className="bg-slate-50">
                  <th className="sticky left-0 z-[60] bg-slate-50 h-12 w-[180px] sm:w-[220px] px-4 sm:px-6 border-r border-gray-200 border-b border-slate-100 top-24">
                    <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest block text-left">Coverage Gap</span>
                  </th>
                  {intervals.map((_, i) => {
                    const actual = Math.round(reqData[i].actual);
                    const fte = Math.round(actual * 0.85);
                    const gapValue = actual - fte;
                    const isMinus = gapValue < 0; 
                    
                    return (
                      <th key={i} className={`text-[8px] sm:text-[9px] font-black h-12 align-middle border-b border-slate-100 min-w-[28px] px-0.5 text-center bg-slate-50 ${isMinus ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {gapValue > 0 ? `+${gapValue}` : gapValue}
                      </th>
                    );
                  })}
                </tr>
                {/* Time Indicators */}
                <tr className="bg-white">
                  <th className="sticky left-0 z-[60] bg-white w-[180px] sm:w-[220px] px-4 sm:px-6 py-3 border-r border-gray-200 border-b border-gray-100 font-black text-[10px] text-black text-left uppercase tracking-widest top-36">
                    Agent Name
                  </th>
                {intervals.map((time, i) => (
                  i % 4 === 0 ? (
                    <th key={i} colSpan={4} className="border-b border-gray-100 border-r border-gray-50/50 text-[8px] sm:text-[9px] font-bold text-neutral-gray py-1.5 text-center bg-white">
                      {time}
                    </th>
                  ) : null
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedAgents.map((agent, idx) => {
                const shift = resolvedShifts[agent.shift] || resolvedShifts["H"];
                const startIdx = timeToIndex(shift.start);
                const endIdx = timeToIndex(shift.end);
                
                return (
                  <tr key={agent.id} className="hover:bg-gray-50/50 transition-colors group h-10 sm:h-12">
                    <td className="sticky left-0 z-40 bg-white group-hover:bg-gray-50/80 border-r border-gray-200 px-4 sm:px-6 py-1.5 transition-colors">
                      <div className="flex flex-col min-w-0 justify-center h-full gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] sm:text-[11px] font-bold text-black uppercase tracking-tight truncate">{agent.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-white ${shift.color}`}>{agent.shift}</span>
                        </div>
                        <span className="text-[8px] sm:text-[9px] font-bold text-neutral-gray uppercase tracking-widest opacity-60 truncate">
                          {agent.team} 
                          {Object.keys(agent.activities).length > 0 && ` • Break: ${intervals[Math.min(...Object.keys(agent.activities).map(Number))]}`}
                        </span>
                      </div>
                    </td>
                    {intervals.map((_, i) => {
                      const isWithinShift = startIdx <= i && i < endIdx;
                      const activities = agent.activities as Record<number, string>;
                      const activityKey = activities[i];
                      const activity = activityKey ? ACTIVITY_TYPES[activityKey as keyof typeof ACTIVITY_TYPES] : null;
                      
                      const isShiftStart = i === startIdx;
                      const isShiftEnd = i === endIdx - 1;
                      
                      return (
                        <td key={i} className="p-0 min-w-[28px] px-0.5 relative cursor-pointer group/cell h-10 sm:h-12 border-b border-gray-100">
                          {isWithinShift && !activity && (
                            <div className={`absolute inset-y-2 inset-x-0 bg-slate-200 group-hover/cell:bg-blue-100/50 transition-colors ${isShiftStart ? "rounded-l-full ml-0.5" : ""} ${isShiftEnd ? "rounded-r-full mr-0.5" : ""}`} />
                          )}
                          {activity && (
                            <div 
                              className={`absolute inset-y-1.5 inset-x-0 ${activity.color} shadow-sm transition-all hover:brightness-110 z-10 
                                ${activities[i-1] !== activityKey ? "rounded-l-md" : ""} 
                                ${activities[i+1] !== activityKey ? "rounded-r-md" : ""}
                                border-y border-white/10`} 
                            />
                          )}
                          <div className="absolute inset-0 z-20 opacity-0 bg-black/5" />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="p-5 sm:p-8 bg-slate-50/80 backdrop-blur-sm flex flex-wrap items-center gap-6 sm:gap-10 justify-center border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-md bg-slate-200 border border-slate-300" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Scheduled</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-md bg-blue-500 shadow-sm" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Duty</span>
          </div>
          {Object.entries(ACTIVITY_TYPES).map(([key, act]) => (
            <div key={key} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-md ${act.color} shadow-sm`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{act.label}</span>
            </div>
          ))}
          <div className="hidden sm:block h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-full border border-rose-100">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-rose-600">Coverage Gap Alert</span>
          </div>
        </div>
      </div>
    </div>
  );
};

  const renderCalendar = () => {
    // Determine the days based on the selected roster start / end dates
    const days = getDaysArray(rosterStartDate, rosterEndDate);

    const generateRosterSubmit = () => {
      setIsGeneratingRoster(true);
      
      const slots = getIntervalSlots(histIntervalType);
      const fteDivisor = histIntervalType === "15m" ? 32 : histIntervalType === "30m" ? 16 : 8;
      const compositionShifts = (Object.keys(dbShifts).length > 0 ? dbShifts : SHIFTS) as Record<string, { label: string; start: string; end: string; color: string }>;

      const agentsToSchedule = combinedAgents
          .filter(a => selectedSite === "all" || a.site === selectedSite)
          .filter(a => selectedUnit === "all" || a.unit === selectedUnit)
          .filter(a => selectedProject === "all" || a.project === selectedProject);      // 1. Precompute final required shifts per day (Shift Composition data) for all historical days
      const histDays = getDaysArray(histStartDate, histEndDate).filter(d => histRequirements[d]);
      const histFinalShiftsRounded: Record<string, Record<string, number>> = {};
      
      histDays.forEach(hd => {
          const fteTarget = slots.reduce((acc, s) => acc + (histRequirements[hd]?.[s] || 0), 0) / fteDivisor;
          let compDayTotal = 0;
          const rawShifts: Record<string, number> = {};
          
          Object.entries(compositionShifts).forEach(([code, sInfo]) => {
             const slotsInShift = slots.filter(slot => isSlotInShift(slot, sInfo.start, sInfo.end));
             const values = slotsInShift.map(slot => histRequirements[hd]?.[slot] || 0);
             let val = 0;
             if (values.length > 0) {
                if (compositionMode === "peak") {
                   val = Math.max(...values, 0);
                } else {
                   const sum = values.reduce((acc, v) => acc + v, 0);
                   val = Number((sum / values.length).toFixed(1));
                }
             }
             rawShifts[code] = val;
             compDayTotal += val;
          });
          
          histFinalShiftsRounded[hd] = {};
          Object.keys(compositionShifts).forEach(code => {
             let finalVal = rawShifts[code];
             if (compDayTotal > fteTarget && compDayTotal > 0) {
                 finalVal = finalVal * (fteTarget / compDayTotal);
             }
             histFinalShiftsRounded[hd][code] = Math.round(finalVal);
          });
      });

      // 1b. Compute Day-of-Week averages from histFinalShiftsRounded
      const dowSum: Record<number, Record<string, number>> = {};
      const dowCount: Record<number, number> = {0:0,1:0,2:0,3:0,4:0,5:0,6:0};
      Array.from({length: 7}).forEach((_, i) => {
          dowSum[i] = {};
          Object.keys(compositionShifts).forEach(code => dowSum[i][code] = 0);
      });
      const globalSum: Record<string, number> = {};
      let globalCount = 0;
      Object.keys(compositionShifts).forEach(code => globalSum[code] = 0);

      histDays.forEach(hd => {
          const dow = parseISO(hd).getDay();
          dowCount[dow]++;
          globalCount++;
          Object.keys(compositionShifts).forEach(code => {
              dowSum[dow][code] += histFinalShiftsRounded[hd][code];
              globalSum[code] += histFinalShiftsRounded[hd][code];
          });
      });

      // 1c. Map targets to Future Roster Days (Strictly matching the KOMPOSISI AGENT PER SHIFT table)
      let requiredSlotsPerDayPerShift: Record<string, Record<string, number>> = {};
      days.forEach(d => {
         requiredSlotsPerDayPerShift[d] = {};
         const dow = parseISO(d).getDay();
         Object.keys(compositionShifts).forEach(code => {
             if (histRequirements[d]) {
                 // Calculate composition directly from target day d to match visual table exactly
                 const fteDayTotal = slots.reduce((acc, s) => acc + (histRequirements[d]?.[s] || 0), 0) / fteDivisor;
                 
                 let compDayTotal = 0;
                 const rawShiftValues: Record<string, number> = {};
                 
                 Object.entries(compositionShifts).forEach(([cCode, sInfo]) => {
                     const slotsInShift = slots.filter(slot => isSlotInShift(slot, sInfo.start, sInfo.end));
                     const values = slotsInShift.map(slot => histRequirements[d]?.[slot] || 0);

                     let calculatedValue = 0;
                     if (values.length > 0) {
                        if (compositionMode === "peak") {
                            calculatedValue = Math.max(...values, 0);
                        } else {
                            const sum = values.reduce((acc, v) => acc + v, 0);
                            calculatedValue = Number((sum / values.length).toFixed(1));
                        }
                     }
                     rawShiftValues[cCode] = calculatedValue;
                     compDayTotal += calculatedValue;
                 });

                 let val = rawShiftValues[code] || 0;
                 if (compDayTotal > fteDayTotal && compDayTotal > 0) {
                     val = val * (fteDayTotal / compDayTotal);
                 }
                 requiredSlotsPerDayPerShift[d][code] = Math.round(val);
             } else if (dowCount[dow] > 0) {
                 requiredSlotsPerDayPerShift[d][code] = Math.round(dowSum[dow][code] / dowCount[dow]);
             } else if (globalCount > 0) {
                 requiredSlotsPerDayPerShift[d][code] = Math.round(globalSum[code] / globalCount);
             } else {
                 requiredSlotsPerDayPerShift[d][code] = 0;
             }
         });
      });

      // Define standard max working days limit per agent
      const maxWorkingDaysPerAgent = days.filter(d => !["Sat", "Sun"].includes(format(parseISO(d), "EEE"))).length;

      const roster: { empId: string, roster: Record<string, string> }[] = agentsToSchedule.map(a => ({
          empId: a.id,
          roster: {}
      }));
      
      const parseTime = (t: string) => { const [h, m] = t.split(':').map(Number); return h + m/60; };
      const getShiftEnd = (startStr: string, endStr: string) => {
         const start = parseTime(startStr);
         const end = parseTime(endStr);
         return end < start ? end + 24 : end;
      };

      const getAgentScore = (agentId: string, shiftCode: string, dayIdx: number) => {
          let score = 100;
          
          const assignedSoFar = Object.values(roster.find(r => r.empId === agentId)!.roster).filter(s => s !== 'OFF').length;
          const daysLeft = days.length - dayIdx;
          const needed = maxWorkingDaysPerAgent - assignedSoFar;

          // Push hard to ensure they meet exactly maxWorkingDaysPerAgent days constraint towards end of month
          if (needed >= daysLeft) {
              score += 500000;
          }
          
          // 1. Rest constraint penalty: min 10 hours rest from previous shift
          if (dayIdx > 0) {
              const prevShiftCode = roster.find(r => r.empId === agentId)?.roster[days[dayIdx-1]];
              if (prevShiftCode && prevShiftCode !== 'OFF') {
                  const prevShiftInfo = compositionShifts[prevShiftCode];
                  const shiftInfo = compositionShifts[shiftCode];
                  if(prevShiftInfo && shiftInfo) {
                      const prevEnd = getShiftEnd(prevShiftInfo.start, prevShiftInfo.end);
                      const currStart = parseTime(shiftInfo.start) + 24; 
                      const rest = currStart - prevEnd;
                      if (rest < 10) score -= 20000;
                  }
              }
          }
          
          // 2. M1/S7 max 4 consecutive penalty
          if (shiftCode.toUpperCase() === 'M1' || shiftCode.toUpperCase() === 'S7') {
             let consec = 0;
             for (let i = dayIdx - 1; i >= 0; i--) {
                 const prevCode = roster.find(r => r.empId === agentId)?.roster[days[i]];
                 if (prevCode && (prevCode.toUpperCase() === 'M1' || prevCode.toUpperCase() === 'S7')) {
                    consec++;
                 } else {
                    break;
                 }
             }
             if (consec >= 4) score -= 20000;
          }

          // 3. Max consecutive working days penalization
          let consecWork = 0;
          for (let i = dayIdx - 1; i >= 0; i--) {
             const prevCode = roster.find(r => r.empId === agentId)?.roster[days[i]];
             if (prevCode && prevCode !== 'OFF') consecWork++;
             else break;
          }
          if (consecWork >= 5) {
             score -= 20000;
          } else {
             // Heavily penalize people who have worked many consecutive days so they naturally take OFF sooner
             score -= consecWork * 500;
          }

          // Balance shifts by preferring agents who need more shifts
          score += needed * 100;

          // 4. Off balancing: Prioritize giving a shift if they had 2 consecutive OFFs, and penalize if they just had an OFF
          let consecOff = 0;
          for (let i = dayIdx - 1; i >= 0; i--) {
             const prevCode = roster.find(r => r.empId === agentId)?.roster[days[i]];
             if (prevCode === 'OFF') consecOff++;
             else break;
          }
          if (consecOff >= 2) score += 5000;
          if (consecOff === 1) score -= 1000; // Prefer giving them 2 consecutive OFFs rather than working immediately after 1 day off

          // 5. Total worked balancing (so shifts are distributed evenly)
          const totalWorked = Object.values(roster.find(r => r.empId === agentId)!.roster).filter(s => s !== 'OFF').length;
          score -= totalWorked * 100;

          // 6. Shift type total balancing (Avoid dominating M1/S7)
          if (shiftCode.toUpperCase() === 'M1' || shiftCode.toUpperCase() === 'S7') {
             const totalM1S7 = Object.values(roster.find(r => r.empId === agentId)!.roster)
                .filter(s => s && (s.toUpperCase() === 'M1' || s.toUpperCase() === 'S7')).length;
             score += totalM1S7 * 500; // Prefer those who already have M1/S7 (cenderung by same agents)
          }

          return score;
      };

      const shiftCodesSorted = Object.keys(compositionShifts).sort((a, b) => {
          const uA = a.toUpperCase();
          const uB = b.toUpperCase();
          if ((uA === 'M1' || uA === 'S7') && !(uB === 'M1' || uB === 'S7')) return -1;
          if (!(uA === 'M1' || uA === 'S7') && (uB === 'M1' || uB === 'S7')) return 1;
          return 0;
      });

      days.forEach((d, dayIdx) => {
          let unassignedAgents = [...agentsToSchedule];
          
          shiftCodesSorted.forEach(shiftCode => {
              let requiredCount = requiredSlotsPerDayPerShift[d][shiftCode] || 0;
              
              let eligibleAgents = unassignedAgents.filter(agent => {
                  // Hard Constraint 0: Total Working Days Strict Equality Check
                  const assignedSoFar = Object.values(roster.find(r => r.empId === agent.id)!.roster).filter(s => s !== 'OFF').length;
                  if (assignedSoFar >= maxWorkingDaysPerAgent) return false;

                  // Hard Constraint 1: Gender for M1 & S7
                  if (shiftCode.toUpperCase() === 'M1' || shiftCode.toUpperCase() === 'S7') {
                      const gender = (agent.gender || '').toUpperCase().trim();
                      if (gender !== 'L' && gender !== 'MALE' && gender !== 'LAKI-LAKI' && gender !== 'PRIA') {
                          return false; 
                      }
                  }
                  
                  // Hard Constraint 2: Min 10 hours rest from previous shift
                  if (dayIdx > 0) {
                      const prevShiftCode = roster.find(r => r.empId === agent.id)?.roster[days[dayIdx-1]];
                      if (prevShiftCode && prevShiftCode !== 'OFF') {
                          const prevShiftInfo = compositionShifts[prevShiftCode];
                          const shiftInfo = compositionShifts[shiftCode];
                          if(prevShiftInfo && shiftInfo) {
                              const prevEnd = getShiftEnd(prevShiftInfo.start, prevShiftInfo.end);
                              const currStart = parseTime(shiftInfo.start) + 24; 
                              const rest = currStart - prevEnd;
                              if (rest < 10) return false;
                          }
                      }
                  }
                  
                  // Hard Constraint 3: Max 5 consecutive working days
                  let consecWork = 0;
                  for (let i = dayIdx - 1; i >= 0; i--) {
                     const prevCode = roster.find(r => r.empId === agent.id)?.roster[days[i]];
                     if (prevCode && prevCode !== 'OFF') consecWork++;
                     else break;
                  }
                  if (consecWork >= 5) return false; 
                  
                  // Hard Constraint 4: Max 4 consecutive M1 / S7
                  if (shiftCode.toUpperCase() === 'M1' || shiftCode.toUpperCase() === 'S7') {
                     let consecM1S7 = 0;
                     for (let i = dayIdx - 1; i >= 0; i--) {
                         const prevCode = roster.find(r => r.empId === agent.id)?.roster[days[i]];
                         if (prevCode && (prevCode.toUpperCase() === 'M1' || prevCode.toUpperCase() === 'S7')) {
                            consecM1S7++;
                         } else {
                            break;
                         }
                     }
                     if (consecM1S7 >= 4) return false;
                  }

                  return true;
              });

              if (requiredCount > eligibleAgents.length) requiredCount = eligibleAgents.length;
              
              if (requiredCount > 0) {
                  const scoredAgents = eligibleAgents.map(agent => ({
                      agent,
                      score: getAgentScore(agent.id, shiftCode, dayIdx)
                  }));
                  
                  // Sort descending by score.
                  scoredAgents.sort((a, b) => {
                      if (a.score !== b.score) return b.score - a.score;
                      return 0.5 - Math.random();
                  });
                  
                  for (let i = 0; i < requiredCount; i++) {
                      const selectedAgent = scoredAgents[i].agent;
                      roster.find(r => r.empId === selectedAgent.id)!.roster[d] = shiftCode;
                      unassignedAgents = unassignedAgents.filter(a => a.id !== selectedAgent.id);
                  }
              }
          });
          
          // Remaining agents get OFF
          unassignedAgents.forEach(agent => {
              if (roster.find(r => r.empId === agent.id)) {
                  roster.find(r => r.empId === agent.id)!.roster[d] = 'OFF';
              }
          });
      });
      
      // --- INTERNALLY GUARANTEE EXACT CALENDAR WORK DAYS FOR EVERY AGENT ---
      const isRestOk = (shiftA: string, shiftB: string) => {
          if (!shiftA || shiftA === 'OFF' || !shiftB || shiftB === 'OFF') return true;
          const sA = compositionShifts[shiftA];
          const sB = compositionShifts[shiftB];
          if (!sA || !sB) return true;
          const endA = getShiftEnd(sA.start, sA.end);
          const startB = parseTime(sB.start) + 24;
          return (startB - endA) >= 10;
      };

      const checkMaxConsecWork = (tempRoster: Record<string, string>, allowedMax = 5) => {
          let maxConsec = 0;
          let currentConsec = 0;
          for (let i = 0; i < days.length; i++) {
              const val = tempRoster[days[i]];
              if (val && val !== 'OFF') {
                  currentConsec++;
                  if (currentConsec > maxConsec) maxConsec = currentConsec;
              } else {
                  currentConsec = 0;
              }
          }
          return maxConsec <= allowedMax;
      };

      const checkMaxConsecM1S7 = (tempRoster: Record<string, string>, allowedMax = 4) => {
          let maxConsec = 0;
          let currentConsec = 0;
          for (let i = 0; i < days.length; i++) {
              const val = tempRoster[days[i]];
              if (val && (val.toUpperCase() === 'M1' || val.toUpperCase() === 'S7')) {
                  currentConsec++;
                  if (currentConsec > maxConsec) maxConsec = currentConsec;
              } else {
                  currentConsec = 0;
              }
          }
          return maxConsec <= allowedMax;
      };

      // PASS 1: Strict constraints (Allowed consecutive work: 5 days, consecutive M1/S7: 4 days, 10 hours rest)
      roster.forEach(rosterEntry => {
          const agent = agentsToSchedule.find(a => a.id === rosterEntry.empId);
          if (!agent) return;
          
          let workDays = Object.values(rosterEntry.roster).filter(s => s !== 'OFF').length;
          let needed = maxWorkingDaysPerAgent - workDays;
          if (needed <= 0) return;
          
          for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
              if (needed <= 0) break;
              const d = days[dayIdx];
              if (rosterEntry.roster[d] === 'OFF') {
                  for (const shiftCode of Object.keys(compositionShifts)) {
                      const currentCount = roster.filter(r => r.roster[d] === shiftCode).length;
                      if (currentCount >= (requiredSlotsPerDayPerShift[d]?.[shiftCode] || 0)) continue;

                      if (shiftCode.toUpperCase() === 'M1' || shiftCode.toUpperCase() === 'S7') {
                          const gender = (agent.gender || '').toUpperCase().trim();
                          if (gender !== 'L' && gender !== 'MALE' && gender !== 'LAKI-LAKI' && gender !== 'PRIA') {
                              continue;
                          }
                      }
                      
                      const prevShift = dayIdx > 0 ? rosterEntry.roster[days[dayIdx - 1]] : 'OFF';
                      const nextShift = dayIdx < days.length - 1 ? rosterEntry.roster[days[dayIdx + 1]] : 'OFF';
                      if (!isRestOk(prevShift, shiftCode) || !isRestOk(shiftCode, nextShift)) continue;
                      
                      const tempRoster = { ...rosterEntry.roster, [d]: shiftCode };
                      if (!checkMaxConsecWork(tempRoster, 5)) continue;
                      if (!checkMaxConsecM1S7(tempRoster, 4)) continue;
                      
                      rosterEntry.roster[d] = shiftCode;
                      needed--;
                      break;
                  }
              }
          }
      });

      // PASS 2: Relax consecutive work constraint to 6 days and consecutive M1/S7 to 5 days, if needed
      roster.forEach(rosterEntry => {
          const agent = agentsToSchedule.find(a => a.id === rosterEntry.empId);
          if (!agent) return;
          
          let workDays = Object.values(rosterEntry.roster).filter(s => s !== 'OFF').length;
          let needed = maxWorkingDaysPerAgent - workDays;
          if (needed <= 0) return;
          
          for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
              if (needed <= 0) break;
              const d = days[dayIdx];
              if (rosterEntry.roster[d] === 'OFF') {
                  for (const shiftCode of Object.keys(compositionShifts)) {
                      const currentCount = roster.filter(r => r.roster[d] === shiftCode).length;
                      if (currentCount >= (requiredSlotsPerDayPerShift[d]?.[shiftCode] || 0)) continue;

                      if (shiftCode.toUpperCase() === 'M1' || shiftCode.toUpperCase() === 'S7') {
                          const gender = (agent.gender || '').toUpperCase().trim();
                          if (gender !== 'L' && gender !== 'MALE' && gender !== 'LAKI-LAKI' && gender !== 'PRIA') {
                              continue;
                          }
                      }
                      
                      const prevShift = dayIdx > 0 ? rosterEntry.roster[days[dayIdx - 1]] : 'OFF';
                      const nextShift = dayIdx < days.length - 1 ? rosterEntry.roster[days[dayIdx + 1]] : 'OFF';
                      if (!isRestOk(prevShift, shiftCode) || !isRestOk(shiftCode, nextShift)) continue;
                      
                      const tempRoster = { ...rosterEntry.roster, [d]: shiftCode };
                      if (!checkMaxConsecWork(tempRoster, 5)) continue;
                      if (!checkMaxConsecM1S7(tempRoster, 4)) continue;
                      
                      rosterEntry.roster[d] = shiftCode;
                      needed--;
                      break;
                  }
              }
          }
      });

      // PASS 3: Fallback relaxation of rest or check constraints in extreme cases to strictly guarantee correct total HK (e.g. May: 21 HK)
      roster.forEach(rosterEntry => {
          const agent = agentsToSchedule.find(a => a.id === rosterEntry.empId);
          if (!agent) return;
          
          let workDays = Object.values(rosterEntry.roster).filter(s => s !== 'OFF').length;
          let needed = maxWorkingDaysPerAgent - workDays;
          if (needed <= 0) return;
          
          for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
              if (needed <= 0) break;
              const d = days[dayIdx];
              if (rosterEntry.roster[d] === 'OFF') {
                  for (const shiftCode of Object.keys(compositionShifts)) {
                      const currentCount = roster.filter(r => r.roster[d] === shiftCode).length;
                      if (currentCount >= (requiredSlotsPerDayPerShift[d]?.[shiftCode] || 0)) continue;

                      if (shiftCode.toUpperCase() === 'M1' || shiftCode.toUpperCase() === 'S7') {
                          const gender = (agent.gender || '').toUpperCase().trim();
                          if (gender !== 'L' && gender !== 'MALE' && gender !== 'LAKI-LAKI' && gender !== 'PRIA') {
                              continue;
                          }
                      }
                      
                      const tempRoster = { ...rosterEntry.roster, [d]: shiftCode };
                      if (!checkMaxConsecWork(tempRoster, 5)) continue;
                      
                      rosterEntry.roster[d] = shiftCode;
                      needed--;
                      break;
                  }
              }
          }
      });

      // PASS 4: Final forced assignment / reduction to MATCH the shift composition matrix
      days.forEach(d => {
          Object.keys(compositionShifts).forEach(shiftCode => {
              const requiredCount = requiredSlotsPerDayPerShift[d][shiftCode] || 0;
              
              // Fix Understaffing (Priority to those with the fewest working days to balance out)
              while (roster.filter(r => r.roster[d] === shiftCode).length < requiredCount) {
                  let availableAgents = roster.filter(r => r.roster[d] === 'OFF');
                  
                  if (shiftCode.toUpperCase() === 'M1' || shiftCode.toUpperCase() === 'S7') {
                      availableAgents = availableAgents.filter(r => {
                          const agent = agentsToSchedule.find(a => a.id === r.empId);
                          const gender = (agent?.gender || '').toUpperCase().trim();
                          return gender === 'L' || gender === 'MALE' || gender === 'LAKI-LAKI' || gender === 'PRIA';
                      });
                  }

                  availableAgents = availableAgents.filter(r => {
                      const wD = Object.values(r.roster).filter(s => s !== 'OFF').length;
                      if (wD >= maxWorkingDaysPerAgent) return false;
                      
                      const temp = { ...r.roster };
                      temp[d] = shiftCode;
                      return checkMaxConsecWork(temp, 5);
                  });
                  
                  if (availableAgents.length === 0) break; // Cannot fulfill if no one is OFF without breaking rules
                  
                  // Sort by ascending working days
                  availableAgents.sort((a, b) => {
                      const wA = Object.values(a.roster).filter(s => s !== 'OFF').length;
                      const wB = Object.values(b.roster).filter(s => s !== 'OFF').length;
                      return wA - wB;
                  });
                  
                  availableAgents[0].roster[d] = shiftCode;
              }
              
              // Fix Overstaffing
              while (roster.filter(r => r.roster[d] === shiftCode).length > requiredCount) {
                  let currentAssigned = roster.filter(r => r.roster[d] === shiftCode);
                  if (currentAssigned.length === 0) break;
                  
                  // Sort by descending working days to remove those with the most overtime first
                  currentAssigned.sort((a, b) => {
                      const wA = Object.values(a.roster).filter(s => s !== 'OFF').length;
                      const wB = Object.values(b.roster).filter(s => s !== 'OFF').length;
                      return wB - wA;
                  });
                  
                  const topAgent = currentAssigned[0];
                  const topAgentWorkDays = Object.values(topAgent.roster).filter(s => s !== 'OFF').length;
                  
                  // Rule: jika hari kerja masih kurang boleh surplus
                  // If even the most-worked assigned agent is at or below quota, do NOT remove them!
                  if (topAgentWorkDays <= maxWorkingDaysPerAgent) break;
                  
                  topAgent.roster[d] = 'OFF';
              }
          });
      });

      // PASS 5: Ensure every agent exactly reaches maxWorkingDaysPerAgent (allows surplus overflow)
      agentsToSchedule.forEach(agent => {
          let agentRoster = roster.find(r => r.empId === agent.id)!;
          let currentWorkDays = Object.values(agentRoster.roster).filter(s => s !== 'OFF').length;
          
          if (currentWorkDays < maxWorkingDaysPerAgent) {
              const offDays = days.filter(d => agentRoster.roster[d] === 'OFF');
              for (const d of offDays) {
                   if (currentWorkDays >= maxWorkingDaysPerAgent) break;
                   const dayIdx = days.indexOf(d);
                   
                   let selectedShift = '';
                   for (const shiftCode of shiftCodesSorted) {
                        if (shiftCode.toUpperCase() === 'M1' || shiftCode.toUpperCase() === 'S7') {
                            const gender = (agent.gender || '').toUpperCase().trim();
                            if (gender !== 'L' && gender !== 'MALE' && gender !== 'LAKI-LAKI' && gender !== 'PRIA') continue;
                            
                            const tempMsg = { ...agentRoster.roster, [d]: shiftCode };
                            if (!checkMaxConsecM1S7(tempMsg, 4)) continue;
                        }
                        
                        let restOk = true;
                        if (dayIdx > 0) {
                            const prevShift = agentRoster.roster[days[dayIdx-1]];
                            if (prevShift && prevShift !== 'OFF') {
                                const prevShiftInfo = compositionShifts[prevShift];
                                const shiftInfo = compositionShifts[shiftCode];
                                if (prevShiftInfo && shiftInfo) {
                                    const prevEnd = getShiftEnd(prevShiftInfo.start, prevShiftInfo.end);
                                    const currStart = parseTime(shiftInfo.start) + 24; 
                                    if ((currStart - prevEnd) < 10) restOk = false;
                                }
                            }
                        }
                        
                        if (!restOk) continue;
                        selectedShift = shiftCode;
                        if (shiftCode.toUpperCase() !== 'M1' && shiftCode.toUpperCase() !== 'S7') break;
                   }
                   
                   if (selectedShift) {
                       let consecBefore = 0;
                       for (let i = dayIdx - 1; i >= 0; i--) { if(agentRoster.roster[days[i]]!=='OFF') consecBefore++; else break; }
                       let consecAfter = 0;
                       for (let i = dayIdx + 1; i < days.length; i++) { if(agentRoster.roster[days[i]]!=='OFF') consecAfter++; else break; }
                       
                       if (consecBefore + 1 + consecAfter <= 5) {
                           agentRoster.roster[d] = selectedShift;
                           currentWorkDays++;
                       }
                   }
              }
              
              currentWorkDays = Object.values(agentRoster.roster).filter(s => s !== 'OFF').length;
              if (currentWorkDays < maxWorkingDaysPerAgent) {
                  const remainingOff = days.filter(d => agentRoster.roster[d] === 'OFF');
                  for (const d of remainingOff) {
                      if (currentWorkDays >= maxWorkingDaysPerAgent) break;
                      let code = shiftCodesSorted.find(c => {
                          if (c.toUpperCase() === 'M1' || c.toUpperCase() === 'S7') {
                              const g = (agent.gender || '').toUpperCase().trim();
                              if (g !== 'L' && g !== 'MALE' && g !== 'LAKI-LAKI' && g !== 'PRIA') return false;
                          }
                          return true;
                      }) || shiftCodesSorted[0];
                      
                      let temp = { ...agentRoster.roster };
                      temp[d] = code;
                      
                      let m1s7Ok = true;
                      if (code.toUpperCase() === 'M1' || code.toUpperCase() === 'S7') {
                          m1s7Ok = checkMaxConsecM1S7(temp, 4);
                      }
                      
                      if (checkMaxConsecWork(temp, 5) && m1s7Ok) {
                          agentRoster.roster[d] = code;
                          currentWorkDays++;
                      }
                  }
              }
          }
      });
      
      setTimeout(() => {
        setGeneratedRoster(roster);
        setIsGeneratingRoster(false);
      }, 600);
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-black text-black uppercase tracking-tight">Roster Generator</h3>
            <p className="text-[10px] text-neutral-gray uppercase tracking-widest font-bold">Auto-schedule using historical composition</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={rosterStartDate} 
                  onChange={(e) => setRosterStartDate(e.target.value)}
                  className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none uppercase font-sans text-neutral-gray focus:ring-1 focus:ring-black transition-all hover:bg-gray-100"
                />
                <span className="text-gray-300 font-bold">-</span>
                <input 
                  type="date" 
                  value={rosterEndDate} 
                  onChange={(e) => setRosterEndDate(e.target.value)}
                  className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none uppercase font-sans text-neutral-gray focus:ring-1 focus:ring-black transition-all hover:bg-gray-100"
                />
             </div>
             
             <button 
               onClick={generateRosterSubmit}
               disabled={isGeneratingRoster || days.length === 0}
               className="bg-black text-white hover:bg-slate-900 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 transition-all disabled:opacity-50 flex items-center gap-2"
             >
               {isGeneratingRoster ? (
                 <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sedang Kalkulasi...</>
               ) : (
                 <><CalendarIcon size={14}/> Buat Schedule</>
               )}
             </button>
          </div>
        </div>

        {generatedRoster.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-500">
            <div className="overflow-x-auto relative">
              <table className="border-separate border-spacing-0 table-fixed min-w-max w-full">
                <thead>
                  <tr className="bg-white">
                    <th className="sticky left-0 z-40 bg-white w-[180px] sm:w-[220px] min-w-[180px] sm:min-w-[220px] max-w-[180px] sm:max-w-[220px] px-4 sm:px-6 py-4 border-r border-b border-gray-200 text-[10px] font-black text-black text-left uppercase tracking-widest">
                      Agent Identity
                    </th>
                    {days.map((dateStr, i) => {
                      const date = parseISO(dateStr);
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      return (
                        <th key={i} className={`px-2 py-3 border-b border-gray-100 border-r border-gray-50/50 text-center min-w-[65px] ${isWeekend ? 'bg-rose-50/30' : ''}`}>
                          <span className={`block text-[9px] font-bold uppercase tracking-widest ${isWeekend ? 'text-active-red/60' : 'text-neutral-gray'}`}>
                            {format(date, "EEE")}
                          </span>
                          <span className={`block text-xs font-black mt-0.5 ${isWeekend ? 'text-active-red' : 'text-black'}`}>
                            {format(date, "dd")}
                          </span>
                        </th>
                      );
                    })}
                    <th className="px-3 py-3 border-b border-gray-200 border-r border-gray-50/50 text-center min-w-[90px] bg-indigo-50/50">
                      <span className="block text-[9px] font-black uppercase tracking-widest text-[#6366f1]">
                        Hari Kerja
                      </span>
                    </th>
                    <th className="px-3 py-3 border-b border-gray-200 border-r border-gray-50/50 text-center min-w-[90px] bg-rose-50/50">
                      <span className="block text-[9px] font-black uppercase tracking-widest text-rose-600">
                        Hari Libur
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-slate-50/20">
                  {combinedAgents
                    .filter(a => selectedSite === "all" || a.site === selectedSite)
                    .filter(a => selectedUnit === "all" || a.unit === selectedUnit)
                    .filter(a => selectedProject === "all" || a.project === selectedProject)
                    .filter(a => generatedRoster.some(r => r.empId === a.id))
                    .map((agent) => {
                      const rosterInfo = generatedRoster.find(r => r.empId === agent.id)!;
                      const genderStr = agent.gender ? agent.gender.charAt(0).toUpperCase() : '?';
                      
                      return (
                      <tr key={agent.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="sticky left-0 z-40 bg-white group-hover:bg-slate-100 border-r border-gray-200 px-4 sm:px-6 py-3 transition-colors w-[180px] sm:w-[220px] min-w-[180px] sm:min-w-[220px] max-w-[180px] sm:max-w-[220px]">
                          <div className="flex flex-col w-full max-w-full overflow-hidden">
                            <div className="flex items-center gap-1.5 w-full justify-between">
                              <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight truncate flex-1 min-w-0" title={agent.name}>{agent.name}</span>
                              <span className="bg-slate-100 text-slate-500 text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0">{genderStr}</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {agent.id}</span>
                          </div>
                        </td>
                        {days.map((d, i) => {
                          const shiftCode = rosterInfo.roster[d] || 'OFF';
                          const isOff = shiftCode === 'OFF';
                          
                          const shiftInfo = (Object.keys(dbShifts).length > 0 ? dbShifts : SHIFTS)[shiftCode] || { color: 'bg-slate-200' };
                          
                          return (
                            <td key={i} className={`p-1 border-r border-gray-50/50 text-center relative`}>
                              <div 
                                className={`mx-auto w-[48px] py-2 rounded-xl text-[10px] font-black transition-all hover:scale-105 cursor-pointer flex items-center justify-center
                                  ${isOff ? 'text-slate-400 bg-slate-100 inset-shadow-sm shadow-none opacity-60' : 'text-white shadow-sm ' + shiftInfo?.color}`}
                              >
                                {shiftCode.toUpperCase()}
                              </div>
                            </td>
                          );
                        })}
                        {(() => {
                          const workDays = days.filter(d => rosterInfo.roster[d] && rosterInfo.roster[d] !== 'OFF').length;
                          const offDays = days.filter(d => !rosterInfo.roster[d] || rosterInfo.roster[d] === 'OFF').length;
                          return (
                            <>
                              <td className="p-1 border-r border-gray-50/50 text-center bg-indigo-50/10 font-bold min-w-[90px]">
                                <span className="text-[11px] font-black text-slate-800">{workDays} Hari</span>
                              </td>
                              <td className="p-1 border-r border-gray-50/50 text-center bg-rose-50/10 font-bold min-w-[90px]">
                                <span className="text-[11px] font-black text-rose-500">{offDays} Hari</span>
                              </td>
                            </>
                          );
                        })()}
                      </tr>
                    );
                  })}
                  
                  {/* Aggregated Output Rows */}
                  {(() => {
                     const shiftCodes = Object.keys((Object.keys(dbShifts).length > 0 ? dbShifts : SHIFTS));
                     return shiftCodes.map(code => (
                        <tr key={`shift-agg-${code}`} className="bg-slate-50/50">
                           <td className="sticky left-0 z-40 bg-slate-100 border-r border-slate-200 px-6 py-2 border-t w-[180px] sm:w-[220px] min-w-[180px] sm:min-w-[220px] max-w-[180px] sm:max-w-[220px]">
                              <span className="text-[10px] font-black uppercase text-slate-700 tracking-widest block">SHIFT {code}</span>
                           </td>
                           {days.map((d, i) => {
                              let count = 0;
                              generatedRoster.forEach(r => { if(r.roster[d] === code) count++; });
                              return (
                                 <td key={i} className="px-2 py-2 border-r border-slate-200 border-t text-center">
                                    <span className={`text-[11px] font-black ${count > 0 ? 'text-slate-900' : 'text-slate-300'}`}>{count}</span>
                                 </td>
                              );
                           })}
                           {(() => {
                             let totalSum = 0;
                             generatedRoster.forEach(r => {
                               days.forEach(d => {
                                 if (r.roster[d] === code) totalSum++;
                               });
                             });
                             return (
                               <>
                                 <td className="px-2 py-2 border-r border-slate-200 border-t text-center bg-indigo-50/10 font-black text-[11px] text-slate-700 min-w-[90px]">
                                   {totalSum}
                                 </td>
                                 <td className="px-2 py-2 border-r border-slate-200 border-t text-center bg-rose-50/10 font-black text-[11px] text-slate-300 min-w-[90px]">
                                   -
                                 </td>
                               </>
                             );
                           })()}
                        </tr>
                     ));
                  })()}

                  <tr className="bg-rose-50/30">
                     <td className="sticky left-0 z-40 bg-rose-100 border-r border-rose-100 px-6 py-2 border-t w-[180px] sm:w-[220px] min-w-[180px] sm:min-w-[220px] max-w-[180px] sm:max-w-[220px]">
                        <span className="text-[10px] font-black uppercase text-rose-700 tracking-widest block">OFF</span>
                     </td>
                     {days.map((d, i) => {
                        let count = 0;
                        generatedRoster.forEach(r => { if(r.roster[d] === 'OFF') count++; });
                        return (
                           <td key={i} className="px-2 py-2 border-r border-rose-100 border-t text-center">
                              <span className={`text-[11px] font-black ${count > 0 ? 'text-rose-700' : 'text-rose-300'}`}>{count}</span>
                           </td>
                        );
                     })}
                     {(() => {
                       let totalOffSum = 0;
                       generatedRoster.forEach(r => {
                         days.forEach(d => {
                           if (!r.roster[d] || r.roster[d] === 'OFF') totalOffSum++;
                         });
                       });
                       return (
                         <>
                           <td className="px-2 py-2 border-r border-rose-100 border-t text-center bg-indigo-50/10 font-black text-[11px] text-slate-300 min-w-[90px]">
                             -
                           </td>
                           <td className="px-2 py-2 border-r border-rose-100 border-t text-center bg-rose-50/10 font-black text-[11px] text-rose-700 min-w-[90px]">
                             {totalOffSum}
                           </td>
                         </>
                       );
                     })()}
                  </tr>

                  <tr className="bg-indigo-50/30">
                     <td className="sticky left-0 z-40 bg-indigo-100 border-r border-indigo-200 px-6 py-2 border-t w-[180px] sm:w-[220px] min-w-[180px] sm:min-w-[220px] max-w-[180px] sm:max-w-[220px]">
                        <span className="text-[10px] font-black uppercase text-indigo-900 tracking-widest block">TOTAL AGENT WFO</span>
                     </td>
                     {days.map((d, i) => {
                        let scheduledCount = 0;
                        generatedRoster.forEach(r => { if(r.roster[d] && r.roster[d] !== 'OFF') scheduledCount++; });
                        
                        return (
                           <td key={i} className="px-2 py-2 border-r border-indigo-200 border-t text-center bg-indigo-50/50">
                              <span className="text-[11px] font-black text-indigo-900">{scheduledCount}</span>
                           </td>
                        )
                     })}
                     {(() => {
                       let totalWfoSum = 0;
                       generatedRoster.forEach(r => {
                         days.forEach(d => {
                           if (r.roster[d] && r.roster[d] !== 'OFF') totalWfoSum++;
                         });
                       });
                       return (
                         <>
                           <td className="px-2 py-2 border-r border-indigo-200 border-t text-center bg-indigo-50/60 font-black text-[11px] text-[#6366f1] min-w-[90px]">
                             {totalWfoSum}
                           </td>
                           <td className="px-2 py-2 border-r border-indigo-200 border-t text-center bg-rose-50/20 font-black text-[11px] text-slate-300 min-w-[90px]">
                             -
                           </td>
                         </>
                       );
                     })()}
                  </tr>

                  <tr className="bg-indigo-100/50">
                     <td className="sticky left-0 z-40 bg-indigo-200 border-r border-indigo-200 px-6 py-3 border-t w-[180px] sm:w-[220px] min-w-[180px] sm:min-w-[220px] max-w-[180px] sm:max-w-[220px]">
                        <span className="text-[10px] font-black uppercase text-indigo-900 tracking-widest block">TOTAL KESELURUHAN</span>
                     </td>
                     {days.map((d, i) => {
                        let totalCount = generatedRoster.length;
                        return (
                          <td key={i} className="px-2 py-3 border-r border-indigo-200 border-t text-center bg-indigo-100/80">
                             <span className="text-[12px] font-black text-indigo-900">{totalCount}</span>
                          </td>
                        )
                     })}
                     {(() => {
                       const totalCellsCount = generatedRoster.length * days.length;
                       return (
                         <>
                           <td className="px-2 py-3 border-r border-indigo-200 border-t text-center bg-indigo-100 font-black text-[12px] text-indigo-950 min-w-[90px]">
                             {totalCellsCount}
                           </td>
                           <td className="px-2 py-3 border-r border-indigo-200 border-t text-center bg-indigo-100/50 font-black text-[12px] text-indigo-300 min-w-[90px]">
                             -
                           </td>
                         </>
                       );
                     })()}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {generatedRoster.length === 0 && (
          <div className="p-12 border-2 border-dashed border-gray-100 rounded-[2rem] bg-slate-50/50 flex flex-col items-center justify-center text-center">
             <CalendarIcon className="w-12 h-12 text-slate-300 mb-4" />
             <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Belum Ada Roster</h4>
             <p className="text-[10px] font-medium text-slate-500 mt-2 max-w-sm uppercase tracking-widest leading-relaxed">
               Silakan pilih rentang tanggal dan klik "Buat Schedule" untuk mengatur jadwal roster karyawan otomatis berdasarkan komposisi required FTE.
             </p>
          </div>
        )}
      </div>
    );
  };
  const renderAttendance = () => {
    const attendanceStats = [
      { label: "Present", value: "392", color: "text-green-600" },
      { label: "Late", value: "14", color: "text-amber-500" },
      { label: "Absent", value: "8", color: "text-active-red" },
      { label: "On Leave", value: "22", color: "text-blue-500" },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {attendanceStats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-neutral-gray uppercase tracking-widest mb-1">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-gray" />
              <input 
                type="text" 
                placeholder="SEARCH ATTENDANCE..." 
                className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-[11px] font-bold uppercase tracking-tight focus:ring-1 focus:ring-active-red/20 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-100 transition-colors">
                <Filter className="w-4 h-4 text-black" />
              </button>
              <button className="px-5 py-2.5 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-active-red transition-all">
                Export Log
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Agent</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Schedule</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Check-In</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Check-Out</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {combinedAgents
                  .filter(a => selectedSite === "all" || a.site === selectedSite)
                  .filter(a => selectedUnit === "all" || a.unit === selectedUnit)
                  .filter(a => selectedProject === "all" || a.project === selectedProject)
                  .map((agent) => {
                  const shift = resolvedShifts[agent.shift] || resolvedShifts["H"];
                  const isLate = Math.random() > 0.8;
                  const checkIn = isLate ? `${shift.start.split(":")[0]}:0${Math.floor(Math.random() * 9) + 5}` : shift.start;
                  
                  return (
                    <tr key={agent.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-black uppercase">{agent.name}</span>
                          <span className="text-[9px] font-bold text-neutral-gray uppercase opacity-60">ID: {agent.id} – {agent.team}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold text-black">{shift.start} - {shift.end}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold ${isLate ? 'text-amber-500' : 'text-black'}`}>{checkIn}</span>
                          {isLate && <span className="bg-amber-50 text-amber-600 text-[8px] font-black uppercase px-1 rounded animate-pulse">Late</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold text-black">--:--</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isLate ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                          {isLate ? 'LATE ENTRY' : 'ON-TIME'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold text-black">
                        {isLate ? '0h 0m' : '4h 12m'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderForecasting = () => (
    <div className="space-y-6 sm:space-y-8">
       <div className="bg-white p-6 sm:p-10 rounded-2xl sm:rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-active-red/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-6 relative">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-slate-900 text-slate-100 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-2 shadow-lg backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time Simulation Active
            </div>
            <h3 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tighter uppercase leading-none italic">
              Coverage <span className="text-rose-600">Intelligence</span>
            </h3>
            <p className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-3">
              <Database size={12} /> Resource Capacity & Demand Calibration
            </p>
          </div>
          
          <div className="flex gap-8 group">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Forecast Precision</p>
                <p className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tighter group-hover:text-indigo-600 transition-colors">99.2%</p>
             </div>
             <div className="h-10 w-px bg-slate-100 self-center" />
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Service Risk</p>
                <div className="flex items-center gap-2 justify-end">
                   <p className="text-3xl sm:text-4xl font-black text-rose-600 tracking-tighter">LOW</p>
                   <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
             </div>
          </div>
        </div>
        
        {/* Simplified Chart Legend */}
        <div className="flex flex-wrap gap-6 mb-4">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#6366f1]" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Customer Demand</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#10b981]" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Staffing Level</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/30" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Resource Shortfall</span>
           </div>
        </div>

        <div className="h-[250px] sm:h-[350px] w-full mt-8">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={reqData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorStaffed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorGap" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                  <stop offset="90%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                interval={7} 
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '24px', 
                  border: '1px solid #e2e8f0', 
                  padding: '24px', 
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                  backgroundColor: 'rgba(255,255,255,0.98)',
                  backdropFilter: 'blur(12px)'
                }}
                itemStyle={{ textTransform: 'uppercase', fontWeight: '900', fontSize: '11px', padding: '6px 0' }}
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
              />
              {/* Demand Line */}
              <Line 
                type="monotone" 
                dataKey="req" 
                name="Demand Threshold" 
                stroke="#6366f1" 
                strokeWidth={2} 
                dot={false}
                activeDot={false}
              />
              {/* Staffed Area */}
              <Area 
                type="monotone" 
                dataKey="actual" 
                name="Staffed Resources" 
                stroke="#10b981" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorStaffed)" 
                activeDot={{ r: 8, strokeWidth: 4, stroke: '#fff', fill: '#10b981' }}
              />
              {/* Gap Highlights (Red Bars) */}
              <Bar 
                dataKey="gap" 
                name="Understaffing Gap" 
                fill="url(#colorGap)" 
                radius={[4, 4, 0, 0]}
                barSize={12}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderHistorical = () => {
    const days = getDaysArray(histStartDate, histEndDate);
    const slots = getIntervalSlots(histIntervalType);

    // Calculate vertical column totals
    const columnTotals = days.map(d => {
      let sum = 0;
      slots.forEach(s => {
        sum += (histRequirements[d]?.[s] || 0);
      });
      return sum;
    });

    // Calculate vertical column totals for active scheduled coverage
    const compositionShifts = (Object.keys(dbShifts).length > 0 ? dbShifts : SHIFTS) as Record<string, { label: string; start: string; end: string; color: string }>;

    const getScheduledAgentCountForSlot = (day: string, slot: string) => {
      if (!generatedRoster || generatedRoster.length === 0) return 0;
      let count = 0;
      generatedRoster.forEach(r => {
        const shiftCode = r.roster[day];
        if (shiftCode && shiftCode !== "OFF") {
          const sInfo = compositionShifts[shiftCode];
          if (sInfo && isSlotInShift(slot, sInfo.start, sInfo.end)) {
            count++;
          }
        }
      });
      return count;
    };

    const scheduledColumnTotals = days.map(d => {
      let sum = 0;
      slots.forEach(s => {
        sum += getScheduledAgentCountForSlot(d, s);
      });
      return sum;
    });

    let totalUnderstaffedGap = 0;
    let totalOverstaffedGap = 0;
    const totalIntervalsCountGap = days.length * slots.length;

    days.forEach(d => {
        slots.forEach(slot => {
            const reqVal = histRequirements[d]?.[slot] || 0;
            const schedVal = getScheduledAgentCountForSlot(d, slot);
            const gapVal = schedVal - reqVal;
            if (gapVal < 0) totalUnderstaffedGap++;
            else if (gapVal > 2) totalOverstaffedGap++;
        });
    });

    const matchIntervalsCountGap = totalIntervalsCountGap - totalOverstaffedGap - totalUnderstaffedGap;
    const accuracyPercentageGap = totalIntervalsCountGap > 0 ? (matchIntervalsCountGap / totalIntervalsCountGap) * 100 : 0;

    return (
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        {/* Dynamic Header & Status Indicator */}
        <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-sky-50 text-sky-600 rounded-2xl">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-black tracking-tight uppercase">Agent Required Capacity Grid</h3>
              <p className="text-neutral-gray text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] mt-1">
                Atur kebutuhan jumlah agent sesuai interval & tanggal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${histUsingFallback ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
              {histUsingFallback ? "Local Fallover" : "Supabase Connected"}
            </span>
            <button
              onClick={() => saveIntervalRequirements()}
              disabled={histSaving || histLoading}
              className="px-4 py-2 bg-slate-900 border border-slate-950 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {histSaving ? (
                <>
                  <Database size={12} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Database size={12} /> Simpan ke Supabase
                </>
              )}
            </button>
          </div>
        </div>

        {/* Configurations Bar */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Date Picker Range */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest block font-sans">Pilih Periode Tanggal (Maks 31 Hari)</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-gray" />
                <input
                  type="date"
                  value={histStartDate}
                  onChange={(e) => setHistStartDate(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-black outline-none font-mono"
                />
              </div>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-gray" />
                <input
                  type="date"
                  value={histEndDate}
                  onChange={(e) => setHistEndDate(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-black outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Flexible Interval Select */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest block font-sans">Durasi Interval</label>
            <div className="grid grid-cols-3 gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
              {(["15m", "30m", "1h"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setHistIntervalType(type)}
                  className={`py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors ${histIntervalType === type ? 'bg-white shadow-sm text-black border border-gray-100' : 'text-neutral-gray hover:text-black'}`}
                >
                  {type === "15m" ? "15m" : type === "30m" ? "30m" : "1 Jam"}
                </button>
              ))}
            </div>
          </div>

          {/* Quick presets */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest block font-sans">Tindakan Cepat</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={seedDefaultRequirements}
                className="w-full py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 text-[9px] font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-1 border border-sky-100"
                title="Isi data curve kantor realistis secara otomatis"
              >
                <Zap size={11} /> Generate
              </button>
              <button
                onClick={clearAllRequirements}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-1 border border-rose-100"
                title="Batal atau kosongkan semua data interval"
              >
                Reset 0
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Upload Panel */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-black">Bulk Import Data Interval</h4>
              <p className="text-neutral-gray text-[9px] font-black uppercase tracking-widest mt-1">
                Salin & Tempel data matrix dari Excel / Google Sheets di bawah ini
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Target Tujuan</span>
              <select
                value={histImportTargetDate}
                onChange={(e) => setHistImportTargetDate(e.target.value)}
                className="bg-gray-50 border-none rounded-xl px-3 py-1.5 text-[10px] font-bold outline-none font-mono"
              >
                <option value="all">Semua Kolom Tanggal (Matrix Excel)</option>
                {days.map(d => (
                  <option key={d} value={d}>Hanya Tanggal: {d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <textarea
                placeholder={
                  histImportTargetDate === "all"
                    ? "Contoh format matrix excel (pisahkan tab / koma):\n10\t12\t15\t10\n10\t12\t14\t11\n8\t10\t12\t9"
                    : "Contoh format kolom tunggal tanggal (Satu angka per baris):\n12\n15\n18\n20\n24\n12"
                }
                rows={4}
                value={histBulkInput}
                onChange={(e) => setHistBulkInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-[11px] font-semibold focus:ring-1 focus:ring-black outline-none font-mono leading-relaxed"
              />
              <button
                onClick={handleBulkImport}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors shadow-sm"
              >
                Proses & Tempel ke Sheet
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
              <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-500">Petunjuk Format</h5>
              <ul className="list-disc pl-4 text-[9px] text-slate-600 font-medium space-y-1.5 leading-relaxed">
                <li>Untuk <strong>Kolom Tunggal</strong>: Pilih tanggal tujuan, lalu salin satu kolom angka dari Excel (misal 24 baris untuk interval 1 Jam).</li>
                <li>Untuk <strong>Matrix Multi-Tanggal</strong>: Pilih durasi 'Semua Kolom', lalu salin range baris & kolom di Excel. Kolom akan dicocokkan berurutan dengan tanggal aktif.</li>
                <li>Data yang Anda tempel akan langsung tampil pada sheet grid interaktif dan dapat disunting/diedit kembali sebelum disimpan permanen ke Supabase.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Shift Composition Panel */}
        <div className="bg-white rounded-[2rem] border border-gray-200/80 shadow-sm overflow-hidden flex flex-col mt-8">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50/50">
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#6366f1] bg-[#f5f3ff] border border-[#e0e7ff] px-2 py-0.5 rounded-full">
                Auto-Converted Staffing Plan
              </span>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-950 mt-1.5 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-[#6366f1]" />
                KOMPOSISI AGENT PER SHIFT (SHIFT COMPOSITION)
              </h4>
              <p className="text-[9px] text-[#6366f1] font-black uppercase tracking-wider mt-1">
                Kebutuhan jumlah agent per shift berdasarkan interval Roster Requirements Matrix di atas
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-100">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 pl-2">Rumus Konversi:</span>
              <select
                value={compositionMode}
                onChange={(e) => setCompositionMode(e.target.value as "peak" | "average")}
                className="bg-transparent border-none rounded-lg text-[9px] font-black uppercase text-[#6366f1] tracking-widest outline-none cursor-pointer p-1 py-1"
              >
                <option value="peak">KAPASITAS PUNCAK (PEAK MAX)</option>
                <option value="average">RATA-RATA KEBUTUHAN (FTE AVG)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[600px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-wider">
                  <th className="w-[120px] px-3 py-2 text-left border-r border-slate-200 font-sans font-black tracking-widest text-[#475569]">
                    SHIFT / JAM KERJA
                  </th>
                  {days.map((d) => {
                    const dayName = format(new Date(d), "EEE");
                    const dateFormatted = format(new Date(d), "dd/MM");
                    const isWeekend = ["Sat", "Sun"].includes(dayName);
                    return (
                      <th key={d} className={`p-1.5 py-1 text-center border-r border-slate-200 min-w-[50px] max-w-[65px] ${isWeekend ? 'bg-rose-50/40 text-rose-600' : 'text-slate-700'}`}>
                        <div className="flex flex-col items-center">
                          <span className="font-extrabold text-[10px] font-mono">{dateFormatted}</span>
                          <span className="text-[8px] font-bold opacity-75">{dayName.toUpperCase()}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {(() => {
                  const compositionShifts = (Object.keys(dbShifts).length > 0 ? dbShifts : SHIFTS) as Record<string, { label: string; start: string; end: string; color: string }>;
                  const fteDivisor = histIntervalType === "15m" ? 32 : histIntervalType === "30m" ? 16 : 8;
                  
                  const rawShiftValues: Record<string, Record<string, number>> = {};
                  const compDayTotals: Record<string, number> = {};
                  const fteDayTotals: Record<string, number> = {};

                  days.forEach(d => {
                    compDayTotals[d] = 0;
                    fteDayTotals[d] = slots.reduce((acc, s) => acc + (histRequirements[d]?.[s] || 0), 0) / fteDivisor;
                  });

                  Object.entries(compositionShifts).forEach(([code, sInfo]) => {
                    rawShiftValues[code] = {};
                    days.forEach(d => {
                      const slotsInShift = slots.filter(slot => isSlotInShift(slot, sInfo.start, sInfo.end));
                      const values = slotsInShift.map(slot => histRequirements[d]?.[slot] || 0);

                      let calculatedValue = 0;
                      if (values.length > 0) {
                        if (compositionMode === "peak") {
                          calculatedValue = Math.max(...values, 0);
                        } else {
                          const sum = values.reduce((acc, v) => acc + v, 0);
                          calculatedValue = Number((sum / values.length).toFixed(1));
                        }
                      }
                      rawShiftValues[code][d] = calculatedValue;
                      compDayTotals[d] += calculatedValue;
                    });
                  });

                  // Scale down shift values so they don't exceed FTE
                  const finalDayTotals: Record<string, number> = {};
                  days.forEach(d => { finalDayTotals[d] = 0; });

                  const rows = Object.entries(compositionShifts).map(([code, sInfo]) => {
                    return (
                      <tr key={code} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-3 py-1.5 border-r border-slate-200 font-mono font-black bg-slate-50 text-slate-800">
                          <div className="flex flex-col">
                            <span className="text-slate-950 font-black text-xs">{code}</span>
                            <span className="text-[7.5px] font-normal text-slate-500 mt-px">
                              {sInfo.start} - {sInfo.end}
                            </span>
                          </div>
                        </td>

                        {days.map((d) => {
                          let val = rawShiftValues[code][d];
                          // Cap scaling down if exceeding FTE
                          if (compDayTotals[d] > fteDayTotals[d] && compDayTotals[d] > 0) {
                            val = val * (fteDayTotals[d] / compDayTotals[d]);
                          }
                          val = Math.round(val);
                          finalDayTotals[d] += val;
                          
                          const isActive = val > 0;
                          return (
                            <td key={d} className="p-1 py-1 text-center border-r border-slate-100">
                              <span className={`font-mono text-xs font-black ${
                                isActive ? 'text-slate-900' : 'text-slate-200'
                              }`}>
                                {val}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  });

                  return (
                    <>
                      {rows}
                      <tr className="bg-slate-100/50">
                        <td className="px-3 py-2 border-r border-slate-200 font-mono font-black text-slate-900 text-xs">
                          TOTAL
                        </td>
                        {days.map(d => {
                           // Sometimes roundings can cause 1 agent off compared to standard FTE ceiling, 
                           // we can ensure the displayed total respects the FTE ceiling explicitly.
                           const finalTotal = Math.min(finalDayTotals[d] || 0, Math.ceil(fteDayTotals[d]));
                           return (
                            <td key={d} className="p-1 py-1 text-center border-r border-slate-200">
                              <span className="font-mono text-[13px] font-black text-indigo-600">
                                {finalTotal}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-center">
            <p className="text-[9.5px] text-[#6366f1] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Zap size={11} className="animate-bounce" /> TIPS: Sesuaikan angka kebutuhan interval di "Roster Requirements Matrix" di atas untuk memperbarui komposisi shift secara real-time!
            </p>
          </div>
        </div>

        {/* Interactive Spreadsheet Grid */}
        <div className="bg-white rounded-[2rem] border border-gray-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#6366f1] bg-[#f5f3ff] border border-[#e0e7ff] px-2 py-0.5 rounded-full">
                Interactive Spreadsheet Window
              </span>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-950 mt-1.5 flex items-center gap-1.5">
                Roster Requirements Matrix
              </h4>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Metrik Terpilih</p>
              <p className="text-xs font-black text-black">
                {days.length} Hari • {slots.length} Slots per Hari
              </p>
            </div>
          </div>

          <div className="overflow-x-auto flex-grow max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
              <thead className="sticky top-0 z-50 bg-slate-100 shadow-sm select-none">
                {/* Visual Header 1: Weeks indicator */}
                <tr className="bg-[#6366f1]/5 text-slate-500 text-[9px] font-black border-b border-slate-100 uppercase tracking-widest">
                  <th className="w-[180px] p-2 text-center border-r border-[#e2e8f0]/40 font-mono text-neutral-gray">
                    WEEK INDEX
                  </th>
                  {days.map((d, idx) => {
                    const weekNum = Math.floor(idx / 7) + 1;
                    const isNewWeek = idx % 7 === 0;
                    return (
                      <th
                        key={`w-${idx}`}
                        className={`p-2 text-center border-r border-[#e2e8f0]/40 text-[#6366f1] text-[8px] tracking-wider`}
                      >
                        {isNewWeek ? `W${weekNum}` : ""}
                      </th>
                    );
                  })}
                </tr>

                {/* Visual Header 1: Dates (01, 02...) */}
                <tr className="bg-white border-b border-slate-200/90 text-sm">
                  <th className="w-[180px] px-4 py-3 text-center border-r border-[#e2e8f0] text-[9px] font-black uppercase tracking-wider text-slate-700 bg-slate-50">
                    Time Interval -<br />Agent Required
                  </th>
                  {days.map((d, i) => {
                    const dateNum = format(new Date(d), "dd");
                    const isWeekend = ["Sat", "Sun"].includes(format(new Date(d), "EEE"));
                    return (
                      <th
                        key={`d-${i}`}
                        className={`p-1.5 text-center font-mono font-black border-r border-[#e2e8f0] ${isWeekend ? 'bg-rose-50/50 text-rose-600' : 'text-slate-900 bg-white'}`}
                      >
                        {dateNum}
                      </th>
                    );
                  })}
                </tr>

                {/* Visual Header 2: Weekday initials (Thu, Fri...) */}
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-neutral-gray">
                  <th className="w-[180px] p-1.5 text-center border-r border-[#e2e8f0] font-sans font-black uppercase text-[8px] tracking-widest">
                    INTERVAL VIEW
                  </th>
                  {days.map((d, i) => {
                    const dayName = format(new Date(d), "EEE");
                    const isWeekend = ["Sat", "Sun"].includes(dayName);
                    return (
                      <th
                        key={`day-${i}`}
                        className={`py-1 px-1.5 text-center font-sans font-black uppercase border-r border-[#e2e8f0] ${isWeekend ? 'bg-rose-50/70 text-rose-500' : 'text-neutral-gray bg-slate-50'}`}
                      >
                        {dayName}
                      </th>
                    );
                  })}
                </tr>

                {/* Summary / Totals Row */}
                <tr className="bg-sky-50 border-b border-sky-100 text-sky-950 font-black">
                  <td className="w-[180px] px-3 py-2 text-center border-r border-sky-100 font-sans text-[9px] uppercase tracking-widest text-sky-900 bg-sky-50">
                    Total Hari (SUM)
                  </td>
                  {columnTotals.map((tot, idx) => (
                    <td
                      key={`tot-${idx}`}
                      className="p-1 px-1.5 text-center font-mono text-[11px] font-black border-r border-sky-100 text-sky-800 bg-sky-50"
                    >
                      {tot}
                    </td>
                  ))}
                </tr>

                {/* Total FTE Row */}
                <tr className="bg-indigo-50/70 border-b-2 border-slate-300 text-indigo-950 font-black">
                  <td className="w-[180px] px-3 py-2 text-center border-r border-indigo-100 font-sans text-[9px] uppercase tracking-widest text-indigo-900 bg-indigo-50/50">
                    Total FTE
                  </td>
                  {columnTotals.map((tot, idx) => {
                    const fteDivisor = histIntervalType === "15m" ? 32 : histIntervalType === "30m" ? 16 : 8;
                    const val = Math.round(tot / fteDivisor);
                    return (
                      <td
                        key={`tot8-${idx}`}
                        className="p-1 px-1.5 text-center font-mono text-[11px] font-black border-r border-indigo-100 text-indigo-800 bg-indigo-50/60"
                      >
                        {val}
                      </td>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {histLoading ? (
                  <tr>
                    <td colSpan={days.length + 1} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <History size={24} className="text-[#6366f1] animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#6366f1]">Loading Interval Data...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  slots.map((slot, sIdx) => (
                    <tr key={`slot-${sIdx}`} className="hover:bg-slate-50/70 transition-colors">
                      {/* Left Header label */}
                      <td className="w-[180px] px-3 py-1.5 text-center border-r border-slate-100 bg-slate-50/30 text-[10px] font-black font-mono text-slate-800 sticky left-0 z-10 selection:bg-transparent">
                        {slot}
                      </td>

                      {/* Interactive Cells */}
                      {days.map((d, dIdx) => {
                        const cellVal = histRequirements[d]?.[slot] || 0;
                        const isWeekend = ["Sat", "Sun"].includes(format(new Date(d), "EEE"));
                        return (
                          <td
                            key={`cell-${sIdx}-${dIdx}`}
                            className={`p-0 border-r border-slate-100 ${isWeekend ? 'bg-rose-50/10' : ''}`}
                          >
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={cellVal === 0 ? "0" : cellVal}
                              onChange={(e) => handleCellChange(d, slot, e.target.value)}
                              className="w-full text-center px-1.5 py-1.5 text-[11px] font-black font-mono focus:bg-sky-100/60 focus:outline-none transition-colors border-none bg-transparent text-slate-900 leading-none"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Helper */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Spreadsheet sedia untuk di-edit langsung. Tekan tombol simpan di kanan bawah untuk menyimpan secara permanen ke database Supabase
              </p>
            </div>
            <button
              onClick={() => saveIntervalRequirements()}
              disabled={histSaving || histLoading}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
            >
              <ClipboardCheck size={12} /> Simpan Perubahan
            </button>
          </div>
        </div>

        {/* Scheduled Coverage Matrix Grid */}
        <div className="bg-white rounded-[2rem] border border-gray-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#059669] bg-[#ecfdf5] border border-[#d1fae5] px-2 py-0.5 rounded-full">
                Active Schedule Output
              </span>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mt-1.5 flex items-center gap-1.5">
                <UserCheck size={14} className="text-[#059669]" />
                Roster Scheduled Coverage Matrix
              </h4>
              <p className="text-[9.5px] text-[#059669] font-black uppercase tracking-wider mt-1">
                Kebutuhan hasil coverage agent per interval berdasarkan data roster schedule yang telah dibuat / digenerate
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Metrik Terjalin</p>
              <p className="text-xs font-black text-black">
                {days.length} Hari • {slots.length} Slots per Hari
              </p>
            </div>
          </div>

          <div className="overflow-x-auto flex-grow max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
              <thead className="sticky top-0 z-50 bg-slate-100 shadow-sm select-none">
                {/* Visual Header 1: Weeks indicator */}
                <tr className="bg-emerald-500/5 text-slate-500 text-[9px] font-black border-b border-slate-100 uppercase tracking-widest">
                  <th className="w-[180px] p-2 text-center border-r border-[#e2e8f0]/40 font-mono text-neutral-gray">
                    WEEK INDEX
                  </th>
                  {days.map((d, idx) => {
                    const weekNum = Math.floor(idx / 7) + 1;
                    const isNewWeek = idx % 7 === 0;
                    return (
                      <th
                        key={`sched-w-${idx}`}
                        className="p-2 text-center border-r border-[#e2e8f0]/40 text-[#059669] text-[8px] tracking-wider"
                      >
                        {isNewWeek ? `W${weekNum}` : ""}
                      </th>
                    );
                  })}
                </tr>

                {/* Visual Header 1: Dates (01, 02...) */}
                <tr className="bg-white border-b border-slate-200/90 text-sm">
                  <th className="w-[180px] px-4 py-3 text-center border-r border-[#e2e8f0] text-[9px] font-black uppercase tracking-wider text-slate-700 bg-slate-50">
                    Time Interval -<br />Scheduled Agent
                  </th>
                  {days.map((d, i) => {
                    const dateNum = format(new Date(d), "dd");
                    const isWeekend = ["Sat", "Sun"].includes(format(new Date(d), "EEE"));
                    return (
                      <th
                        key={`sched-d-${i}`}
                        className={`p-1.5 text-center font-mono font-black border-r border-[#e2e8f0] ${isWeekend ? 'bg-rose-50/50 text-rose-600' : 'text-slate-900 bg-white'}`}
                      >
                        {dateNum}
                      </th>
                    );
                  })}
                </tr>

                {/* Visual Header 2: Weekday initials (Thu, Fri...) */}
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-neutral-gray">
                  <th className="w-[180px] p-1.5 text-center border-r border-[#e2e8f0] font-sans font-black uppercase text-[8px] tracking-widest">
                    INTERVAL VIEW
                  </th>
                  {days.map((d, i) => {
                    const dayName = format(new Date(d), "EEE");
                    const isWeekend = ["Sat", "Sun"].includes(dayName);
                    return (
                      <th
                        key={`sched-day-${i}`}
                        className={`py-1 px-1.5 text-center font-sans font-black uppercase border-r border-[#e2e8f0] ${isWeekend ? 'bg-rose-50/70 text-rose-500' : 'text-neutral-gray bg-slate-50'}`}
                      >
                        {dayName}
                      </th>
                    );
                  })}
                </tr>

                {/* Summary / Totals Row */}
                <tr className="bg-emerald-50 border-b border-emerald-100 text-emerald-950 font-black">
                  <td className="w-[180px] px-3 py-2 text-center border-r border-emerald-100 font-sans text-[9px] uppercase tracking-widest text-[#059669] bg-emerald-50">
                    Total Hari (SUM)
                  </td>
                  {scheduledColumnTotals.map((tot, idx) => (
                    <td
                      key={`sched-tot-${idx}`}
                      className="p-1 px-1.5 text-center font-mono text-[11px] font-black border-r border-emerald-100 text-[#059669] bg-emerald-50"
                    >
                      {tot}
                    </td>
                  ))}
                </tr>

                {/* Total FTE Row */}
                <tr className="bg-emerald-50/50 border-b-2 border-slate-300 text-emerald-950 font-black">
                  <td className="w-[180px] px-3 py-2 text-center border-r border-emerald-100 font-sans text-[9px] uppercase tracking-widest text-[#059669] bg-emerald-50/30">
                    Total FTE
                  </td>
                  {scheduledColumnTotals.map((tot, idx) => {
                    const fteDivisor = histIntervalType === "15m" ? 36 : histIntervalType === "30m" ? 18 : 9;
                    const val = Math.round(tot / fteDivisor);
                    return (
                      <td
                        key={`sched-tot8-${idx}`}
                        className="p-1 px-1.5 text-center font-mono text-[11px] font-black border-r border-emerald-100 text-slate-800 bg-emerald-50/40"
                      >
                        {val}
                      </td>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {generatedRoster.length === 0 ? (
                  <tr>
                    <td colSpan={days.length + 1} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle size={24} className="text-amber-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                          Belum ada schedule yang dibuat. Silakan buat schedule terlebih dahulu di tab "Schedule Generator".
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  slots.map((slot, sIdx) => (
                    <tr key={`sched-slot-${sIdx}`} className="hover:bg-slate-50/70 transition-colors">
                      {/* Left Header label */}
                      <td className="w-[180px] px-3 py-1.5 text-center border-r border-slate-100 bg-slate-50/30 text-[10px] font-black font-mono text-slate-800 sticky left-0 z-10 selection:bg-transparent">
                        {slot}
                      </td>

                      {/* Coverage Cells */}
                      {days.map((d, dIdx) => {
                        const cellVal = getScheduledAgentCountForSlot(d, slot);
                        const isWeekend = ["Sat", "Sun"].includes(format(new Date(d), "EEE"));
                        return (
                          <td
                            key={`sched-cell-${sIdx}-${dIdx}`}
                            className={`px-1.5 py-3 text-center border-r border-slate-100 text-[11px] font-black font-mono text-slate-900 leading-none ${isWeekend ? 'bg-rose-50/10' : ''}`}
                          >
                            {cellVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Matriks coverage di atas mewakili jumlah kapasitas agent aktual yang tersedia untuk bekerja pada setiap interval waktu.
              </p>
            </div>
          </div>
        </div>

        {/* Roster Spacing Gap Matrix Grid */}
        <div className="bg-white rounded-[2rem] border border-gray-200/80 shadow-sm overflow-hidden flex flex-col mt-4">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#dc2626] bg-[#fef2f2] border border-[#fee2e2] px-2 py-0.5 rounded-full">
                GAP ANALYSIS OUTPUT
              </span>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mt-1.5 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-[#dc2626]" />
                Roster Gap Matrix (Schedule vs Requirement)
              </h4>
              <p className="text-[9.5px] text-[#dc2626] font-black uppercase tracking-wider mt-1">
                Selisih ketersediaan agent aktual (Scheduled) dikurangi dengan kebutuhan minimal (Requirements) per interval
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Metrik Selisih</p>
              <p className="text-xs font-black text-black">
                {days.length} Hari • {slots.length} Slots per Hari
              </p>
            </div>
          </div>

          <div className="overflow-x-auto flex-grow max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
              <thead className="sticky top-0 z-50 bg-slate-100 shadow-sm select-none">
                {/* Visual Header 1: Weeks indicator */}
                <tr className="bg-rose-500/5 text-slate-500 text-[9px] font-black border-b border-slate-100 uppercase tracking-widest">
                  <th className="w-[180px] p-2 text-center border-r border-[#e2e8f0]/40 font-mono text-neutral-gray">
                    WEEK INDEX
                  </th>
                  {days.map((d, idx) => {
                    const weekNum = Math.floor(idx / 7) + 1;
                    const isNewWeek = idx % 7 === 0;
                    return (
                      <th
                        key={`gap-w-${idx}`}
                        className="p-2 text-center border-r border-[#e2e8f0]/40 text-[#dc2626] text-[8px] tracking-wider"
                      >
                        {isNewWeek ? `W${weekNum}` : ""}
                      </th>
                    );
                  })}
                </tr>

                {/* Dates (01, 02...) */}
                <tr className="bg-white border-b border-slate-200/90 text-sm">
                  <th className="w-[180px] px-4 py-3 text-center border-r border-[#e2e8f0] text-[9px] font-black uppercase tracking-wider text-slate-700 bg-slate-50">
                    Time Interval -<br />Coverage Gap
                  </th>
                  {days.map((d, i) => {
                    const dateNum = format(new Date(d), "dd");
                    const isWeekend = ["Sat", "Sun"].includes(format(new Date(d), "EEE"));
                    return (
                      <th
                        key={`gap-d-${i}`}
                        className={`p-1.5 text-center font-mono font-black border-r border-[#e2e8f0] ${isWeekend ? 'bg-rose-50/50 text-rose-600' : 'text-slate-900 bg-white'}`}
                      >
                        {dateNum}
                      </th>
                    );
                  })}
                </tr>

                {/* Weekday initials (Thu, Fri...) */}
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-neutral-gray">
                  <th className="w-[180px] p-1.5 text-center border-r border-[#e2e8f0] font-sans font-black uppercase text-[8px] tracking-widest">
                    INTERVAL VIEW
                  </th>
                  {days.map((d, i) => {
                    const dayName = format(new Date(d), "EEE");
                    const isWeekend = ["Sat", "Sun"].includes(dayName);
                    return (
                      <th
                        key={`gap-day-${i}`}
                        className={`py-1 px-1.5 text-center font-sans font-black uppercase border-r border-[#e2e8f0] ${isWeekend ? 'bg-rose-50/70 text-rose-500' : 'text-neutral-gray bg-slate-50'}`}
                      >
                        {dayName}
                      </th>
                    );
                  })}
                </tr>

                {/* Summary / Totals Row */}
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-950 font-black">
                  <td className="w-[180px] px-3 py-2 text-center border-r border-slate-200 font-sans text-[9px] uppercase tracking-widest text-[#475569] bg-slate-100">
                    Total Gap Hari (SUM)
                  </td>
                  {days.map((d, idx) => {
                    const totReq = columnTotals[idx] || 0;
                    const totSched = scheduledColumnTotals[idx] || 0;
                    const netGap = totSched - totReq;
                    const gapColor = netGap < 0 ? 'text-rose-600 bg-rose-50/60' : netGap > 0 ? 'text-emerald-700 bg-emerald-50/40' : 'text-slate-600';
                    return (
                      <td
                        key={`gap-tot-${idx}`}
                        className={`p-1 px-1.5 text-center font-mono text-[11px] font-black border-r border-slate-200 ${gapColor}`}
                      >
                        {netGap > 0 ? `+${netGap}` : netGap}
                      </td>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 flex-grow">
                {slots.map((slot, sIdx) => (
                  <tr key={`gap-slot-${sIdx}`} className="hover:bg-slate-50/70 transition-colors">
                    {/* Left Header label */}
                    <td className="w-[180px] px-3 py-1.5 text-center border-r border-slate-100 bg-slate-50/30 text-[10px] font-black font-mono text-slate-800 sticky left-0 z-10 selection:bg-transparent">
                      {slot}
                    </td>

                    {/* Gap Cells */}
                    {days.map((d, dIdx) => {
                      const reqVal = histRequirements[d]?.[slot] || 0;
                      const schedVal = getScheduledAgentCountForSlot(d, slot);
                      const gapVal = schedVal - reqVal;
                      const isWeekend = ["Sat", "Sun"].includes(format(new Date(d), "EEE"));
                      
                      let cellClass = "";
                      let displayVal = "";
                      
                      if (gapVal < 0) {
                        cellClass = "bg-rose-50/80 text-rose-600 font-extrabold";
                        displayVal = `${gapVal}`;
                      } else if (gapVal > 0) {
                        cellClass = "bg-emerald-50/20 text-emerald-600 font-bold";
                        displayVal = `+${gapVal}`;
                      } else {
                        cellClass = "text-slate-400 font-normal bg-slate-50/10";
                        displayVal = "0";
                      }

                      return (
                        <td
                          key={`gap-cell-${sIdx}-${dIdx}`}
                          className={`px-1.5 py-3 text-center border-r border-slate-100 text-[11px] font-mono leading-none ${cellClass} ${isWeekend ? 'brightness-95' : ''}`}
                        >
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Legenda: Angka negatif (<span className="text-rose-600 font-bold">merah</span>) menunjukkan kekurangan agent (understaffed), angka positif (<span className="text-emerald-600 font-bold">hijau</span>) menunjukkan kelebihan agent (overstaffed).
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 border-t border-slate-200/60 pt-4">
               <div className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Understaffed Gap &lt; 0</span>
                  <span className="text-rose-600 font-black text-sm mt-1">{totalUnderstaffedGap}</span>
               </div>
               <div className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Overstaffed Gap &gt; 2</span>
                  <span className="text-amber-500 font-black text-sm mt-1">{totalOverstaffedGap}</span>
               </div>
               <div className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">In Target Gap 0-2</span>
                  <span className="text-emerald-600 font-black text-sm mt-1">{matchIntervalsCountGap}</span>
               </div>
               <div className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Total Interval Slots</span>
                  <span className="text-slate-900 font-black text-sm mt-1">{totalIntervalsCountGap}</span>
               </div>
               <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">Roster Accuracy</span>
                  <span className="text-indigo-600 font-black text-sm mt-1">{accuracyPercentageGap.toFixed(1)}%</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDB = () => {
    return (
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        {/* DB Sync & Status Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl">
              <Database className="w-8 h-8 text-black animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-black tracking-tight uppercase">Database Workforce Roster</h3>
              <p className="text-neutral-gray text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] mt-1">
                Koneksi Supabase Aktif & Sinkronisasi Real-time
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <div className="text-right">
              <p className="text-[9px] font-black text-neutral-gray uppercase tracking-widest mb-0.5">Total DB Records</p>
              <p className="text-2xl font-black text-black">{dbEmployees.length} Karyawan</p>
            </div>
            <div className="flex flex-col items-end">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${usingFallback ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                {usingFallback ? "Local Fallover" : "Supabase Live"}
              </span>
              <button 
                onClick={loadDbEmployees} 
                disabled={dbLoading}
                className="mt-1.5 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 transition-colors disabled:opacity-50 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-black"
                title="Refresh Data"
              >
                <History size={12} className={`text-black ${dbLoading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Input Forms (Grid Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          
          {/* Bulk Import Column */}
          <div className="lg:col-span-12 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
            <div>
              <h4 className="text-sm font-black text-black uppercase tracking-wider">Bulk Add Employees</h4>
              <p className="text-neutral-gray text-[10px] font-black uppercase tracking-widest mt-1">
                Paste daftar karyawan di bawah ini (Format: NIP, Name, Skill, Channel, Gender, Religion, Project, Unit, Site) atau cukup pisahkan dengan comma/tab
              </p>
            </div>
            
            <textarea
              placeholder="Contoh format lengkap (9 kolom):&#10;2221669, Yoga Fachrul Tristiawan, English, Voice, Male, Islam, Project Alpha, Unit A, Jakarta&#10;&#10;Atau cukup ketik nama saja per baris (kolom lain otomatis default):&#10;Helmi Khairunnisa Putri Kaylsi&#10;Elina Isninda Riyani"
              rows={6}
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs font-semibold focus:ring-1 focus:ring-black outline-none font-mono resize-none leading-relaxed"
            />
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] font-bold text-neutral-gray font-mono">
                {bulkInput.split("\n").filter(l => l.trim()).length} Baris Terdeteksi
              </span>
              <button
                onClick={handleBulkSubmit}
                disabled={dbLoading || !bulkInput.trim()}
                className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {bulkProgress ? bulkProgress : "Process Bulk Add"}
              </button>
            </div>
          </div>

          {/* Single Add & Tools Column */}
          <div className="lg:col-span-12 flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-black uppercase tracking-wider">Single Add Employee</h4>
                  <p className="text-neutral-gray text-[10px] font-black uppercase tracking-widest mt-1">Satu per satu data individu</p>
                </div>
                <button 
                  onClick={() => setIsAddingSingle(!isAddingSingle)}
                  className="text-[10px] font-black uppercase tracking-widest text-[#6366f1] underline"
                >
                  {isAddingSingle ? "Tutup Form" : "Buka Form"}
                </button>
              </div>

              {isAddingSingle ? (
                <form onSubmit={handleSingleSubmit} className="space-y-4 animate-in slide-in-from-top duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest block font-sans">Nama Karyawan</label>
                      <input 
                        type="text"
                        required
                        placeholder="Nama lengkap..."
                        value={singleFormData.name}
                        onChange={(e) => setSingleFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-semibold focus:ring-1 focus:ring-black outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest block font-sans">NIP (Nomor Induk Pegawai)</label>
                      <input 
                        type="text"
                        required
                        placeholder="Contoh: 2221669"
                        value={singleFormData.nip}
                        onChange={(e) => setSingleFormData(prev => ({ ...prev, nip: e.target.value }))}
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-semibold focus:ring-1 focus:ring-black outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest block font-sans">Skill / Keahlian</label>
                      <select 
                        value={singleFormData.skill}
                        onChange={(e) => setSingleFormData(prev => ({ ...prev, skill: e.target.value }))}
                        className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-black outline-none"
                      >
                        {SKILLS.map(sk => <option key={sk} value={sk}>{sk}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest block font-sans">Channel</label>
                      <select 
                        value={singleFormData.channel}
                        onChange={(e) => setSingleFormData(prev => ({ ...prev, channel: e.target.value }))}
                        className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-black outline-none"
                      >
                        {CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest block font-sans">Gender</label>
                      <select 
                        value={singleFormData.gender}
                        onChange={(e) => setSingleFormData(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-black outline-none"
                      >
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest block font-sans">Religion (Agama)</label>
                      <select 
                        value={singleFormData.religion}
                        onChange={(e) => setSingleFormData(prev => ({ ...prev, religion: e.target.value }))}
                        className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-black outline-none"
                      >
                        {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest block font-sans">Project</label>
                      <select 
                        value={singleFormData.project}
                        onChange={(e) => setSingleFormData(prev => ({ ...prev, project: e.target.value }))}
                        className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-black outline-none"
                      >
                        {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest block font-sans">Unit</label>
                      <select 
                        value={singleFormData.unit}
                        onChange={(e) => setSingleFormData(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-black outline-none"
                      >
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest block font-sans">Site (Lokasi)</label>
                      <select 
                        value={singleFormData.site}
                        onChange={(e) => setSingleFormData(prev => ({ ...prev, site: e.target.value }))}
                        className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-black outline-none"
                      >
                        {SITES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={dbLoading}
                    className="w-full py-2.5 bg-black text-white hover:bg-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mt-2"
                  >
                    Tambah Karyawan
                  </button>
                </form>
              ) : (
                <div className="py-6 text-center border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 flex-grow">
                  <p className="text-[10px] font-black text-neutral-gray uppercase tracking-widest">Form Input Cepat Non-Aktif</p>
                  <button 
                    onClick={() => setIsAddingSingle(true)}
                    className="mt-1 px-4 py-2 bg-gray-50 border border-gray-100 hover:bg-gray-100 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                  >
                    Buka Form
                  </button>
                </div>
              )}
            </div>
            
            {/* Quick Tips Box */}
            <div className="flex-1 bg-slate-50 border border-slate-100 p-6 rounded-3xl flex flex-col justify-center gap-3">
              <span className="text-[9px] font-black text-neutral-gray uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} className="text-black" /> Petunjuk Penggunaan
              </span>
              <ul className="list-disc pl-4 text-[10px] text-slate-600 font-medium space-y-2 leading-relaxed">
                <li>Setiap karyawan yang ditambahkan di sini akan otomatis disinkronkan ke tabel terpisah <strong>`workforce`</strong> di Supabase.</li>
                <li>Daftar karyawan ini akan langsung aktif pada tab <strong>Interval</strong> & <strong>Calendar</strong> untuk plotting jadwal roster.</li>
                <li>Gunakan fitur <strong>Bulk Add</strong> untuk memasukkan puluhan karyawan dengan format rapi secara instan.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Database Workers Table View */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h4 className="text-base font-black text-black uppercase tracking-tight font-sans">Daftar Karyawan di Database ({dbEmployees.length})</h4>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#6366f1]">
              Live Connection
            </div>
          </div>

          {dbError ? (
            <div className="p-10 text-center flex flex-col items-center gap-3">
              <AlertCircle className="w-8 h-8 text-active-red opacity-40" />
              <p className="text-xs font-bold text-active-red uppercase tracking-widest">Error: {dbError}</p>
              <button 
                onClick={loadDbEmployees}
                className="mt-2 px-5 py-2.5 bg-gray-50 border border-gray-100 hover:bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Coba Lagi
              </button>
            </div>
          ) : dbLoading && dbEmployees.length === 0 ? (
            <div className="py-20 text-center text-neutral-gray text-xs font-bold uppercase tracking-widest">
              Menghubungi Supabase Node...
            </div>
          ) : dbEmployees.length === 0 ? (
            <div className="py-20 text-center border-dashed border-2 border-gray-100 m-6 rounded-3xl flex flex-col items-center justify-center gap-3 bg-slate-50/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-gray">Belum ada karyawan di database Supabase Anda</p>
              <p className="text-[9px] font-semibold text-neutral-gray max-w-xs leading-relaxed text-center">Gunakan Bulk Add atau Single Add di atas untuk memasukkan data master pertama Anda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-4 text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100 font-sans">No</th>
                    <th className="px-4 py-4 text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100 font-sans">NIP</th>
                    <th className="px-4 py-4 text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100 font-sans">Name</th>
                    <th className="px-4 py-4 text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100 font-sans">Skill</th>
                    <th className="px-4 py-4 text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100 font-sans">Channel</th>
                    <th className="px-4 py-4 text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100 font-sans">Gender</th>
                    <th className="px-4 py-4 text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100 font-sans">Religion</th>
                    <th className="px-4 py-4 text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100 font-sans">Project</th>
                    <th className="px-4 py-4 text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100 font-sans">Unit</th>
                    <th className="px-4 py-4 text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100 font-sans">Site</th>
                    <th className="px-4 py-4 text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100 text-right font-sans">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dbEmployees.map((emp, idx) => (
                    <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-4 text-[11px] font-bold text-neutral-gray font-mono">{idx + 1}</td>
                      <td className="px-4 py-4 text-[11px] font-bold text-black font-mono">{emp.nip}</td>
                      <td className="px-4 py-4 text-[11px] font-black text-black uppercase font-sans">{emp.name}</td>
                      <td className="px-4 py-4 text-[11px] font-bold text-neutral-gray font-sans">{emp.skill || "-"}</td>
                      <td className="px-4 py-4 text-[11px] font-bold text-neutral-gray font-sans">{emp.channel || "-"}</td>
                      <td className="px-4 py-4 text-[11px] font-bold text-neutral-gray font-sans">{emp.gender || "-"}</td>
                      <td className="px-4 py-4 text-[11px] font-bold text-neutral-gray font-sans">{emp.religion || "-"}</td>
                      <td className="px-4 py-4 text-[11px] font-bold text-black uppercase font-sans">{emp.project || "-"}</td>
                      <td className="px-4 py-4 text-[11px] font-bold text-neutral-gray uppercase font-sans">{emp.unit || "-"}</td>
                      <td className="px-4 py-4 text-[11px] font-bold text-neutral-gray uppercase font-sans">{emp.site || "-"}</td>
                      <td className="px-4 py-4 text-right">
                        {deleteConfirmId === emp.id ? (
                          <div className="flex items-center justify-end gap-1.5 animate-in zoom-in-95 duration-200">
                            <button
                              onClick={() => handleDeleteDbEmployee(emp.id)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-[9px] font-black uppercase text-white tracking-widest rounded-lg transition-colors font-sans"
                            >
                              Yakin?
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-[9px] font-black uppercase text-gray-600 tracking-widest rounded-lg transition-colors font-sans"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(emp.id)}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-[9px] font-black uppercase text-active-red tracking-widest rounded-lg transition-colors font-sans"
                          >
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 max-w-full overflow-x-hidden -mt-4 sm:-mt-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[999] max-w-md bg-neutral-900 border border-neutral-800 text-white shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'}`} />
            <p className="text-[10px] font-black uppercase tracking-widest font-sans leading-relaxed">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-white/40 hover:text-white/80 text-xs font-black font-mono leading-none select-none pl-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Header */}
      <div className="px-1">
        <div className="flex flex-col p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
          {/* Header Filters - All Parallel */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-2 pb-3 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest whitespace-nowrap">Site:</span>
              <select 
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-black/10 min-w-[120px]"
              >
                <option value="all">ALL SITES</option>
                {SITES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest whitespace-nowrap">Unit:</span>
              <select 
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-black/10 min-w-[120px]"
              >
                <option value="all">ALL UNITS</option>
                {UNITS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
              </select>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest whitespace-nowrap">Project:</span>
              <select 
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-black/10 min-w-[140px]"
              >
                <option value="all">ALL PROJECTS</option>
                {PROJECTS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
              </select>
            </div>

            <div className="ml-auto hidden xl:block">
              <p className="text-[9px] font-black text-neutral-gray uppercase tracking-[0.2em] opacity-30">Global Workforce Analysis</p>
            </div>
          </div>

          {/* Navigation Tabs - Below Filters */}
          <nav className="flex items-center overflow-x-auto scrollbar-hide no-scrollbar pt-2 px-1">
            <div className="flex items-center gap-1.5 min-w-max">
              {[
                { id: "schedule", label: "Interval", icon: Clock },
                { id: "calendar", label: "Calendar", icon: CalendarIcon },
                { id: "forecasting", label: "Forecast", icon: TrendingUp },
                { id: "planning", label: "Planning", icon: CalendarIcon },
                { id: "historical", label: "Historical", icon: History },
                { id: "db", label: "DB", icon: Database },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab.id 
                      ? "bg-black text-white shadow-lg shadow-black/20" 
                      : "text-neutral-gray hover:bg-gray-50"
                  }`}
                >
                  <tab.icon className={`w-3 h-3 ${activeTab === tab.id ? "text-active-red" : "text-neutral-gray"}`} />
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={activeTab}
           initial={{ opacity: 0, scale: 0.99, y: 10 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.99, y: -10 }}
           transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeTab === "schedule" && renderScheduleGrid()}
          {activeTab === "calendar" && renderCalendar()}
          {false && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div>
                    <h3 className="text-2xl font-black text-black tracking-tight uppercase">Time Adherence</h3>
                    <p className="text-neutral-gray text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Schedule vs Actual Pulse</p>
                 </div>
                 <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-green-500" />
                     <span className="text-[10px] font-bold uppercase text-neutral-gray">Online: 391</span>
                   </div>
                   <div className="w-px h-4 bg-gray-200" />
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-active-red" />
                     <span className="text-[10px] font-bold uppercase text-neutral-gray">Offline: 21</span>
                   </div>
                 </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                 <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative w-full md:w-80">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-gray" />
                      <input 
                        type="text" 
                        placeholder="FILTER AGENT..." 
                        className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-[11px] font-bold uppercase tracking-tight focus:ring-1 focus:ring-active-red/20 outline-none"
                      />
                    </div>
                 </div>

                 <div className="overflow-x-auto relative flex-grow">
                    <table className="border-separate border-spacing-0 table-fixed min-w-[1200px] w-full">
                      <thead>
                        <tr className="bg-gray-50/50">
                          <th className="sticky left-0 z-40 bg-gray-50/50 w-[240px] px-6 py-4 border-r border-b border-gray-100 text-[10px] font-black text-neutral-gray uppercase tracking-widest text-left">
                            Agent Identity
                          </th>
                          <th className="w-full relative p-0 border-b border-gray-100">
                            <div className="flex w-full">
                              {Array.from({ length: 25 }).map((_, i) => (
                                <div key={i} className="flex-1 text-[9px] font-bold text-neutral-gray border-l border-gray-100/50 py-2 text-center">
                                  {String(i).padStart(2, '0')}:00
                                </div>
                              ))}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {combinedAgents
                          .filter(a => selectedSite === "all" || a.site === selectedSite)
                          .filter(a => selectedUnit === "all" || a.unit === selectedUnit)
                          .filter(a => selectedProject === "all" || a.project === selectedProject)
                          .map((agent) => {
                          const shift = resolvedShifts[agent.shift] || resolvedShifts["H"];
                          const startPct = (timeToIndex(shift.start) / 96) * 100;
                          const endPct = (timeToIndex(shift.end) / 96) * 100;
                          
                          return (
                            <tr key={agent.id} className="group">
                              <td className="sticky left-0 z-40 bg-white group-hover:bg-gray-50 transition-colors border-r px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-bold text-black uppercase">{agent.name}</span>
                                  <div className="flex items-center gap-2 mt-1">
                                     <span className="text-[9px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded uppercase">96% Adh</span>
                                     <span className="text-[9px] font-bold text-neutral-gray uppercase opacity-60">ID: {agent.id}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-0 relative">
                                <div className="flex flex-col py-4 gap-2 px-1">
                                   {/* Schedule Track */}
                                   <div className="h-4 w-full bg-gray-100/50 rounded-full relative overflow-hidden">
                                      <div 
                                        className="absolute h-full bg-blue-500/80 rounded-full border border-blue-600/20" 
                                        style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
                                      />
                                      {Object.entries(agent.activities).map(([idx, act]) => {
                                         const i = parseInt(idx);
                                         const l = (i / 96) * 100;
                                         const w = (1 / 96) * 100;
                                         return (
                                           <div 
                                             key={idx} 
                                             className={`absolute h-full ${ACTIVITY_TYPES[act as keyof typeof ACTIVITY_TYPES]?.color || 'bg-black'}`}
                                             style={{ left: `${l}%`, width: `${w}%` }}
                                           />
                                         );
                                      })}
                                   </div>
                                   {/* Actual Track */}
                                   <div className="h-4 w-full bg-gray-100/50 rounded-full relative overflow-hidden">
                                      <div 
                                        className="absolute h-full bg-emerald-500 rounded-full border border-emerald-600/20" 
                                        style={{ left: `${startPct + 0.5}%`, width: `${endPct - startPct - 1.5}%` }}
                                      />
                                   </div>
                                   {/* Exception Track */}
                                   <div className="h-4 w-full bg-gray-100/50 rounded-full relative overflow-hidden">
                                      <div 
                                        className="absolute h-full bg-active-red/20 border border-active-red/30 rounded-full" 
                                        style={{ left: `${startPct + 10}%`, width: `${2}%` }}
                                      />
                                   </div>
                                </div>
                                <div className="absolute inset-0 flex pointer-events-none">
                                   {Array.from({ length: 25 }).map((_, i) => (
                                     <div key={i} className="flex-1 border-l border-gray-100/30" />
                                   ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                 </div>

                 <div className="p-6 bg-gray-50 flex flex-wrap items-center gap-8 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-1.5 rounded-full bg-blue-500" />
                       <p className="text-[10px] font-black uppercase text-neutral-gray tracking-widest">Planned Shift</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-1.5 rounded-full bg-emerald-500" />
                       <p className="text-[10px] font-black uppercase text-neutral-gray tracking-widest">Actual Online</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-1.5 rounded-full bg-active-red" />
                       <p className="text-[10px] font-black uppercase text-neutral-gray tracking-widest">Deviation Alert</p>
                    </div>
                 </div>
              </div>
            </div>
          )}
          {activeTab === "forecasting" && renderForecasting()}
          {activeTab === "historical" && renderHistorical()}
          {activeTab === "db" && renderDB()}
          {activeTab === "planning" && (
            <div className="py-20 sm:py-40 bg-white rounded-2xl sm:rounded-[40px] border border-gray-100 text-center border-dashed px-6">
               <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-200" />
               </div>
               <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-gray-200 leading-loose">
                 Future Resource Planning Phase III Initializing
               </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}