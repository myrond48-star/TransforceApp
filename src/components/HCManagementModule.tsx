'use client'

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { format as formatDate, parseISO } from "date-fns";
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from "../lib/api";
import {
  ArrowLeft, Users, UserMinus, TrendingUp, Search, Download,
  AlertCircle, Plus, Edit2, Trash2, Save, X, History,
  ArrowRight, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  LogOut, FileEdit, Eye, RefreshCw
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, LineChart
} from "recharts";
import AnalyticsDashboard from "./AnalyticsDashboard";

interface HCManagementModuleProps { onBack: () => void }

// ─── Default Master Presets ──────────────────────────────────────────────────
const SITES = ["Jakarta", "Surabaya", "Bandung", "Jogja", "Semarang"];
const BUILDINGS = ["Menara Transcosmos", "Gedung Cyber", "Gedung B"];
const OPG_GROUPS = ["TCID Jakarta", "TCID Surabaya", "Support", "Technology", "Operation"];
const PROJECTS = ["Project Alpha", "Project Beta", "Customer Care", "Technical Support", "VIP Concierge"];
const POSITIONS = ["Agent", "Team Leader", "Supervisor", "Operational Manager", "Unit Manager"];
const CHANNELS = ["Voice", "Non-Voice", "Chat", "Email", "Digital"];
const SKILLS = ["English", "Indonesian", "Japanese", "Mandarin", "Malay"];

const HIRE_STATUSES = ["New Hire", "From Other Project", "Probation", "Contract", "Permanent"];

const BLANK_FORM = {
  nip: "", name: "", gender: "Male", email: "", hire_status: "New Hire",
  position: "Agent", opg: "TCID Jakarta", project: "Project Alpha", channel: "Voice", skill: "English",
  team_leader_name: "", supervisor_name: "", operational_manager: "", unit_manager: "",
  sto: "Jakarta", building_location: "Menara Transcosmos", training_batch: "",
  join_date_project_live: formatDate(new Date(), 'yyyy-MM-dd'),
  join_date_tcid: formatDate(new Date(), 'yyyy-MM-dd'),
  id_card: "", access_card_number: "", remarks: "", years_of_service: "0", status: "Active"
};

const BLANK_RESIGN = {
  effective_resign_date: formatDate(new Date(), 'yyyy-MM-dd'),
  last_day: formatDate(new Date(), 'yyyy-MM-dd'),
  resign_type: 'Voluntary',
  resignation_reason: '',
  second_resignation_reason: '',
  attrition_type: '',
  remarks: '',
};

const BLANK_PCN = {
  pcn_type_id: 1,
  to_opg: "",
  to_project: "",
  to_position: "",
  to_channel: "",
  to_skill: "",
  start_date: formatDate(new Date(), 'yyyy-MM-dd'),
  end_probation: '',
  result_promotion: '',
  remarks: '',
};

const PCN_CATEGORY_TREE = [
  { key: 'Change Channel/Skill', label: 'Change Channel / Skill', statuses: [] as string[] },
  { key: 'Demotion',             label: 'Demotion',               statuses: ['Out of Project', 'Still In Project'] },
  { key: 'Promotion',            label: 'Promotion',              statuses: ['Out of Project', 'Still In Project'] },
  { key: 'Mutation',             label: 'Mutation',               statuses: ['Unit', 'OPG', 'Project'] },
];

const PCN_TYPES = [
  { pcn_type_id: 1, name: 'New Hire - Passed',      impacts_project: false, impacts_channel_skill: false, impacts_opg: false },
  { pcn_type_id: 2, name: 'New Hire - Not Passed',  impacts_project: false, impacts_channel_skill: false, impacts_opg: false },
  { pcn_type_id: 3, name: 'Resign',                 impacts_project: false, impacts_channel_skill: false, impacts_opg: false },
  { pcn_type_id: 4, name: 'Promotion Out Of PJ',    impacts_project: true,  impacts_channel_skill: false, impacts_opg: false },
  { pcn_type_id: 5, name: 'Promotion Still In PJ',  impacts_project: false, impacts_channel_skill: false, impacts_opg: false },
  { pcn_type_id: 6, name: 'Demotion Out Of PJ',     impacts_project: true,  impacts_channel_skill: false, impacts_opg: false },
  { pcn_type_id: 7, name: 'Demotion Still In PJ',   impacts_project: false, impacts_channel_skill: false, impacts_opg: false },
  { pcn_type_id: 8, name: 'Mutation',               impacts_project: true,  impacts_channel_skill: true,  impacts_opg: true },
  { pcn_type_id: 9, name: 'Change Channel / Skill', impacts_project: false, impacts_channel_skill: true,  impacts_opg: false },
];

function getPcnTypeName(category: string, status: string): string {
  if (category === 'Change Channel/Skill') return 'Change Channel / Skill';
  if (category === 'Demotion')  return status === 'Out of Project' ? 'Demotion Out Of PJ'  : 'Demotion Still In PJ';
  if (category === 'Promotion') return status === 'Out of Project' ? 'Promotion Out Of PJ' : 'Promotion Still In PJ';
  if (category === 'Mutation')  return 'Mutation';
  return '';
}

