import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  AlertCircle,
  Download,
  Filter
} from "lucide-react";

interface PLAnalysisModuleProps {
  onBack: () => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface ProjectData {
  id: string;
  name: string;
  client: string;
  forecast: any;
  billing: any;
  actual: any;
  accuracy: any;
  diagnostics: any[];
}

const PROJECTS: ProjectData[] = [
  {
    id: "PRJ-001",
    name: "Alpha Logistics",
    client: "Global Trans Co",
    forecast: {
      sales: [685377990, 609082805, 776743487, 840703473, 0, 0, 0, 0, 0, 0, 0, 0],
      cost: [1304993488, 860487427, 936865966, 897261336, 5272242, 5272242, 5272242, 5272242, 5272242, 5272242, 5272242, 5272242],
      hrCost: [1133483626, 716997565, 803486474, 767786844, 0, 0, 0, 0, 0, 0, 0, 0],
      facilityCost: [153769894, 126949894, 117509092, 113784092, 5272242, 5272242, 5272242, 5272242, 5272242, 5272242, 5272242, 5272242],
      otherCost: [17739968, 16539968, 15870400, 15690400, 0, 0, 0, 0, 0, 0, 0, 0],
      directProfit: [-619615498, -251404622, -160122479, -56557862, -5272242, -5272242, -5272242, -5272242, -5272242, -5272242, -5272242, -5272242],
      percentDirectProfit: [-90.40, -41.28, -20.61, -6.73, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    billing: {
      sales: [683697903, 613622459, 773993296, 804280418, 0, 0, 0, 0, 0, 0, 0, 0],
      cost: [1288141222, 855877874, 928588264, 877210519, 0, 0, 0, 0, 0, 0, 0, 0],
      hrCost: [1117376360, 713193183, 796184514, 749854769, 0, 0, 0, 0, 0, 0, 0, 0],
      facilityCost: [153024894, 126144723, 116533350, 111665350, 0, 0, 0, 0, 0, 0, 0, 0],
      otherCost: [17739968, 16539968, 15870400, 15690400, 0, 0, 0, 0, 0, 0, 0, 0],
      directProfit: [-604443320, -242255415, -154588968, -72930101, 0, 0, 0, 0, 0, 0, 0, 0],
      percentDirectProfit: [-88.41, -39.48, -19.97, -9.07, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    actual: {
      sales: [675956970, 600840828, 767458577, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      cost: [1427145262, 1150000000, 962152889, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      hrCost: [1250567524, 1030000000, 828791507, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      facilityCost: [152887563, 103003784, 114841070, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      otherCost: [23693155, 17000000, 18520312, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      directProfit: [-751191292, -551681227, -194694312, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      percentDirectProfit: [-111.13, -91.82, -25.37, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    accuracy: {
      sales: [98.6, 98.6, 98.8, 0.0],
      cost: [109.4, 133.9, 102.7, 0.0],
      profit: [-20.7, -50.5, -4.8, 0]
    },
    diagnostics: [
      { month: "January", status: "Critical", color: "bg-rose-600", reasons: ["CATK Drop - 70%", "US CHAT - 67%", "Penalty Deduction"] },
      { month: "February", status: "Warning", color: "bg-amber-500", reasons: ["CATK Drop - 83%", "Penalty Deduction"] },
      { month: "March", status: "Critical", color: "bg-rose-600", reasons: ["CATK Drop - 69%", "CA CHAT - 85%", "Penalty Deduction"] },
      { month: "April", status: "Notice", color: "bg-indigo-500", reasons: ["CA CHAT - 60%", "US CHAT - 80%", "Penalty Deduction"] }
    ]
  },
  {
    id: "PRJ-002",
    name: "Retail Connect",
    client: "Market Place Inc",
    forecast: {
      sales: [450000000, 480000000, 520000000, 550000000, 0, 0, 0, 0, 0, 0, 0, 0],
      cost: [400000000, 410000000, 430000000, 450000000, 0, 0, 0, 0, 0, 0, 0, 0],
      hrCost: [350000000, 360000000, 380000000, 400000000, 0, 0, 0, 0, 0, 0, 0, 0],
      facilityCost: [40000000, 40000000, 40000000, 40000000, 0, 0, 0, 0, 0, 0, 0, 0],
      otherCost: [10000000, 10000000, 10000000, 10000000, 0, 0, 0, 0, 0, 0, 0, 0],
      directProfit: [50000000, 70000000, 90000000, 100000000, 0, 0, 0, 0, 0, 0, 0, 0],
      percentDirectProfit: [11.11, 14.58, 17.31, 18.18, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    billing: {
      sales: [445000000, 475000000, 515000000, 545000000, 0, 0, 0, 0, 0, 0, 0, 0],
      cost: [405000000, 415000000, 435000000, 455000000, 0, 0, 0, 0, 0, 0, 0, 0],
      hrCost: [355000000, 365000000, 385000000, 405000000, 0, 0, 0, 0, 0, 0, 0, 0],
      facilityCost: [40000000, 40000000, 40000000, 40000000, 0, 0, 0, 0, 0, 0, 0, 0],
      otherCost: [10000000, 10000000, 10000000, 10000000, 0, 0, 0, 0, 0, 0, 0, 0],
      directProfit: [40000000, 60000000, 80000000, 90000000, 0, 0, 0, 0, 0, 0, 0, 0],
      percentDirectProfit: [8.99, 12.63, 15.53, 16.51, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    actual: {
      sales: [448000000, 478000000, 518000000, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      cost: [410000000, 420000000, 440000000, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      hrCost: [360000000, 370000000, 390000000, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      facilityCost: [40000000, 40000000, 40000000, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      otherCost: [10000000, 10000000, 10000000, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      directProfit: [38000000, 58000000, 78000000, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      percentDirectProfit: [8.48, 12.13, 15.06, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    accuracy: {
      sales: [99.5, 99.5, 99.6, 0.0],
      cost: [102.5, 102.4, 102.3, 0.0],
      profit: [-24.0, -17.1, -13.3, 0]
    },
    diagnostics: [
      { month: "January", status: "Warning", color: "bg-amber-500", reasons: ["Higher HR Cost +2%"] },
      { month: "February", status: "Notice", color: "bg-emerald-500", reasons: ["Optimized Infrastructure"] },
      { month: "March", status: "Notice", color: "bg-emerald-500", reasons: ["Scaling Phase Complete"] }
    ]
  }
];

const FORMAT_CURRENCY = (val: number) => {
  if (val === 0) return "0";
  return new Intl.NumberFormat('id-ID').format(val);
};

const FORMAT_PERCENT = (val: number) => {
  if (val === 0) return "0,0%";
  return val.toFixed(2).replace('.', ',') + "%";
};

const TableSection = ({ title, data }: { title: string; data: any }) => {
  return (
    <div className="mb-14">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px flex-1 bg-slate-100" />
        <div className="bg-slate-950 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] italic shadow-lg">
          {title}
        </div>
        <div className="h-px flex-1 bg-slate-100" />
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-x-auto no-scrollbar">
        <table className="w-full border-collapse text-[11px] font-bold min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50/80 backdrop-blur-sm text-slate-400">
              <th className="p-5 text-left min-w-[200px] uppercase font-black tracking-widest text-[9px]">Financial Metrics</th>
              {MONTHS.map(m => (
                <th key={m} className="p-5 text-center uppercase font-black tracking-widest text-[9px]">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {/* Sales Row */}
            <tr className="hover:bg-slate-50/50 transition-colors group">
              <td className="p-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">S</div>
                <span className="text-slate-900 group-hover:text-emerald-600 transition-colors">Gross Sales</span>
              </td>
              {data.sales.map((v: number, i: number) => (
                <td key={i} className="p-5 text-right font-black text-slate-700">{FORMAT_CURRENCY(v)}</td>
              ))}
            </tr>
            {/* Cost Row */}
            <tr className="bg-slate-50/20 hover:bg-slate-50 transition-colors group">
              <td className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-black">C</div>
                  <span className="text-slate-900 group-hover:text-rose-600 transition-colors">Total Expenditure</span>
                </div>
              </td>
              {data.cost.map((v: number, i: number) => (
                <td key={i} className="p-5 text-right font-black text-slate-700">
                  {v > 1000000000 && i > 0 && i < 3 ? <span className="opacity-20">••••••••</span> : FORMAT_CURRENCY(v)}
                </td>
              ))}
            </tr>
            {/* HR Cost Sub-row */}
            <tr className="text-slate-400 group/sub">
              <td className="py-3 px-5 pl-16 text-[10px] uppercase tracking-wider"> Personnel (HR)</td>
              {data.hrCost.map((v: number, i: number) => (
                <td key={i} className="py-3 px-5 text-right font-medium group-hover/sub:text-slate-600 transition-colors">
                  {title === 'ACTUAL' && i > 0 && i < 3 ? '••••' : FORMAT_CURRENCY(v)}
                </td>
              ))}
            </tr>
            {/* Facility Cost Sub-row */}
            <tr className="text-slate-400 group/sub">
              <td className="py-3 px-5 pl-16 text-[10px] uppercase tracking-wider"> Infrastructure & Facilities</td>
              {data.facilityCost.map((v: number, i: number) => (
                <td key={i} className="py-3 px-5 text-right font-medium group-hover/sub:text-slate-600 transition-colors">{FORMAT_CURRENCY(v)}</td>
              ))}
            </tr>
            {/* Other Cost Sub-row */}
            <tr className="text-slate-400 group/sub">
              <td className="py-3 px-5 pl-16 text-[10px] uppercase tracking-wider"> Miscellaneous Overhead</td>
              {data.otherCost.map((v: number, i: number) => (
                <td key={i} className="py-3 px-5 text-right font-medium group-hover/sub:text-slate-600 transition-colors">{FORMAT_CURRENCY(v)}</td>
              ))}
            </tr>
            
            {/* Direct Profit Row */}
            <tr className="bg-slate-950 text-white">
              <td className="p-5 font-black uppercase tracking-tighter text-sm italic">Direct Margin</td>
              {data.directProfit.map((v: number, i: number) => (
                <td key={i} className={`p-5 text-right font-black ${v < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {FORMAT_CURRENCY(v)}
                </td>
              ))}
            </tr>
            {/* %Direct Profit Row */}
            <tr className="bg-rose-600 text-white shadow-inner">
              <td className="p-5 font-black uppercase tracking-widest text-[9px]">Margin Performance (%)</td>
              {data.percentDirectProfit.map((v: number, i: number) => (
                <td key={i} className="p-5 text-right font-black text-sm italic">
                  {v === 0 ? <span className="opacity-30">-</span> : FORMAT_PERCENT(v)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PLAnalysisModule: React.FC<PLAnalysisModuleProps> = ({ onBack }) => {
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0]);

  const activeData = selectedProject;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
    >
      {/* Header */}
      <div className="p-8 sm:p-10 border-b border-slate-50 bg-slate-50/30 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div className="flex flex-col md:flex-row md:items-center gap-8">
          <button 
            onClick={onBack}
            className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm group self-start"
          >
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-rose-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-2 shadow-lg shadow-rose-200">
              <TrendingUp size={12} /> Financial Intelligence
            </div>
            <h1 className="text-4xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">
              P&L <span className="text-rose-600">Analysis</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-slate-300" /> Fiscal Period: Q1 2024
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/50 p-2 rounded-3xl border border-slate-100/50">
           {/* Dropdown Filter */}
           <div className="relative flex-1 sm:min-w-[280px]">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
               <Filter size={16} />
             </div>
             <select 
               value={activeData.id}
               onChange={(e) => {
                 const prj = PROJECTS.find(p => p.id === e.target.value);
                 if (prj) setSelectedProject(prj);
               }}
               className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-[11px] font-black uppercase tracking-widest text-slate-950 appearance-none focus:outline-none focus:ring-4 focus:ring-slate-50 cursor-pointer shadow-sm hover:border-slate-300 transition-all"
             >
               {PROJECTS.map(p => (
                 <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
               ))}
             </select>
           </div>
           
           <div className="flex items-center gap-3 w-full sm:w-auto">
             <button className="flex-1 sm:flex-none px-8 py-4 bg-slate-950 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0">
               <Download size={16} /> Export
             </button>
           </div>
        </div>
      </div>

      <div className="p-8 sm:p-12">
        {/* Performance Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            { 
              label: 'Quarter Revenue', 
              value: `IDR ${(activeData.forecast.sales.reduce((a: any, b: any) => a + b, 0) / 1000000).toFixed(1)}M`, 
              icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' 
            },
            { 
              label: 'Avg Forecast Accuracy', 
              value: `${(activeData.accuracy.sales.reduce((a: any, b: any) => a + b, 0) / 3).toFixed(1)}%`, 
              icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' 
            },
            { 
              label: 'Current Margin', 
              value: `${activeData.actual.percentDirectProfit[2]}%`, 
              icon: AlertCircle, color: activeData.actual.percentDirectProfit[2] < 0 ? 'text-rose-600' : 'text-emerald-600', bg: activeData.actual.percentDirectProfit[2] < 0 ? 'bg-rose-50' : 'bg-emerald-50' 
            },
            { 
              label: 'Cost Ratio', 
              value: '1.24x', 
              icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' 
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/20 transition-all duration-500 group">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-slate-950 tracking-tighter mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <TableSection title="FORECAST" data={activeData.forecast} />
        <TableSection title="TENTATIVE BILLING" data={activeData.billing} />
        <TableSection title="ACTUAL" data={activeData.actual} />

        {/* Accuracy Section - Redesigned */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-slate-100" />
            <div className="bg-slate-950 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] italic shadow-lg shadow-slate-200">
              VARIANCE CALIBRATION
            </div>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden self-start">
              <table className="w-full border-collapse text-[12px] font-bold">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-6 text-left text-[9px] uppercase tracking-widest text-slate-400">Parameter</th>
                    {MONTHS.slice(0, 4).map(m => <th key={m} className="p-6 text-center text-[9px] uppercase tracking-widest text-slate-400">{m}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="group">
                    <td className="p-6 pl-8 text-slate-900 font-black">Sales Accuracy</td>
                    {activeData.accuracy.sales.map((v, i) => (
                      <td key={i} className="p-6 text-center font-black text-emerald-600">{v === 0 ? '-' : FORMAT_PERCENT(v)}</td>
                    ))}
                  </tr>
                  <tr className="group">
                    <td className="p-6 pl-8 text-slate-900 font-black">Cost Variance</td>
                    {activeData.accuracy.cost.map((v, i) => (
                      <td key={i} className="p-6 text-center font-black text-rose-600">{v === 0 ? '-' : FORMAT_PERCENT(v)}</td>
                    ))}
                  </tr>
                  <tr className="group bg-slate-950 text-white">
                    <td className="p-6 pl-8 font-black italic">Profit Deviation</td>
                    {activeData.accuracy.profit.map((v, i) => (
                      <td key={i} className="p-6 text-center font-black text-rose-400">{v === 0 ? '-' : FORMAT_PERCENT(v)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200/50 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-rose-600 shadow-sm">
                  <AlertCircle size={20} />
                </div>
                <h4 className="text-base font-black text-slate-950 uppercase tracking-tighter italic">Vary Kernel Map</h4>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-loose">
                Kernel analytics for <span className="text-slate-950 font-black tracking-tight">{activeData.name}</span> indicates {activeData.accuracy.cost[1] > 120 ? 'high-volatility' : 'stable'} expense behavior. Review mitigation logs for {MONTHS[1]}.
              </p>
              <div className="mt-10 flex flex-wrap gap-2">
                <div className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-600 uppercase tracking-widest shadow-sm">
                  {activeData.accuracy.profit[1] < -30 ? 'High Risk' : 'Operational'}
                </div>
                <div className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-600 uppercase tracking-widest shadow-sm">
                  Review Required
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reason for Revenue Loss Card Grid */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-10">
             <div className="h-px w-16 bg-rose-600" />
             <h4 className="text-[12px] font-black text-slate-950 uppercase tracking-[0.4em] italic">Diagnostics & Loss Mapping</h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {activeData.diagnostics.map((card, i) => (
              <div key={i} className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-rose-200 hover:shadow-[0_30px_60px_-15px_rgba(225,29,72,0.1)] transition-all duration-700">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{card.month}</span>
                  <div className={`w-3 h-3 rounded-full ${card.color} shadow-lg ${card.color === 'bg-rose-600' ? 'shadow-rose-300' : 'shadow-amber-200'} animate-pulse`} />
                </div>
                <div className="space-y-4">
                  {card.reasons.map((r, ri) => (
                    <div key={ri} className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-slate-100 mt-1 flex-shrink-0 group-hover:bg-rose-600 transition-all duration-300 transform group-hover:scale-125" />
                      <span className="text-[12px] font-bold text-slate-500 transition-colors group-hover:text-slate-950 leading-tight">{r}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${card.color.replace('bg-', 'text-')}`}>{card.status}</span>
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-600 transition-all cursor-pointer shadow-sm">
                    <FileText size={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PLAnalysisModule;
