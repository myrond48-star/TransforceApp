import React from "react";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  Info, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Mail, 
  Phone, 
  MapPin,
  CheckCircle2,
  Cpu
} from "lucide-react";

interface AboutModuleProps {
  onBack: () => void;
}

export default function AboutModule({ onBack }: AboutModuleProps) {
  const highlights = [
    {
      icon: Zap,
      title: "Real-time Capacity Planning",
      description: "Advanced algorithms for instant workforce optimization and capacity calculations."
    },
    {
      icon: ShieldCheck,
      title: "Enterprise Governance",
      description: "Strict HC governance filters and identity lifecycle management for maximum security."
    },
    {
      icon: Info,
      title: "Unified Intelligence",
      description: "Centralized dashboard for KPI tracking, P&L analysis, and facilities oversight."
    },
    {
      icon: Cpu,
      title: "Automated Workflows",
      description: "Streamlined ID creation/deletion and reporting automation to reduce manual overhead."
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8 sm:space-y-12 max-w-5xl mx-auto px-1"
    >
      {/* Header Area */}
      <div className="flex items-center gap-4 sm:gap-8 border-b border-gray-100 pb-8 sm:pb-10">
        <button 
          onClick={onBack}
          className="w-12 h-12 sm:w-14 sm:h-14 bg-white border border-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center hover:border-black hover:shadow-xl transition-all group shrink-0"
        >
          <ArrowLeft className="w-5 sm:w-6 h-5 sm:h-6 text-black group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-black uppercase tracking-tight leading-none">About System</h1>
          <p className="text-[9px] sm:text-xs text-neutral-gray font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2 italic opacity-70">Application Integrity & Performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
        {/* Branding & Version Column */}
        <div className="lg:col-span-1 space-y-6 sm:space-y-8">
          <div className="bg-white p-8 sm:p-10 rounded-2xl sm:rounded-[32px] border border-gray-100 shadow-sm text-center flex flex-col items-center">
            <div className="flex flex-col items-center mb-8 pointer-events-none">
              <div className="flex items-center gap-1">
                <span className="text-3xl sm:text-4xl font-bold tracking-tighter text-black uppercase leading-none">trans</span>
                <span className="text-3xl sm:text-4xl font-bold tracking-tighter text-active-red uppercase leading-none">force</span>
              </div>
              <div className="h-[2px] sm:h-[3px] bg-active-red w-full mt-1 mb-1 shadow-[0_2px_4px_rgba(209,16,43,0.3)]" />
              <span className="text-[10px] sm:text-[12px] font-bold tracking-[0.3em] sm:tracking-[0.4em] text-neutral-gray uppercase block mt-1">
                — Management —
              </span>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold text-neutral-gray uppercase tracking-widest mb-1.5">Current Release</p>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-black text-white rounded-full text-[10px] sm:text-xs font-bold font-mono">
                   v1.0.4-stable
                </div>
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold text-neutral-gray uppercase tracking-widest mb-1.5">Build Identifier</p>
                <p className="text-[10px] sm:text-xs font-mono font-bold text-black opacity-80 uppercase">04052026.BUILD.772</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border border-gray-100 space-y-6">
            <h3 className="text-[10px] sm:text-xs font-bold text-black uppercase tracking-widest border-b border-gray-200 pb-4 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Support Channels
            </h3>
            <div className="space-y-5">
              {[
                { icon: Globe, label: "Internal Portal", value: "https://transforce.id" },
                { icon: Mail, label: "Help Desk", value: "wfm-support@transcosmos.co.id" },
                { icon: Phone, label: "VoIP Extension", value: "Ext. xxxx (Internal Only)" },
                { icon: MapPin, label: "HQ Location", value: "Jakarta Headquarters" },
              ].map((contact, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 shrink-0">
                    <contact.icon className="w-4 h-4 text-active-red" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] font-bold text-neutral-gray uppercase tracking-widest leading-none">{contact.label}</p>
                    <p className="text-[11px] sm:text-xs font-bold text-black mt-1.5 truncate">{contact.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Highlights & Information Column */}
        <div className="lg:col-span-2 space-y-8 sm:space-y-10">
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight">Key Capabilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {highlights.map((item, idx) => (
                <div key={idx} className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 hover:border-active-red/20 transition-all group">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-active-red group-hover:text-white transition-all duration-300">
                    <item.icon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-black mb-2 uppercase tracking-tight">{item.title}</h4>
                  <p className="text-[11px] sm:text-xs text-neutral-gray leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black text-white p-8 sm:p-10 rounded-3xl sm:rounded-[40px] relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-active-red opacity-10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-active-red animate-pulse" />
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">Operational Readiness</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-4 uppercase tracking-tight">Mission Critical Build</h3>
              <p className="text-white/70 text-xs sm:text-[13px] leading-relaxed mb-8 max-w-xl">
                Transforce is engineered to sustain 99.9% operational availability. This platform serves as the backbone for capacity decision-making across Transcosmos Indonesia's multi-site infrastructure.
              </p>
              <div className="flex flex-wrap gap-3">
                {["SSL Secure", "Zero-Trust", "Real-time Sync", "Cloud Tech"].map(label => (
                  <div key={label} className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-white/20 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-active-red" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center pt-6 sm:pt-10 text-center">
            <p className="text-[9px] sm:text-[10px] font-bold text-neutral-gray uppercase tracking-[0.4em] mb-4">Engineering Secretariat</p>
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-neutral-gray opacity-60">POWERED BY</span>
              <span className="text-base sm:text-lg font-black text-black uppercase tracking-tighter decoration-active-red/40 decoration-2 underline-offset-8 underline decoration-double">Transcosmos Indonesia</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