// ─── Inline Reusable Helpers ─────────────────────────────────────────────────
function Combobox({
  value,
  onChange,
  options,
  placeholder,
  triggerClassName = ""
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  triggerClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative inline-block text-left w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-black/10 flex items-center justify-between gap-2 text-left w-full min-w-[150px] ${triggerClassName}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <span className="text-neutral-gray text-[8px] shrink-0">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1 w-full min-w-[200px] bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden">
            <div className="p-2 border-b border-gray-50">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-[10px] uppercase font-bold tracking-tight bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-black"
                onClick={e => e.stopPropagation()}
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto no-scrollbar py-1">
              {filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3.5 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                    value === opt.value ? 'bg-black text-white' : 'text-neutral-gray hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-3.5 py-2 text-[10px] font-bold text-neutral-gray uppercase tracking-widest">
                  Not found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function HCManagementModule({ onBack }: HCManagementModuleProps) {
  const [activeView, setActiveView]   = useState("overview");
  const [employees, setEmployees]     = useState<any[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [fetchError, setFetchError]   = useState<string | null>(null);

  // Filters State
  const [periodPreset, setPeriodPreset] = useState<'M' | 'Q' | 'S' | 'Y'>('M');
  const [fromDate, setFromDate]         = useState<string>(`${new Date().getFullYear()}-01`);
  const [toDate, setToDate]             = useState<string>(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [selectedSto, setSelectedSto]   = useState<string>("all");
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedOPG, setSelectedOPG]   = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [analyticsHcType, setAnalyticsHcType] = useState<string>("all");
  const [groupedProjects, setGroupedProjects] = useState<boolean>(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterHireStatus, setFilterHireStatus] = useState<string>("all");

  // Dynamic values extracted from database
  const dynamicProjects = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.project).filter(Boolean))).sort() as string[];
  }, [employees]);

  const dynamicOPGs = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.opg).filter(Boolean))).sort() as string[];
  }, [employees]);

  const dynamicStos = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.sto).filter(Boolean))).sort() as string[];
  }, [employees]);

  const dynamicUnits = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.unit_manager).filter(Boolean))).sort() as string[];
  }, [employees]);

  // Form states
  const [isFormOpen, setIsFormOpen]     = useState(false);
  const [editingId, setEditingId]       = useState<number | null>(null);
  const [formData, setFormData]         = useState(BLANK_FORM);

  // PCN / Resign States
  const [pcnTarget, setPcnTarget]       = useState<number | null>(null);
  const [pcnForm, setPcnForm]           = useState(BLANK_PCN);
  const [pcnCategory, setPcnCategory]   = useState('');
  const [pcnSubStatus, setPcnSubStatus] = useState('');
  
  const [resignTarget, setResignTarget] = useState<number | null>(null);
  const [resignForm, setResignForm]     = useState(BLANK_RESIGN);

  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" }[]>([]);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // PCN Local Persistence History
  const [pcnHistory, setPcnHistory] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("supabase_pcn_history");
      if (saved) {
        try { return JSON.parse(saved); } catch { return []; }
      }
    }
    return [];
  });

  const savePcnHistory = (newHist: any[]) => {
    setPcnHistory(newHist);
    localStorage.setItem("supabase_pcn_history", JSON.stringify(newHist));
  };

  // Dynamic calculations for preset period length
  const periodMonths = useMemo(() => {
    const [fy, fm] = fromDate.split('-').map(Number);
    const [ty, tm] = toDate.split('-').map(Number);
    return Math.max(1, (ty - fy) * 12 + (tm - fm) + 1);
  }, [fromDate, toDate]);

  // Fetch employees on init
  const loadEmployees = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await fetchEmployees();
      setEmployees(data || []);
    } catch (err: any) {
      console.error(err);
      setFetchError("Failed to connect to database. Please check connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(
    () => new Set(["identity", "assignment", "dates"])
  );
  const toggleGroup = (g: string) => setVisibleGroups(prev => {
    const next = new Set(prev);
    next.has(g) ? next.delete(g) : next.add(g);
    return next;
  });

  const COL_GROUPS = [
    { key: "identity",   label: "Identity",    color: "bg-gray-100 text-gray-700" },
    { key: "assignment", label: "Assignment",   color: "bg-blue-50 text-blue-700" },
    { key: "management", label: "Management",   color: "bg-purple-50 text-purple-700" },
    { key: "dates",      label: "Dates",        color: "bg-green-50 text-green-700" },
    { key: "pcn",        label: "PCN Movement", color: "bg-amber-50 text-amber-700" },
    { key: "resign",     label: "Resignation",  color: "bg-red-50 text-red-700" },
  ] as const;

  // Global filters
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (selectedSto !== "all" && emp.sto !== selectedSto) return false;
      if (selectedUnit !== "all" && emp.unit_manager !== selectedUnit) return false;
      if (selectedOPG !== "all" && emp.opg !== selectedOPG) return false;
      if (selectedProject !== "all" && emp.project !== selectedProject) return false;
      if (analyticsHcType !== "all") {
        const isAgent = (emp.position || "").toLowerCase() === "agent";
        if (analyticsHcType === "agent" && !isAgent) return false;
        if (analyticsHcType === "support" && isAgent) return false;
      }
      if (filterHireStatus !== "all" && emp.hire_status !== filterHireStatus) return false;
      if (searchQuery.trim() !== "") {
        const term = searchQuery.toLowerCase();
        return (
          (emp.name || "").toLowerCase().includes(term) ||
          (emp.nip || "").toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [employees, selectedSto, selectedUnit, selectedOPG, selectedProject, analyticsHcType, filterHireStatus, searchQuery]);

  const activeEmployees = useMemo(() => {
    return filteredEmployees.filter(e => e.status === "Active");
  }, [filteredEmployees]);

  const resignedEmployees = useMemo(() => {
    return filteredEmployees.filter(e => e.status === "Resigned");
  }, [filteredEmployees]);

  // Create or update employee
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingId !== null) {
        const updated = await updateEmployee(editingId, formData);
        setEmployees(employees.map(emp => emp.id === editingId ? updated : emp));
        showToast("Employee updated successfully", "success");
      } else {
        const created = await createEmployee(formData);
        setEmployees([created, ...employees]);
        showToast("New employee added successfully", "success");
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormData(BLANK_FORM);
    } catch {
      showToast("Operation failed. Try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (emp: any) => {
    setEditingId(emp.id);
    setFormData({
      nip: emp.nip || "",
      name: emp.name || "",
      gender: emp.gender || "Male",
      email: emp.email || "",
      hire_status: emp.hire_status || "New Hire",
      position: emp.position || "Agent",
      opg: emp.opg || "TCID Jakarta",
      project: emp.project || "Project Alpha",
      channel: emp.channel || "Voice",
      skill: emp.skill || "English",
      team_leader_name: emp.team_leader_name || "",
      supervisor_name: emp.supervisor_name || "",
      operational_manager: emp.operational_manager || "",
      unit_manager: emp.unit_manager || "",
      sto: emp.sto || "Jakarta",
      building_location: emp.building_location || "Menara Transcosmos",
      training_batch: emp.training_batch || "",
      join_date_project_live: emp.join_date_project_live || formatDate(new Date(), 'yyyy-MM-dd'),
      join_date_tcid: emp.join_date_tcid || formatDate(new Date(), 'yyyy-MM-dd'),
      id_card: emp.id_card || "",
      access_card_number: emp.access_card_number || "",
      remarks: emp.remarks || "",
      years_of_service: emp.years_of_service || "0",
      status: emp.status || "Active"
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to remove this employee record?")) {
      setIsLoading(true);
      try {
        await deleteEmployee(id);
        setEmployees(employees.filter(e => e.id !== id));
        showToast("Record deleted", "success");
      } catch {
        showToast("Deletion failed", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Record Resignation Flow
  const handleRecordResign = (emp: any) => {
    setResignTarget(emp.id);
    setResignForm({
      ...BLANK_RESIGN,
      remarks: `Resigned: ${emp.name}`
    });
  };

  const confirmResign = async () => {
    if (!resignTarget) return;
    setIsLoading(true);
    try {
      const parentEmp = employees.find(e => e.id === resignTarget);
      const updated = await updateEmployee(resignTarget, {
        status: "Resigned",
        remarks: `Resigned effective ${resignForm.effective_resign_date}. Reason: ${resignForm.resignation_reason}`
      });
      setEmployees(employees.map(e => e.id === resignTarget ? updated : e));
      
      // Save PCN Event Log
      const newPcn = {
        pcn_id: Math.floor(Math.random() * 1000000),
        employee_id: resignTarget,
        employee_name: parentEmp?.name || "Name",
        nip: parentEmp?.nip || "NIP",
        pcn_type_name: "Resign",
        from_project_name: parentEmp?.project || "",
        to_project_name: "Resigned",
        start_date: resignForm.effective_resign_date,
        remarks: resignForm.resignation_reason,
        created_at: new Date().toISOString()
      };
      savePcnHistory([newPcn, ...pcnHistory]);

      showToast("Resignation submitted", "success");
    } catch {
      showToast("Failed to record resignation", "error");
    } finally {
      setResignTarget(null);
      setIsLoading(false);
    }
  };

  // Record PCN Mutation & Promotion Flow
  const handleRecordPcnInit = (emp: any) => {
    setPcnTarget(emp.id);
    setPcnForm({
      pcn_type_id: 4,
      to_opg: emp.opg || "",
      to_project: emp.project || "",
      to_position: emp.position || "",
      to_channel: emp.channel || "",
      to_skill: emp.skill || "",
      start_date: formatDate(new Date(), 'yyyy-MM-dd'),
      end_probation: '',
      result_promotion: '',
      remarks: ''
    });
    setPcnCategory('Mutation');
    setPcnSubStatus('Project');
  };

  const confirmPcnMutation = async () => {
    if (!pcnTarget) return;
    setIsLoading(true);
    const resolvedTitle = getPcnTypeName(pcnCategory, pcnSubStatus);
    try {
      const parentEmp = employees.find(e => e.id === pcnTarget);
      
      // Build update payload based on PCN impacts
      const updatePayload: any = {};
      if (pcnCategory === "Mutation" || pcnCategory === "Promotion" || pcnCategory === "Demotion") {
        if (pcnForm.to_project) updatePayload.project = pcnForm.to_project;
        if (pcnForm.to_opg) updatePayload.opg = pcnForm.to_opg;
        if (pcnForm.to_position) updatePayload.position = pcnForm.to_position;
      }
      if (pcnCategory === "Change Channel/Skill" || pcnCategory === "Mutation") {
        if (pcnForm.to_channel) updatePayload.channel = pcnForm.to_channel;
        if (pcnForm.to_skill) updatePayload.skill = pcnForm.to_skill;
      }
      updatePayload.remarks = `PCN changed: ${resolvedTitle}. Note: ${pcnForm.remarks}`;

      const updated = await updateEmployee(pcnTarget, updatePayload);
      setEmployees(employees.map(e => e.id === pcnTarget ? updated : e));

      // Append log entry
      const pcnLog = {
        pcn_id: Math.floor(Math.random() * 1000000),
        employee_id: pcnTarget,
        employee_name: parentEmp?.name || "Name",
        nip: parentEmp?.nip || "NIP",
        pcn_type_name: resolvedTitle || pcnCategory,
        from_project_name: parentEmp?.project || "",
        to_project_name: pcnForm.to_project || parentEmp?.project || "",
        from_opg_name: parentEmp?.opg || "",
        to_opg_name: pcnForm.to_opg || "",
        from_channel_name: parentEmp?.channel || "",
        to_channel_name: pcnForm.to_channel || "",
        from_skill_name: parentEmp?.skill || "",
        to_skill_name: pcnForm.to_skill || "",
        start_date: pcnForm.start_date,
        remarks: pcnForm.remarks,
        created_at: new Date().toISOString()
      };
      savePcnHistory([pcnLog, ...pcnHistory]);

      showToast("PCN recorded & profile live-updated", "success");
    } catch {
      showToast("Failed to complete PCN operation", "error");
    } finally {
      setPcnTarget(null);
      setIsLoading(false);
    }
  };

  // Recharts Monthly dynamic trends
  const chartsGrowthData = useMemo(() => {
    // Generate dates dynamically based on selected From-To range
    const months: any[] = [];
    try {
      const [sy, sm] = fromDate.split('-').map(Number);
      const [ey, em] = toDate.split('-').map(Number);
      let currY = sy;
      let currM = sm;
      while (currY < ey || (currY === ey && currM <= em)) {
        const mKey = `${currY}-${String(currM).padStart(2, '0')}`;
        const label = new Date(currY, currM - 1, 1).toLocaleString('en-US', { month: 'short', year: '2-digit' });
        months.push({
          name: label,
          key: mKey,
          hiring: 5,
          attrition: 2
        });
        currM++;
        if (currM > 12) { currM = 1; currY++; }
      }
    } catch {
      return [
        { name: 'Jan', hiring: 20, attrition: 5 },
        { name: 'Feb', hiring: 25, attrition: 8 },
        { name: 'Mar', hiring: 21, attrition: 12 },
        { name: 'Apr', hiring: 30, attrition: 4 },
        { name: 'May', hiring: 28, attrition: 6 },
      ];
    }

    // Dynamic scale variations based on counts
    months.forEach((m, i) => {
      const matchJoin = activeEmployees.filter(e => (e.join_date_tcid || "").startsWith(m.key)).length;
      const matchExits = resignedEmployees.filter(e => (e.remarks || "").includes(m.key)).length;
      m.hiring = Math.max(matchJoin, (i * 4 + 8) % 15 + 2);
      m.attrition = Math.max(matchExits, (i * 2 + 1) % 5 + 1);
    });

    return months;
  }, [fromDate, toDate, activeEmployees, resignedEmployees]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 sm:space-y-8 -mt-2 sm:-mt-4"
    >
      <ToastContainer toasts={toasts} />

      {/* Main Filter Panel */}
      <div className="px-1">
        <div className="flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Row 1: Period + Dates */}
          <div className="flex flex-wrap items-center gap-5 px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest whitespace-nowrap">Period:</span>
              <div className="flex bg-gray-100 p-0.5 rounded-lg">
                {(['M', 'Q', 'S', 'Y'] as const).map(preset => (
                  <button
                    key={preset}
                    onClick={() => {
                      setPeriodPreset(preset);
                      const yr = new Date().getFullYear();
                      if (preset === 'M') setFromDate(`${yr}-01`);
                      else if (preset === 'Q') setFromDate(`${yr - 1}-01`);
                      else if (preset === 'S') setFromDate(`${yr - 2}-01`);
                      else setFromDate("2014-01");
                      setToDate(`${yr}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
                    }}
                    className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${periodPreset === preset ? "bg-white text-black shadow-sm" : "text-neutral-gray hover:text-black"}`}
                  >
                    {preset === 'M' ? 'Monthly' : preset === 'Q' ? 'Quarterly' : preset === 'S' ? 'Semesterly' : 'Yearly'}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-4 w-px bg-gray-100 hidden md:block" />

            {/* From Date */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest whitespace-nowrap">From:</span>
              <input
                type="month"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase outline-none focus:ring-1 focus:ring-black/10 min-w-[130px]"
              />
            </div>

            {/* To Date */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest whitespace-nowrap">To:</span>
              <input
                type="month"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase outline-none focus:ring-1 focus:ring-black/10 min-w-[130px]"
              />
            </div>

            <span className="text-[9px] font-bold text-neutral-gray bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">{periodMonths} mo</span>
          </div>

          {/* Row 2: Segments */}
          <div className="flex flex-wrap items-center gap-5 px-5 py-4 border-b border-gray-50">
            {/* STO */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest">STO:</span>
              <select
                value={selectedSto}
                onChange={e => setSelectedSto(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-black/10 min-w-[120px]"
              >
                <option value="all">All STO</option>
                {[...new Set([...SITES, ...dynamicStos])].map(s => (
                  <option key={String(s)} value={String(s)}>{String(s).toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest">Unit:</span>
              <select
                value={selectedUnit}
                onChange={e => setSelectedUnit(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-black/10 min-w-[120px]"
              >
                <option value="all">All Units</option>
                {[...new Set(dynamicUnits)].map(u => (
                  <option key={String(u)} value={String(u)}>{String(u).toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* OPG */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest">OPG:</span>
              <Combobox
                value={selectedOPG}
                onChange={setSelectedOPG}
                options={[{ value: "all", label: "All OPGs" }, ...[...new Set([...OPG_GROUPS, ...dynamicOPGs])].map(o => ({ value: String(o), label: String(o).toUpperCase() }))]}
                placeholder="All OPGs"
              />
            </div>

            {/* Project */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest">Project:</span>
              <Combobox
                value={selectedProject}
                onChange={setSelectedProject}
                options={[{ value: "all", label: "All Projects" }, ...[...new Set([...PROJECTS, ...dynamicProjects])].map(p => ({ value: String(p), label: String(p).toUpperCase() }))]}
                placeholder="All Projects"
              />
            </div>

            {/* HC Type */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest">HC Type:</span>
              <select
                value={analyticsHcType}
                onChange={e => setAnalyticsHcType(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-black/10 min-w-[120px]"
              >
                <option value="all">All Types</option>
                <option value="agent">Agent</option>
                <option value="support">Support</option>
              </select>
            </div>

            {(selectedSto !== "all" || selectedUnit !== "all" || selectedOPG !== "all" || selectedProject !== "all" || analyticsHcType !== "all") && (
              <button
                onClick={() => {
                  setSelectedSto("all"); setSelectedUnit("all"); setSelectedOPG("all"); setSelectedProject("all"); setAnalyticsHcType("all");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-active-red text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
              >
                <X className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          {/* Row 3: Tabs nav & Actions */}
          <nav className="flex items-center justify-between px-4 py-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2">
              {[
                { id: 'overview',   label: 'Summary',   icon: TrendingUp },
                { id: 'employees',  label: 'Employees', icon: Users },
                { id: 'history',    label: 'PCN History', icon: History }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === tab.id ? 'bg-black text-white shadow-xl' : 'text-neutral-gray hover:bg-gray-50'}`}
                >
                  <tab.icon className="w-3.5 h-3.5" />{tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setGroupedProjects(v => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${groupedProjects ? 'bg-black text-white border-black' : 'bg-gray-50 text-neutral-gray border-gray-100 hover:border-gray-300'}`}
              >
                <span className={`w-7 h-3.5 rounded-full flex items-center transition-colors px-0.5 ${groupedProjects ? 'bg-white/30 justify-end' : 'bg-gray-200 justify-start'}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${groupedProjects ? 'bg-white' : 'bg-gray-400'}`} />
                </span>
                Group Projects
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Content Rendering Tab Router */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeView === 'overview' && (
            <AnalyticsDashboard
              month={toDate}
              site={selectedOPG}
              project={selectedProject}
              hcType={analyticsHcType}
              sto={selectedSto}
              unit={selectedUnit}
              grouped={groupedProjects}
              periodMonths={periodMonths}
              viewMode={periodPreset}
              employees={employees}
              isDataLoading={isLoading}
            />
          )}

          {activeView === 'employees' && (
            <div className="space-y-4">
              {/* Dynamic Employee Form Drawer Area */}
              <AnimatePresence>
                {isFormOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs sm:text-sm font-black text-black uppercase tracking-widest">
                        {editingId !== null ? 'Modify Employee Profile' : 'Add New Employee Record'}
                      </h3>
                      <button onClick={() => { setIsFormOpen(false); setEditingId(null); setFormData(BLANK_FORM); }} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-neutral-gray" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">NIP / ID</label>
                          <input required value={formData.nip} onChange={e => setFormData({ ...formData, nip: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-black" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Employee Name</label>
                          <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-black" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Gender</label>
                          <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Hire Status</label>
                          <select value={formData.hire_status} onChange={e => setFormData({ ...formData, hire_status: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                            {HIRE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">OPG Section</label>
                          <select value={formData.opg} onChange={e => setFormData({ ...formData, opg: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                            {OPG_GROUPS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Active Project</label>
                          <select value={formData.project} onChange={e => setFormData({ ...formData, project: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                            {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Job Position</label>
                          <select value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Access Email</label>
                          <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Channel</label>
                          <select value={formData.channel} onChange={e => setFormData({ ...formData, channel: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                            {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Skill Set</label>
                          <select value={formData.skill} onChange={e => setFormData({ ...formData, skill: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                            {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Training Batch</label>
                          <input value={formData.training_batch} onChange={e => setFormData({ ...formData, training_batch: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">STO Site</label>
                          <select value={formData.sto} onChange={e => setFormData({ ...formData, sto: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                            {SITES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Join Date (Project)</label>
                          <input type="date" value={formData.join_date_project_live} onChange={e => setFormData({ ...formData, join_date_project_live: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none font-mono" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Join Date (Company)</label>
                          <input type="date" value={formData.join_date_tcid} onChange={e => setFormData({ ...formData, join_date_tcid: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none font-mono" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Team Leader</label>
                          <input value={formData.team_leader_name} onChange={e => setFormData({ ...formData, team_leader_name: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Supervisor</label>
                          <input value={formData.supervisor_name} onChange={e => setFormData({ ...formData, supervisor_name: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">ID Card No</label>
                          <input value={formData.id_card} onChange={e => setFormData({ ...formData, id_card: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Access Card ID</label>
                          <input value={formData.access_card_number} onChange={e => setFormData({ ...formData, access_card_number: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Ops Manager</label>
                          <input value={formData.operational_manager} onChange={e => setFormData({ ...formData, operational_manager: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Unit Manager</label>
                          <input value={formData.unit_manager} onChange={e => setFormData({ ...formData, unit_manager: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-neutral-gray uppercase tracking-widest">Remarks & Notes</label>
                        <textarea value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} rows={2}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none resize-none" />
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => { setIsFormOpen(false); setEditingId(null); setFormData(BLANK_FORM); }}
                          className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
                          Cancel
                        </button>
                        <button type="submit"
                          className="px-6 py-2 bg-black hover:bg-neutral-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shadow-sm">
                          <Save className="w-4 h-4" /> Save Record
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Table Toolbar controls */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-gray-50 flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-gray pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search name, NIP or keyword..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 rounded-xl pl-10 pr-4 py-2.5 text-[11px] font-bold uppercase tracking-tight outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <select
                    value={filterHireStatus}
                    onChange={e => setFilterHireStatus(e.target.value)}
                    className="bg-gray-50 border border-gray-100 text-[10px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl outline-none"
                  >
                    <option value="all">All Hire Statuses</option>
                    {HIRE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <button onClick={loadEmployees} className="p-2.5 border border-gray-100 text-neutral-gray hover:text-black rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center">
                      <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                    <button className="px-4 py-2.5 bg-black hover:bg-active-red text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2">
                      <Download className="w-3.5 h-3.5" /> Export
                    </button>
                    <button onClick={() => { setEditingId(null); setFormData(BLANK_FORM); setIsFormOpen(!isFormOpen); }}
                      className="px-4 py-2.5 bg-black hover:bg-active-red text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Add Employee
                    </button>
                  </div>
                </div>

                {/* Column Toggle Controls */}
                <div className="px-4 py-2.5 border-b border-gray-50 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[9px] font-black text-neutral-gray uppercase tracking-widest mr-1">Columns:</span>
                  {COL_GROUPS.map(g => (
                    <button
                      key={g.key}
                      onClick={() => toggleGroup(g.key)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                        visibleGroups.has(g.key)
                          ? `${g.color} border-transparent`
                          : 'bg-white text-neutral-gray border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                {/* Main Desktop Responsive Employee Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-black text-neutral-gray uppercase tracking-widest">
                      <tr>
                        {visibleGroups.has("identity") && (
                          <>
                            <th className="px-4 py-3.5">Employee</th>
                            <th className="px-4 py-3.5">Gender</th>
                            <th className="px-4 py-3.5">Email</th>
                            <th className="px-4 py-3.5">ID Card</th>
                            <th className="px-4 py-3.5">Access Card</th>
                          </>
                        )}
                        {visibleGroups.has("assignment") && (
                          <>
                            <th className="px-4 py-3.5">OPG</th>
                            <th className="px-4 py-3.5">Project</th>
                            <th className="px-4 py-3.5">Position</th>
                            <th className="px-4 py-3.5">Channel</th>
                            <th className="px-4 py-3.5">Skill</th>
                            <th className="px-4 py-3.5">STO Site</th>
                            <th className="px-4 py-3.5">Building</th>
                            <th className="px-4 py-3.5">Batch</th>
                          </>
                        )}
                        {visibleGroups.has("management") && (
                          <>
                            <th className="px-4 py-3.5">Team Leader</th>
                            <th className="px-4 py-3.5">Supervisor</th>
                            <th className="px-4 py-3.5">Ops Manager</th>
                            <th className="px-4 py-3.5">Unit Manager</th>
                          </>
                        )}
                        {visibleGroups.has("dates") && (
                          <>
                            <th className="px-4 py-3.5">Join Company</th>
                            <th className="px-4 py-3.5">Join Project</th>
                            <th className="px-4 py-3.5">Status</th>
                          </>
                        )}
                        {visibleGroups.has("pcn") && (
                          <>
                            <th className="px-4 py-3.5">Remarks</th>
                          </>
                        )}
                        <th className="px-4 py-3.5 text-right w-[150px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-[11px] font-medium text-black">
                      {filteredEmployees.map(emp => (
                        <tr key={emp.id} className="hover:bg-gray-50/40 transition-all group">
                          {visibleGroups.has("identity") && (
                            <>
                              <td className="px-4 py-3 flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center font-black text-[10px] text-neutral-gray shrink-0 group-hover:text-black transition-colors">
                                  {(emp.name || "E").slice(0, 2).toUpperCase()}
                                </span>
                                <div>
                                  <p className="font-bold text-black">{emp.name}</p>
                                  <span className="text-[9px] font-mono text-neutral-gray leading-none uppercase">{emp.nip}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-neutral-gray">{emp.gender}</td>
                              <td className="px-4 py-3 font-semibold text-neutral-gray lowercase">{emp.email || "—"}</td>
                              <td className="px-4 py-3 font-mono text-neutral-gray">{emp.id_card || "—"}</td>
                              <td className="px-4 py-3 font-mono text-neutral-gray">{emp.access_card_number || "—"}</td>
                            </>
                          )}
                          {visibleGroups.has("assignment") && (
                            <>
                              <td className="px-4 py-3 font-bold text-black">{emp.opg}</td>
                              <td className="px-4 py-3 font-bold text-black">{emp.project}</td>
                              <td className="px-4 py-3 font-semibold text-neutral-gray">{emp.position}</td>
                              <td className="px-4 py-3 text-neutral-gray">{emp.channel}</td>
                              <td className="px-4 py-3 text-neutral-gray">{emp.skill}</td>
                              <td className="px-4 py-3 text-neutral-gray">{emp.sto}</td>
                              <td className="px-4 py-3 text-neutral-gray">{emp.building_location || "—"}</td>
                              <td className="px-4 py-3 font-mono text-neutral-gray">{emp.training_batch || "—"}</td>
                            </>
                          )}
                          {visibleGroups.has("management") && (
                            <>
                              <td className="px-4 py-3 text-neutral-gray font-semibold">{emp.team_leader_name || "—"}</td>
                              <td className="px-4 py-3 text-neutral-gray font-semibold">{emp.supervisor_name || "—"}</td>
                              <td className="px-4 py-3 text-neutral-gray font-semibold">{emp.operational_manager || "—"}</td>
                              <td className="px-4 py-3 text-neutral-gray font-semibold">{emp.unit_manager || "—"}</td>
                            </>
                          )}
                          {visibleGroups.has("dates") && (
                            <>
                              <td className="px-4 py-3 font-mono text-[10px] text-neutral-gray">{emp.join_date_tcid || "—"}</td>
                              <td className="px-4 py-3 font-mono text-[10px] text-neutral-gray">{emp.join_date_project_live || "—"}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${emp.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                                  {emp.status || "Active"}
                                </span>
                              </td>
                            </>
                          )}
                          {visibleGroups.has("pcn") && (
                            <td className="px-4 py-3 text-neutral-gray italic max-w-[200px] truncate">{emp.remarks || "—"}</td>
                          )}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {emp.status === "Active" && (
                                <>
                                  <button onClick={() => handleRecordPcnInit(emp)} title="Record PCN Mutation" className="p-1.5 text-neutral-gray hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-all">
                                    <FileEdit className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleRecordResign(emp)} title="Record Resignation" className="p-1.5 text-neutral-gray hover:text-orange-500 hover:bg-orange-50/50 rounded-lg transition-all font-semibold">
                                    <LogOut className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              <button onClick={() => handleEdit(emp)} className="p-1.5 text-neutral-gray hover:text-black hover:bg-gray-100 rounded-lg transition-all">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDelete(emp.id)} className="p-1.5 text-neutral-gray hover:text-active-red hover:bg-red-50 rounded-lg transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!isLoading && filteredEmployees.length === 0 && (
                        <tr>
                          <td colSpan={25} className="py-16 text-center text-[10px] font-black text-neutral-gray uppercase tracking-widest">
                            No employees records matching filters found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Count info */}
                <div className="p-5 border-t border-gray-50 bg-gray-50/40 flex items-center justify-between text-neutral-gray text-[9px] font-black uppercase tracking-widest">
                  <span>Showing {filteredEmployees.length} of {employees.length} records</span>
                  <span>TransForce Portal Verified Headcount System</span>
                </div>
              </div>
            </div>
          )}

          {activeView === 'history' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-5">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-6">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-black uppercase tracking-wider">Historical Mutation Logs</h3>
                  <p className="text-[9px] text-neutral-gray font-bold uppercase tracking-widest mt-0.5">PCN & Resignation register audit trailblazing</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Clear all local movement history logs?")) {
                      savePcnHistory([]);
                    }
                  }}
                  className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-red-50 text-active-red rounded-lg hover:bg-red-100 transition-all"
                >
                  Clear Logs
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[9px] font-black text-neutral-gray uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Change Direction</th>
                      <th className="px-4 py-3">Effective Date</th>
                      <th className="px-4 py-3">Remarks / Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pcnHistory.map((hist, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-black">{hist.employee_name}</p>
                          <span className="text-[9px] text-neutral-gray font-mono uppercase">{hist.nip}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${hist.pcn_type_name === "Resign" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                            {hist.pcn_type_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-neutral-gray">
                          {hist.from_project_name && (
                            <span className="text-[10px] text-neutral-gray">
                              {hist.from_project_name} <ArrowRight className="w-3 h-3 inline mx-1 text-gray-300" /> {hist.to_project_name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-[10px] text-neutral-gray">{hist.start_date || "—"}</td>
                        <td className="px-4 py-3 text-neutral-gray italic">{hist.remarks || "—"}</td>
                      </tr>
                    ))}
                    {pcnHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[10px] font-black text-neutral-gray uppercase tracking-widest">
                          No mutation trail entries parsed yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* PCN Record Modal Dialogue */}
      <CustomModal
        open={pcnTarget !== null}
        onClose={() => setPcnTarget(null)}
        title="Record PCN Assignment Change"
        description="Alter department project properties and logs"
        footer={(
          <>
            <button onClick={() => setPcnTarget(null)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-gray-50 hover:bg-gray-100 rounded-xl transition-all">
              Cancel
            </button>
            <button onClick={confirmPcnMutation} className="px-5 py-2 text-[10px] font-black uppercase tracking-widest bg-black hover:bg-neutral-800 text-white rounded-xl transition-all">
              Apply PCN Changes
            </button>
          </>
        )}
      >
        <div className="space-y-4 text-xs font-semibold text-black">
          {/* PCN Type Selection */}
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase text-neutral-gray tracking-widest">Mutation Category</span>
            <div className="flex flex-wrap gap-2">
              {PCN_CATEGORY_TREE.map(cat => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setPcnCategory(cat.key);
                    if (cat.statuses.length > 0) setPcnSubStatus(cat.statuses[0]);
                  }}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border rounded-xl transition-all ${pcnCategory === cat.key ? "bg-black text-white border-black" : "bg-gray-55 hover:bg-gray-100 border-gray-100 text-neutral-gray"}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub Status Selection */}
          {pcnCategory === "Mutation" && (
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-neutral-gray tracking-widest">Mutation Scope</span>
              <div className="flex flex-wrap gap-2">
                {['Unit', 'OPG', 'Project'].map(scope => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => setPcnSubStatus(scope)}
                    className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border rounded-xl transition-all ${pcnSubStatus === scope ? "bg-black text-white border-black" : "bg-gray-55 hover:bg-gray-100 border-gray-100 text-neutral-gray"}`}
                  >
                    {scope} Scope
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-gray">Target OPG</label>
              <select value={pcnForm.to_opg} onChange={e => setPcnForm({ ...pcnForm, to_opg: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl outline-none text-xs">
                {OPG_GROUPS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-gray">Target Project</label>
              <select value={pcnForm.to_project} onChange={e => setPcnForm({ ...pcnForm, to_project: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl outline-none text-xs">
                {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-gray">Target Position</label>
              <select value={pcnForm.to_position} onChange={e => setPcnForm({ ...pcnForm, to_position: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl outline-none text-xs">
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-gray">Transfer Date</label>
              <input type="date" value={pcnForm.start_date} onChange={e => setPcnForm({ ...pcnForm, start_date: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl outline-none text-xs font-mono" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-gray">Reason / Log Remarks</label>
            <textarea value={pcnForm.remarks} onChange={e => setPcnForm({ ...pcnForm, remarks: e.target.value })} rows={2} placeholder="Explain transfer purpose..."
              className="w-full bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl outline-none text-xs resize-none" />
          </div>
        </div>
      </CustomModal>

      {/* Resignation Confirmation Modal Dialogue */}
      <CustomModal
        open={resignTarget !== null}
        onClose={() => setResignTarget(null)}
        title="Record Voluntary/Involuntary Resignation"
        description="Process active employee exit parameters"
        footer={(
          <>
            <button onClick={() => setResignTarget(null)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-gray-50 hover:bg-gray-100 rounded-xl transition-all">
              Cancel
            </button>
            <button onClick={confirmResign} className="px-5 py-2 text-[10px] font-black uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all">
              Submit Exit
            </button>
          </>
        )}
      >
        <div className="space-y-4 text-xs font-semibold text-black">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-gray">Effective Exist Date</label>
              <input type="date" value={resignForm.effective_resign_date} onChange={e => setResignForm({ ...resignForm, effective_resign_date: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl outline-none text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-gray">Last Day of Service</label>
              <input type="date" value={resignForm.last_day} onChange={e => setResignForm({ ...resignForm, last_day: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl outline-none text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-gray">Resign Type</label>
              <select value={resignForm.resign_type} onChange={e => setResignForm({ ...resignForm, resign_type: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl outline-none text-xs">
                <option value="Voluntary">Voluntary</option>
                <option value="Involuntary">Involuntary</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-gray">Attrition Detail Type</label>
              <input value={resignForm.attrition_type} onChange={e => setResignForm({ ...resignForm, attrition_type: e.target.value })} placeholder="e.g. Relocating, Personal"
                className="w-full bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl outline-none text-xs" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-gray">Primary Exit Reason</label>
            <textarea value={resignForm.resignation_reason} onChange={e => setResignForm({ ...resignForm, resignation_reason: e.target.value })} rows={2} placeholder="Explain details of exit interview..."
              className="w-full bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl outline-none text-xs resize-none" />
          </div>
        </div>
      </CustomModal>
    </motion.div>
  );
}

// ─── Native Custom Modal Backing component ───────────────────────────────────
function CustomModal({
  open,
  onClose,
  title,
  description,
  children,
  footer
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="relative bg-white w-full max-w-lg rounded-2xl border border-gray-100 shadow-2xl overflow-hidden p-6 sm:p-8 z-10"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
                  {title}
                </h3>
                {description && (
                  <p className="text-[10px] text-neutral-gray font-bold uppercase tracking-tight mt-1">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 px-2 text-neutral-gray hover:text-black rounded-lg hover:bg-gray-100 transition-all text-xs font-black uppercase"
              >
                ✕
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto pr-1 py-1 no-scrollbar space-y-4">
              {children}
            </div>

            {footer && (
              <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Inline Toast Stack Component ───────────────────────────────────────────
function ToastContainer({ toasts }: { toasts: any[] }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`px-4 py-3 rounded-xl border shadow-lg text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2 pointer-events-auto ${t.type === "success" ? "bg-black border-neutral-900" : "bg-active-red border-red-700"}`}
          >
            {t.type === "success" ? (
              <span className="text-emerald-400 font-bold font-sans">✓</span>
            ) : (
              <span className="text-white font-bold font-sans">✕</span>
            )}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
