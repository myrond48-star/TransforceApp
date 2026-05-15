import React from "react";
import { motion } from "motion/react";
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Activity, 
  Server, 
  ArrowLeft, 
  Database,
  Globe,
  Fingerprint,
  Eye,
  AlertTriangle,
  Users
} from "lucide-react";

interface SecurityModuleProps {
  onBack: () => void;
}

export default function SecurityModule({ onBack }: SecurityModuleProps) {
  const securityPillars = [
    {
      id: "perimeter",
      title: "Network Perimeter",
      focus: "Blocking physical access from the internet.",
      highlight: "The database is restricted to localhost, meaning it cannot be reached from any external IP. All traffic is funneled through a secure Cloudflare Tunnel, and connections are encrypted via TLS 1.3.",
      icon: Globe,
      status: "Active",
      color: "blue"
    },
    {
      id: "auth",
      title: "Authentication",
      focus: "Verifying identity with strong credentials.",
      highlight: "Uses advanced SCRAM-SHA-256 password hashing. Each service has its own dedicated login (no shared accounts), and passwords are managed as environment secrets rather than being hardcoded.",
      icon: Key,
      status: "Hardened",
      color: "green"
    },
    {
      id: "authorization",
      title: "Authorization",
      focus: "Limiting what a user can do once inside.",
      highlight: "Uses RBAC (Role-Based Access Control) to separate duties (e.g., an app cannot delete tables). Row Level Security (RLS) ensures users can only see data rows that specifically belong to their department or context.",
      icon: Fingerprint,
      status: "Enforced",
      color: "purple"
    },
    {
      id: "protection",
      title: "Data Protection",
      focus: "Safeguarding the data itself, even if it is stolen.",
      highlight: "Sensitive columns (like salaries) are encrypted using pgcrypto. Automated backups are encrypted with AES-256 before being stored in Cloudflare R2. PgBouncer is used to prevent connection exhaustion attacks.",
      icon: Lock,
      status: "Encrypted",
      color: "amber"
    },
    {
      id: "audit",
      title: "Audit & Monitoring",
      focus: "Detecting and responding to suspicious behavior.",
      highlight: "Every major action is logged via pgaudit. Real-time alerts are triggered for failed login bursts, unauthorized table changes, or unusual off-hours activity, ensuring the IT team can respond immediately to threats.",
      icon: Activity,
      status: "Monitoring",
      color: "red"
    }
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black uppercase">Security Framework</h1>
            <p className="text-xs font-bold text-neutral-gray uppercase tracking-[0.2em] mt-1">Enterprise-Grade Protection Protocol</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-full">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          <span className="text-[10px] font-black uppercase text-green-700 tracking-wider">System Status: Secure</span>
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {securityPillars.map((pillar, idx) => (
          <motion.div
            key={pillar.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:border-active-red/10 transition-all duration-500 group relative overflow-hidden"
          >
            {/* Status Badge */}
            <div className={`absolute top-8 right-8 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors
              ${pillar.color === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white' : 
                pillar.color === 'green' ? 'bg-green-50 text-green-600 border-green-100 group-hover:bg-green-600 group-hover:text-white' :
                pillar.color === 'purple' ? 'bg-purple-50 text-purple-600 border-purple-100 group-hover:bg-purple-600 group-hover:text-white' :
                pillar.color === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-600 group-hover:text-white' :
                'bg-red-50 text-red-600 border-red-100 group-hover:bg-red-600 group-hover:text-white'}`}
            >
              {pillar.status}
            </div>

            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-gray-100">
              <pillar.icon className="w-7 h-7 text-black stroke-[1.5]" />
            </div>

            <h3 className="text-lg font-bold text-black mb-1">{pillar.title}</h3>
            <p className="text-[11px] font-bold text-neutral-gray uppercase tracking-wider mb-6 pb-4 border-b border-gray-50">
              Focus: {pillar.focus}
            </p>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-grow">
                  <p className="text-[13px] text-gray-600 leading-relaxed font-medium">
                    {pillar.highlight}
                  </p>
                </div>
              </div>
            </div>

            {/* Background elements */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gray-50/50 rounded-full blur-2xl group-hover:bg-active-red/5 transition-colors" />
          </motion.div>
        ))}

        {/* Technical Implementation Note */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-black rounded-3xl p-8 flex flex-col justify-between text-white relative overflow-hidden xl:col-span-1"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Server className="w-5 h-5 text-gray-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Database Compliance</span>
            </div>
            <h3 className="text-xl font-bold mb-4">PostgreSQL Configuration</h3>
            <div className="space-y-3 font-mono text-[11px] text-gray-400">
              <p className="flex justify-between border-b border-white/10 pb-2">
                <span>ssl_mode</span>
                <span className="text-green-400">verify-full</span>
              </p>
              <p className="flex justify-between border-b border-white/10 pb-2">
                <span>password_encryption</span>
                <span className="text-green-400">scram-sha-256</span>
              </p>
              <p className="flex justify-between border-b border-white/10 pb-2">
                <span>pgaudit.log</span>
                <span className="text-green-400">all</span>
              </p>
              <p className="flex justify-between">
                <span>shared_preload_libraries</span>
                <span className="text-green-400">pg_stat_statements, pgaudit</span>
              </p>
            </div>
          </div>
          
          <div className="mt-8 relative z-10">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <p className="text-[10px] leading-relaxed text-gray-300 italic">
                "Our architecture follows the Principle of Least Privilege (PoLP), ensuring that every component operates with only the minimum permissions necessary."
              </p>
            </div>
          </div>

          {/* Abstract geometric background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-active-red/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px]" />
        </motion.div>
      </div>

      {/* SQL Implementation Showcase */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-5 h-5 text-black" />
          <h2 className="text-sm font-black uppercase tracking-widest">PostgreSQL Hardening Snippets</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1e1e1e] rounded-2xl p-6 overflow-x-auto border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Row Level Security (RLS)</span>
              <Lock className="w-3 h-3 text-gray-500" />
            </div>
            <pre className="text-[11px] text-gray-300 leading-normal">
{`-- Enable RLS on sensitive table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Policy: Users see only their department
CREATE POLICY employee_dept_policy ON employees
    FOR SELECT
    USING (department_id = (
        SELECT department_id FROM app_users 
        WHERE username = current_user
    ));`}
            </pre>
          </div>

          <div className="bg-[#1e1e1e] rounded-2xl p-6 overflow-x-auto border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Column Encryption (pgcrypto)</span>
              <Eye className="w-3 h-3 text-gray-500" />
            </div>
            <pre className="text-[11px] text-gray-300 leading-normal">
{`-- Setup pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert encrypted sensitive data
INSERT INTO payroll (employee_id, salary_encrypted)
VALUES (
  'EMP-123', 
  pgp_sym_encrypt('50000', 'SUPER_SECRET_KEY')
);`}
            </pre>
          </div>
        </div>
      </div>

      {/* Real-time Alerts Simulation */}
      <div className="mt-8 bg-white rounded-3xl border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-active-red" />
            <h2 className="text-sm font-black uppercase tracking-widest text-black">Security Audit Feed</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-neutral-gray uppercase">Live Stream</span>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { time: "08:42:15", type: "SUCCESS", event: "Admin login successful via Cloudflare Tunnel", user: "myrond.48@gmail.com", ip: "172.21.0.1" },
            { time: "09:12:04", type: "AUDIT", event: "Sensitive query executed on table 'payroll'", user: "reporting_service", ip: "localhost" },
            { time: "10:05:33", type: "WARNING", event: "Failed login attempt burst detected", user: "system_guest", ip: "192.168.1.44" },
            { time: "11:30:12", type: "COMPLIANCE", event: "Encrypted backup verified on Cloudflare R2", user: "system_cron", ip: "internal" }
          ].map((log, i) => (
            <div key={i} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
              <div className="text-[10px] font-mono text-neutral-gray w-16">{log.time}</div>
              <div className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter w-20 text-center
                ${log.type === 'SUCCESS' ? 'bg-green-100 text-green-700' : 
                  log.type === 'WARNING' ? 'bg-red-100 text-red-700' : 
                  log.type === 'AUDIT' ? 'bg-blue-100 text-blue-700' : 
                  'bg-gray-100 text-gray-700'}`}>
                {log.type}
              </div>
              <div className="flex-grow">
                <p className="text-xs font-bold text-black">{log.event}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-[10px] text-neutral-gray font-medium flex items-center gap-1">
                    <Users className="w-3 h-3" /> {log.user}
                  </span>
                  <span className="text-[10px] text-neutral-gray font-medium flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {log.ip}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
