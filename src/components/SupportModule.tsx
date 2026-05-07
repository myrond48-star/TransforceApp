import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft,
  Calculator,
  HardHat,
  GraduationCap,
  Bot,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  BarChart3,
  X
} from "lucide-react";

interface SupportModuleProps {
  onBack: () => void;
}

const TABS = [
  { id: "presale", label: "Presale - Capacity Calculation", icon: Calculator },
  { id: "aftersales", label: "Aftersales - Capacity Calculation", icon: HardHat },
  { id: "training", label: "Training Request", icon: GraduationCap },
  { id: "automation", label: "Automation Request", icon: Bot },
];

// Mock Data for Automation
const PICS = [
  { id: "PIC001", name: "Tony Stark", role: "Sr. Automation Engineer", workload: 85, tasks: 5 },
  { id: "PIC002", name: "Bruce Banner", role: "Data Scientist", workload: 60, tasks: 3 },
  { id: "PIC003", name: "Shuri", role: "Process Specialist", workload: 40, tasks: 2 },
  { id: "PIC004", name: "Reed Richards", role: "Architect", workload: 95, tasks: 7 },
];

const INITIAL_REQUESTS = [
  { id: "AR-2024-001", title: "Automated Shipping Report", requester: "John Smith", team: "Support A", pic: "Tony Stark", status: "In Progress", priority: "High", date: "2024-05-01" },
  { id: "AR-2024-002", title: "Inventory Sync Bot", requester: "Sarah Connor", team: "Support B", pic: "Bruce Banner", status: "Pending", priority: "Medium", date: "2024-05-03" },
  { id: "AR-2024-003", title: "Slack KPI Notification", requester: "Ellen Ripley", team: "High Priority", pic: "Shuri", status: "Completed", priority: "Low", date: "2024-04-28" },
  { id: "AR-2024-004", title: "Auto-ID Badge Generator", requester: "Arthur Dent", team: "Support B", pic: "Reed Richards", status: "In Progress", priority: "High", date: "2024-05-05" },
];

function AutomationRequestView() {
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [showNewModal, setShowNewModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRequests = requests.filter(req => 
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PICS.map((pic) => (
          <div key={pic.id} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-black transition-colors">
                <User className="w-5 h-5 text-neutral-gray group-hover:text-white" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest block">Workload</span>
                <span className={`text-sm font-bold ${pic.workload > 80 ? 'text-active-red' : 'text-emerald-600'}`}>
                  {pic.workload}%
                </span>
              </div>
            </div>
            <h3 className="text-sm font-bold text-black uppercase tracking-tight truncate">{pic.name}</h3>
            <p className="text-[10px] text-neutral-gray font-bold uppercase tracking-widest opacity-60 mb-4">{pic.role}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-neutral-gray opacity-40" />
                <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest">{pic.tasks} Active Tasks</span>
              </div>
              <div className="h-1 w-16 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${pic.workload > 80 ? 'bg-active-red' : 'bg-emerald-500'}`} 
                  style={{ width: `${pic.workload}%` }} 
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Ticket Queue */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black text-black uppercase tracking-widest">Request Queue</h2>
            <div className="px-2.5 py-1 bg-gray-100 rounded-full text-[10px] font-black text-neutral-gray uppercase">
              {requests.length} Total
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-gray" />
              <input 
                type="text"
                placeholder="SEARCH REQUESTS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-[10px] font-bold text-black focus:bg-white focus:border-black outline-none transition-all w-48 sm:w-64 placeholder:opacity-40"
              />
            </div>
            <button 
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-active-red transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Ticket
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Request Detail</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Requester</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Assigned PIC</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Priority</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-active-red tracking-widest mb-1">{req.id}</span>
                      <span className="text-xs font-bold text-black uppercase tracking-tight">{req.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-black uppercase tracking-tight">{req.requester}</span>
                      <span className="text-[9px] text-neutral-gray font-bold uppercase tracking-widest opacity-60">{req.team}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-black">
                        {req.pic.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-black uppercase tracking-tight">{req.pic}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
                      ${req.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 
                        req.status === 'In Progress' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}
                    `}>
                      {req.status === 'Completed' ? <CheckCircle2 className="w-3 h-3" /> : 
                       req.status === 'In Progress' ? <Clock className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {req.status}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[9px] font-black uppercase tracking-widest 
                      ${req.priority === 'High' ? 'text-active-red' : 
                        req.priority === 'Medium' ? 'text-orange-500' : 'text-neutral-gray'}
                    `}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest opacity-60">{req.date}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-black p-6 sm:p-8 flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">New Automation Ticket</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Submit a process for automation</p>
                </div>
                <button 
                  onClick={() => setShowNewModal(false)}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-gray uppercase tracking-widest block">Process Title</label>
                    <input 
                      type="text" 
                      placeholder="E.G., DAILY REPORT SYNC"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-black outline-none focus:border-black transition-all uppercase placeholder:opacity-30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-gray uppercase tracking-widest block">Priority</label>
                    <select className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-black outline-none focus:border-black transition-all">
                      <option>LOW</option>
                      <option>MEDIUM</option>
                      <option>HIGH</option>
                      <option>URGENT</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-gray uppercase tracking-widest block">Process Description</label>
                  <textarea 
                    rows={4}
                    placeholder="DESCRIBE THE CURRENT MANUAL PROCESS AND DESIRED OUTCOME..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-black outline-none focus:border-black transition-all placeholder:opacity-30 resize-none"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button 
                    onClick={() => setShowNewModal(false)}
                    className="flex-1 px-6 py-4 bg-gray-100 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setShowNewModal(false)}
                    className="flex-1 px-6 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-active-red transition-all shadow-lg shadow-black/20"
                  >
                    Submit Ticket
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SupportModule({ onBack }: SupportModuleProps) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

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
            <h1 className="text-xl sm:text-3xl font-black text-black uppercase tracking-tight leading-none">Support</h1>
            <p className="text-[9px] sm:text-xs text-neutral-gray font-bold uppercase tracking-widest mt-2 italic opacity-70">Requests & Capacity Tools</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-gray-100 bg-gray-50/50">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all
                ${activeTab === tab.id ? 'bg-white text-black border-t-2 border-active-red shadow-[0_-2px_10px_rgba(0,0,0,0.02)]' : 'text-neutral-gray hover:text-black hover:bg-gray-100/50'}
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-8 lg:p-12 min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === "automation" ? (
              <motion.div
                key="automation"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <AutomationRequestView />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex flex-col items-center justify-center text-center py-20"
              >
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  {React.createElement(TABS.find(t => t.id === activeTab)?.icon || Bot, {
                    className: "w-10 h-10 text-neutral-gray"
                  })}
                </div>
                <h2 className="text-xl font-black text-black uppercase tracking-tight mb-2">
                  {TABS.find(t => t.id === activeTab)?.label}
                </h2>
                <p className="text-sm text-neutral-gray font-medium max-w-md mx-auto">
                  This module section is currently under construction. Check back soon for updates to the {TABS.find(t => t.id === activeTab)?.label.toLowerCase()} functionalities.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
