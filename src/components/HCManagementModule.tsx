import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Users, 
  UserMinus, 
  TrendingUp, 
  Filter, 
  Search,
  Download,
  Mail,
  MoreHorizontal,
  Briefcase,
  Calendar,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  CheckCircle2,
  Sun,
  Moon
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
  Legend
} from "recharts";

interface HCManagementModuleProps {
  onBack: () => void;
}

const attritionData = [
  { name: 'Jan', attrition: 2.1, hiring: 15 },
  { name: 'Feb', attrition: 1.8, hiring: 12 },
  { name: 'Mar', attrition: 2.5, hiring: 18 },
  { name: 'Apr', attrition: 1.2, hiring: 20 },
  { name: 'May', attrition: 1.5, hiring: 14 },
];

const SITES = ["Jakarta", "Surabaya", "Bandung"];
const UNITS = ["Operation", "Support", "Technology"];
const PROJECTS = ["Project Alpha", "Project Beta"];
const LANGUAGES = ["English", "Indonesian", "Japanese"];

const employeeList = [
  { id: "EMP001", name: "Alexander Mitchell", role: "Ops Lead", status: "Active", joinDate: "2023-05-12", email: "a.mitchell@transforce.com", site: "Jakarta", unit: "Operation", project: "Project Alpha" },
  { id: "EMP002", name: "Sarah Jenkins", role: "Sr. Analyst", status: "Active", joinDate: "2023-06-15", email: "s.jenkins@transforce.com", site: "Surabaya", unit: "Support", project: "Project Beta" },
  { id: "EMP003", name: "David Chen", role: "Support Spec", status: "On Leave", joinDate: "2024-01-10", email: "d.chen@transforce.com", site: "Bandung", unit: "Technology", project: "Project Alpha" },
  { id: "EMP004", name: "Elena Rodriguez", role: "QC Engineer", status: "Active", joinDate: "2022-11-20", email: "e.rodriguez@transforce.com", site: "Jakarta", unit: "Operation", project: "Project Beta" },
  { id: "EMP005", name: "Marcus Thorne", role: "Wfm Manager", status: "Active", joinDate: "2023-02-28", email: "m.thorne@transforce.com", site: "Surabaya", unit: "Support", project: "Project Alpha" },
];

