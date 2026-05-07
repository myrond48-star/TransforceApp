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
  Users,
  BarChart3,
  X,
  LayoutDashboard
} from "lucide-react";

interface SupportModuleProps {
  onBack: () => void;
}

const TABS = [
  { id: "dashboard", label: "Ticket Requests", icon: LayoutDashboard },
  { id: "presale", label: "Presale - Capacity Calculation", icon: Calculator },
  { id: "aftersales", label: "Aftersales - Capacity Calculation", icon: HardHat },
  { id: "training", label: "Training Request", icon: GraduationCap },
  { id: "automation", label: "Automation Request", icon: Bot },
  { id: "admin", label: "Admin - Assignment", icon: Users },
];

// Mock Data for Automation
const PICS = [
  { id: "PIC001", name: "Achmad Mutaqin", role: "Sr. Automation Engineer", workload: 85, tasks: 5 },
  { id: "PIC002", name: "Disiana Fawwazsya", role: "Data Scientist", workload: 60, tasks: 3 },
  { id: "PIC003", name: "Dwi Kurnianto", role: "Process Specialist", workload: 40, tasks: 2 },
  { id: "PIC004", name: "Heru Setiawan", role: "Architect", workload: 95, tasks: 7 },
];

const INITIAL_REQUESTS = [
  { id: "AR-2024-001", title: "Automated Shipping Report", requester: "John Smith", team: "Support A", pic: "Achmad Mutaqin", status: "In Progress", priority: "High", date: "2024-05-01" },
  { id: "AR-2024-002", title: "Inventory Sync Bot", requester: "Sarah Connor", team: "Support B", pic: "Disiana Fawwazsya", status: "Pending", priority: "Medium", date: "2024-05-03" },
  { id: "AR-2024-003", title: "Slack KPI Notification", requester: "Ellen Ripley", team: "High Priority", pic: "Dwi Kurnianto", status: "Completed", priority: "Low", date: "2024-04-28" },
  { id: "AR-2024-004", title: "Auto-ID Badge Generator", requester: "Arthur Dent", team: "Support B", pic: "Heru Setiawan", status: "In Progress", priority: "High", date: "2024-05-05" },
];

const PRESALE_PICS = [
  { id: "PPIC001", name: "Ronal", role: "Solution Architect", workload: 90, tasks: 3 },
  { id: "PPIC002", name: "Ronny Saputra", role: "Technical Presales", workload: 65, tasks: 2 },
  { id: "PPIC003", name: "Achmad Mutaqin", role: "Junior Presales", workload: 45, tasks: 4 },
];

const INITIAL_PRESALE_REQUESTS = [
  { id: "PR-2024-001", title: "Enterprise Pricing Model", requester: "Pepper Potts", team: "Sales A", pic: "Ronal", status: "In Progress", priority: "High", date: "2024-05-02" },
  { id: "PR-2024-002", title: "Technical Demo Alpha", requester: "Happy Hogan", team: "Sales B", pic: "Ronny Saputra", status: "Pending", priority: "Medium", date: "2024-05-04" },
];

const AFTERSALES_PICS = [
  { id: "APIC001", name: "Disiana Fawwazsya", role: "L2 Support", workload: 70, tasks: 8 },
  { id: "APIC002", name: "Dwi Kurnianto", role: "L3 Supervisor", workload: 85, tasks: 5 },
  { id: "APIC003", name: "Heru Setiawan", role: "System Maintenance", workload: 30, tasks: 1 },
];

const INITIAL_AFTERSALES_REQUESTS = [
  { id: "AS-2024-001", title: "Client SLA Review", requester: "Nick Fury", team: "Account Mgmt", pic: "Disiana Fawwazsya", status: "In Progress", priority: "High", date: "2024-05-06" },
  { id: "AS-2024-002", title: "Bug Squashing Phase 2", requester: "Maria Hill", team: "Operations", pic: "Dwi Kurnianto", status: "Pending", priority: "Urgent", date: "2024-05-07" },
];

