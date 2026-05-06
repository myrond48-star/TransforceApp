import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Activity, 
  BarChart3,
  Calendar,
  Filter,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface KPITrackerModuleProps {
  onBack: () => void;
}

const performanceData = [
  { name: 'Jan', sl: 82, occupancy: 78, aht: 295 },
  { name: 'Feb', sl: 85, occupancy: 82, aht: 288 },
  { name: 'Mar', sl: 78, occupancy: 85, aht: 310 },
  { name: 'Apr', sl: 91, occupancy: 80, aht: 275 },
  { name: 'May', sl: 95, occupancy: 84, aht: 265 },
];

const COLORS = ['#D1102B', '#000000', '#6366f1', '#10b981'];

export default function KPITrackerModule({ onBack }: KPITrackerModuleProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const kpis = [
    { label: "Service Level", value: "95.2%", target: "85.0%", status: "Exceeded", icon: Target, trend: "+4.2%", positive: true },
    { label: "Occupancy", value: "84.1%", target: "80.0%", status: "Optimal", icon: Activity, trend: "+1.5%", positive: true },
    { label: "Avg Handle Time", value: "265s", target: "280s", status: "Within Range", icon: Clock, trend: "-15s", positive: true },
    { label: "Quality Score", value: "92.8%", target: "90.0%", status: "Optimal", icon: CheckCircle2, trend: "+0.8%", positive: true },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8 lg:space-y-12"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={onBack}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-white border border-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center hover:border-black hover:shadow-xl transition-all group shrink-0"
          >
            <ArrowLeft className="w-5 sm:w-6 h-5 sm:h-6 text-black group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-3xl font-black text-black uppercase tracking-tight leading-none">KPI Tracker</h1>
            <p className="text-[9px] sm:text-xs text-neutral-gray font-bold uppercase tracking-widest mt-2 italic opacity-70">Real-time performance monitoring and target tracking</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1 bg-white border border-gray-100 rounded-2xl shadow-sm">
           <button 
             onClick={() => setActiveTab("overview")}
             className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-black text-white shadow-xl shadow-black/20' : 'text-neutral-gray hover:bg-gray-50'}`}
           >
             Overview
           </button>
           <button 
             onClick={() => setActiveTab("historical")}
             className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'historical' ? 'bg-black text-white shadow-xl shadow-black/20' : 'text-neutral-gray hover:bg-gray-50'}`}
           >
             Historical
           </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity">
              <kpi.icon className="w-16 h-16 text-black" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-active-red/5 transition-colors">
                <kpi.icon className="w-5 h-5 text-black group-hover:text-active-red transition-colors" />
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${kpi.positive ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                {kpi.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {kpi.trend}
              </div>
            </div>
            <p className="text-[10px] font-bold text-neutral-gray uppercase tracking-widest mb-1">{kpi.label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-black tracking-tighter">{kpi.value}</p>
              <div className="h-4 w-px bg-gray-100 mx-1" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-neutral-gray uppercase tracking-widest leading-none">Target</span>
                <span className="text-[11px] font-bold text-black mt-1">{kpi.target}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
               <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${kpi.status === 'Exceeded' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                 {kpi.status}
               </span>
               <div className="flex gap-0.5">
                 {[1, 2, 3, 4, 5].map(b => (
                    <div key={b} className={`w-1 h-3 rounded-full ${b <= 4 ? 'bg-black' : 'bg-gray-100'}`} />
                 ))}
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
              <div>
                 <h3 className="text-xl font-black text-black uppercase tracking-tight">Aggregate Performance Trend</h3>
                 <p className="text-[10px] font-bold text-neutral-gray uppercase tracking-[0.2em] mt-1 italic">Multi-metric efficiency overview</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-active-red" />
                    <span className="text-[9px] font-black uppercase text-neutral-gray">Service Level</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-black" />
                    <span className="text-[9px] font-black uppercase text-neutral-gray">Occupancy</span>
                 </div>
              </div>
           </div>

           <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSL" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D1102B" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#D1102B" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000" stopOpacity={0.05}/>
                      <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '16px' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                  />
                  <Area type="monotone" dataKey="sl" stroke="#D1102B" strokeWidth={3} fillOpacity={1} fill="url(#colorSL)" />
                  <Area type="monotone" dataKey="occupancy" stroke="#000" strokeWidth={3} fillOpacity={1} fill="url(#colorOcc)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Efficiency Column */}
        <div className="flex flex-col gap-6">
           <div className="bg-black text-white p-8 rounded-[2.5rem] relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-active-red opacity-10 blur-[60px]" />
              <div className="relative z-10">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-active-red mb-3">Efficiency Peak</h4>
                 <h3 className="text-4xl font-black tracking-tighter leading-none mb-4">95%</h3>
                 <p className="text-white/60 text-[11px] leading-relaxed font-medium uppercase tracking-tight mb-8">
                   Achieved peak operational output during May window 04052026.
                 </p>
                 <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <Zap className="text-active-red w-5 h-5" />
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black uppercase text-white/40">Status</span>
                       <span className="text-xs font-bold uppercase">Optimal Output</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex-grow">
              <h4 className="text-xs font-black uppercase tracking-widest text-black mb-6 flex items-center justify-between">
                Efficiency by Month
                <Filter size={14} className="text-neutral-gray" />
              </h4>
              <div className="space-y-6">
                 {performanceData.map((d, i) => (
                   <div key={i} className="group cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-[10px] font-black uppercase text-neutral-gray tracking-widest">{d.name} Performance</span>
                         <span className="text-[11px] font-black text-black">{d.sl}%</span>
                      </div>
                      <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${d.sl}%` }}
                           transition={{ duration: 1, delay: i * 0.1 }}
                           className={`h-full rounded-full transition-all duration-500 ${d.sl > 90 ? 'bg-emerald-500' : d.sl > 80 ? 'bg-black' : 'bg-active-red'}`} 
                         />
                      </div>
                   </div>
                 ))}
              </div>
              <div className="mt-10 pt-6 border-t border-gray-50">
                 <button className="w-full py-4 bg-gray-50 hover:bg-black hover:text-white transition-all rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
                   <Download size={14} /> Full Data Submission
                 </button>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