export default function HCManagementModule({ onBack }: HCManagementModuleProps) {
  const [activeView, setActiveView] = useState("overview");

  const [filterMode, setFilterMode] = useState<"month" | "range" | "single">("month");
  const [selectedSite, setSelectedSite] = useState("all");
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");

  // CRUD State
  const [employees, setEmployees] = useState(employeeList);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    role: "",
    status: "Active",
    joinDate: new Date().toISOString().split('T')[0],
    email: ""
  });

  const handleEdit = (emp: any) => {
    setEditingEmployee(emp);
    setFormData(emp);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      setEmployees(employees.filter(e => e.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      setEmployees(employees.map(e => e.id === editingEmployee.id ? formData : e));
    } else {
      const newId = `EMP${String(employees.length + 1).padStart(3, '0')}`;
      setEmployees([...employees, { ...formData, id: newId }]);
    }
    setIsFormOpen(false);
    setEditingEmployee(null);
    setFormData({ id: "", name: "", role: "", status: "Active", joinDate: new Date().toISOString().split('T')[0], email: "" });
  };

  const renderOverview = () => {
      const filteredCount = employees
        .filter(emp => selectedSite === "all" || (emp as any).site === selectedSite)
        .filter(emp => selectedUnit === "all" || (emp as any).unit === selectedUnit)
        .filter(emp => selectedProject === "all" || (emp as any).project === selectedProject)
        .length;
  
      return (
        <div className="space-y-6 sm:space-y-8">
          {/* Top Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity hidden sm:block">
              <Users className="w-16 h-16 text-black" />
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold text-neutral-gray uppercase tracking-widest mb-1">Total Active HC</p>
            <div className="flex items-end gap-3">
              <p className="text-2xl sm:text-3xl font-black text-black">{filteredCount.toString().padStart(3, '0')}</p>
              <span className="text-active-red font-bold text-[10px] sm:text-xs mb-1">+12 this month</span>
            </div>
          </div>
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group font-sans">
          <p className="text-[9px] sm:text-[10px] font-bold text-neutral-gray uppercase tracking-widest mb-1">Attrition Rate</p>
          <div className="flex items-end gap-3">
            <p className="text-2xl sm:text-3xl font-black text-black">1.52%</p>
            <span className="text-green-600 font-bold text-[10px] sm:text-xs mb-1">−0.4% vs prev</span>
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group sm:col-span-2 lg:col-span-1">
          <p className="text-[9px] sm:text-[10px] font-bold text-neutral-gray uppercase tracking-widest mb-1">Pending Requests</p>
          <div className="flex items-end gap-3">
            <p className="text-2xl sm:text-3xl font-black text-black">08</p>
            <span className="text-neutral-gray font-bold text-[10px] sm:text-xs mb-1">Approvals required</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-black uppercase tracking-tight">Growth vs Attrition Trends</h3>
              <p className="text-[9px] text-neutral-gray font-bold uppercase tracking-widest mt-1">Monthly performance analysis</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-bold uppercase text-neutral-gray">
                <div className="w-2 h-2 rounded-full bg-active-red" /> Hiring
              </div>
              <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-bold uppercase text-neutral-gray">
                <div className="w-2 h-2 rounded-full bg-black" /> Attrition
              </div>
            </div>
          </div>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attritionData}>
                <defs>
                  <linearGradient id="colorHiring" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D1102B" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#D1102B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="hiring" stroke="#D1102B" fillOpacity={1} fill="url(#colorHiring)" strokeWidth={2} />
                <Line type="monotone" dataKey="attrition" stroke="#000" strokeWidth={2} dot={{ r: 4, fill: '#000' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-xs sm:text-sm font-bold text-black uppercase tracking-tight mb-6">Summary Metrics</h3>
          <div className="space-y-4 sm:space-y-6">
            {[
              { label: "Daily Variance", title: "Shift Coverage", val: "98.2%", status: "Optimal", icon: Calendar, color: "text-neutral-gray", sColor: "text-green-600" },
              { label: "Weekly Health", title: "Net Growth", val: "+4.5%", status: "Year to Date", icon: TrendingUp, color: "text-neutral-gray", sColor: "text-neutral-gray" },
              { label: "Attrition Risk", title: "Critical Resigns", val: "02", status: "Action Needed", icon: AlertCircle, color: "text-active-red", sColor: "text-active-red" },
            ].map((metric, i) => (
              <div key={i} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-gray-100 hidden xs:block">
                    <metric.icon className={`w-3.5 h-3.5 ${metric.color}`} />
                  </div>
                  <div>
                    <p className="text-[8px] sm:text-[9px] font-bold text-neutral-gray uppercase tracking-widest">{metric.label}</p>
                    <p className="text-xs sm:text-sm font-bold text-black">{metric.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-base sm:text-lg font-black ${metric.label === 'Attrition Risk' ? 'text-active-red' : 'text-black'}`}>{metric.val}</p>
                  <p className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest ${metric.sColor}`}>{metric.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  };

  const renderEmployees = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-gray" />
          <input 
            type="text" 
            placeholder="SEARCH EMPLOYEE NAME OR ID..." 
            className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-[11px] font-bold uppercase tracking-tight focus:ring-1 focus:ring-black outline-none"
          />
        </div>
        <div className="flex flex-row items-center gap-2">
          <button className="flex-1 sm:flex-none justify-center px-4 py-2.5 border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:border-black transition-all">
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
          <button className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-active-red transition-all">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden divide-y divide-gray-50">
        {employees
          .filter(emp => selectedSite === "all" || (emp as any).site === selectedSite)
          .filter(emp => selectedUnit === "all" || (emp as any).unit === selectedUnit)
          .filter(emp => selectedProject === "all" || (emp as any).project === selectedProject)
          .map((emp) => (
          <div key={emp.id} className="p-4 flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-[10px] text-neutral-gray">
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-black">{emp.name}</p>
                    <p className="text-[10px] text-neutral-gray uppercase tracking-tighter mt-0.5">{emp.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button className="p-2 text-neutral-gray hover:text-black transition-colors"><Mail className="w-4 h-4" /></button>
                   <button className="p-2 text-neutral-gray hover:text-black transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                <div>
                   <p className="text-[8px] font-bold text-neutral-gray uppercase tracking-widest">Role</p>
                   <p className="text-[11px] font-bold text-black flex items-center gap-1.5 mt-0.5">
                     <Briefcase className="w-3 h-3 text-neutral-gray/40" /> {emp.role}
                   </p>
                </div>
                <div>
                   <p className="text-[8px] font-bold text-neutral-gray uppercase tracking-widest">Status/Join Date</p>
                   <div className="flex flex-col gap-1 mt-0.5">
                     <span className={`w-fit px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                        emp.status === 'Active' ? 'bg-green-50 text-green-600' : 
                        emp.status === 'On Leave' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-neutral-gray'
                      }`}>
                        {emp.status}
                      </span>
                      <p className="text-[10px] font-bold text-neutral-gray mt-1">{emp.joinDate}</p>
                   </div>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-neutral-gray uppercase tracking-widest whitespace-nowrap">Employee Details</th>
              <th className="px-6 py-4 text-[10px] font-bold text-neutral-gray uppercase tracking-widest whitespace-nowrap">Role/Position</th>
              <th className="px-6 py-4 text-[10px] font-bold text-neutral-gray uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-neutral-gray uppercase tracking-widest whitespace-nowrap">Join Date</th>
              <th className="px-6 py-4 text-[10px] font-bold text-neutral-gray uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-xs">
            {employees
              .filter(emp => selectedSite === "all" || (emp as any).site === selectedSite)
              .filter(emp => selectedUnit === "all" || (emp as any).unit === selectedUnit)
              .filter(emp => selectedProject === "all" || (emp as any).project === selectedProject)
              .map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-[10px] text-neutral-gray group-hover:border-active-red transition-colors">
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-black">{emp.name}</p>
                      <p className="text-[10px] text-neutral-gray uppercase tracking-tighter mt-0.5">{emp.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3 h-3 text-neutral-gray opacity-40" />
                    <span className="font-medium text-black whitespace-nowrap">{emp.role}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                      emp.status === 'Active' ? 'bg-green-50 text-green-600' : 
                      emp.status === 'On Leave' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-neutral-gray'
                    }`}>
                      {emp.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 font-bold text-neutral-gray whitespace-nowrap">
                  {emp.joinDate}
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1.5 text-neutral-gray hover:text-black transition-colors"><Mail className="w-4 h-4" /></button>
                    <button className="p-1.5 text-neutral-gray hover:text-black transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex flex-col xs:flex-row items-center justify-between gap-4">
        <p className="text-[9px] font-bold text-neutral-gray uppercase tracking-widest">Showing {employees.length} of 428 records</p>
        <div className="flex gap-1.5">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-[11px] font-bold hover:bg-white transition-colors">1</button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-bold text-neutral-gray hover:bg-white hover:border-gray-200 transition-colors">2</button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-bold text-neutral-gray hover:bg-white hover:border-gray-200 transition-colors">3</button>
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {isFormOpen ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xl max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-black uppercase tracking-widest">
                {editingEmployee ? 'Update Identity' : 'Create New Identity'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-neutral-gray" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-gray uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[11px] font-bold focus:ring-1 focus:ring-black outline-none transition-all"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-gray uppercase tracking-widest ml-1">Corporate Email</label>
                  <input 
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[11px] font-bold focus:ring-1 focus:ring-black outline-none transition-all"
                    placeholder="name@transforce.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-gray uppercase tracking-widest ml-1">Assigned Role</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[11px] font-bold uppercase focus:ring-1 focus:ring-black outline-none transition-all"
                  >
                    <option value="">Select Role</option>
                    <option value="Ops Lead">Ops Lead</option>
                    <option value="Sr. Analyst">Sr. Analyst</option>
                    <option value="Support Spec">Support Spec</option>
                    <option value="QC Engineer">QC Engineer</option>
                    <option value="Wfm Manager">Wfm Manager</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-gray uppercase tracking-widest ml-1">Current Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[11px] font-bold uppercase focus:ring-1 focus:ring-black outline-none transition-all"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-gray uppercase tracking-widest ml-1">Enrollment Date</label>
                  <input 
                    type="date"
                    value={formData.joinDate}
                    onChange={e => setFormData({ ...formData, joinDate: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[11px] font-bold uppercase focus:ring-1 focus:ring-black outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50 flex gap-3">
                <button 
                  type="submit"
                  className="flex-1 bg-black text-white hover:bg-active-red py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> {editingEmployee ? 'Commit Changes' : 'Initialize Identity'}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-black uppercase tracking-tight">Identity Management</h3>
                <p className="text-[10px] text-neutral-gray font-bold uppercase tracking-widest mt-1 italic">Administrative Control Panel</p>
              </div>
              <button 
                onClick={() => { setEditingEmployee(null); setIsFormOpen(true); }}
                className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-active-red transition-all shadow-lg shadow-black/10"
              >
                <Plus className="w-4 h-4" /> Create New User
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-bold text-neutral-gray uppercase tracking-widest">User ID & Name</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-neutral-gray uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-neutral-gray uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-neutral-gray uppercase tracking-widest text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees
                    .filter(emp => selectedSite === "all" || (emp as any).site === selectedSite)
                    .filter(emp => selectedUnit === "all" || (emp as any).unit === selectedUnit)
                    .filter(emp => selectedProject === "all" || (emp as any).project === selectedProject)
                    .map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-[10px] text-neutral-gray">
                            {emp.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-black">{emp.name}</p>
                            <p className="text-[9px] text-neutral-gray font-medium uppercase tracking-tighter">{emp.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-neutral-gray uppercase bg-gray-100 px-2 py-0.5 rounded">{emp.role}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Active' ? 'bg-green-500' : emp.status === 'On Leave' ? 'bg-amber-500' : 'bg-gray-300'}`} />
                          <span className="text-[10px] font-bold text-black uppercase">{emp.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(emp)}
                            className="p-2 text-neutral-gray hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(emp.id)}
                            className="p-2 text-neutral-gray hover:text-active-red hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="space-y-6 sm:space-y-10 -mt-2 sm:-mt-4"
    >
      <div className="px-1">
        <div className="flex flex-col gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
          {/* Row 1: Side-by-Side Filters */}
          <div className="flex flex-wrap items-center gap-6 px-2 pb-2 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest whitespace-nowrap">Time:</span>
              <div className="flex bg-gray-100 p-0.5 rounded-lg">
                {(["month", "range", "single"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase transition-all ${
                      filterMode === mode ? "bg-white text-black shadow-sm" : "text-neutral-gray hover:text-black"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {filterMode === "month" && (
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-gray pointer-events-none" />
                    <input 
                      type="month" 
                      className="bg-gray-50 border border-gray-100 rounded-xl pl-8 pr-4 py-1.5 text-[10px] font-black uppercase outline-none focus:ring-1 focus:ring-black/10 min-w-[140px]"
                    />
                  </div>
                )}
                {filterMode === "range" && (
                  <div className="flex items-center gap-1">
                    <div className="relative">
                      <input 
                        type="date" 
                        className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase outline-none focus:ring-1 focus:ring-black/10 w-[110px]"
                      />
                    </div>
                    <span className="text-[10px] text-neutral-gray">-</span>
                    <div className="relative">
                      <input 
                        type="date" 
                        className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase outline-none focus:ring-1 focus:ring-black/10 w-[110px]"
                      />
                    </div>
                  </div>
                )}
                {filterMode === "single" && (
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-gray pointer-events-none" />
                    <input 
                      type="date" 
                      className="bg-gray-50 border border-gray-100 rounded-xl pl-8 pr-4 py-1.5 text-[10px] font-black uppercase outline-none focus:ring-1 focus:ring-black/10 min-w-[140px]"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="h-4 w-px bg-gray-100 hidden lg:block" />

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest">Site:</span>
              <select 
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-black/10 min-w-[140px]"
              >
                <option value="all">ALL SITES</option>
                {SITES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest">Unit:</span>
              <select 
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-black/10 min-w-[140px]"
              >
                <option value="all">ALL UNITS</option>
                {UNITS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
              </select>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-neutral-gray uppercase tracking-widest">Project:</span>
              <select 
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-black/10 min-w-[160px]"
              >
                <option value="all">ALL PROJECTS</option>
                {PROJECTS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
              </select>
            </div>

            <div className="ml-auto hidden md:block">
              <p className="text-[9px] font-black text-neutral-gray uppercase tracking-[0.2em] opacity-30">Global HC Filters</p>
            </div>
          </div>

          <nav className="flex items-center p-1 overflow-x-auto no-scrollbar scrollbar-hide">
            <div className="flex items-center min-w-max gap-2">
              {[
                { id: 'overview', label: 'Summary', icon: TrendingUp },
                { id: 'employees', label: 'Employees', icon: Users },
                { id: 'user-management', label: 'Identity CRUD', icon: CheckCircle2 },
                { id: 'attrition', label: 'Analytics', icon: UserMinus },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeView === tab.id 
                      ? 'bg-black text-white shadow-xl shadow-black/20' 
                      : 'text-neutral-gray hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>

      <motion.div
        key={activeView}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeView === 'overview' && renderOverview()}
        {activeView === 'employees' && renderEmployees()}
        {activeView === 'user-management' && renderUserManagement()}
        {activeView === 'attrition' && (
          <div className="py-20 sm:py-32 bg-white rounded-2xl sm:rounded-[32px] border border-gray-100 shadow-sm text-center px-6">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserMinus className="w-8 h-8 text-gray-200" />
            </div>
            <h3 className="text-[10px] sm:text-xs font-black text-gray-300 uppercase tracking-[0.3em] leading-relaxed">Attrition Predictor Data Synthesis In Progress</h3>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