function SupportDashboardView() {
  const [ticketCategory, setTicketCategory] = useState("automation");

  const config: Record<string, { 
    title: string, 
    subtitle: string, 
    color: string, 
    descLabel: string,
    fields: { label: string, options: string[] }[]
  }> = {
    automation: { 
      title: "New Automation Ticket", 
      subtitle: "Submit a process for automation", 
      color: "bg-black", 
      descLabel: "Process Description",
      fields: [
        { label: "Platform", options: ["RPA", "CUSTOM SCRIPT", "INTEGRATION / API", "AI BOT"] },
        { label: "Complexity", options: ["SIMPLE (TASK)", "MODERATE (WORKFLOW)", "COMPLEX (SYSTEM)"] },
        { label: "Impact", options: ["HIGH - SCALABILITY", "MEDIUM - TIME SAVING", "LOW - CONVENIENCE"] }
      ]
    },
    training: { 
      title: "New Training Request", 
      subtitle: "Submit educational needs", 
      color: "bg-emerald-600", 
      descLabel: "Session Goals",
      fields: [
        { label: "Category", options: ["ONBOARDING", "REFRESHMENT", "SOFT SKILLS", "TECHNICAL TOOLS"] },
        { label: "Audience", options: ["NEW HIRES", "SUPPORT AGENTS", "TEAM LEADS", "MANAGEMENT"] },
        { label: "Delivery", options: ["VIRTUAL / ZOOM", "ON-SITE / OFFICE", "SELF-PACED / RECORDING"] }
      ]
    },
    presale: { 
      title: "Presale Capacity Request", 
      subtitle: "Calculate resource needs", 
      color: "bg-blue-600", 
      descLabel: "Project Scope",
      fields: [
        { label: "Project Type", options: ["IMPLEMENTATION", "MIGRATION", "CONSULTATION", "POC / PILOT"] },
        { label: "Region", options: ["APAC", "EMEA", "AMER / NORTH", "LATAM"] },
        { label: "Scope Size", options: ["SMALL (< 100 FTE)", "MEDIUM (100-500 FTE)", "LARGE (500+ FTE)"] }
      ]
    },
    aftersales: { 
      title: "Aftersales Capacity Request", 
      subtitle: "Monitor ongoing workload", 
      color: "bg-orange-600", 
      descLabel: "Support Requirements",
      fields: [
        { label: "Support Level", options: ["TIER 1 (BASIC)", "TIER 2 (TECHNICAL)", "TIER 3 (EXPERT)"] },
        { label: "Category", options: ["BUG FIXING", "FEATURE ENHANCEMENT", "MAINTENANCE", "GENERAL Q&A"] },
        { label: "Urgency", options: ["P1 - CRITICAL", "P2 - HIGH", "P3 - MEDIUM", "P4 - LOW"] }
      ]
    },
  };

  const current = config[ticketCategory] || config.automation;

  const allRequests = [
    ...INITIAL_REQUESTS.map(req => ({ ...req, type: 'Automation', categoryColor: 'bg-red-50 text-active-red' })),
    ...INITIAL_TRAINING_REQUESTS.map(req => ({ ...req, type: 'Training', categoryColor: 'bg-emerald-50 text-emerald-600' })),
    ...INITIAL_PRESALE_REQUESTS.map(req => ({ ...req, type: 'Presale', categoryColor: 'bg-blue-50 text-blue-600' })),
    ...INITIAL_AFTERSALES_REQUESTS.map(req => ({ ...req, type: 'Aftersales', categoryColor: 'bg-orange-50 text-orange-600' }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const [searchQuery, setSearchQuery] = useState("");
  const filteredRequests = allRequests.filter(req => 
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight">Create Ticket</h2>
          <p className="text-[10px] font-bold text-neutral-gray uppercase tracking-widest mt-1">Submit a new request</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`${current.color} p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors`}>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">{current.title}</h2>
            <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-1">{current.subtitle}</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-gray uppercase tracking-widest block font-sans">Support Category</label>
            <select 
              value={ticketCategory}
              onChange={(e) => setTicketCategory(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-black outline-none focus:border-black transition-all appearance-none cursor-pointer uppercase"
            >
              <option value="automation">Automation Request</option>
              <option value="training">Training Request</option>
              <option value="presale">Presale Capacity</option>
              <option value="aftersales">Aftersales Capacity</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-gray uppercase tracking-widest block font-sans">Request Title</label>
              <input 
                type="text" 
                placeholder="ENTER SUBJECT..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-black outline-none focus:border-black transition-all uppercase placeholder:opacity-30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-gray uppercase tracking-widest block font-sans">Priority</label>
              <select className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-black outline-none focus:border-black transition-all appearance-none cursor-pointer">
                <option>LOW</option>
                <option>MEDIUM</option>
                <option>HIGH</option>
                <option>URGENT</option>
              </select>
            </div>
          </div>

          {/* Dynamic Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {current.fields.map((f, i) => (
              <div key={i} className="space-y-2">
                <label className="text-[10px] font-black text-neutral-gray uppercase tracking-widest block font-sans">{f.label}</label>
                <select className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold text-black outline-none focus:border-black transition-all appearance-none cursor-pointer">
                  {f.options.map((opt, idx) => (
                    <option key={idx}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-gray uppercase tracking-widest block font-sans">{current.descLabel}</label>
            <textarea 
              rows={3}
              placeholder="PROPERLY DESCRIBE THE REQUIREMENTS OR SCOPE..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-black outline-none focus:border-black transition-all placeholder:opacity-30 resize-none"
            />
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
            <button 
              className={`px-8 py-4 ${current.color} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-black/10 font-sans ml-auto`}
            >
              Submit Request
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black text-black uppercase tracking-widest leading-none">Global Request Queue</h2>
            <div className="px-2.5 py-1 bg-gray-100 rounded-full text-[10px] font-black text-neutral-gray uppercase">
              {filteredRequests.length} Total
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-gray" />
            <input 
              type="text"
              placeholder="SEARCH ALL TICKETS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-[10px] font-bold text-black focus:bg-white focus:border-black outline-none transition-all w-48 sm:w-64 placeholder:opacity-40"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Request Detail</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Category</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Requester</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRequests.map((req, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-black opacity-60 tracking-widest mb-1">{req.id}</span>
                      <span className="text-xs font-bold text-black uppercase tracking-tight">{req.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`inline-flex items-center px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${req.categoryColor}`}>
                      {req.type}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-black uppercase tracking-tight">{req.requester}</span>
                      <span className="text-[9px] text-neutral-gray font-bold uppercase tracking-widest opacity-60">{req.team}</span>
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
                  <td className="px-6 py-5 text-right">
                    <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest opacity-60">{req.date}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AutomationRequestView() {
  const [requests] = useState(INITIAL_REQUESTS);
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
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black text-black uppercase tracking-widest leading-none">Request Queue</h2>
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
    </div>
  );
}

// Mock Data for Training
const TRAINING_PICS = [
  { id: "TPIC001", name: "Ronal", role: "Leadership Trainer", tasks: 4 },
  { id: "TPIC002", name: "Ronny Saputra", role: "Technical Specialist", tasks: 2 },
  { id: "TPIC003", name: "Achmad Mutaqin", role: "Compliance Lead", tasks: 6 },
  { id: "TPIC004", name: "Disiana Fawwazsya", role: "Soft Skills Coach", tasks: 3 },
];

const INITIAL_TRAINING_REQUESTS = [
  { id: "TR-2024-001", title: "New Hire Onboarding", requester: "Maria Hill", team: "HR", pic: "Ronal", status: "In Progress", priority: "High", date: "2024-05-02" },
  { id: "TR-2024-002", title: "Advanced Excel Workshop", requester: "Phil Coulson", team: "Support A", pic: "Ronny Saputra", status: "Pending", priority: "Medium", date: "2024-05-04" },
  { id: "TR-2024-003", title: "Security Awareness", requester: "Nick Fury", team: "Global", pic: "Achmad Mutaqin", status: "Completed", priority: "High", date: "2024-04-30" },
  { id: "TR-2024-004", title: "Customer Empathy Training", requester: "Peggy Carter", team: "Support B", pic: "Disiana Fawwazsya", status: "In Progress", priority: "Low", date: "2024-05-06" },
];

function TrainingRequestView() {
  const [requests] = useState(INITIAL_TRAINING_REQUESTS);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRequests = requests.filter(req => 
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* PICs Row (No Workload) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {TRAINING_PICS.map((pic) => (
          <div key={pic.id} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-black transition-colors">
                <User className="w-5 h-5 text-neutral-gray group-hover:text-white" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-black uppercase tracking-tight truncate">{pic.name}</h3>
                <p className="text-[9px] text-neutral-gray font-bold uppercase tracking-widest opacity-60">{pic.role}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-neutral-gray opacity-40" />
                <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest">{pic.tasks} Assigned Sessions</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Ticket Queue */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black text-black uppercase tracking-widest leading-none">Training sessions</h2>
            <div className="px-2.5 py-1 bg-gray-100 rounded-full text-[10px] font-black text-neutral-gray uppercase">
              {requests.length} Requests
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-gray" />
              <input 
                type="text"
                placeholder="FIND TRAINING..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-[10px] font-bold text-black focus:bg-white focus:border-black outline-none transition-all w-48 sm:w-64 placeholder:opacity-40"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Training Title</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Originator</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Facilitator</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Priority</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-emerald-600 tracking-widest mb-1">{req.id}</span>
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
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-[10px] font-bold text-emerald-700">
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
    </div>
  );
}

function PresaleRequestView() {
  const [requests] = useState(INITIAL_PRESALE_REQUESTS);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRequests = requests.filter(req => 
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRESALE_PICS.map((pic) => (
          <div key={pic.id} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-black transition-colors">
                <User className="w-5 h-5 text-neutral-gray group-hover:text-white" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest block">Workload</span>
                <span className={`text-sm font-bold ${pic.workload > 80 ? 'text-active-red' : 'text-blue-600'}`}>
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
                  className={`h-full rounded-full ${pic.workload > 80 ? 'bg-active-red' : 'bg-blue-500'}`} 
                  style={{ width: `${pic.workload}%` }} 
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black text-black uppercase tracking-widest leading-none">Presale Queue</h2>
            <div className="px-2.5 py-1 bg-gray-100 rounded-full text-[10px] font-black text-neutral-gray uppercase">
              {requests.length} Requests
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-gray" />
              <input 
                type="text"
                placeholder="FIND PRESALE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-[10px] font-bold text-black focus:bg-white focus:border-black outline-none transition-all w-48 sm:w-64 placeholder:opacity-40"
              />
            </div>
          </div>
        </div>

         <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Project Title</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Client / Team</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Presale PIC</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Priority</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-blue-600 tracking-widest mb-1">{req.id}</span>
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
                       <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-700">
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
    </div>
  );
}

function AftersalesRequestView() {
  const [requests] = useState(INITIAL_AFTERSALES_REQUESTS);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRequests = requests.filter(req => 
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AFTERSALES_PICS.map((pic) => (
          <div key={pic.id} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-black transition-colors">
                <User className="w-5 h-5 text-neutral-gray group-hover:text-white" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest block">Workload</span>
                <span className={`text-sm font-bold ${pic.workload > 80 ? 'text-active-red' : 'text-orange-600'}`}>
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
                  className={`h-full rounded-full ${pic.workload > 80 ? 'bg-active-red' : 'bg-orange-500'}`} 
                  style={{ width: `${pic.workload}%` }} 
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black text-black uppercase tracking-widest leading-none">Aftersales Queue</h2>
            <div className="px-2.5 py-1 bg-gray-100 rounded-full text-[10px] font-black text-neutral-gray uppercase">
              {requests.length} Requests
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-gray" />
              <input 
                type="text"
                placeholder="FIND AFTERSALES..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-[10px] font-bold text-black focus:bg-white focus:border-black outline-none transition-all w-48 sm:w-64 placeholder:opacity-40"
              />
            </div>
          </div>
        </div>

         <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Project Title</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Client / Team</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Aftersales PIC</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Priority</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-orange-600 tracking-widest mb-1">{req.id}</span>
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
                       <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center text-[10px] font-bold text-orange-700">
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
                      ${req.priority === 'Urgent' ? 'text-active-red' :
                        req.priority === 'High' ? 'text-active-red' : 
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
    </div>
  );
}

function AdminAssignmentView() {
  const allRequests = [
    ...INITIAL_REQUESTS.map(req => ({ ...req, type: 'Automation', categoryColor: 'bg-red-50 text-active-red' })),
    ...INITIAL_TRAINING_REQUESTS.map(req => ({ ...req, type: 'Training', categoryColor: 'bg-emerald-50 text-emerald-600' })),
    ...INITIAL_PRESALE_REQUESTS.map(req => ({ ...req, type: 'Presale', categoryColor: 'bg-blue-50 text-blue-600' })),
    ...INITIAL_AFTERSALES_REQUESTS.map(req => ({ ...req, type: 'Aftersales', categoryColor: 'bg-orange-50 text-orange-600' }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const ALL_PICS = [
    "Achmad Mutaqin",
    "Disiana Fawwazsya",
    "Dwi Kurnianto",
    "Heru Setiawan",
    "Ronal",
    "Ronny Saputra",
    "Unassigned"
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const filteredRequests = allRequests.filter(req => 
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.pic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight">Assignment Admin</h2>
          <p className="text-[10px] font-bold text-neutral-gray uppercase tracking-widest mt-1">Manage Ticket Allocations</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black text-black uppercase tracking-widest leading-none">Task Assignment List</h2>
            <div className="px-2.5 py-1 bg-gray-100 rounded-full text-[10px] font-black text-neutral-gray uppercase">
              {filteredRequests.length} Total
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-gray" />
            <input 
              type="text"
              placeholder="SEARCH BY TITLE OR PIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-[10px] font-bold text-black focus:bg-white focus:border-black outline-none transition-all w-48 sm:w-64 placeholder:opacity-40 uppercase"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Ticket ID / Title</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Type</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Current Assignee</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-gray uppercase tracking-widest border-b border-gray-100">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRequests.map((req, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-black opacity-60 tracking-widest mb-1">{req.id}</span>
                      <span className="text-xs font-bold text-black uppercase tracking-tight">{req.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`inline-flex items-center px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${req.categoryColor}`}>
                      {req.type}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg max-w-[200px]">
                      <User className="w-3.5 h-3.5 text-neutral-gray" />
                      <span className="text-[10px] font-bold text-black uppercase">{req.pic}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <select 
                      className="w-full max-w-[200px] px-3 py-2 bg-white border border-gray-200 hover:border-black rounded-lg text-[10px] font-bold text-black outline-none focus:border-black transition-all appearance-none cursor-pointer uppercase"
                      defaultValue={req.pic}
                    >
                      <option value="" disabled>-- REASSIGN --</option>
                      {ALL_PICS.map(picName => (
                        <option key={picName} value={picName}>{picName}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function SupportModule({ onBack }: SupportModuleProps) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8 lg:space-y-12 pb-20"
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
            {activeTab === "dashboard" ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <SupportDashboardView />
              </motion.div>
            ) : activeTab === "automation" ? (
              <motion.div
                key="automation"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <AutomationRequestView />
              </motion.div>
            ) : activeTab === "training" ? (
              <motion.div
                key="training"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <TrainingRequestView />
              </motion.div>
            ) : activeTab === "presale" ? (
              <motion.div
                key="presale"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <PresaleRequestView />
              </motion.div>
            ) : activeTab === "aftersales" ? (
              <motion.div
                key="aftersales"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <AftersalesRequestView />
              </motion.div>
            ) : activeTab === "admin" ? (
              <motion.div
                key="admin"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <AdminAssignmentView />
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
                  This queue section is currently under development. You can submit requests for this category via the main Dashboard tab.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
