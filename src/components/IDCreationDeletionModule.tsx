import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  UserPlus, 
  UserMinus, 
  Search,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Smartphone,
  Mail,
  Shield,
  Key
} from "lucide-react";

interface IDCreationDeletionModuleProps {
  onBack: () => void;
}

const ID_REQUESTS = [
  { id: "REQ001", name: "Alice Johnson", type: "Creation", system: "LDAP", status: "Pending", date: "2024-05-10", priority: "High" },
  { id: "REQ002", name: "Bob Smith", type: "Deletion", system: "SAP", status: "Approved", date: "2024-05-11", priority: "Normal" },
  { id: "REQ003", name: "Charlie Davis", type: "Creation", system: "Email", status: "Completed", date: "2024-05-09", priority: "Low" },
  { id: "REQ004", name: "Diana Prince", type: "Deletion", system: "LDAP", status: "Rejected", date: "2024-05-12", priority: "Critical" },
];

export default function IDCreationDeletionModule({ onBack }: IDCreationDeletionModuleProps) {
  const [activeTab, setActiveTab] = useState<"requests" | "new_request">("requests");
  const [requests, setRequests] = useState(ID_REQUESTS);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRequests = requests.filter(req => 
    req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRequests = () => (
    <div className="space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-gray" />
          <input 
            type="text" 
            placeholder="Search request ID or name..." 
            className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-[11px] font-bold uppercase tracking-tight focus:ring-1 focus:ring-black outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setActiveTab("new_request")}
          className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-active-red transition-all shadow-lg shadow-black/10"
        >
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-[9px] font-bold text-neutral-gray uppercase tracking-widest">Request ID</th>
                <th className="px-6 py-4 text-[9px] font-bold text-neutral-gray uppercase tracking-widest">Employee Name</th>
                <th className="px-6 py-4 text-[9px] font-bold text-neutral-gray uppercase tracking-widest">Operation</th>
                <th className="px-6 py-4 text-[9px] font-bold text-neutral-gray uppercase tracking-widest">System</th>
                <th className="px-6 py-4 text-[9px] font-bold text-neutral-gray uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[9px] font-bold text-neutral-gray uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-[10px] font-bold text-black">{req.id}</td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-black">{req.name}</p>
                    <p className="text-[9px] text-neutral-gray font-medium uppercase mt-0.5">{req.date}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                      req.type === 'Creation' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {req.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold text-neutral-gray">{req.system}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        req.status === 'Completed' ? 'bg-green-500' : 
                        req.status === 'Approved' ? 'bg-blue-500' : 
                        req.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <span className="text-[10px] font-bold text-black uppercase">{req.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-neutral-gray hover:text-black transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderNewRequest = () => (
    <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 rounded-[32px] border border-gray-100 shadow-xl">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight">Identity Lifecycle Request</h2>
          <p className="text-[10px] text-neutral-gray font-bold uppercase tracking-widest mt-2 italic opacity-70">Initialize System Access or Deactivation</p>
        </div>
        <button onClick={() => setActiveTab("requests")} className="p-3 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
          <X className="w-5 h-5 text-neutral-gray" />
        </button>
      </div>

      <form className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-neutral-gray uppercase tracking-widest ml-1">Employee Detail</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-gray" />
              <input 
                type="text" 
                placeholder="Search Employee..." 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold focus:ring-1 focus:ring-black outline-none transition-all"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-neutral-gray uppercase tracking-widest ml-1">Request Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="py-4 rounded-2xl border-2 border-blue-600 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4" /> Creation
              </button>
              <button type="button" className="py-4 rounded-2xl border border-gray-200 bg-white text-neutral-gray text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:border-orange-600 hover:text-orange-600 transition-all">
                <UserMinus className="w-4 h-4" /> Deletion
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-neutral-gray uppercase tracking-widest ml-1">Target Systems</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { id: 'ldap', label: 'LDAP', icon: Shield },
              { id: 'sap', label: 'SAP', icon: Database },
              { id: 'email', label: 'Email', icon: Mail },
              { id: 'mobile', label: 'Mobile', icon: Smartphone }
            ].map(sys => (
              <label key={sys.id} className="cursor-pointer group">
                <input type="checkbox" className="hidden peer" />
                <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col items-center gap-3 group-hover:border-black transition-all peer-checked:bg-black peer-checked:text-white peer-checked:border-black shadow-sm">
                  <sys.icon className="w-5 h-5 opacity-40 group-hover:opacity-100 peer-checked:opacity-100 transition-opacity" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{sys.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-gray-50 flex gap-4">
          <button 
            type="button"
            onClick={() => setActiveTab("requests")}
            className="flex-1 bg-white border border-gray-200 text-neutral-gray py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:border-black hover:text-black"
          >
            Discard
          </button>
          <button 
            type="submit"
            className="flex-[2] bg-black text-white hover:bg-active-red py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3"
          >
            <Send className="w-4 h-4" /> Submit Request
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="space-y-8 -mt-2 sm:-mt-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-1">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center hover:border-black transition-all group shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-black group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight leading-none">ID Lifecycle</h1>
            <p className="text-[9px] text-neutral-gray font-bold uppercase tracking-widest mt-2 italic opacity-70">Identity Provisioning Engine</p>
          </div>
        </div>

        <nav className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit">
          <button 
            onClick={() => setActiveTab("requests")}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "requests" ? "bg-black text-white shadow-lg" : "text-neutral-gray hover:text-black"}`}
          >
            Requests
          </button>
          <button 
            onClick={() => setActiveTab("new_request")}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "new_request" ? "bg-black text-white shadow-lg" : "text-neutral-gray hover:text-black"}`}
          >
            + Create New
          </button>
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "requests" ? renderRequests() : renderNewRequest()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// Missing icons helper
const MoreHorizontal = (props: any) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
);
const Database = (props: any) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>
);
const Send = (props: any) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
);
