import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { format, startOfDay, addMinutes } from "date-fns";
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
  UserCircle
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

interface WorkforceModuleProps {
  onBack: () => void;
}

// --- Mock Data & Constants ---

const SHIFTS = {
  "S1": { label: "Morning", start: "07:00", end: "16:00", color: "bg-blue-500" },
  "S2": { label: "Evening", start: "15:00", end: "00:00", color: "bg-indigo-500" },
  "H": { label: "Day", start: "08:00", end: "17:00", color: "bg-emerald-500" },
};

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
  { id: "WF001", name: "Alexander Grant", shift: "S1", team: "Support A", activities: { 40: "LB", 41: "LB", 42: "LB", 43: "LB", 56: "SB" } },
  { id: "WF002", name: "Sarah Connor", shift: "H", team: "Support B", activities: { 48: "MT", 49: "MT", 56: "LB", 57: "LB", 58: "LB", 59: "LB" } },
  { id: "WF003", name: "John Wick", shift: "S2", team: "High Priority", activities: { 80: "LB", 81: "LB", 82: "LB", 83: "LB" } },
  { id: "WF004", name: "Ellen Ripley", shift: "S1", team: "Support A", activities: { 48: "TR", 49: "TR", 50: "TR", 51: "TR" } },
  { id: "WF005", name: "Arthur Dent", shift: "H", team: "Support B", activities: { 60: "LB", 61: "LB", 62: "LB", 63: "LB" } },
  ...Array.from({ length: 35 }).map((_, i) => {
    const shiftOpts = ["S1", "S2", "H"];
    const teamOpts = ["Support A", "Support B", "High Priority", "Technical"];
    const shift = shiftOpts[Math.floor(Math.random() * shiftOpts.length)];
    const team = teamOpts[Math.floor(Math.random() * teamOpts.length)];
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
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'interval' | 'activity', direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [showActions, setShowActions] = useState(false);

  const timeToIndex = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 4 + Math.floor(m / 15);
  };

  const renderScheduleGrid = () => {
    const teams = ["all", "Support A", "Support B", "High Priority", "Technical"];
    
    const filteredAgents = mockAgents
      .filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter(a => selectedTeam === "all" || a.team === selectedTeam)
      .sort((a, b) => {
        if (sortConfig.key === 'name') {
          return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        if (sortConfig.key === 'interval') {
          const shiftA = SHIFTS[a.shift as keyof typeof SHIFTS].start;
          const shiftB = SHIFTS[b.shift as keyof typeof SHIFTS].start;
          return sortConfig.direction === 'asc' ? shiftA.localeCompare(shiftB) : shiftB.localeCompare(shiftA);
        }
        // Simplified activity sort (just by presence of initial activity)
        return 0;
      });

    return (
      <div className="space-y-6 sm:space-y-8">
        {/* Quick Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Overall Adherence", value: "94.8%", trend: "+2.1%", icon: CheckCircle2, color: "text-green-600" },
            { label: "Current Service Level", value: "88.2%", trend: "-1.5%", icon: Zap, color: "text-active-red" },
            { label: "Total Headcount", value: "412", trend: "+12", icon: Users, color: "text-black" },
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
              {filteredAgents.map((agent, idx) => {
                const shift = SHIFTS[agent.shift as keyof typeof SHIFTS];
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
    const dates = Array.from({ length: 14 }).map((_, i) => addMinutes(startOfDay(new Date()), i * 24 * 60));
    
    return (
      <div className="space-y-6">
        {/* Calendar Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-bold text-neutral-gray uppercase tracking-widest mb-1">Total Roster Coverage</p>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-black text-black">98.5%</p>
              <span className="text-green-600 font-bold text-xs mb-1">Satisfied</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-bold text-neutral-gray uppercase tracking-widest mb-1">Avg. Weekly Utilization</p>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-black text-black">84.2%</p>
              <span className="text-neutral-gray font-bold text-xs mb-1">Optimal</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-bold text-neutral-gray uppercase tracking-widest mb-1">Open Requests</p>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-black text-active-red">12</p>
              <span className="text-active-red font-bold text-xs mb-1">Action Req.</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          {/* Calendar Toolbar */}
          <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-xl">
                <button className="p-1 hover:text-active-red transition-colors disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-[11px] font-black uppercase tracking-widest px-4 min-w-[140px] text-center">May 2026 - Week 19</span>
                <button className="p-1 hover:text-active-red transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="h-8 w-px bg-gray-100" />
              <button className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-100 transition-colors">
                <CalendarIcon className="w-4 h-4 text-black" />
              </button>
            </div>
            <div className="flex gap-2">
              <button className="px-5 py-2.5 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-active-red transition-all">
                Publish Roster
              </button>
            </div>
          </div>

          {/* Roster Grid */}
          <div className="overflow-x-auto relative">
            <table className="border-separate border-spacing-0 table-fixed min-w-max w-full">
              <thead>
                <tr className="bg-white">
                  <th className="sticky left-0 z-40 bg-white w-[180px] sm:w-[220px] px-4 sm:px-6 py-4 border-r border-b-2 border-gray-200 text-[10px] font-black text-black text-left uppercase tracking-widest">
                    Agent Roster
                  </th>
                  {dates.map((date, i) => {
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    return (
                      <th key={i} className={`px-2 py-3 border-b-2 border-gray-100 border-r border-gray-50/50 text-center min-w-[60px] ${isWeekend ? 'bg-gray-50/50' : ''}`}>
                        <span className={`block text-[9px] font-bold uppercase tracking-widest ${isWeekend ? 'text-active-red/60' : 'text-neutral-gray'}`}>
                          {format(date, "EEE")}
                        </span>
                        <span className={`block text-xs font-black mt-0.5 ${isWeekend ? 'text-active-red' : 'text-black'}`}>
                          {format(date, "dd")}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mockAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50/20 transition-colors group">
                    <td className="sticky left-0 z-40 bg-white group-hover:bg-gray-50/80 border-r border-gray-200 px-4 sm:px-6 py-3 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-black uppercase tracking-tight">{agent.name}</span>
                        <span className="text-[9px] font-bold text-neutral-gray uppercase tracking-widest opacity-60">ID: {agent.id}</span>
                      </div>
                    </td>
                    {dates.map((_, i) => {
                      const day = (i % 7);
                      const isOff = day === 0 || day === 6;
                      const shiftCode = isOff ? 'OFF' : agent.shift;
                      const shiftInfo = SHIFTS[shiftCode as keyof typeof SHIFTS];
                      
                      return (
                        <td key={i} className={`p-1.5 border-r border-gray-50/50 text-center relative ${isOff ? 'bg-gray-50/20' : ''}`}>
                          <div 
                            className={`w-full py-1.5 rounded-lg text-[10px] font-black transition-all hover:scale-105 cursor-pointer flex items-center justify-center
                              ${isOff ? 'text-neutral-gray bg-gray-100/50' : 'text-white ' + shiftInfo?.color} shadow-sm border border-black/5`}
                          >
                            {shiftCode}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Summary Rows */}
                <tr className="bg-gray-50">
                  <td className="sticky left-0 z-40 bg-gray-50 border-r border-gray-200 px-4 sm:px-6 py-4 font-black text-[10px] text-neutral-gray uppercase tracking-widest">
                    Scheduled (Total)
                  </td>
                  {dates.map((_, i) => (
                    <td key={i} className="px-2 py-4 border-r border-gray-50/50 text-center">
                      <span className="text-[11px] font-black text-black">{(i % 7 === 0 || i % 7 === 6) ? '0' : '5'}</span>
                    </td>
                  ))}
                </tr>
                <tr className="bg-white">
                  <td className="sticky left-0 z-40 bg-white border-r border-gray-200 px-4 sm:px-6 py-4 font-black text-[10px] text-neutral-gray uppercase tracking-widest">
                    Coverage %
                  </td>
                  {dates.map((_, i) => (
                    <td key={i} className="px-2 py-4 border-r border-gray-50/50 text-center">
                      <span className="text-[10px] font-bold text-green-600">{(i % 7 === 0 || i % 7 === 6) ? 'N/A' : '100%'}</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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
                {mockAgents.map((agent) => {
                  const shift = SHIFTS[agent.shift as keyof typeof SHIFTS];
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
    const historicalStats = [
      { label: "Aug. Service Level", value: "91.2%", status: "Optimal", color: "text-emerald-500" },
      { label: "Occupancy Avg", value: "82.4%", status: "Healthy", color: "text-blue-500" },
      { label: "Adherence Avg", value: "95.8%", status: "High", color: "text-indigo-600" },
      { label: "Absenteeism", value: "4.2%", status: "Stable", color: "text-rose-500" },
    ];

    const historicalLogs = [
      { date: "2026-05-05", interval: "09:00 - 09:15", req: 42, actual: 44, sl: "98.2%", color: "text-emerald-500" },
      { date: "2026-05-05", interval: "09:15 - 09:30", req: 45, actual: 42, sl: "88.4%", color: "text-amber-500" },
      { date: "2026-05-05", interval: "09:30 - 09:45", req: 48, actual: 40, sl: "72.1%", color: "text-rose-500" },
      { date: "2026-05-05", interval: "09:45 - 10:00", req: 44, actual: 44, sl: "95.6%", color: "text-emerald-500" },
      { date: "2026-05-04", interval: "14:00 - 14:15", req: 38, actual: 39, sl: "99.1%", color: "text-emerald-500" },
      { date: "2026-05-04", interval: "14:15 - 14:30", req: 40, actual: 38, sl: "86.5%", color: "text-amber-500" },
    ];

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {historicalStats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-black text-slate-950 tracking-tighter">{stat.value}</p>
                <span className={`text-[9px] font-black uppercase tracking-widest ${stat.color} mb-1.5`}>{stat.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-950">Interval History Log</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Archived performance metrics across historical intervals</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select className="bg-slate-50 border-none rounded-xl pl-10 pr-6 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-black/10">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>Previous Month</option>
                </select>
              </div>
              <button className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-black transition-colors">
                <Download size={16} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Date Reference</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Interval Window</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Req. Capacity</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Actual Staffed</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Service Level</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Action Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {historicalLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6 text-[11px] font-black text-slate-950 font-mono tracking-tighter">{log.date}</td>
                    <td className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.interval}</td>
                    <td className="px-8 py-6 text-[11px] font-black text-slate-950">{log.req}</td>
                    <td className="px-8 py-6 text-[11px] font-black text-slate-950">{log.actual}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-grow w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${log.color.replace('text-', 'bg-')}`} style={{ width: log.sl }} />
                        </div>
                        <span className={`text-[11px] font-black ${log.color}`}>{log.sl}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-950 flex items-center gap-2 transition-colors">
                        <Database size={12} /> Drill Down
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center">
            <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-black transition-colors underline underline-offset-4">
              Load Archive (2025 - 2026)
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 max-w-full overflow-x-hidden">
      {/* Back & Navigation Header */}
      <div className="flex flex-col gap-6 px-1">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-4 sm:gap-6">
            <button 
              onClick={onBack}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-white border border-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center hover:border-black hover:shadow-xl transition-all group shrink-0"
            >
              <ArrowLeft className="w-5 sm:w-6 h-5 sm:h-6 text-black group-hover:-translate-x-1 transition-transform" />
            </button>
            
            <nav className="flex items-center p-1 bg-white border border-gray-100 rounded-xl sm:rounded-[24px] shadow-sm overflow-x-auto scrollbar-hide no-scrollbar w-full lg:w-auto">
              <div className="flex items-center min-w-max">
                {[
                  { id: "schedule", label: "Interval", icon: Clock },
                  { id: "calendar", label: "Calendar", icon: CalendarIcon },
                  { id: "adherence", label: "Adherence", icon: CheckCircle2 },
                  { id: "attendance", label: "Attendance", icon: ClipboardCheck },
                  { id: "forecasting", label: "Forecast", icon: TrendingUp },
                  { id: "planning", label: "Planning", icon: CalendarIcon },
                  { id: "historical", label: "Historical", icon: History },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-lg sm:rounded-[18px] text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === tab.id 
                        ? "bg-black text-white shadow-xl shadow-black/20" 
                        : "text-neutral-gray hover:bg-gray-50"
                    }`}
                  >
                    <tab.icon className={`w-3.5 sm:w-4 h-3.5 sm:h-4 ${activeTab === tab.id ? "text-active-red" : "text-neutral-gray"}`} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </nav>
          </div>
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
          {activeTab === "adherence" && (
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
                        {mockAgents.map((agent) => {
                          const shift = SHIFTS[agent.shift as keyof typeof SHIFTS];
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
          {activeTab === "attendance" && renderAttendance()}
          {activeTab === "forecasting" && renderForecasting()}
          {activeTab === "historical" && renderHistorical()}
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