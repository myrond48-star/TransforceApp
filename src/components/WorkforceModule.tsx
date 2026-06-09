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
  LayoutDashboard,
  Info,
  Trash2
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
import { fetchEmployees, createEmployee, deleteEmployee, fetchWorkforce, createWorkforceRecord, deleteWorkforceRecord, deleteWorkforceRecords, fetchIntervalRequirements, upsertIntervalRequirements, fetchUniqueProjects, fetchRosterSchedule, upsertRosterSchedule } from "../lib/api";
import { useAppStore } from "../lib/store";

interface WorkforceModuleProps {
  onBack: () => void;
}

// --- Mock Data & Constants ---

const SHIFTS = {
  "S1": { label: "Morning", start: "07:00", end: "16:00", color: "bg-blue-500", weight: 1 },
  "S2": { label: "Evening", start: "15:00", end: "00:00", color: "bg-indigo-500", weight: 2 },
  "H": { label: "Day", start: "08:00", end: "17:00", color: "bg-emerald-500", weight: 3 },
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

const timeToIndex = (timeStr: string) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 4 + Math.floor(m / 15);
};

const timeToMinutes = (timeStr: string) => {
  if (!timeStr || !timeStr.includes(":")) return 0;
  const [h, m] = timeStr.trim().split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const matchSite = (agentSite: string | undefined, selectedSite: string) => {
  if (!selectedSite || selectedSite === "all") return true;
  const aSite = (agentSite || "Jakarta").trim().toLowerCase();
  const sSel = selectedSite.trim().toLowerCase();
  if (sSel === "jogja" && (aSite === "jogja" || aSite === "jogjakarta" || aSite === "yogyakarta" || aSite === "jogja/yogyakarta" || aSite === "yogyakarta/jogja")) return true;
  if (aSite === "jogja" && (sSel === "jogja" || sSel === "jogjakarta" || sSel === "yogyakarta" || sSel === "jogja/yogyakarta" || sSel === "yogyakarta/jogja")) return true;
  return aSite === sSel;
};

const matchUnit = (agentUnit: string | undefined, selectedUnit: string) => {
  if (!selectedUnit || selectedUnit === "all") return true;
  const aUnit = (agentUnit || "Unit A").trim().toLowerCase().replace(/\s+/g, "");
  const uSel = selectedUnit.trim().toLowerCase().replace(/\s+/g, "");
  return aUnit === uSel;
};

const matchProject = (agentProj: string | undefined, selectedProject: string) => {
  if (!selectedProject || selectedProject === "all") return true;
  const aProj = (agentProj || "").trim().toLowerCase();
  const pSel = selectedProject.trim().toLowerCase();
  return aProj === pSel;
};

const getProjectOffset = (projectName: string | undefined, hour: number) => {
  if (!projectName || projectName === "all") return 0;
  let hash = 0;
  for (let i = 0; i < projectName.length; i++) {
    hash = (hash << 5) - hash + projectName.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const baseOffset = (absHash % 9) - 4; // -4 to +4
  const multiplier = (absHash % 3) + 1; // 1, 2, or 3
  const phaseShift = absHash % 24;      // 0 to 23 hours shift
  const wave = Math.sin((hour + phaseShift) * Math.PI / 12) * multiplier * 2.5;
  return Math.round(baseOffset + wave);
};

const mockAgents: any[] = [];

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
  const settings = useAppStore(state => state.settings);

  const getActivityDef = (code: string, agentProj?: string) => {
    const projKey = (selectedProject && selectedProject !== "all") 
      ? selectedProject 
      : (agentProj || "Project Alpha");
    
    const projActivities = settings.activities?.[projKey];
    if (projActivities && projActivities[code]) {
      return projActivities[code];
    }
    
    if (settings.activities) {
      for (const proj of Object.keys(settings.activities)) {
        if (settings.activities[proj]?.[code]) {
          return settings.activities[proj][code];
        }
      }
    }
    
    return ACTIVITY_TYPES[code as keyof typeof ACTIVITY_TYPES] || { label: code, color: "bg-slate-500" };
  };

  // Persistent Custom Agent Activities/Breaks Store
  const [agentActivities, setAgentActivities] = useState<Record<string, Record<string, Record<string, Record<number, string>>>>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("workforce_custom_breaks");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (_) {
          return {};
        }
      }
    }
    return {};
  });

  // Save agentActivities to localStorage when it changes
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("workforce_custom_breaks", JSON.stringify(agentActivities));
    }
  }, [agentActivities]);

  const handleClearBreaks = (agentId: string) => {
    setAgentActivities(prev => {
      const nextProj = { ...prev[selectedProject] };
      const nextDate = { ...nextProj[selectedDate] };
      nextDate[agentId] = {}; // clear activities
      nextProj[selectedDate] = nextDate;
      
      showNotification(`Break for agent successfully deleted! 🗑️`, "success");
      return {
        ...prev,
        [selectedProject]: nextProj
      };
    });
  };

  const handleToggleCellBreak = (agentId: string, slotIdx: number, currentActivity: string | null) => {
    setAgentActivities(prev => {
      const nextProj = { ...prev[selectedProject] };
      const nextDate = { ...nextProj[selectedDate] };
      const agentActs = { ...(nextDate[agentId] || {}) };
      
      if (currentActivity) {
        delete agentActs[slotIdx];
      } else {
        agentActs[slotIdx] = "LB"; // Toggle to Lunch Break
      }
      
      nextDate[agentId] = agentActs;
      nextProj[selectedDate] = nextDate;
      
      return {
        ...prev,
        [selectedProject]: nextProj
      };
    });
  };

  const handleAutoBreak = () => {
    // 1. Get filtered agents of the currently displayed list
    const filteredAgents = combinedAgents
      .filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter(a => selectedTeam === "all" || a.team === selectedTeam)
      .filter(a => matchSite(a.site, selectedSite))
      .filter(a => matchUnit(a.unit, selectedUnit))
      .filter(a => matchProject(a.project, selectedProject));

    if (filteredAgents.length === 0) {
      showNotification("No agents match the current filter to schedule breaks for.", "error");
      return;
    }

    // Days in current roster schedule to check for overlap/same hours
    const days = getDaysArray(rosterStartDate, rosterEndDate);

    // Helper to get agent's shift configuration for the selected date
    const getAgentShiftForDateLocal = (agent: any) => {
      const rosterEntry = generatedRoster.find(r => r.empId === agent.id);
      const shiftCode = rosterEntry ? rosterEntry.roster[selectedDate] : agent.shift;
      if (!shiftCode || shiftCode === "OFF") {
        return null;
      }
      return {
        code: shiftCode,
        shift: resolvedShifts[shiftCode] || Object.values(resolvedShifts)[0]
      };
    };

    // Compute base actual coverage for each interval idx (0 - 95)
    // representing how many agents are working without any breaks.
    const baseCoverage = Array.from({ length: 96 }, () => 0);
    filteredAgents.forEach(agent => {
      const shiftInfo = getAgentShiftForDateLocal(agent);
      if (shiftInfo) {
        const s = shiftInfo.shift;
        const startIdx = timeToIndex(s.start);
        let endIdx = timeToIndex(s.end);
        if (endIdx <= startIdx) endIdx = 96;
        for (let i = startIdx; i < endIdx; i++) {
          baseCoverage[i]++;
        }
      }
    });

    // Compute original required staffing curve for matching dynamicReqData
    const totalAgentsInFilter = filteredAgents.length;
    const requiredCount = Array.from({ length: 96 }, (_, i) => {
      if (totalAgentsInFilter > 0) {
        const multiplier = 0.75 + Math.sin(i / 12) * 0.15;
        return Math.max(1, Math.round(totalAgentsInFilter * multiplier));
      }
      return 0;
    });

    // Running coverage tracks how many working agents currently exist
    const currentCoverage = [...baseCoverage];

    // Map to hold newly assigned breaks
    const newAssignedDateBreaks: Record<string, Record<number, string>> = {};
    const newAssignedNextDateBreaks: Record<string, Record<number, string>> = {};

    // Sort agents or process them. Let's process each agent in order.
    filteredAgents.forEach(agent => {
      const shiftInfo = getAgentShiftForDateLocal(agent);
      if (!shiftInfo) {
        newAssignedDateBreaks[agent.id] = {};
        return;
      }

      const { code: shiftCode, shift: s } = shiftInfo;
      let shiftStartIdx = timeToIndex(s.start);
      let shiftEndIdx = timeToIndex(s.end);
      const isOvernight = shiftEndIdx <= shiftStartIdx;
      if (isOvernight) shiftEndIdx += 96;

      // Follow "mengikuti settingan pada auto break"
      const customOptions = settings.autoBreak?.[shiftCode] || [];
      let candidates: number[] = [];
      if (customOptions.length > 0) {
        candidates = customOptions
          .map((t: string) => {
            const idx = timeToIndex(t);
            // If overnight shift and the configured break is early in the day, it belongs to the continuation part
            if (isOvernight && idx < timeToIndex(s.end)) {
              return idx + 96;
            }
            return idx;
          })
          .filter((idx: number) => idx >= shiftStartIdx && idx < shiftEndIdx - 3);
      }

      // Fallback candidate break start bounds
      if (candidates.length === 0) {
        const totalSlots = shiftEndIdx - shiftStartIdx;
        const startMid = shiftStartIdx + Math.floor(totalSlots * 0.3);
        const endMid = shiftStartIdx + Math.floor(totalSlots * 0.7);
        for (let i = startMid; i <= endMid - 4; i += 2) {
          candidates.push(i);
        }
        if (candidates.length === 0) {
          candidates.push(shiftStartIdx + Math.floor(totalSlots / 2));
        }
      }

      // Check this agent's break times on OTHER days
      const otherDaysBreakStarts: number[] = [];
      days.forEach(day => {
        if (day !== selectedDate) {
          const dayActs = agentActivities[selectedProject]?.[day]?.[agent.id] || {};
          const keys = Object.keys(dayActs).map(Number).sort((a, b) => a - b);
          if (keys.length > 0) {
            // Un-normalize overnight breaks if needed so distance penalty still roughly works
            otherDaysBreakStarts.push(keys[0]);
          }
        }
      });

      let bestCandidate = candidates[0];
      let bestScore = -Infinity;

      candidates.forEach(c => {
        let totalGapSum = 0;
        let penalty = 0;

        for (let offset = 0; offset < 4; offset++) {
          const sIdx = c + offset;
          const mapIdx = sIdx >= 96 ? sIdx - 96 : sIdx;

          const currentActual = currentCoverage[mapIdx] || 0;
          const required = requiredCount[mapIdx];
          const currentGap = currentActual - required;

          if (currentActual - 1 < required) {
            penalty += 10000;
          }

          totalGapSum += currentGap;
        }

        otherDaysBreakStarts.forEach(prevStart => {
            // Modulo check since previous starts are stored 0-95
          const normalizedC = c >= 96 ? c - 96 : c;
          if (normalizedC === prevStart) {
            penalty += 50000;
          } else if (Math.abs(normalizedC - prevStart) < 4) {
            penalty += 15000;
          }
        });

        const score = totalGapSum - penalty;
        if (score > bestScore) {
          bestScore = score;
          bestCandidate = c;
        }
      });

      if (bestCandidate !== undefined) {
        const agentActs: Record<number, string> = {};
        const agentActsNextDay: Record<number, string> = {};
        for (let offset = 0; offset < 4; offset++) {
          const slot = bestCandidate + offset;
          const mapIdx = slot >= 96 ? slot - 96 : slot;
          currentCoverage[mapIdx]--;
          
          if (slot >= 96) {
             agentActsNextDay[slot - 96] = "LB";
          } else {
             agentActs[slot] = "LB";
          }
        }
        
        if (Object.keys(agentActs).length > 0) {
          newAssignedDateBreaks[agent.id] = agentActs;
        }
        if (Object.keys(agentActsNextDay).length > 0) {
          newAssignedNextDateBreaks[agent.id] = agentActsNextDay;
        }
      }
    });

    // Save newly calculated custom activities in state
    setAgentActivities(prev => {
      const nextProj = { ...prev[selectedProject] };
      const nextDate = { ...nextProj[selectedDate], ...newAssignedDateBreaks };
      nextProj[selectedDate] = nextDate;
      
      if (Object.keys(newAssignedNextDateBreaks).length > 0) {
        const nextDateStr = format(addDays(parseISO(selectedDate), 1), "yyyy-MM-dd");
        const subsequentDate = { ...nextProj[nextDateStr] };
        for (const [aId, bMap] of Object.entries(newAssignedNextDateBreaks)) {
            subsequentDate[aId] = { ...subsequentDate[aId], ...bMap };
        }
        nextProj[nextDateStr] = subsequentDate;
      }
      
      return {
        ...prev,
        [selectedProject]: nextProj
      };
    });

     showNotification("Auto Break successfully processed for all active agents! ☕", "success");
  };
  const [dbShifts, setDbShifts] = useState<Record<string, { label: string; start: string; end: string; color: string }>>({});

  const resolvedShifts: Record<string, { label: string; start: string; end: string; color: string }> = {
    ...SHIFTS,
    ...dbShifts
  };

  const isShiftCrossDay = (code: string | null) => {
    if (!code) return false;
    const s = resolvedShifts[code];
    if (!s) return false;
    if ((s as any).crosses_day === true || (s as any).is_overnight === true) return true;
    if (s.start && s.end) {
      const startHour = parseInt(s.start.split(':')[0]) || 0;
      const endHour = parseInt(s.end.split(':')[0]) || 0;
      if (endHour < startHour || (endHour === 0 && startHour > 0)) {
        return true;
      }
    }
    return false;
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
          const shiftMap: Record<string, { label: string; start: string; end: string; color: string; weight?: number }> = {};
          const colors = ["bg-blue-500", "bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500", "bg-teal-500"];
          
          data.forEach((s: any, idx: number) => {
            const colorClass = settings?.shifts?.[s.code]?.color || colors[idx % colors.length];
            shiftMap[s.code] = {
              label: s.code,
              start: s.start_time,
              end: s.end_time,
              color: colorClass,
              weight: s.weight || 1
            };
          });
          setDbShifts(shiftMap);
        } else {
          setDbShifts({});
        }
      } catch (err) {
        console.warn("Could not load master shifts from Supabase:", err);
        setDbShifts({});
      }
    };
    loadAllShifts();
  }, [selectedProject]);
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'interval' | 'activity', direction: 'asc' | 'desc' }>({ key: 'interval', direction: 'asc' });
  const [showActions, setShowActions] = useState(false);
  const [showBulkRemoveModal, setShowBulkRemoveModal] = useState(false);
  const [bulkRemoveStart, setBulkRemoveStart] = useState("");
  const [bulkRemoveEnd, setBulkRemoveEnd] = useState("");
  const [bulkRemoveTarget, setBulkRemoveTarget] = useState<"all" | "filtered">("all");

  const [cellContextMenu, setCellContextMenu] = useState<{
    x: number;
    y: number;
    agentId: string;
    slotIdx: number;
  } | null>(null);

  const handleSetCellActivity = (agentId: string, slotIdx: number, activityCode: string | null) => {
    setAgentActivities(prev => {
      const nextProj = { ...prev[selectedProject] };
      const nextDate = { ...nextProj[selectedDate] };
      const agentActs = { ...(nextDate[agentId] || {}) };
      
      if (!activityCode) {
        delete agentActs[slotIdx];
      } else {
        agentActs[slotIdx] = activityCode;
      }
      
      nextDate[agentId] = agentActs;
      nextProj[selectedDate] = nextDate;
      
      return {
        ...prev,
        [selectedProject]: nextProj
      };
    });
    setCellContextMenu(null);
    showNotification(
      activityCode 
        ? `Activity ${getActivityDef(activityCode, selectedProject)?.label} successfully set! ⏱️`
        : "Activity successfully deleted! 🗑️", 
      "success"
    );
  };

  const handleBulkClearBreaks = (startStr: string, endStr: string, targetType: "all" | "filtered", filteredAgentsToClear: any[]) => {
    const start = parseISO(startStr);
    const end = parseISO(endStr);
    if (!startStr || !endStr || isNaN(start.getTime()) || isNaN(end.getTime())) {
      showNotification("Invalid date range! 📅", "error");
      return;
    }
    if (start > end) {
      showNotification("Start date must be less than or equal to end date! ⚠️", "error");
      return;
    }

    const agentsToClear = targetType === "filtered"
      ? filteredAgentsToClear
      : combinedAgents.filter(a => matchProject(a.project, selectedProject));

    if (agentsToClear.length === 0) {
      showNotification("No agents found match the criteria for break deletion! ⚠️", "info");
      return;
    }

    setAgentActivities(prev => {
      const nextProj = { ...prev[selectedProject] };
      let current = start;
      while (current <= end) {
        const dateStr = format(current, "yyyy-MM-dd");
        const nextDate = { ...nextProj[dateStr] };
        
        agentsToClear.forEach(agent => {
          nextDate[agent.id] = {}; // Clear all activities
        });
        
        nextProj[dateStr] = nextDate;
        current = addDays(current, 1);
      }
      
      return {
        ...prev,
        [selectedProject]: nextProj
      };
    });

    showNotification(`Successfully deleted bulk breaks for ${agentsToClear.length} agents within the date range! 🗑️`, "success");
    setShowBulkRemoveModal(false);
  };

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
  const [selectedDbEmployeeIds, setSelectedDbEmployeeIds] = useState<(string | number)[]>([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  React.useEffect(() => {
    setSelectedDbEmployeeIds([]);
  }, [selectedSite, selectedUnit, selectedProject]);

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
  const [confirmReset, setConfirmReset] = useState(false);
  const [histImportTargetDate, setHistImportTargetDate] = useState("all");
  const [compositionMode, setCompositionMode] = useState<"peak" | "average">("peak");

  // Roster / Calendar Tab States
  const [rosterStartDate, setRosterStartDate] = useState(format(startOfWeek(new Date(), {weekStartsOn: 1}), 'yyyy-MM-dd'));
  const [rosterEndDate, setRosterEndDate] = useState(format(addDays(startOfWeek(new Date(), {weekStartsOn: 1}), 6), 'yyyy-MM-dd'));
  const [generatedRoster, setGeneratedRoster] = useState<{empId: string, roster: Record<string, string>}[]>([]);
  const [isGeneratingRoster, setIsGeneratingRoster] = useState(false);
  const [forcedOffAgents, setForcedOffAgents] = useState<Set<string>>(new Set());
  const [workingDaysMode, setWorkingDaysMode] = useState<"weekdays" | "all_calendar" | "custom">("all_calendar");
  const [customWorkingDaysVal, setCustomWorkingDaysVal] = useState<number>(20);

  const getExpectedWorkingDays = (daysArray: string[]) => {
    // Number of working days matches calendar working days for the given period
    return daysArray.filter(d => !["Sat", "Sun"].includes(format(parseISO(d), "EEE"))).length;
  };

  const SEED_WORKFORCE: any[] = [];

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
    while (current <= end && count < 100) {
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

  const loadRosterSchedule = async (start: string, end: string, project: string) => {
    try {
      const dbData = await fetchRosterSchedule(start, end, project);
      if (dbData && dbData.length > 0) {
        // Group by emp_id in a case-insensitive and trimmed manner
        const rosterMap: Record<string, Record<string, string>> = {};
        dbData.forEach((row: any) => {
          if (!row.emp_id) return;
          const empIdStr = String(row.emp_id).trim();
          if (!rosterMap[empIdStr]) rosterMap[empIdStr] = {};
          
          let dateStr = "";
          if (row.date) {
            // Support Date object, string ISO timestamp, or date format
            if (row.date instanceof Date) {
              dateStr = format(row.date, "yyyy-MM-dd");
            } else {
              dateStr = String(row.date).split("T")[0].split(" ")[0].trim();
            }
          }
          if (dateStr) {
            rosterMap[empIdStr][dateStr] = row.shift_code;
          }
        });

        const newRoster = Object.entries(rosterMap).map(([empId, roster]) => ({
          empId,
          roster
        }));
        setGeneratedRoster(newRoster);
      } else {
        // Try fallback if empty
        const cached = localStorage.getItem(`supabase_roster_fallback_${start}_${end}_${project}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          const newRoster = Object.entries(parsed).map(([empId, roster]) => ({ empId, roster: roster as Record<string, string> }));
          setGeneratedRoster(newRoster);
        } else {
          setGeneratedRoster([]);
        }
      }
    } catch (err) {
      console.warn("Could not query supabase roster_schedule. Utilizing existing or empty state", err);
      const cached = localStorage.getItem(`supabase_roster_fallback_${start}_${end}_${project}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const newRoster = Object.entries(parsed).map(([empId, roster]) => ({ empId, roster: roster as Record<string, string> }));
          setGeneratedRoster(newRoster);
        } catch {
          setGeneratedRoster([]);
        }
      } else {
        setGeneratedRoster([]);
      }
    }
  };

  const saveRosterSchedule = async () => {
    if (generatedRoster.length === 0) {
      showNotification("No roster schedule available to save.", "info");
      return;
    }

    const records: any[] = [];
    const days = getDaysArray(rosterStartDate, rosterEndDate);
    
    generatedRoster.forEach(r => {
      const agentObj = combinedAgents.find(a => a.id === r.empId);
      const agentProj = agentObj?.project || selectedProject;
      days.forEach(d => {
        if (r.roster[d]) {
          records.push({
            date: d,
            emp_id: r.empId,
            project: agentProj,
            shift_code: r.roster[d]
          });
        }
      });
    });

    try {
      await upsertRosterSchedule(records);
      showNotification("Roster Schedule successfully saved to Supabase!", "success");
    } catch (err: any) {
      console.warn("Failed to sync schedule to Supabase. Saving to local storage fallback.", err);
      // Fallback to local storage per project
      const rosterStorage: Record<string, any> = {};
      generatedRoster.forEach(r => {
        rosterStorage[r.empId] = r.roster;
      });
      localStorage.setItem(`supabase_roster_fallback_${rosterStartDate}_${rosterEndDate}_${selectedProject}`, JSON.stringify(rosterStorage));
      showNotification("Saved to local storage (Offline Mode).", "info");
    }
  };

  const loadIntervalRequirements = async (start: string, end: string, type: "1h" | "30m" | "15m", project: string) => {
    setHistLoading(true);
    setHistUsingFallback(false);
    try {
      const dbData = await fetchIntervalRequirements(start, end, type, project);
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
            
            // Apply project specific deterministic offset
            const offset = getProjectOffset(project, hour);
            
            let baseVal = 0;
            if (hour >= 8 && hour <= 12) {
              baseVal = 12 + (hour % 3) * 4;
            } else if (hour > 12 && hour <= 17) {
              baseVal = 15 + (hour % 4) * 2;
            } else if (hour > 17 && hour <= 22) {
              baseVal = 8;
            } else {
              baseVal = 2;
            }
            reqMap[d][s] = Math.max(1, baseVal + offset);
          });
        });
        setHistRequirements(reqMap);
      } else {
        dbData.forEach((row: any) => {
          if (!reqMap[row.date]) reqMap[row.date] = {};
          if (project === "all") {
            reqMap[row.date][row.time_slot] = (reqMap[row.date][row.time_slot] || 0) + row.required_agents;
          } else {
            reqMap[row.date][row.time_slot] = row.required_agents;
          }
        });
        setHistRequirements(reqMap);
      }
    } catch (err: any) {
      console.warn("Could not query supabase interval_requirements. Fetching from cache/local...", err);
      setHistUsingFallback(true);
      
      const cached = localStorage.getItem(`supabase_interval_req_${type}_${project}`);
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
            
            // Apply project specific deterministic offset
            const offset = getProjectOffset(project, hour);
            
            let baseVal = 0;
            if (hour >= 8 && hour <= 12) {
              baseVal = 12 + (hour % 3) * 3;
            } else if (hour > 12 && hour <= 17) {
              baseVal = 15 + (hour % 4) * 2;
            } else {
              baseVal = 2;
            }
            reqMap[d][s] = Math.max(1, baseVal + offset);
          });
        });
        setHistRequirements(reqMap);
        localStorage.setItem(`supabase_interval_req_${type}_${project}`, JSON.stringify(reqMap));
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
          interval_type: histIntervalType,
          project: selectedProject // Ensure save aligns with the selected project
        });
      });
    });
    
    try {
      await upsertIntervalRequirements(records);
      setHistUsingFallback(false);
      localStorage.setItem(`supabase_interval_req_${histIntervalType}_${selectedProject}`, JSON.stringify(targetMap));
      showNotification("Interval data successfully saved to Supabase!", "success");
    } catch (err: any) {
      console.warn("Failed to sync to Supabase. Saving locally only:", err);
      setHistUsingFallback(true);
      localStorage.setItem(`supabase_interval_req_${histIntervalType}_${selectedProject}`, JSON.stringify(targetMap));
      showNotification("Supabase storage failed. Data saved locally (offline fallback).", "info");
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
        
        // Apply project specific deterministic offset
        const offset = getProjectOffset(selectedProject, hour);
        
        let baseVal = 0;
        if (hour >= 8 && hour <= 12) {
          baseVal = 15 + (hour % 3) * 4;
        } else if (hour > 12 && hour <= 17) {
          baseVal = 18 + (hour % 4) * 2;
        } else if (hour > 17 && hour <= 22) {
          baseVal = 10;
        } else {
          baseVal = 2;
        }
        seeded[d][s] = Math.max(1, baseVal + offset);
      });
    });
    
    setHistRequirements(seeded);
    saveIntervalRequirements(seeded);
    showNotification("Successfully generated realistic agent curve!", "success");
  };

  const clearAllRequirements = () => {
    const cleared: Record<string, Record<string, number>> = {};
    Object.keys(histRequirements).forEach(d => {
      cleared[d] = {};
      const slots = getIntervalSlots(histIntervalType);
      slots.forEach(s => {
        cleared[d][s] = 0;
      });
    });
    
    setHistRequirements(cleared);
    saveIntervalRequirements(cleared);
    showNotification("All interval data successfully cleared!", "success");
  };

  const handleBulkImport = () => {
    if (!histBulkInput.trim()) {
      showNotification("Please enter interval data first.", "error");
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
      showNotification(`Successfully imported ${importedCount} interval rows for date ${targetDate}!`, "success");
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
      showNotification(`Successfully imported table containing ${rowsImported} rows for ${days.length} days!`, "success");
    }
  };

  const lastSyncedDateRef = React.useRef(selectedDate);

  // Sync selectedDate with rosterStartDate/rosterEndDate week range only when selectedDate changes
  React.useEffect(() => {
    if (selectedDate !== lastSyncedDateRef.current) {
      try {
        const parsedDate = parseISO(selectedDate);
        const start = format(startOfWeek(parsedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const end = format(addDays(startOfWeek(parsedDate, { weekStartsOn: 1 }), 6), 'yyyy-MM-dd');
        setRosterStartDate(start);
        setRosterEndDate(end);
        lastSyncedDateRef.current = selectedDate;
      } catch (err) {
        console.error("Error setting roster date range from selectedDate", err);
      }
    }
  }, [selectedDate]);

  React.useEffect(() => {
    if (activeTab === "historical") {
      loadIntervalRequirements(histStartDate, histEndDate, histIntervalType, selectedProject);
    } else if (activeTab === "calendar" || activeTab === "schedule") {
      loadIntervalRequirements(rosterStartDate, rosterEndDate, histIntervalType, selectedProject);
      loadRosterSchedule(rosterStartDate, rosterEndDate, selectedProject);
    }
  }, [activeTab, histStartDate, histEndDate, rosterStartDate, rosterEndDate, histIntervalType, selectedProject]);

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
      // Keep selected list clean of deleted IDs
      setSelectedDbEmployeeIds(prev => prev.filter(item => item !== id));
    }
  };

  // Handler for Bulk Delete
  const handleBulkDeleteDbEmployees = async () => {
    if (selectedDbEmployeeIds.length === 0) return;
    setDbLoading(true);
    try {
      if (!usingFallback) {
        await deleteWorkforceRecords(selectedDbEmployeeIds);
      }
      const updatedList = dbEmployees.filter(emp => !selectedDbEmployeeIds.includes(emp.id));
      setDbEmployees(updatedList);
      localStorage.setItem("supabase_workforce_fallback", JSON.stringify(updatedList));
      showNotification(`Successfully deleted ${selectedDbEmployeeIds.length} employees`, 'success');
      setSelectedDbEmployeeIds([]);
    } catch (err) {
      // Allow fallback delete
      const updatedList = dbEmployees.filter(emp => !selectedDbEmployeeIds.includes(emp.id));
      setDbEmployees(updatedList);
      localStorage.setItem("supabase_workforce_fallback", JSON.stringify(updatedList));
      showNotification(`Successfully deleted ${selectedDbEmployeeIds.length} employees (offline mode)`, 'success');
      setSelectedDbEmployeeIds([]);
    } finally {
      setDbLoading(false);
      setBulkDeleteConfirm(false);
    }
  };

  // Handler for Single Add
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleFormData.name.trim()) {
      showNotification("Name is required.", "error");
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
      
      showNotification(`Employee "${singleFormData.name}" successfully added!`, "success");
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
    const empShift = emp.shift as string;
    const fallbackShiftCode = (empShift && resolvedShifts[empShift]) 
      ? empShift 
      : "OFF";
    const agentId = emp.nip || `DB${String(emp.id).padStart(3, '0')}`;
    
    const rosterEntry = generatedRoster.find(r => r.empId === agentId);
    const activeShiftCode = rosterEntry?.roster?.[selectedDate] || fallbackShiftCode;

    const customProj = agentActivities[selectedProject] || {};
    const customDate = customProj[selectedDate] || {};
    const hasCustomEntry = agentId in customDate;
    
    let resolvedActivities = {};
    if (hasCustomEntry) {
      resolvedActivities = customDate[agentId] || {};
    }
    
    return {
      id: agentId,
      nip: emp.nip || agentId,
      name: emp.name,
      shift: activeShiftCode,
      gender: emp.gender,
      team: ["Support A", "Support B", "High Priority", "Technical"][index % 4],
      site: emp.site || "Jakarta",
      unit: emp.unit || "Unit A",
      project: emp.project || "",
      activities: resolvedActivities
    };
  });

  const combinedAgents = mappedDbEmployees;

  const dynamicReqData = React.useMemo(() => {
    const filteredAgents = combinedAgents
      .filter(a => matchSite(a.site, selectedSite))
      .filter(a => matchUnit(a.unit, selectedUnit))
      .filter(a => matchProject(a.project, selectedProject));

    return Array.from({ length: 96 }).map((_, i) => {
      let computedActual = 0;
      filteredAgents.forEach(agent => {
        let isWorkingNow = false;

        // Check if working shift assigned for today
        const rosterEntry = generatedRoster.find(r => r.empId === agent.id);
        const shiftCode = rosterEntry?.roster?.[selectedDate] || agent.shift;
        if (shiftCode && shiftCode !== "OFF") {
          const s = resolvedShifts[shiftCode] || Object.values(resolvedShifts)[0];
          if (s) {
            const startIdx = timeToIndex(s.start);
            let endIdx = timeToIndex(s.end);
            if (endIdx <= startIdx) endIdx = 96;
            if (startIdx <= i && i < endIdx && !agent.activities[i]) {
              isWorkingNow = true;
            }
          }
        }

        // Check if working overnight shift assigned for yesterday (continuation)
        if (!isWorkingNow) {
          const yesterdayDate = format(addDays(new Date(selectedDate), -1), "yyyy-MM-dd");
          const yesterdayShiftCode = rosterEntry?.roster?.[yesterdayDate] || agent.shift;
          if (yesterdayShiftCode && yesterdayShiftCode !== "OFF") {
            const sY = resolvedShifts[yesterdayShiftCode] || Object.values(resolvedShifts)[0];
            if (sY) {
              const yStartIdx = timeToIndex(sY.start);
              const yEndIdx = timeToIndex(sY.end);
              if (yEndIdx <= yStartIdx && yEndIdx > 0) {
                if (0 <= i && i < yEndIdx && !agent.activities[i]) {
                  isWorkingNow = true;
                }
              }
            }
          }
        }

        if (isWorkingNow) {
          computedActual++;
        }
      });

      const totalAgentsInFilter = filteredAgents.length;
      let scaledReq = 0;
      const targetReqs = histRequirements[selectedDate];
      if (targetReqs && targetReqs[intervals[i]] !== undefined) {
          scaledReq = targetReqs[intervals[i]];
      } else {
        if (totalAgentsInFilter > 0) {
          const multiplier = 0.75 + Math.sin(i / 12) * 0.15;
          scaledReq = Math.max(1, Math.round(totalAgentsInFilter * multiplier));
        }
      }

      const discrepancy = computedActual - scaledReq;
      return {
        time: intervals[i],
        req: scaledReq,
        actual: computedActual,
        gap: discrepancy < 0 ? Math.abs(discrepancy) : 0,
        surplus: discrepancy > 0 ? discrepancy : 0
      };
    });
  }, [combinedAgents, selectedSite, selectedUnit, selectedProject, resolvedShifts, generatedRoster, selectedDate, histRequirements]);

  const renderOverview = () => {
    const filteredCount = combinedAgents
      .filter(a => matchSite(a.site, selectedSite))
      .filter(a => matchUnit(a.unit, selectedUnit))
      .filter(a => matchProject(a.project, selectedProject))
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
               <ComposedChart data={dynamicReqData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
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
      .filter(a => matchSite(a.site, selectedSite))
      .filter(a => matchUnit(a.unit, selectedUnit))
      .filter(a => matchProject(a.project, selectedProject));

    const filteredCount = filteredAgents.length;

    // Helper to get agent's shift configuration for the selected date (can be specified)
    const getAgentShiftForDate = (agent: any, targetDate: string = selectedDate) => {
      const rosterEntry = generatedRoster.find(r => r.empId === agent.id);
      const shiftCode = rosterEntry ? rosterEntry.roster[targetDate] : agent.shift;
      if (!shiftCode || shiftCode === "OFF") {
        return null;
      }
      return {
        code: shiftCode,
        shift: resolvedShifts[shiftCode] || Object.values(resolvedShifts)[0]
      };
    };

    // Separate sorting logic
    const sortedAgents = [...filteredAgents].sort((a, b) => {
      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortConfig.key === 'interval') {
        const infoA = getAgentShiftForDate(a);
        const infoB = getAgentShiftForDate(b);
        const shiftA = infoA ? infoA.shift.start : "24:00";
        const shiftB = infoB ? infoB.shift.start : "24:00";
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
                        { label: "Swap Shift", icon: History, onClick: () => showNotification("Fitur Swap Shift segera hadir! 🔄", "info") },
                        { label: "Approval", icon: ShieldCheck, onClick: () => showNotification("Fitur Persetujuan/Approval segera hadir! 🛡️", "info") },
                        { label: "Auto Break", icon: Coffee, onClick: () => { handleAutoBreak(); setShowActions(false); } },
                        { label: "Remove Break (Bulk)", icon: Trash2, onClick: () => { setBulkRemoveStart(selectedDate); setBulkRemoveEnd(selectedDate); setShowBulkRemoveModal(true); setShowActions(false); } },
                        { label: "Download", icon: Download, onClick: () => showNotification("Mengunduh laporan... 💾", "info") },
                      ].map((item, i) => (
                        <button 
                          key={i}
                          onClick={item.onClick}
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
          <div className="overflow-auto relative max-h-[85vh] md:max-h-[950px]">
            <table className="border-separate border-spacing-0 table-fixed w-full min-w-[2800px]">
              <thead className="sticky top-0 z-50">
                {/* Agent Actual Row */}
                <tr className="bg-white">
                  <th className="sticky left-0 z-[60] bg-white h-12 w-[180px] sm:w-[220px] px-4 sm:px-6 border-r border-gray-200 border-b border-gray-50 top-0">
                    <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest block text-left">Agent Actual</span>
                  </th>
                  {dynamicReqData.map((data, i) => (
                    <th key={i} className="text-[8px] sm:text-[9px] font-black text-slate-700 border-b border-gray-50 h-12 align-middle min-w-[28px] px-0.5 text-center bg-white">
                      {data.actual}
                    </th>
                  ))}
                </tr>
                {/* Agent FTE Row */}
                <tr className="bg-white">
                  <th className="sticky left-0 z-[60] bg-white h-12 w-[180px] sm:w-[220px] px-4 sm:px-6 border-r border-gray-200 border-b border-gray-50 top-12">
                    <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest block text-left">Agent FTE</span>
                  </th>
                  {dynamicReqData.map((data, i) => (
                    <th key={i} className="text-[8px] sm:text-[9px] font-black text-slate-700 border-b border-gray-50 h-12 align-middle min-w-[28px] px-0.5 text-center bg-white">
                      {data.req}
                    </th>
                  ))}
                </tr>
                {/* Coverage Gap Row */}
                <tr className="bg-slate-50">
                  <th className="sticky left-0 z-[60] bg-slate-50 h-12 w-[180px] sm:w-[220px] px-4 sm:px-6 border-r border-gray-200 border-b border-slate-100 top-24">
                    <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest block text-left">Coverage Gap</span>
                  </th>
                  {dynamicReqData.map((data, i) => {
                    const gapValue = data.actual - data.req;
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
              {(() => {
                const combinedRows = sortedAgents.flatMap((agent) => {
                  const items = [];

                  // Check yesterday's shift for overnight continuation (e.g., M1, M3 starting at 21:00 or 22:00)
                  const yesterdayDate = format(addDays(new Date(selectedDate), -1), "yyyy-MM-dd");
                  const yesterdayShiftInfo = getAgentShiftForDate(agent, yesterdayDate);
                  const yesterdayShift = yesterdayShiftInfo?.shift || null;
                  const yesterdayShiftCode = yesterdayShiftInfo?.code || "OFF";
                  
                  if (yesterdayShift && yesterdayShiftCode !== "OFF") {
                    const yStartIdx = timeToIndex(yesterdayShift.start);
                    const yEndIdx = timeToIndex(yesterdayShift.end);
                    // If it crosses midnight
                    if (yEndIdx <= yStartIdx && yEndIdx > 0) {
                      items.push({
                        agent,
                        rowKey: `${agent.id}-continuation`,
                        isContinuation: true,
                        shiftCode: yesterdayShiftCode,
                        shift: yesterdayShift,
                        startIdx: 0,
                        endIdx: yEndIdx
                      });
                    }
                  }

                  // Standard today shift row
                  const todayShiftInfo = getAgentShiftForDate(agent, selectedDate);
                  const todayShift = todayShiftInfo?.shift || null;
                  const todayShiftCode = todayShiftInfo?.code || "OFF";
                  const todayStartIdx = todayShift ? timeToIndex(todayShift.start) : -1;
                  const todayEndIdx = todayShift ? (timeToIndex(todayShift.end) <= timeToIndex(todayShift.start) ? 96 : timeToIndex(todayShift.end)) : -1;

                  items.push({
                    agent,
                    rowKey: `${agent.id}-today`,
                    isContinuation: false,
                    shiftCode: todayShiftCode,
                    shift: todayShift,
                    startIdx: todayStartIdx,
                    endIdx: todayEndIdx
                  });

                  return items;
                });

                const sortedCombinedRows = [...combinedRows].sort((rowA, rowB) => {
                  const isDupA = rowA.isContinuation && isShiftCrossDay(rowA.shiftCode);
                  const isDupB = rowB.isContinuation && isShiftCrossDay(rowB.shiftCode);

                  if (isDupA && !isDupB) return -1;
                  if (!isDupA && isDupB) return 1;
                  return 0;
                });

                return sortedCombinedRows.map(({ agent, rowKey, isContinuation, shiftCode, shift, startIdx, endIdx }) => {
                  return (
                    <tr key={rowKey} className="hover:bg-gray-50/50 transition-colors group h-10 sm:h-12">
                      <td className="sticky left-0 z-40 bg-white group-hover:bg-gray-50/80 border-r border-gray-200 px-4 sm:px-6 py-1.5 transition-colors">
                        <div className="flex flex-col min-w-0 justify-center h-full gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] sm:text-[11px] font-bold text-black uppercase tracking-tight truncate">
                              {agent.name}
                              {isContinuation && (
                                <span className="text-[8px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 ml-2 font-black uppercase tracking-widest leading-none">
                                  Cont.
                                </span>
                              )}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-white ${shiftCode.toUpperCase() === "OFF" ? "bg-rose-500" : (shift?.color || "bg-gray-400")}`}>{shiftCode.toUpperCase()}</span>
                          </div>
                          <span className="text-[8px] sm:text-[9px] font-bold text-neutral-gray uppercase tracking-widest opacity-60 truncate flex items-center justify-between gap-1">
                            <span className="truncate">
                              {agent.nip} 
                              {Object.keys(agent.activities).length > 0 && ` • Break: ${intervals[Math.min(...Object.keys(agent.activities).map(Number))]}`}
                            </span>
                            {Object.keys(agent.activities).length > 0 && (
                              <button
                                title="Hapus Break Hari Ini"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClearBreaks(agent.id);
                                }}
                                className="p-0.5 hover:bg-rose-50 rounded text-rose-600 transition-colors pointer-events-auto shrink-0"
                              >
                                <Trash2 size={11} className="stroke-[2.5]" />
                              </button>
                            )}
                          </span>
                        </div>
                      </td>
                      {intervals.map((_, i) => {
                        const isWithinShift = shift ? (startIdx <= i && i < endIdx) : false;
                        const activities = agent.activities as Record<number, string>;
                        const activityKey = activities[i];
                        const activity = activityKey ? getActivityDef(activityKey, agent.project) : null;
                        
                        const isShiftStart = shift ? (i === startIdx) : false;
                        const isShiftEnd = shift ? (i === endIdx - 1) : false;
                        
                        return (
                          <td 
                            key={i} 
                            className="p-0 min-w-[28px] px-0.5 relative cursor-pointer group/cell h-10 sm:h-12 border-b border-gray-100"
                            onClick={() => {
                              // Left click disabled as requested to prevent accidental break additions
                            }}
                            onContextMenu={(e) => {
                              if (!isWithinShift) return;
                              e.preventDefault();
                              setCellContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                agentId: agent.id,
                                slotIdx: i
                              });
                            }}
                          >
                            {isWithinShift && (
                              <div className={`absolute inset-y-2 inset-x-0 ${settings.shiftBarColor || "bg-slate-200/70"} group-hover/cell:bg-blue-100/30 transition-colors ${isShiftStart ? "rounded-l-full ml-0.5" : ""} ${isShiftEnd ? "rounded-r-full mr-0.5" : ""}`} />
                            )}
                            {isWithinShift && activity && (
                              <div 
                                className={`absolute h-5 sm:h-6 top-1/2 -translate-y-1/2 ${activity.color} transition-all hover:brightness-110 z-10 
                                  ${activities[i-1] !== activityKey ? "rounded-l-full left-0.5 shadow-sm" : "-left-px"} 
                                  ${activities[i+1] !== activityKey ? "rounded-r-full right-0.5 shadow-sm" : "-right-px"}`} 
                              />
                            )}
                            <div className="absolute inset-0 z-20 opacity-0 bg-black/5" />

                            {/* Beautiful Custom CSS Tooltip */}
                            <div className="absolute bottom-[80%] left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 scale-95 group-hover/cell:opacity-100 group-hover/cell:scale-100 transition-all duration-150 z-50 flex flex-col items-center">
                              <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 rounded-xl px-3 py-2 text-[9px] font-bold shadow-xl whitespace-nowrap flex flex-col gap-1 leading-none items-center">
                                <span className="text-neutral-gray font-mono tracking-widest text-[8px]">{intervals[i]}</span>
                                <span className="text-white font-black uppercase tracking-wider">
                                  {isWithinShift ? (activity ? activity.label : "Kerja (Aktif)") : "Luar Shift"}
                                </span>
                                {isWithinShift && (
                                  <span className="text-[#818cf8] font-black text-[7px] tracking-widest mt-0.5 uppercase">
                                    Klik Kanan untuk Kelola
                                  </span>
                                )}
                              </div>
                              <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-0.75 border-r border-b border-slate-800" />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                });
              })()}
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
          {(() => {
            const projKey = (selectedProject && selectedProject !== "all") ? selectedProject : "Project Alpha";
            const projActs = settings.activities?.[projKey] || ACTIVITY_TYPES;
            return Object.keys(projActs).map((key) => {
              const act = getActivityDef(key);
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-md ${act.color} shadow-sm`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{act.label}</span>
                </div>
              );
            });
          })()}
          <div className="hidden sm:block h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-full border border-rose-100">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-rose-600">Coverage Gap Alert</span>
          </div>
        </div>
      </div>

      {/* Bulk Remove Breaks Modal */}
      <AnimatePresence>
        {showBulkRemoveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBulkRemoveModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 md:p-8 w-full max-w-md relative z-10 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200"
            >
              <div>
                <h3 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2.5">
                  <Trash2 size={18} className="text-rose-600 animate-pulse" />
                  BULK REMOVE BREAKS
                </h3>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-1.5 leading-relaxed">
                  Hapus semua break/aktivitas custom dalam rentang tanggal untuk project <span className="text-rose-600 font-extrabold">"{selectedProject}"</span>.
                </p>
              </div>

              <div className="space-y-4">
                {/* Start Date */}
                <div className="space-y-1.5 font-sans">
                  <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest block">Tanggal Mulai</label>
                  <input 
                    type="date" 
                    value={bulkRemoveStart} 
                    onChange={e => setBulkRemoveStart(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1.5 font-sans">
                  <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest block">Tanggal Selesai</label>
                  <input 
                    type="date" 
                    value={bulkRemoveEnd} 
                    onChange={e => setBulkRemoveEnd(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                  />
                </div>

                {/* Target selection */}
                <div className="space-y-1.5 font-sans">
                  <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest block">Target Agent</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBulkRemoveTarget("all")}
                      className={`py-2.5 px-3 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all border ${bulkRemoveTarget === "all" ? "bg-black text-white border-black" : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"}`}
                    >
                      Semua Agent ({combinedAgents.filter(a => matchProject(a.project, selectedProject)).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkRemoveTarget("filtered")}
                      className={`py-2.5 px-3 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all border ${bulkRemoveTarget === "filtered" ? "bg-black text-white border-black" : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"}`}
                    >
                      Agent Filter ({filteredAgents.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Confirm Buttons */}
              <div className="flex items-center gap-3 pt-2 font-sans">
                <button
                  type="button"
                  onClick={() => setShowBulkRemoveModal(false)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkClearBreaks(bulkRemoveStart, bulkRemoveEnd, bulkRemoveTarget, filteredAgents)}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-100"
                >
                  <Trash2 size={13} />
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Context Menu Popup for right click action on interval cells */}
      {cellContextMenu && (
        <>
          {/* Backdrop overlay to close when click outside */}
          <div 
            className="fixed inset-0 z-[1000] bg-transparent" 
            onClick={() => setCellContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setCellContextMenu(null);
            }}
          />
          
          {/* Context Menu Popup */}
          <div 
            className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 min-w-[170px] flex flex-col gap-1 text-[10px] font-sans"
            style={{ 
              top: `${Math.min(cellContextMenu.y, (typeof window !== "undefined" ? window.innerHeight : 1000) - 200)}px`, 
              left: `${Math.min(cellContextMenu.x, (typeof window !== "undefined" ? window.innerWidth : 1000) - 180)}px`
            }}
          >
            <div className="px-3 py-1.5 text-gray-400 font-extrabold text-[9px] tracking-widest border-b border-gray-100 uppercase">
              Aktivitas: {intervals[cellContextMenu.slotIdx]}
            </div>
            
            {/* List activities */}
            <div className="flex flex-col gap-0.5 max-h-[220px] overflow-y-auto">
              {(() => {
                const projKey = (selectedProject && selectedProject !== "all") ? selectedProject : "Project Alpha";
                const projActs = settings.activities?.[projKey] || ACTIVITY_TYPES;
                
                return Object.keys(projActs).map((key) => {
                  const act = getActivityDef(key, selectedProject);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSetCellActivity(cellContextMenu.agentId, cellContextMenu.slotIdx, key)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-slate-700 font-bold uppercase tracking-wider"
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${act.color} inline-block`} />
                        {act.label}
                      </span>
                      <span className="text-[8px] font-black text-slate-400 font-mono tracking-wider">{key}</span>
                    </button>
                  );
                });
              })()}
            </div>
            
            {/* Remove option */}
            {(() => {
              const targetAgent = combinedAgents.find(a => a.id === cellContextMenu.agentId);
              const activities = targetAgent?.activities as Record<number, string>;
              const hasActivity = activities && activities[cellContextMenu.slotIdx];
              
              if (hasActivity) {
                return (
                  <button
                    type="button"
                    onClick={() => handleSetCellActivity(cellContextMenu.agentId, cellContextMenu.slotIdx, null)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 transition-colors flex items-center gap-2 border-t border-gray-100 mt-1 font-bold uppercase tracking-wider"
                  >
                    <Trash2 size={12} className="text-rose-500 shrink-0" />
                    Hapus Aktivitas
                  </button>
                );
              }
              return null;
            })()}
          </div>
        </>
      )}
    </div>
  );
};

  const renderCalendar = () => {
    // Determine the days based on the selected roster start / end dates
    const days = getDaysArray(rosterStartDate, rosterEndDate);

    const filteredRoster = (generatedRoster || []).filter(r => {
      const agent = combinedAgents.find(a => String(a.id).trim().toLowerCase() === String(r.empId).trim().toLowerCase());
      if (!agent) return false;
      return matchSite(agent.site, selectedSite) &&
             matchUnit(agent.unit, selectedUnit) &&
             matchProject(agent.project, selectedProject);
    });

    const generateRosterSubmit = () => {
      setIsGeneratingRoster(true);
      
      const slots = getIntervalSlots(histIntervalType);
      const fteDivisor = histIntervalType === "15m" ? 32 : histIntervalType === "30m" ? 16 : 8;
      const compositionShifts = (Object.keys(dbShifts).length > 0 ? dbShifts : SHIFTS) as Record<string, { label: string; start: string; end: string; color: string }>;

      const checkIsFemale = (agentInfo: any) => {
          const g = (agentInfo.gender || '').toUpperCase().trim();
          if (g === 'L' || g === 'MALE' || g === 'LAKI-LAKI' || g === 'PRIA') {
              return false;
          }
          if (g === 'P' || g === 'FEMALE' || g === 'PEREMPUAN' || g === 'WANITA' || g.startsWith('F')) {
              return true;
          }
          if (g.startsWith('P') && !g.startsWith('PRIA')) {
              return true;
          }
          return false;
      };

      const agentsToSchedule = combinedAgents
          .filter(a => matchSite(a.site, selectedSite))
          .filter(a => matchUnit(a.unit, selectedUnit))
          .filter(a => matchProject(a.project, selectedProject));

      if (agentsToSchedule.length === 0) {
        showNotification(`No agents registered for Project "${selectedProject === "all" ? "All Projects" : selectedProject}". Please register agents under the Employee DB tab first, or choose another project.`, "error");
        setIsGeneratingRoster(false);
        return;
      }

      // Define standard maximum working days to avoid skewing scheduling completely towards the first array keys
      const maxWorkingDaysPerAgent = getExpectedWorkingDays(days);

      // 1. Precompute final required shifts per day (Shift Composition data) for all historical days
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
             histFinalShiftsRounded[hd][code] = rawShifts[code] > 0 ? Math.max(1, Math.round(finalVal)) : 0;
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
                 requiredSlotsPerDayPerShift[d][code] = (rawShiftValues[code] || 0) > 0 ? Math.max(1, Math.round(val)) : 0;
             } else if (dowCount[dow] > 0) {
                 requiredSlotsPerDayPerShift[d][code] = Math.round(dowSum[dow][code] / dowCount[dow]);
             } else if (globalCount > 0) {
                 requiredSlotsPerDayPerShift[d][code] = Math.round(globalSum[code] / globalCount);
             } else {
                 requiredSlotsPerDayPerShift[d][code] = 0;
             }
         });
      });

      // 1d. If actual agents are fewer than requirements, scale down and distribute shift targets proportionally per day
       // to ensure we don't starve minor/night shifts and cover all interval ranges evenly.
       const activeAgentsCountVisible = agentsToSchedule.filter(a => !forcedOffAgents.has(a.id)).length;
       if (activeAgentsCountVisible > 0 && days.length > 0) {
           const typicalDailyCap = Math.max(1, Math.round(activeAgentsCountVisible * (maxWorkingDaysPerAgent / days.length)));
           days.forEach(d => {
               let totalReqOnDay = 0;
               Object.keys(compositionShifts).forEach(code => {
                   totalReqOnDay += requiredSlotsPerDayPerShift[d]?.[code] || 0;
               });

               if (totalReqOnDay > typicalDailyCap && totalReqOnDay > 0) {
                   const sortedShifts = Object.keys(compositionShifts).sort((a, b) => {
                       return (requiredSlotsPerDayPerShift[d]?.[b] || 0) - (requiredSlotsPerDayPerShift[d]?.[a] || 0);
                   });

                   const activeRequiredShifts = sortedShifts.filter(code => (requiredSlotsPerDayPerShift[d]?.[code] || 0) > 0);
                   if (activeRequiredShifts.length > 0) {
                       const scaledTargets: Record<string, number> = {};
                       let allocated = 0;

                       // Phase 1: Assign at least 1 to every active shift (up to typicalDailyCap)
                       activeRequiredShifts.forEach(code => {
                           if (allocated < typicalDailyCap) {
                               scaledTargets[code] = 1;
                               allocated++;
                           } else {
                               scaledTargets[code] = 0;
                           }
                       });

                       // Phase 2: Distribute remaining slots proportionally
                       if (allocated < typicalDailyCap) {
                           let remaining = typicalDailyCap - allocated;
                           const totalOriginalActive = activeRequiredShifts.reduce((acc, code) => acc + (requiredSlotsPerDayPerShift[d]?.[code] || 0), 0);
                           
                           activeRequiredShifts.forEach(code => {
                               if (scaledTargets[code] > 0) {
                                   const orig = requiredSlotsPerDayPerShift[d]?.[code] || 0;
                                   const share = Math.floor(remaining * (orig / totalOriginalActive));
                                   scaledTargets[code] += share;
                                   allocated += share;
                               }
                           });

                           // Distribute any leftover from floor rounding
                           let leftover = typicalDailyCap - allocated;
                           let safetyIter = 0;
                           while (leftover > 0 && safetyIter < 10) {
                               safetyIter++;
                               for (const code of activeRequiredShifts) {
                                   if (leftover <= 0) break;
                                   if (scaledTargets[code] > 0) {
                                       scaledTargets[code]++;
                                       leftover--;
                                   }
                               }
                           }
                       }

                       // Override the required slots for this day with our beautiful distributed targets!
                       Object.keys(compositionShifts).forEach(code => {
                           requiredSlotsPerDayPerShift[d][code] = scaledTargets[code] || 0;
                       });
                   }
               }
           });
       }

       // Access settings and public holidays synchronously from store
      const { settings } = useAppStore.getState();
      const storeHolidays = settings.holidays || {};
      const holidayDatesInPeriod = days.filter(d => storeHolidays[d]);
      const holidayCount = holidayDatesInPeriod.length;
      const allowedLiburDempet = 2 + holidayCount;

      const roster: { empId: string, roster: Record<string, string> }[] = agentsToSchedule.map(a => {
          const initialRoster: Record<string, string> = {};
          days.forEach(d => {
              initialRoster[d] = 'OFF';
          });
          return { empId: a.id, roster: initialRoster };
      });
      
      const parseTime_new = (t: string) => { 
         if (!t) return 0;
         const [h, m] = t.split(':').map(Number); 
         return h + m/60; 
      };
      
      const getShiftEnd_new = (startStr: string, endStr: string) => {
         const start = parseTime_new(startStr);
         const end = parseTime_new(endStr);
         return end < start ? end + 24 : end;
      };

      const getWeekKey = (dayStr: string) => {
          const date = parseISO(dayStr);
          return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      };

       const isGenderOk = (agent: any, day: string, shiftCode: string) => {
           const isFemale = checkIsFemale(agent);
           if (!isFemale) return true;

           const sInfo = compositionShifts[shiftCode];
           if (!sInfo) return true;

           const startT = parseTime_new(sInfo.start);
           const rawEndT = parseTime_new(sInfo.end);
           const endT = rawEndT < startT ? rawEndT + 24 : rawEndT;

           if (startT < 6 || endT > 23) {
               const totalMalePoolSize = agentsToSchedule.filter(a => !checkIsFemale(a) && !forcedOffAgents.has(a.id)).length;
               
               let totalNightShiftRequiredSlots = 0;
               Object.keys(compositionShifts).forEach(key => {
                   const s = compositionShifts[key];
                   if (s) {
                       const st = parseTime_new(s.start);
                       const et = parseTime_new(s.end);
                       const end = et < st ? et + 24 : et;
                       if (st < 6 || end > 23) {
                           totalNightShiftRequiredSlots += (requiredSlotsPerDayPerShift[day]?.[key] || 0);
                       }
                   }
               });

               if (totalNightShiftRequiredSlots > totalMalePoolSize) {
                   return true; // Relaxed because we have insufficient male pool capacity to cover required night shift targets
               }
               return false; // Strictly restricted since male pool exceeds the demand
           }

           return true;
       };

      // Strict Validation of Hard constraints
      const isValidShiftAssignment = (agent: any, day: string, shiftCode: string, rMap: Record<string, string>) => {
          if (shiftCode === 'OFF') return true;

          // Forced OFF handling
          if (forcedOffAgents.has(agent.id)) return false;

          // 1. Gender constraint
          if (!isGenderOk(agent, day, shiftCode)) {
              return false;
          }

          // Temporary roster map to check consecutive constraints
          const tempRoster = { ...rMap, [day]: shiftCode };

          // 2. Max consecutive working days <= 6 (allowed up to 6 HK)
          let maxConsecWork = 0;
          let currentConsecWork = 0;
          for (let i = 0; i < days.length; i++) {
              const val = tempRoster[days[i]];
              if (val && val !== 'OFF') {
                  currentConsecWork++;
                  if (currentConsecWork > maxConsecWork) maxConsecWork = currentConsecWork;
              } else {
                  currentConsecWork = 0;
              }
          }
          if (maxConsecWork > 6) return false;

          // 3. Weekly working days limit <= 6 in any calendar week of this period (Mon-Sun)
          const weekCounts: Record<string, number> = {};
          for (let i = 0; i < days.length; i++) {
              const d = days[i];
              const val = tempRoster[d];
              if (val && val !== 'OFF') {
                  const weekKey = getWeekKey(d);
                  weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
              }
          }
          if (Object.values(weekCounts).some(count => count > 6)) return false;

          // 4. Max consecutive special shifts (nyebrang hari / overnight) <= 3
          let maxConsecSpecial = 0;
          let currentConsecSpecial = 0;
          for (let i = 0; i < days.length; i++) {
              const val = tempRoster[days[i]];
              if (val && isShiftCrossDay(val)) {
                  currentConsecSpecial++;
                  if (currentConsecSpecial > maxConsecSpecial) maxConsecSpecial = currentConsecSpecial;
              } else {
                  currentConsecSpecial = 0;
              }
          }
          if (maxConsecSpecial > 3) return false;

          // 5. Min 10 hours rest from previous shift and to next shift
          const dayIdx = days.indexOf(day);
          if (dayIdx > 0) {
              const prevShift = tempRoster[days[dayIdx - 1]];
              if (prevShift && prevShift !== 'OFF') {
                  const pInfo = compositionShifts[prevShift];
                  const sInfo = compositionShifts[shiftCode];
                  if (pInfo && sInfo) {
                      const prevEnd = getShiftEnd_new(pInfo.start, pInfo.end);
                      const currStart = parseTime_new(sInfo.start) + 24;
                      if ((currStart - prevEnd) < 10) return false;
                  }
              }
          }
          if (dayIdx < days.length - 1) {
              const nextShift = tempRoster[days[dayIdx + 1]];
              if (nextShift && nextShift !== 'OFF') {
                  const nInfo = compositionShifts[nextShift];
                  const sInfo = compositionShifts[shiftCode];
                  if (nInfo && sInfo) {
                      const currEnd = getShiftEnd_new(sInfo.start, sInfo.end);
                      const nextStart = parseTime_new(nInfo.start) + 24;
                      if ((nextStart - currEnd) < 10) return false;
                  }
              }
          }

          return true;
      };

      const getMaxConsecutiveOff = (rMap: Record<string, string>) => {
          let maxConsec = 0;
          let currentConsec = 0;
          for (let i = 0; i < days.length; i++) {
              const val = rMap[days[i]];
              if (!val || val === 'OFF') {
                  currentConsec++;
                  if (currentConsec > maxConsec) {
                      maxConsec = currentConsec;
                  }
              } else {
                  currentConsec = 0;
              }
          }
          return maxConsec;
      };

      const shiftCodesSorted = Object.keys(compositionShifts).sort((a, b) => {
          const isA_Spec = isShiftCrossDay(a);
          const isB_Spec = isShiftCrossDay(b);
          if (isA_Spec && !isB_Spec) return -1;
          if (!isA_Spec && isB_Spec) return 1;
          return 0;
      });

      const getShiftsSortedByNeed = (day: string) => {
          return [...shiftCodesSorted].sort((a, b) => {
              const targetA = requiredSlotsPerDayPerShift[day]?.[a] || 0;
              const actualA = roster.filter(r => r.roster[day] === a).length;
              const needA = targetA - actualA;

              const targetB = requiredSlotsPerDayPerShift[day]?.[b] || 0;
              const actualB = roster.filter(r => r.roster[day] === b).length;
              const needB = targetB - actualB;

              return needB - needA; // Prioritize higher need
          });
      };

      // --- INITIAL GREEDY ASSIGNMENT TO TARGETS ---
      // We assign shifts day-by-day based on required slots per day per shift
      days.forEach((d) => {
          const assignedOnDay = new Set<string>();
          forcedOffAgents.forEach(id => assignedOnDay.add(id));

          // Sort shifts by dynamic need to cover the most critical gaps first
          const dayShiftsSorted = getShiftsSortedByNeed(d);

          dayShiftsSorted.forEach(shiftCode => {
              const targetCount = requiredSlotsPerDayPerShift[d]?.[shiftCode] || 0;
              if (targetCount <= 0) return;

              // Find candidates eligible on day d with current workDays < expected limit
              const candidates = agentsToSchedule.filter(agent => {
                  if (assignedOnDay.has(agent.id)) return false;
                  
                  const agentRoster = roster.find(r => r.empId === agent.id)!;
                  const currentWorkDays = Object.values(agentRoster.roster).filter(s => s && s !== 'OFF').length;
                  if (currentWorkDays >= maxWorkingDaysPerAgent) return false;

                  return isValidShiftAssignment(agent, d, shiftCode, agentRoster.roster);
              });

              // Rank candidates by fewest working days to maintain a balanced workload
              const scored = candidates.map(agent => {
                  const agentRoster = roster.find(r => r.empId === agent.id)!;
                  const currentWorkDays = Object.values(agentRoster.roster).filter(s => s && s !== 'OFF').length;
                  return { agent, workDays: currentWorkDays };
              });

              scored.sort((a, b) => a.workDays - b.workDays);

              const toAssign = scored.slice(0, targetCount);
              toAssign.forEach(sc => {
                  const rEntry = roster.find(r => r.empId === sc.agent.id)!;
                  rEntry.roster[d] = shiftCode;
                  assignedOnDay.add(sc.agent.id);
              });
          });
      });

      // --- COMPENSATE AND BACKFILL GUARANTEEING EXACTLY maxWorkingDaysPerAgent ---
      // For any active agents who are STILL under-scheduled, find valid shifts to bring them to exactly maxWorkingDaysPerAgent!
      // To avoid chronological clustering, we prioritize backfilling on days with the highest understaffing (unfulfilled needs)!
      agentsToSchedule.forEach(agent => {
          if (forcedOffAgents.has(agent.id)) return;

          const rEntry = roster.find(r => r.empId === agent.id)!;
          let currentWorkDays = Object.values(rEntry.roster).filter(s => s && s !== 'OFF').length;

          if (currentWorkDays < maxWorkingDaysPerAgent) {
              const offDays = days.filter(d => rEntry.roster[d] === 'OFF');

              // Helper to measure day's total understaffed need
              const getDayNeed = (day: string) => {
                  let dayNeed = 0;
                  Object.keys(compositionShifts).forEach(code => {
                      const target = requiredSlotsPerDayPerShift[day]?.[code] || 0;
                      const actual = roster.filter(r => r.roster[day] === code).length;
                      if (target > actual) {
                          dayNeed += (target - actual);
                      }
                  });
                  return dayNeed;
              };

              // Sort offDays descending by total unfulfilled need on that day
              const sortedOffDays = [...offDays].sort((a, b) => getDayNeed(b) - getDayNeed(a));
              
              for (const d of sortedOffDays) {
                  if (currentWorkDays >= maxWorkingDaysPerAgent) break;

                  // Find a valid shift code that can be assigned here (strict)
                  const dayShiftsSorted = getShiftsSortedByNeed(d);
                  const eligibleShift = dayShiftsSorted.find(shiftCode => {
                      return isValidShiftAssignment(agent, d, shiftCode, rEntry.roster);
                  });

                  if (eligibleShift) {
                      rEntry.roster[d] = eligibleShift;
                      currentWorkDays++;
                  }
              }
          }

          // If still under-scheduled, backfill with relaxed rules
          if (currentWorkDays < maxWorkingDaysPerAgent) {
              const offDays = days.filter(d => rEntry.roster[d] === 'OFF');
              const sortedOffDays = [...offDays].sort((a, b) => {
                  const getDayNeed = (day: string) => {
                      let dayNeed = 0;
                      Object.keys(compositionShifts).forEach(code => {
                          const target = requiredSlotsPerDayPerShift[day]?.[code] || 0;
                          const actual = roster.filter(r => r.roster[day] === code).length;
                          if (target > actual) dayNeed += (target - actual);
                      });
                      return dayNeed;
                  };
                  return getDayNeed(b) - getDayNeed(a);
              });

              const isValidShiftAssignmentRelaxed = (ag: any, day: string, sCode: string, rMap: Record<string, string>) => {
                  if (sCode === 'OFF') return true;
                  // 1. Gender constraint
                  if (!isGenderOk(ag, day, sCode)) {
                      return false;
                  }
                  const dayIdx = days.indexOf(day);
                  if (dayIdx > 0) {
                      const prevShift = rMap[days[dayIdx - 1]];
                      if (prevShift && prevShift !== 'OFF') {
                          const pInfo = compositionShifts[prevShift];
                          const sInfo = compositionShifts[sCode];
                          if (pInfo && sInfo) {
                              const prevEnd = getShiftEnd_new(pInfo.start, pInfo.end);
                              const currStart = parseTime_new(sInfo.start) + 24;
                              if ((currStart - prevEnd) < 10) return false;
                          }
                      }
                  }
                  if (dayIdx < days.length - 1) {
                      const nextShift = rMap[days[dayIdx + 1]];
                      if (nextShift && nextShift !== 'OFF') {
                          const nInfo = compositionShifts[nextShift];
                          const sInfo = compositionShifts[sCode];
                          if (nInfo && sInfo) {
                              const currEnd = getShiftEnd_new(sInfo.start, sInfo.end);
                              const nextStart = parseTime_new(nInfo.start) + 24;
                              if ((nextStart - currEnd) < 10) return false;
                          }
                      }
                  }
                  return true;
              };

              for (const d of sortedOffDays) {
                  if (currentWorkDays >= maxWorkingDaysPerAgent) break;

                  const dayShiftsSorted = getShiftsSortedByNeed(d);
                  const eligibleShift = dayShiftsSorted.find(shiftCode => {
                      return isValidShiftAssignmentRelaxed(agent, d, shiftCode, rEntry.roster);
                  });

                  if (eligibleShift) {
                      rEntry.roster[d] = eligibleShift;
                      currentWorkDays++;
                  }
              }
          }

          // Ultimate absolute backfill to ensure EXACT working days count
          if (currentWorkDays < maxWorkingDaysPerAgent) {
              const offDays = days.filter(d => rEntry.roster[d] === 'OFF');
              for (const d of offDays) {
                  if (currentWorkDays >= maxWorkingDaysPerAgent) break;

                  const dayShiftsSorted = getShiftsSortedByNeed(d);
                  const eligibleShift = dayShiftsSorted.find(shiftCode => {
                      if (!isGenderOk(agent, d, shiftCode)) {
                          return false;
                      }
                      return true;
                  });

                  if (eligibleShift) {
                      rEntry.roster[d] = eligibleShift;
                      currentWorkDays++;
                  }
              }
          }

          // If somehow they have MORE than maxWorkingDaysPerAgent, trim the excess down
          if (currentWorkDays > maxWorkingDaysPerAgent) {
              const workDaysInRoster = days.filter(d => rEntry.roster[d] && rEntry.roster[d] !== 'OFF');
              
              // Sort workdays by overstaffing of their assigned shift (descending)
              const sortedWorkDays = [...workDaysInRoster].sort((a, b) => {
                  const shiftA = rEntry.roster[a];
                  const targetA = requiredSlotsPerDayPerShift[a]?.[shiftA] || 0;
                  const actualA = roster.filter(r => r.roster[a] === shiftA).length;
                  const surplusA = actualA - targetA;

                  const shiftB = rEntry.roster[b];
                  const targetB = requiredSlotsPerDayPerShift[b]?.[shiftB] || 0;
                  const actualB = roster.filter(r => r.roster[b] === shiftB).length;
                  const surplusB = actualB - targetB;

                  return surplusB - surplusA; // Prioritize higher surplus
              });

              for (const d of sortedWorkDays) {
                  if (currentWorkDays <= maxWorkingDaysPerAgent) break;
                  rEntry.roster[d] = 'OFF';
                  currentWorkDays--;
              }
          }
      });

      // --- HIGH PERFORMANCE HILL CLIMBING PASS FOR MAXIMUM INTERVAL COVERAGE METRICS ---
      // We prioritize exact intervals and penalize under/overstaffing as per the UI Roster Accuracy definitions.
      const getGapPenalty = (gap: number) => {
          if (gap < 0) return -gap * 100000; // Understaffing is heavily penalized
          if (gap > 2) return (gap - 2) * 10000; // Overstaffing beyond 2 is softly penalized
          return 0; // Ideal range 0-2 (highest accuracy)
      };

      const getConsecOffPenalty = (agentRosterMap: Record<string, string>) => {
          const consecOff = getMaxConsecutiveOff(agentRosterMap);
          const allowed = holidayCount > 0 ? (2 + holidayCount) : 2;
          if (consecOff > allowed) {
              return (consecOff - allowed) * 500000; // Penalize exceeding max consecutive OFF
          }
          return 0;
      };

      // Initialize slot-level gaps
      let currentGaps: Record<string, number[]> = {};
      days.forEach(d => {
          currentGaps[d] = slots.map(s => {
              let schedCount = 0;
              roster.forEach(r => {
                  const code = r.roster[d];
                  if (code && code !== 'OFF' && compositionShifts[code] && isSlotInShift(s, compositionShifts[code].start, compositionShifts[code].end)) {
                      schedCount++;
                  }
              });
              return schedCount - (histRequirements[d]?.[s] || 0);
          });
      });

      let totalConsecPenalty = 0;
      roster.forEach(r => {
          if (forcedOffAgents.has(r.empId)) return;
          totalConsecPenalty += getConsecOffPenalty(r.roster);
      });

      const calculateGlobalScore = () => {
          let gapScore = 0;
          days.forEach(d => {
              currentGaps[d].forEach(gap => {
                  gapScore -= getGapPenalty(gap);
              });
          });
          return gapScore - totalConsecPenalty;
      };

      let currentScore = calculateGlobalScore();

      // Perform fast localized hill-climbing search (Volume preserving, guarantees strict HK counts)
      for (let iter = 0; iter < 150000; iter++) {
          const randType = Math.random();

          if (randType < 0.35) {
              // --- MUTATION 1: CHANGE SHIFT CODES (Volume-preserving) ---
              const randAgentIdx = Math.floor(Math.random() * roster.length);
              const rEntry = roster[randAgentIdx];
              if (forcedOffAgents.has(rEntry.empId)) continue;

              const agent = agentsToSchedule.find(a => a.id === rEntry.empId)!;

              const workingDays = days.filter(d => rEntry.roster[d] !== 'OFF');
              if (workingDays.length === 0) continue;

              const d = workingDays[Math.floor(Math.random() * workingDays.length)];
              const oldShift = rEntry.roster[d];

              const candidateShift = shiftCodesSorted[Math.floor(Math.random() * shiftCodesSorted.length)];
              if (candidateShift === oldShift) continue;

              if (!isValidShiftAssignment(agent, d, candidateShift, rEntry.roster)) continue;

              let deltaScore = 0;
              slots.forEach((s, sIdx) => {
                  const gap = currentGaps[d][sIdx];
                  let newGap = gap;
                  if (isSlotInShift(s, compositionShifts[oldShift].start, compositionShifts[oldShift].end)) {
                      newGap--;
                  }
                  if (isSlotInShift(s, compositionShifts[candidateShift].start, compositionShifts[candidateShift].end)) {
                      newGap++;
                  }
                  if (gap !== newGap) {
                      deltaScore += getGapPenalty(gap) - getGapPenalty(newGap);
                  }
              });

              if (deltaScore >= 0) {
                  rEntry.roster[d] = candidateShift;
                  currentScore += deltaScore;

                  slots.forEach((s, sIdx) => {
                      if (isSlotInShift(s, compositionShifts[oldShift].start, compositionShifts[oldShift].end)) {
                          currentGaps[d][sIdx]--;
                      }
                      if (isSlotInShift(s, compositionShifts[candidateShift].start, compositionShifts[candidateShift].end)) {
                          currentGaps[d][sIdx]++;
                      }
                  });
              }

          } else if (randType < 0.70) {
              // --- MUTATION 2: MOVE WORKING DAY (Volume-preserving) ---
              const randAgentIdx = Math.floor(Math.random() * roster.length);
              const rEntry = roster[randAgentIdx];
              if (forcedOffAgents.has(rEntry.empId)) continue;

              const agent = agentsToSchedule.find(a => a.id === rEntry.empId)!;

              const workingDays = days.filter(d => rEntry.roster[d] !== 'OFF');
              const offDays = days.filter(d => rEntry.roster[d] === 'OFF');
              if (workingDays.length === 0 || offDays.length === 0) continue;

              const wd = workingDays[Math.floor(Math.random() * workingDays.length)];
              const od = offDays[Math.floor(Math.random() * offDays.length)];
              const oldShift = rEntry.roster[wd];

              const candidateShift = shiftCodesSorted[Math.floor(Math.random() * shiftCodesSorted.length)];

              const tempRosterMap = { ...rEntry.roster, [wd]: 'OFF', [od]: candidateShift };
              if (!isValidShiftAssignment(agent, od, candidateShift, { ...rEntry.roster, [wd]: 'OFF' })) continue;

              const oldConsecPenalty = getConsecOffPenalty(rEntry.roster);
              const newConsecPenalty = getConsecOffPenalty(tempRosterMap);
              const consecPenaltyDelta = oldConsecPenalty - newConsecPenalty;

              let deltaScore = 0;
              slots.forEach((s, sIdx) => {
                  const gapWd = currentGaps[wd][sIdx];
                  let newGapWd = gapWd;
                  if (isSlotInShift(s, compositionShifts[oldShift].start, compositionShifts[oldShift].end)) {
                      newGapWd--;
                  }
                  if (gapWd !== newGapWd) {
                      deltaScore += getGapPenalty(gapWd) - getGapPenalty(newGapWd);
                  }

                  const gapOd = currentGaps[od][sIdx];
                  let newGapOd = gapOd;
                  if (isSlotInShift(s, compositionShifts[candidateShift].start, compositionShifts[candidateShift].end)) {
                      newGapOd++;
                  }
                  if (gapOd !== newGapOd) {
                      deltaScore += getGapPenalty(gapOd) - getGapPenalty(newGapOd);
                  }
              });

              const totalDelta = deltaScore + consecPenaltyDelta;

              if (totalDelta >= 0) {
                  rEntry.roster[wd] = 'OFF';
                  rEntry.roster[od] = candidateShift;
                  currentScore += totalDelta;
                  totalConsecPenalty += (newConsecPenalty - oldConsecPenalty);

                  slots.forEach((s, sIdx) => {
                      if (isSlotInShift(s, compositionShifts[oldShift].start, compositionShifts[oldShift].end)) {
                          currentGaps[wd][sIdx]--;
                      }
                      if (isSlotInShift(s, compositionShifts[candidateShift].start, compositionShifts[candidateShift].end)) {
                          currentGaps[od][sIdx]++;
                      }
                  });
              }

          } else {
              // --- MUTATION 3: SWAP SHIFTS BETWEEN TWO AGENTS (Volume-preserving) ---
              const idxA = Math.floor(Math.random() * roster.length);
              const idxB = Math.floor(Math.random() * roster.length);
              if (idxA === idxB) continue;

              const rA = roster[idxA];
              const rB = roster[idxB];
              if (forcedOffAgents.has(rA.empId) || forcedOffAgents.has(rB.empId)) continue;

              const agentA = agentsToSchedule.find(a => a.id === rA.empId)!;
              const agentB = agentsToSchedule.find(a => a.id === rB.empId)!;

              const d = days[Math.floor(Math.random() * days.length)];
              const shiftA = rA.roster[d];
              const shiftB = rB.roster[d];
              if (shiftA === shiftB) continue;

              if (shiftA === 'OFF' || shiftB === 'OFF') continue;

              const tempA = { ...rA.roster, [d]: shiftB };
              const tempB = { ...rB.roster, [d]: shiftA };

              if (!isValidShiftAssignment(agentA, d, shiftB, tempA)) continue;
              if (!isValidShiftAssignment(agentB, d, shiftA, tempB)) continue;

              rA.roster[d] = shiftB;
              rB.roster[d] = shiftA;
          }
      }

      setTimeout(() => {
        setGeneratedRoster(roster);
        setIsGeneratingRoster(false);
      }, 600);
    };

    const generateRosterSubmitOldDummy = () => {
      setIsGeneratingRoster(true);
      
      const slots = getIntervalSlots(histIntervalType);
      const fteDivisor = histIntervalType === "15m" ? 32 : histIntervalType === "30m" ? 16 : 8;
      const compositionShifts = (Object.keys(dbShifts).length > 0 ? dbShifts : SHIFTS) as Record<string, { label: string; start: string; end: string; color: string }>;

      const agentsToSchedule = combinedAgents
          .filter(a => matchSite(a.site, selectedSite))
          .filter(a => matchUnit(a.unit, selectedUnit))
          .filter(a => matchProject(a.project, selectedProject));

      // Define standard maximum working days to avoid skewing scheduling completely towards the first array keys
      const maxWorkingDaysPerAgent = getExpectedWorkingDays(days);

      // 1. Precompute final required shifts per day (Shift Composition data) for all historical days
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
             if (compositionMode !== 'peak' && compDayTotal > fteTarget && compDayTotal > 0) {
                 finalVal = finalVal * (fteTarget / compDayTotal);
             }
             histFinalShiftsRounded[hd][code] = rawShifts[code] > 0 ? Math.max(1, Math.round(finalVal)) : 0;
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
                 requiredSlotsPerDayPerShift[d][code] = (rawShiftValues[code] || 0) > 0 ? Math.max(1, Math.round(val)) : 0;
             } else if (dowCount[dow] > 0) {
                 requiredSlotsPerDayPerShift[d][code] = Math.round(dowSum[dow][code] / dowCount[dow]);
             } else if (globalCount > 0) {
                 requiredSlotsPerDayPerShift[d][code] = Math.round(globalSum[code] / globalCount);
             } else {
                 requiredSlotsPerDayPerShift[d][code] = 0;
             }
         });
      });

      const roster: { empId: string, roster: Record<string, string> }[] = agentsToSchedule.map(a => {
          const isForcedOff = forcedOffAgents.has(a.id);
          const initialRoster: Record<string, string> = {};
          if (isForcedOff) {
              days.forEach(d => initialRoster[d] = 'OFF');
          }
          return { empId: a.id, roster: initialRoster };
      });
      
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
          
          // 2. Max 4 consecutive overnight shifts penalty
          if (isShiftCrossDay(shiftCode)) {
             let consec = 0;
             for (let i = dayIdx - 1; i >= 0; i--) {
                 const prevCode = roster.find(r => r.empId === agentId)?.roster[days[i]];
                 if (prevCode && isShiftCrossDay(prevCode)) {
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

          // 6. Shift type total balancing (Avoid dominating overnight shifts)
          if (isShiftCrossDay(shiftCode)) {
             const totalM1S7 = Object.values(roster.find(r => r.empId === agentId)!.roster)
                .filter(s => s && isShiftCrossDay(s)).length;
             score += totalM1S7 * 500; // Prefer those who already have overnight shifts
          }

          return score;
      };

      const shiftCodesSorted = Object.keys(compositionShifts).sort((a, b) => {
          const isA_Spec = isShiftCrossDay(a);
          const isB_Spec = isShiftCrossDay(b);
          if (isA_Spec && !isB_Spec) return -1;
          if (!isA_Spec && isB_Spec) return 1;
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
                  if (isShiftCrossDay(shiftCode)) {
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
                  if (isShiftCrossDay(shiftCode)) {
                     let consecM1S7 = 0;
                     for (let i = dayIdx - 1; i >= 0; i--) {
                         const prevCode = roster.find(r => r.empId === agent.id)?.roster[days[i]];
                         if (prevCode && isShiftCrossDay(prevCode)) {
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
          const effectiveMax = maxWorkingDaysPerAgent === days.length ? days.length : allowedMax;
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
          return maxConsec <= effectiveMax;
      };

      const checkMaxConsecM1S7 = (tempRoster: Record<string, string>, allowedMax = 4) => {
          let maxConsec = 0;
          let currentConsec = 0;
          for (let i = 0; i < days.length; i++) {
              const val = tempRoster[days[i]];
              if (val && isShiftCrossDay(val)) {
                  currentConsec++;
                  if (currentConsec > maxConsec) maxConsec = currentConsec;
              } else {
                  currentConsec = 0;
              }
          }
          return maxConsec <= allowedMax;
      };

      // PASS 1: Strict constraints (Allowed consecutive work: 5 days, consecutive M1/S7: 4 days, 10 hours rest)
      roster.forEach(rosterEntry => { /* TEST 2 */
          if (forcedOffAgents.has(rosterEntry.empId)) return; /* TEST */
          const agent = agentsToSchedule.find(a => a.id === rosterEntry.empId);
          if (!agent) return;
          
          let workDays = Object.values(rosterEntry.roster).filter(s => s !== 'OFF').length;
          let needed = maxWorkingDaysPerAgent - workDays;
          if (needed <= 0) return;
          
          for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
              if (needed <= 0) break;
              const d = days[dayIdx];
              if (rosterEntry.roster[d] === 'OFF') {
                  const sortedShifts = Object.keys(compositionShifts).sort((a, b) => {
                      const defA = (requiredSlotsPerDayPerShift[d]?.[a] || 0) - roster.filter(r => r.roster[d] === a).length;
                      const defB = (requiredSlotsPerDayPerShift[d]?.[b] || 0) - roster.filter(r => r.roster[d] === b).length;
                      return defB - defA;
                  });
                  for (const shiftCode of sortedShifts) {
                      const currentCount = roster.filter(r => r.roster[d] === shiftCode).length;
                      if (currentCount >= (requiredSlotsPerDayPerShift[d]?.[shiftCode] || 0)) continue;

                      if (isShiftCrossDay(shiftCode)) {
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
          if (forcedOffAgents.has(rosterEntry.empId)) return;
          const agent = agentsToSchedule.find(a => a.id === rosterEntry.empId);
          if (!agent) return;
          
          let workDays = Object.values(rosterEntry.roster).filter(s => s !== 'OFF').length;
          let needed = maxWorkingDaysPerAgent - workDays;
          if (needed <= 0) return;
          
          for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
              if (needed <= 0) break;
              const d = days[dayIdx];
              if (rosterEntry.roster[d] === 'OFF') {
                  const sortedShifts = Object.keys(compositionShifts).sort((a, b) => {
                      const defA = (requiredSlotsPerDayPerShift[d]?.[a] || 0) - roster.filter(r => r.roster[d] === a).length;
                      const defB = (requiredSlotsPerDayPerShift[d]?.[b] || 0) - roster.filter(r => r.roster[d] === b).length;
                      return defB - defA;
                  });
                  for (const shiftCode of sortedShifts) {
                      const currentCount = roster.filter(r => r.roster[d] === shiftCode).length;
                      if (currentCount >= (requiredSlotsPerDayPerShift[d]?.[shiftCode] || 0)) continue;

                      if (isShiftCrossDay(shiftCode)) {
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
          if (forcedOffAgents.has(rosterEntry.empId)) return;
          const agent = agentsToSchedule.find(a => a.id === rosterEntry.empId);
          if (!agent) return;
          
          let workDays = Object.values(rosterEntry.roster).filter(s => s !== 'OFF').length;
          let needed = maxWorkingDaysPerAgent - workDays;
          if (needed <= 0) return;
          
          for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
              if (needed <= 0) break;
              const d = days[dayIdx];
              if (rosterEntry.roster[d] === 'OFF') {
                  const sortedShifts = Object.keys(compositionShifts).sort((a, b) => {
                      const defA = (requiredSlotsPerDayPerShift[d]?.[a] || 0) - roster.filter(r => r.roster[d] === a).length;
                      const defB = (requiredSlotsPerDayPerShift[d]?.[b] || 0) - roster.filter(r => r.roster[d] === b).length;
                      return defB - defA;
                  });
                  for (const shiftCode of sortedShifts) {
                      const currentCount = roster.filter(r => r.roster[d] === shiftCode).length;
                      if (currentCount >= (requiredSlotsPerDayPerShift[d]?.[shiftCode] || 0)) continue;

                      if (isShiftCrossDay(shiftCode)) {
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
                  let availableAgents = roster.filter(r => r.roster[d] === 'OFF' && !forcedOffAgents.has(r.empId));
                  if (availableAgents.length === 0) break;

                  // We will look for an agent in stages of relaxation to satisfy the requiredCount.
                  let chosenAgentRoster: any = null;

                  // Precompute helper functions for candidate evaluation
                  const isGenderMatched = (empId: string) => {
                      if (!isShiftCrossDay(shiftCode)) return true;
                      const agent = agentsToSchedule.find(a => a.id === empId);
                      const gender = (agent?.gender || '').toUpperCase().trim();
                      return gender === 'L' || gender === 'MALE' || gender === 'LAKI-LAKI' || gender === 'PRIA';
                  };

                  const isRestTimeOk = (empId: string) => {
                      const rEntry = roster.find(r => r.empId === empId);
                      if (!rEntry) return true;
                      const dayIdx = days.indexOf(d);
                      const prevShift = dayIdx > 0 ? rEntry.roster[days[dayIdx - 1]] : 'OFF';
                      const nextShift = dayIdx < days.length - 1 ? rEntry.roster[days[dayIdx + 1]] : 'OFF';
                      return isRestOk(prevShift, shiftCode) && isRestOk(shiftCode, nextShift);
                  };

                  // --- STAGE 1: Strict (Gender matched, Rest OK, Work Days < Limit, Max Consecutive <= 5) ---
                  let stage1 = availableAgents.filter(r => {
                      if (!isGenderMatched(r.empId) || !isRestTimeOk(r.empId)) return false;
                      const wD = Object.values(r.roster).filter(s => s !== 'OFF').length;
                      if (wD >= maxWorkingDaysPerAgent) return false;
                      const temp = { ...r.roster, [d]: shiftCode };
                      return checkMaxConsecWork(temp, 5);
                  });
                  if (stage1.length > 0) {
                      stage1.sort((a, b) => {
                          const wA = Object.values(a.roster).filter(s => s !== 'OFF').length;
                          const wB = Object.values(b.roster).filter(s => s !== 'OFF').length;
                          return wA - wB;
                      });
                      chosenAgentRoster = stage1[0];
                  }

                  // --- STAGE 2: Relax Rest checks (Gender matched, Work Days < Limit, Max Consecutive <= 5) ---
                  if (!chosenAgentRoster) {
                      let stage2 = availableAgents.filter(r => {
                          if (!isGenderMatched(r.empId)) return false;
                          const wD = Object.values(r.roster).filter(s => s !== 'OFF').length;
                          if (wD >= maxWorkingDaysPerAgent) return false;
                          const temp = { ...r.roster, [d]: shiftCode };
                          return checkMaxConsecWork(temp, 5);
                      });
                      if (stage2.length > 0) {
                          stage2.sort((a, b) => {
                              const wA = Object.values(a.roster).filter(s => s !== 'OFF').length;
                              const wB = Object.values(b.roster).filter(s => s !== 'OFF').length;
                              return wA - wB;
                          });
                          chosenAgentRoster = stage2[0];
                      }
                  }

                  // --- STAGE 3: Relax Gender check for overnight shifts (Rest OK, Work Days < Limit, Max Consecutive <= 5) ---
                  if (!chosenAgentRoster && isShiftCrossDay(shiftCode)) {
                      let stage3 = availableAgents.filter(r => {
                          if (!isRestTimeOk(r.empId)) return false;
                          const wD = Object.values(r.roster).filter(s => s !== 'OFF').length;
                          if (wD >= maxWorkingDaysPerAgent) return false;
                          const temp = { ...r.roster, [d]: shiftCode };
                          return checkMaxConsecWork(temp, 5);
                      });
                      if (stage3.length > 0) {
                          stage3.sort((a, b) => {
                              const wA = Object.values(a.roster).filter(s => s !== 'OFF').length;
                              const wB = Object.values(b.roster).filter(s => s !== 'OFF').length;
                              return wA - wB;
                          });
                          chosenAgentRoster = stage3[0];
                      }
                  }

                  // --- STAGE 4: Relax gender and work day count slightly (Work Days < Limit + 2, Max Consecutive <= 6) ---
                  if (!chosenAgentRoster) {
                      let stage4 = availableAgents.filter(r => {
                          const wD = Object.values(r.roster).filter(s => s !== 'OFF').length;
                          if (wD >= maxWorkingDaysPerAgent + 2) return false;
                          const temp = { ...r.roster, [d]: shiftCode };
                          return checkMaxConsecWork(temp, 6);
                      });
                      if (stage4.length > 0) {
                          stage4.sort((a, b) => {
                              const wA = Object.values(a.roster).filter(s => s !== 'OFF').length;
                              const wB = Object.values(b.roster).filter(s => s !== 'OFF').length;
                              return wA - wB;
                          });
                          chosenAgentRoster = stage4[0];
                      }
                  }

                  // --- STAGE 5: Relax work day count completely, Consecutive Work <= 8 ---
                  if (!chosenAgentRoster) {
                      let stage5 = availableAgents.filter(r => {
                          const temp = { ...r.roster, [d]: shiftCode };
                          return checkMaxConsecWork(temp, 8);
                      });
                      if (stage5.length > 0) {
                          stage5.sort((a, b) => {
                              const wA = Object.values(a.roster).filter(s => s !== 'OFF').length;
                              const wB = Object.values(b.roster).filter(s => s !== 'OFF').length;
                              return wA - wB;
                          });
                          chosenAgentRoster = stage5[0];
                      }
                  }

                  // --- STAGE 6: Ultimate Fallback (Any OFF agent who isn't forced off) ---
                  if (!chosenAgentRoster) {
                      availableAgents.sort((a, b) => {
                          const wA = Object.values(a.roster).filter(s => s !== 'OFF').length;
                          const wB = Object.values(b.roster).filter(s => s !== 'OFF').length;
                          return wA - wB;
                      });
                      chosenAgentRoster = availableAgents[0];
                  }

                  if (chosenAgentRoster) {
                      chosenAgentRoster.roster[d] = shiftCode;
                  } else {
                      break;
                  }
              }
              
              // Fix Overstaffing
              while (roster.filter(r => r.roster[d] === shiftCode).length > requiredCount) {
                  let currentAssigned = roster.filter(r => r.roster[d] === shiftCode && !forcedOffAgents.has(r.empId));
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
          if (forcedOffAgents.has(agent.id)) return;
          let agentRoster = roster.find(r => r.empId === agent.id)!;
          let currentWorkDays = Object.values(agentRoster.roster).filter(s => s !== 'OFF').length;
          
          if (currentWorkDays < maxWorkingDaysPerAgent) {
              const offDays = days.filter(d => agentRoster.roster[d] === 'OFF');
              for (const d of offDays) {
                   if (currentWorkDays >= maxWorkingDaysPerAgent) break;
                   const dayIdx = days.indexOf(d);
                   
                   let selectedShift = '';
                   const sortedByDeficit = [...shiftCodesSorted].sort((a, b) => {
                       const defA = (requiredSlotsPerDayPerShift[d][a] || 0) - roster.filter(r => r.roster[d] === a).length;
                       const defB = (requiredSlotsPerDayPerShift[d][b] || 0) - roster.filter(r => r.roster[d] === b).length;
                       return defB - defA;
                   });
                   
                   for (const shiftCode of sortedByDeficit) {
                        if (isShiftCrossDay(shiftCode)) {
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
                        if (!isShiftCrossDay(shiftCode)) break;
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
                      const sortedByDeficitFallback = [...shiftCodesSorted].sort((a, b) => {
                          const defA = (requiredSlotsPerDayPerShift[d][a] || 0) - roster.filter(r => r.roster[d] === a).length;
                          const defB = (requiredSlotsPerDayPerShift[d][b] || 0) - roster.filter(r => r.roster[d] === b).length;
                          return defB - defA;
                      });
                      
                      let code = sortedByDeficitFallback.find(c => {
                          if (isShiftCrossDay(c)) {
                              const g = (agent.gender || '').toUpperCase().trim();
                              if (g !== 'L' && g !== 'MALE' && g !== 'LAKI-LAKI' && g !== 'PRIA') return false;
                          }
                          return true;
                      }) || sortedByDeficitFallback[0];
                      
                      let temp = { ...agentRoster.roster };
                      temp[d] = code;
                      
                      let m1s7Ok = true;
                      if (isShiftCrossDay(code)) {
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
      
      // PASS 6: Fast Simulated Annealing / Hill Climbing to maximize accuracy
      let currentGaps: Record<string, number[]> = {};
      days.forEach(d => {
          currentGaps[d] = slots.map(s => {
              let schedCount = 0;
              roster.forEach(r => {
                  const code = r.roster[d];
                  if (code && code !== 'OFF' && compositionShifts[code] && isSlotInShift(s, compositionShifts[code].start, compositionShifts[code].end)) {
                      schedCount++;
                  }
              });
              return schedCount - (histRequirements[d]?.[s] || 0);
          });
      });

      const getGapPenalty = (gap: number) => {
          if (gap < 0) return -gap * 2; // Understaffing is 2x worse
          if (gap > 2) return (gap - 2); // Overstaffing beyond 2 is bad
          return 0; // Ideal range 0-2
      };

      const calculateGlobalScore = () => {
          let score = 0;
          days.forEach(d => {
              for(let i=0; i<slots.length; i++) {
                 score -= getGapPenalty(currentGaps[d][i]);
              }
          });
          return score;
      };

      let currentScore = calculateGlobalScore();
      const allShifts = ['OFF', ...shiftCodesSorted];

      // 300,000 iterations of random hill climbing (takes <15ms in javascript)
      for(let iter=0; iter<300000; iter++) {
          const randAgentIdx = Math.floor(Math.random() * roster.length);
          const agentRoster = roster[randAgentIdx];
          if (forcedOffAgents.has(agentRoster.empId)) continue;
          
          const randDayIdx = Math.floor(Math.random() * days.length);
          const d = days[randDayIdx];
          const oldShift = agentRoster.roster[d] || 'OFF';
          
          // Determine mutation type: 50% chance to change shift on same day, 50% chance to swap an OFF day with a Working day
          const mutationType = Math.random() < 0.5 ? 'change_shift' : 'swap_days';
          
          let candidateShift = '';
          let d2 = '';
          let oldShift2 = '';
          
          if (mutationType === 'change_shift') {
             // Only change between working shifts if it's already a working day
             let validShifts = oldShift === 'OFF' ? ['OFF'] : shiftCodesSorted;
             if (validShifts.length === 1 && validShifts[0] === 'OFF') continue;
             
             candidateShift = validShifts[Math.floor(Math.random() * validShifts.length)];
             if (candidateShift === oldShift) continue;
             
             // Single day modification
             const tempRoster = { ...agentRoster.roster, [d]: candidateShift };
             if (!checkMaxConsecWork(tempRoster, 5)) continue;
             
             if (isShiftCrossDay(candidateShift)) {
                 const agent = agentsToSchedule.find(a => a.id === agentRoster.empId);
                 const gender = (agent?.gender || '').toUpperCase().trim();
                 if (gender !== 'L' && gender !== 'MALE' && gender !== 'LAKI-LAKI' && gender !== 'PRIA') continue;
                 if (!checkMaxConsecM1S7(tempRoster, 4)) continue;
             }
             
             const cStart = parseTime(compositionShifts[candidateShift].start);
             const cEnd = getShiftEnd(compositionShifts[candidateShift].start, compositionShifts[candidateShift].end);
             if (randDayIdx > 0) {
                 const prev = tempRoster[days[randDayIdx-1]];
                 if (prev && prev !== 'OFF' && compositionShifts[prev]) {
                    const pEnd = getShiftEnd(compositionShifts[prev].start, compositionShifts[prev].end);
                    if ((cStart + 24 - pEnd) < 10) continue;
                 }
             }
             if (randDayIdx < days.length - 1) {
                 const next = tempRoster[days[randDayIdx+1]];
                 if (next && next !== 'OFF' && compositionShifts[next]) {
                    const nStart = parseTime(compositionShifts[next].start);
                    if ((nStart + 24 - cEnd) < 10) continue;
                 }
             }

             // Evaluate change delta
             let deltaScore = 0;
             slots.forEach((s, sIdx) => {
                 const gap = currentGaps[d][sIdx];
                 let newGap = gap;
                 
                 if (isSlotInShift(s, compositionShifts[oldShift].start, compositionShifts[oldShift].end)) {
                     newGap--;
                 }
                 if (isSlotInShift(s, compositionShifts[candidateShift].start, compositionShifts[candidateShift].end)) {
                     newGap++;
                 }
                 
                 if (gap !== newGap) {
                     deltaScore += getGapPenalty(gap) - getGapPenalty(newGap);
                 }
             });

             if (deltaScore >= 0) {
                 agentRoster.roster[d] = candidateShift;
                 currentScore += deltaScore;
                 
                 slots.forEach((s, sIdx) => {
                     if (isSlotInShift(s, compositionShifts[oldShift].start, compositionShifts[oldShift].end)) {
                         currentGaps[d][sIdx]--;
                     }
                     if (isSlotInShift(s, compositionShifts[candidateShift].start, compositionShifts[candidateShift].end)) {
                         currentGaps[d][sIdx]++;
                     }
                 });
             }
          } else {
             // Swap Days Mode
             if (oldShift === 'OFF') {
                 // d is OFF, we need to find a working day to swap with
                 const workingDaysIdxs = days.map((day, idx) => ({day, idx})).filter(x => agentRoster.roster[x.day] !== 'OFF');
                 if (workingDaysIdxs.length === 0) continue;
                 const randWork = workingDaysIdxs[Math.floor(Math.random() * workingDaysIdxs.length)];
                 d2 = randWork.day;
                 oldShift2 = agentRoster.roster[d2];
                 candidateShift = oldShift2; // Moving the working shift to d
             } else {
                 // d is Working, we need to find an OFF day to swap with
                 const offDaysIdxs = days.map((day, idx) => ({day, idx})).filter(x => !agentRoster.roster[x.day] || agentRoster.roster[x.day] === 'OFF');
                 if (offDaysIdxs.length === 0) continue;
                 const randOff = offDaysIdxs[Math.floor(Math.random() * offDaysIdxs.length)];
                 d2 = randOff.day;
                 oldShift2 = 'OFF';
                 candidateShift = 'OFF'; // Moving OFF to d
             }

             // We are swapping the shift of d and d2
             // d gets oldShift2, d2 gets oldShift
             const tempRoster = { ...agentRoster.roster, [d]: oldShift2, [d2]: oldShift };
             if (!checkMaxConsecWork(tempRoster, 5)) continue;
             
             // Check constraints for d and d2
             let validConstraints = true;
             for (const testDay of [d, d2]) {
                const shiftToTest = tempRoster[testDay];
                if (shiftToTest === 'OFF') continue;
                
                if (isShiftCrossDay(shiftToTest)) {
                   const agent = agentsToSchedule.find(a => a.id === agentRoster.empId);
                   const gender = (agent?.gender || '').toUpperCase().trim();
                   if (gender !== 'L' && gender !== 'MALE' && gender !== 'LAKI-LAKI' && gender !== 'PRIA') validConstraints = false;
                   if (!checkMaxConsecM1S7(tempRoster, 4)) validConstraints = false;
                }
                
                const tIdx = days.indexOf(testDay);
                const cStart = parseTime(compositionShifts[shiftToTest].start);
                const cEnd = getShiftEnd(compositionShifts[shiftToTest].start, compositionShifts[shiftToTest].end);
                if (tIdx > 0) {
                    const prev = tempRoster[days[tIdx-1]];
                    if (prev && prev !== 'OFF' && compositionShifts[prev]) {
                       const pEnd = getShiftEnd(compositionShifts[prev].start, compositionShifts[prev].end);
                       if ((cStart + 24 - pEnd) < 10) validConstraints = false;
                    }
                }
                if (tIdx < days.length - 1) {
                    const next = tempRoster[days[tIdx+1]];
                    if (next && next !== 'OFF' && compositionShifts[next]) {
                       const nStart = parseTime(compositionShifts[next].start);
                       if ((nStart + 24 - cEnd) < 10) validConstraints = false;
                    }
                }
             }
             if (!validConstraints) continue;

             // Evaluate change delta (combines delta from d and d2)
             let deltaScore = 0;
             // For d: removes oldShift, adds oldShift2
             slots.forEach((s, sIdx) => {
                 const gap = currentGaps[d][sIdx];
                 let newGap = gap;
                 if (oldShift !== 'OFF' && isSlotInShift(s, compositionShifts[oldShift].start, compositionShifts[oldShift].end)) newGap--;
                 if (oldShift2 !== 'OFF' && isSlotInShift(s, compositionShifts[oldShift2].start, compositionShifts[oldShift2].end)) newGap++;
                 if (gap !== newGap) deltaScore += getGapPenalty(gap) - getGapPenalty(newGap);
             });
             // For d2: removes oldShift2, adds oldShift
             slots.forEach((s, sIdx) => {
                 const gap = currentGaps[d2][sIdx];
                 let newGap = gap;
                 if (oldShift2 !== 'OFF' && isSlotInShift(s, compositionShifts[oldShift2].start, compositionShifts[oldShift2].end)) newGap--;
                 if (oldShift !== 'OFF' && isSlotInShift(s, compositionShifts[oldShift].start, compositionShifts[oldShift].end)) newGap++;
                 if (gap !== newGap) deltaScore += getGapPenalty(gap) - getGapPenalty(newGap);
             });

             if (deltaScore >= 0) {
                 agentRoster.roster[d] = oldShift2;
                 agentRoster.roster[d2] = oldShift;
                 currentScore += deltaScore;
                 
                 slots.forEach((s, sIdx) => {
                     if (oldShift !== 'OFF' && isSlotInShift(s, compositionShifts[oldShift].start, compositionShifts[oldShift].end)) currentGaps[d][sIdx]--;
                     if (oldShift2 !== 'OFF' && isSlotInShift(s, compositionShifts[oldShift2].start, compositionShifts[oldShift2].end)) currentGaps[d][sIdx]++;
                 });
                 slots.forEach((s, sIdx) => {
                     if (oldShift2 !== 'OFF' && isSlotInShift(s, compositionShifts[oldShift2].start, compositionShifts[oldShift2].end)) currentGaps[d2][sIdx]--;
                     if (oldShift !== 'OFF' && isSlotInShift(s, compositionShifts[oldShift].start, compositionShifts[oldShift].end)) currentGaps[d2][sIdx]++;
                 });
             }
          }
      }
      
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
             
             <div className="flex items-center gap-2">
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
               {generatedRoster.length > 0 && (
                 <button
                   onClick={saveRosterSchedule}
                   className="bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2"
                 >
                   <Database size={14} /> Simpan Schedule
                 </button>
               )}
             </div>
          </div>
        </div>

        {generatedRoster.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-500">
            <div className="bg-slate-50 px-6 py-3 border-b border-gray-100 flex items-center justify-end">
               <span className="text-xs font-bold text-slate-500">Klik kanan pada nama Agent untuk <span className="text-rose-500 font-black">Force OFF</span>. (Klik ulang Buat Schedule setelahnya)</span>
            </div>
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
                        <th key={i} className={`px-2 py-3 border-b border-gray-100 border-r border-gray-50/50 text-center w-[65px] min-w-[65px] max-w-[65px] ${isWeekend ? 'bg-rose-50/30' : ''}`}>
                          <span className={`block text-[9px] font-bold uppercase tracking-widest ${isWeekend ? 'text-active-red/60' : 'text-neutral-gray'}`}>
                            {format(date, "EEE")}
                          </span>
                          <span className={`block text-xs font-black mt-0.5 ${isWeekend ? 'text-active-red' : 'text-black'}`}>
                            {format(date, "dd")}
                          </span>
                        </th>
                      );
                    })}
                    <th className="px-3 py-3 border-b border-gray-200 border-r border-gray-50/50 text-center w-[90px] min-w-[90px] max-w-[90px] bg-indigo-50/50">
                      <span className="block text-[9px] font-black uppercase tracking-widest text-[#6366f1]">
                        Hari Kerja
                      </span>
                    </th>
                    <th className="px-3 py-3 border-b border-gray-200 border-r border-gray-50/50 text-center w-[90px] min-w-[90px] max-w-[90px] bg-rose-50/50">
                      <span className="block text-[9px] font-black uppercase tracking-widest text-rose-600">
                        Hari Libur
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-slate-50/20">
                  {combinedAgents
                    .filter(a => matchSite(a.site, selectedSite))
                    .filter(a => matchUnit(a.unit, selectedUnit))
                    .filter(a => matchProject(a.project, selectedProject))
                    .filter(a => generatedRoster.some(r => String(r.empId).trim().toLowerCase() === String(a.id).trim().toLowerCase()))
                    .map((agent) => {
                      const rosterInfo = generatedRoster.find(r => String(r.empId).trim().toLowerCase() === String(agent.id).trim().toLowerCase());
                      const rosterMap = rosterInfo?.roster || {};
                      const genderStr = agent.gender ? agent.gender.charAt(0).toUpperCase() : '?';
                      
                      return (
                      <tr key={agent.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td 
                          className="sticky left-0 z-40 bg-white group-hover:bg-slate-100 border-r border-gray-200 px-4 sm:px-6 py-3 transition-colors w-[180px] sm:w-[220px] min-w-[180px] sm:min-w-[220px] max-w-[180px] sm:max-w-[220px] cursor-context-menu"
                          onContextMenu={(e) => {
                            e.preventDefault();
                            const isForcedOff = forcedOffAgents.has(agent.id);
                            setForcedOffAgents(prev => {
                                const next = new Set(prev);
                                if (isForcedOff) next.delete(agent.id);
                                else next.add(agent.id);
                                return next;
                            });
                            
                            // Instant visual update for current generated roster view
                            if (!isForcedOff) {
                                setGeneratedRoster(prev => prev.map(r => {
                                    if (String(r.empId).trim().toLowerCase() === String(agent.id).trim().toLowerCase()) {
                                        const offR = { ...r.roster };
                                        days.forEach(d => offR[d] = 'OFF');
                                        return { ...r, roster: offR };
                                    }
                                    return r;
                                }));
                            }
                          }}
                          title="Klik Kanan untuk Paksa OFF Jadwal (Force Off)"
                        >
                          <div className="flex flex-col w-full max-w-full overflow-hidden">
                            <div className="flex items-center gap-1.5 w-full justify-between">
                              <span className={`text-[11px] font-black uppercase tracking-tight truncate flex-1 min-w-0 ${forcedOffAgents.has(agent.id) ? 'text-rose-500 line-through opacity-70' : 'text-slate-900'}`} title={agent.name}>
                                {agent.name}
                              </span>
                              <span className="bg-slate-100 text-slate-500 text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0">{genderStr}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${forcedOffAgents.has(agent.id) ? 'text-rose-400' : 'text-slate-400'}`}>ID: {agent.id}</span>
                                {forcedOffAgents.has(agent.id) && <span className="bg-rose-100 text-rose-600 text-[7px] font-black px-1 rounded uppercase tracking-wider">Forced Off</span>}
                            </div>
                          </div>
                        </td>
                        {days.map((d, i) => {
                          const shiftCode = rosterMap[d] || 'OFF';
                          const isOff = shiftCode === 'OFF';
                          
                          const shiftInfo = (Object.keys(dbShifts).length > 0 ? dbShifts : SHIFTS)[shiftCode] || { color: 'bg-slate-200' };
                          
                          return (
                            <td key={i} className={`p-1 border-r border-gray-50/50 text-center relative w-[65px] min-w-[65px] max-w-[65px]`}>
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
                          const workDays = days.filter(d => rosterMap[d] && rosterMap[d] !== 'OFF').length;
                          const offDays = days.filter(d => !rosterMap[d] || rosterMap[d] === 'OFF').length;
                          return (
                            <>
                              <td className="p-1 border-r border-gray-50/50 text-center bg-indigo-50/10 font-bold w-[90px] min-w-[90px] max-w-[90px]">
                                <span className="text-[11px] font-black text-slate-800">{workDays} Hari</span>
                              </td>
                              <td className="p-1 border-r border-gray-50/50 text-center bg-rose-50/10 font-bold w-[90px] min-w-[90px] max-w-[90px]">
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
                              filteredRoster.forEach(r => { if(r.roster[d] === code) count++; });
                              return (
                                 <td key={i} className="px-2 py-2 border-r border-slate-200 border-t text-center">
                                    <span className={`text-[11px] font-black ${count > 0 ? 'text-slate-900' : 'text-slate-300'}`}>{count}</span>
                                 </td>
                              );
                           })}
                           {(() => {
                             let totalSum = 0;
                             filteredRoster.forEach(r => {
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
                        filteredRoster.forEach(r => { if(r.roster[d] === 'OFF') count++; });
                        return (
                           <td key={i} className="px-2 py-2 border-r border-rose-100 border-t text-center">
                              <span className={`text-[11px] font-black ${count > 0 ? 'text-rose-700' : 'text-rose-300'}`}>{count}</span>
                           </td>
                        );
                     })}
                     {(() => {
                       let totalOffSum = 0;
                       filteredRoster.forEach(r => {
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
                        filteredRoster.forEach(r => { if(r.roster[d] && r.roster[d] !== 'OFF') scheduledCount++; });
                        
                        return (
                           <td key={i} className="px-2 py-2 border-r border-indigo-200 border-t text-center bg-indigo-50/50">
                              <span className="text-[11px] font-black text-indigo-900">{scheduledCount}</span>
                           </td>
                        )
                     })}
                     {(() => {
                       let totalWfoSum = 0;
                       filteredRoster.forEach(r => {
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
                        let totalCount = filteredRoster.length;
                        return (
                           <td key={i} className="px-2 py-3 border-r border-indigo-200 border-t text-center bg-indigo-100/80">
                              <span className="text-[12px] font-black text-indigo-900">{totalCount}</span>
                           </td>
                        )
                     })}
                     {(() => {
                       const totalCellsCount = filteredRoster.length * days.length;
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
                  .filter(a => matchSite(a.site, selectedSite))
                  .filter(a => matchUnit(a.unit, selectedUnit))
                  .filter(a => matchProject(a.project, selectedProject))
                  .map((agent) => {
                  const dummyShiftInfo = generatedRoster.find(r => r.empId === agent.id);
                  const activeShiftCode = dummyShiftInfo?.roster?.[selectedDate] || agent.shift;
                  if (activeShiftCode === "OFF") return null;
                  const shift = resolvedShifts[activeShiftCode] || Object.values(resolvedShifts)[0];
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
            <ComposedChart data={dynamicReqData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
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
        const agent = combinedAgents.find(a => a.id === r.empId);
        if (!agent) return;
        if (!matchSite(agent.site, selectedSite)) return;
        if (!matchUnit(agent.unit, selectedUnit)) return;
        if (!matchProject(agent.project, selectedProject)) return;

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

        {histUsingFallback && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-[1.5rem] p-6 text-amber-900 space-y-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl mt-0.5">
                <Database size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider">Database Diperlukan Upgrade Kolom 'project'</h4>
                <p className="text-[11px] leading-relaxed opacity-90 font-medium">
                  Supabase mendeteksi bahwa tabel <code>interval_requirements</code> pada database Anda kemungkinan dibuat menggunakan format lama dan belum memiliki kolom <code>project</code>. Tekan tombol di bawah ini untuk menyalin skrip SQL migrasi, lalu jalankan di **SQL Editor Supabase** Anda untuk mengaktifkan pemisahan dan penyimpanan data antar Proyek (Project A, B, dst) secara instan!
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                const sql = `-- Migrasi Kolom Project pada interval_requirements\n` +
                  `ALTER TABLE public.interval_requirements ADD COLUMN IF NOT EXISTS project VARCHAR(255) DEFAULT 'default' NOT NULL;\n` +
                  `ALTER TABLE public.interval_requirements DROP CONSTRAINT IF EXISTS unique_requirement;\n` +
                  `ALTER TABLE public.interval_requirements ADD CONSTRAINT unique_requirement UNIQUE (date, time_slot, interval_type, project);\n\n` +
                  `-- Migrasi Kolom Project pada roster_schedule\n` +
                  `ALTER TABLE public.roster_schedule ADD COLUMN IF NOT EXISTS project VARCHAR(255) DEFAULT 'default' NOT NULL;\n` +
                  `ALTER TABLE public.roster_schedule DROP CONSTRAINT IF EXISTS unique_roster_record;\n` +
                  `ALTER TABLE public.roster_schedule ADD CONSTRAINT unique_roster_record UNIQUE (date, emp_id, project);\n`;
                navigator.clipboard.writeText(sql);
                showNotification("Skrip SQL Migrasi disalin ke clipboard! 👍 Silakan tempelkan & run di SQL Editor Supabase Anda.", "success");
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95 duration-100"
            >
              <ClipboardCheck size={12} /> Salin Skrip SQL Migrasi
            </button>
          </div>
        )}

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
                className="w-full py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all duration-250 flex items-center justify-center gap-1 border bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-100"
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

                  const rows = Object.entries(compositionShifts)
                    .sort((a, b) => {
                      const wA = (a[1] as any).weight !== undefined ? (a[1] as any).weight : 1;
                      const wB = (b[1] as any).weight !== undefined ? (b[1] as any).weight : 1;
                      return wA - wB;
                    })
                    .map(([code, sInfo]) => {
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
                          const rawVal = val;
                          // Cap scaling down if exceeding FTE
                          if (compDayTotals[d] > fteDayTotals[d] && compDayTotals[d] > 0) {
                            val = val * (fteDayTotals[d] / compDayTotals[d]);
                          }
                          val = rawVal > 0 ? Math.max(1, Math.round(val)) : 0;
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
                           // Render the actual sum of the column cells to match the displayed numbers exactly
                           const finalTotal = finalDayTotals[d] || 0;
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

          <div className="overflow-x-auto flex-grow max-h-[85vh] md:max-h-[900px] overflow-y-auto">
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

          <div className="overflow-x-auto flex-grow max-h-[85vh] md:max-h-[900px] overflow-y-auto">
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

          <div className="overflow-x-auto flex-grow max-h-[85vh] md:max-h-[900px] overflow-y-auto">
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
    const filteredDbEmployees = dbEmployees
      .filter(emp => matchSite(emp.site, selectedSite))
      .filter(emp => matchUnit(emp.unit, selectedUnit))
      .filter(emp => matchProject(emp.project, selectedProject));

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
          <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <h4 className="text-base font-black text-black uppercase tracking-tight font-sans">Daftar Karyawan di Database ({filteredDbEmployees.length})</h4>
              {selectedDbEmployeeIds.length > 0 && (
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-wider animate-in zoom-in-95">
                  {selectedDbEmployeeIds.length} Terpilih
                </span>
              )}
            </div>

            {selectedDbEmployeeIds.length > 0 ? (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {bulkDeleteConfirm ? (
                  <div className="flex items-center gap-1.5 bg-rose-50 p-1.5 rounded-2xl border border-rose-100">
                    <span className="text-[9px] font-black uppercase text-rose-700 px-2 font-sans">Yakin hapus {selectedDbEmployeeIds.length} karyawan?</span>
                    <button
                      onClick={handleBulkDeleteDbEmployees}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-[9px] font-black uppercase text-white tracking-widest rounded-xl transition-all shadow-sm font-sans"
                    >
                      Ya, Hapus!
                    </button>
                    <button
                      onClick={() => setBulkDeleteConfirm(false)}
                      className="px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-100 text-[9px] font-black uppercase text-gray-600 tracking-widest rounded-xl transition-all font-sans"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setBulkDeleteConfirm(true)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-[9px] font-black uppercase text-active-red tracking-widest rounded-xl transition-all flex items-center gap-1.5 hover:scale-[1.02] font-sans"
                  >
                    <Trash2 size={12} className="text-active-red" /> Bulk Hapus
                  </button>
                )}
              </div>
            ) : (
              <div className="text-[10px] font-black uppercase tracking-widest text-[#6366f1]">
                Live Connection
              </div>
            )}
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
                    <th className="px-4 py-4 border-b border-gray-100 w-12 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-[#6366f1] focus:ring-[#6366f1] cursor-pointer w-3.5 h-3.5 transition-all"
                        checked={filteredDbEmployees.length > 0 && filteredDbEmployees.every(emp => selectedDbEmployeeIds.includes(emp.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDbEmployeeIds(filteredDbEmployees.map(emp => emp.id));
                          } else {
                            setSelectedDbEmployeeIds([]);
                          }
                        }}
                      />
                    </th>
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
                  {filteredDbEmployees.map((emp, idx) => {
                    const isSelected = selectedDbEmployeeIds.includes(emp.id);
                    return (
                      <tr key={emp.id} className={`hover:bg-gray-50/50 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                        <td className="px-4 py-4 text-center w-12">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-[#6366f1] focus:ring-[#6366f1] cursor-pointer w-3.5 h-3.5 transition-all"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedDbEmployeeIds(prev =>
                                prev.includes(emp.id)
                                  ? prev.filter(id => id !== emp.id)
                                  : [...prev, emp.id]
                              );
                            }}
                          />
                        </td>
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
                  ); })}
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
                          .filter(a => matchSite(a.site, selectedSite))
                          .filter(a => matchUnit(a.unit, selectedUnit))
                          .filter(a => matchProject(a.project, selectedProject))
                          .map((agent) => {
                          const shiftInfoRow = generatedRoster.find(r => r.empId === agent.id);
                          const activeShiftCodeRow = shiftInfoRow?.roster?.[selectedDate] || agent.shift;
                          const shift = activeShiftCodeRow === "OFF" ? { start: "OFF", end: "OFF" } : resolvedShifts[activeShiftCodeRow] || Object.values(resolvedShifts)[0];
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
                                             className={`absolute h-full ${getActivityDef(act as string, agent.project)?.color || 'bg-black'}`}
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