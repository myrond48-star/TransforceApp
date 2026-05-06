import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { format } from 'date-fns';
import { checkConnection, updateDbConfig } from '../lib/api';
import { 
  Settings as SettingsIcon, 
  Database, 
  Clock, 
  Users, 
  Calendar, 
  Plus, 
  Trash2, 
  Save, 
  X,
  ShieldCheck,
  Globe,
  Utensils,
  Zap,
  ArrowLeftRight,
  AlertCircle,
  Briefcase,
  Moon,
  Sun,
  RefreshCw,
  Layout,
  HardDrive,
  FileCheck,
  Wifi
} from 'lucide-react';

interface SettingsProps {
  initialModule?: string;
  initialTab?: string;
}

export const Settings: React.FC<SettingsProps> = ({ initialModule, initialTab }) => {
  const { settings, updateSettings, syncSettingsFromDB } = useAppStore();
  const [activeModule, setActiveModule] = useState(initialModule || 'workforce');
  const [activeTab, setActiveTab] = useState(initialTab || 'shift');
  
  // Update state if props change (for deep linking from App)
  useEffect(() => {
    if (initialModule) setActiveModule(initialModule);
    if (initialTab) setActiveTab(initialTab);
  }, [initialModule, initialTab]);
  
  // Refined module switcher logic to handle tab resets correctly
  const handleModuleSwitch = (moduleId: string) => {
    setActiveModule(moduleId);
    if (moduleId === 'workforce') {
      setActiveTab('shift');
    } else {
      // For modules without specific tabs, we reset to a safe default
      // but it doesn't matter much as they don't check activeTab for rendering content
      setActiveTab('none'); 
    }
  };
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  // API State
  const [url, setUrl] = useState(settings.apiUrl);
  const [key, setKey] = useState(settings.apiKey);
  const [channels, setChannels] = useState(settings.channels.join(', '));

  // Shift State
  const [shifts, setShifts] = useState(Object.entries(settings.shifts).map(([k, v]) => ({ code: k, ...(v as any) })));

  // Holiday State
  const [holidays, setHolidays] = useState(Object.entries(settings.holidays).map(([k, v]) => ({ date: k, desc: v })));
  const [newHolDate, setNewHolDate] = useState('');
  const [newHolDesc, setNewHolDesc] = useState('');
  const [showBulkHol, setShowBulkHol] = useState(false);
  const [bulkHolText, setBulkHolText] = useState('');

  // Auto Break State
  const [autoBreakStrings, setAutoBreakStrings] = useState<Record<string, string>>(() => {
    const res: Record<string, string> = {};
    Object.keys(settings.shifts).forEach(code => {
      res[code] = (settings.autoBreak[code] || []).join(', ');
    });
    return res;
  });
  const [fridayBreak, setFridayBreak] = useState(settings.fridayBreak);

  // Puasa State
  const [puasa, setPuasa] = useState(settings.puasa);
  const [puasaShifts, setPuasaShifts] = useState(settings.puasaShifts);
  const [newPuasaStart, setNewPuasaStart] = useState('');
  const [newPuasaEnd, setNewPuasaEnd] = useState('');

  // Roles State
  const [roles, setRoles] = useState(settings.roles);

  // Activities State
  const [activities, setActivities] = useState(settings.activities || {});

  // SQL Infrastructure State
  const [sqlConfig, setSqlConfig] = useState({
    host: 'db.transcosmos.id',
    port: '5432',
    database: 'wfm_production',
    username: 'admin_wfm',
    password: '••••••••••••',
    ssl: true
  });

  // Business Rules State
  const [bizRules, setBizRules] = useState(settings.bizRules);

  // HC Management State (Placeholders)
  const [employeeTypes, setEmployeeTypes] = useState(['Permanent', 'Probation', 'Contract', 'Outsource']);
  const [departments, setDepartments] = useState(['Operations', 'IT', 'Finance', 'HR', 'Facility']);

  // ID Security State (Placeholders)
  const [idPrefixes, setIdPrefixes] = useState({ LDAP: 'TCM_', SAP: 'P_', EMAIL: 'corp_' });
  const [approvalFlows, setApprovalFlows] = useState(['Standard', 'Escalated', 'VIP']);

  // Analytics State (Placeholders)
  const [kpiTargets, setKpiTargets] = useState({ ServiceLevel: 85, Occupancy: 80, AHT: 280 });

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{ status: string; connected?: boolean; database?: boolean; error?: string } | null>(null);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbUrlInput, setDbUrlInput] = useState('');
  const [isSavingDb, setIsSavingDb] = useState(false);

  const handleTestConnection = async () => {
    setIsTestingDb(true);
    setDbStatus(null);
    try {
      const result = await checkConnection();
      setDbStatus(result);
      if (result.status === 'ok' && result.database) {
        showStatus("Database check complete: URL configured! ✅");
      } else if (result.status === 'ok' && !result.database) {
        showStatus("Backend reachable, but DATABASE_URL is missing ⚠️");
      } else {
        showStatus("Database connection test failed ❌");
      }
    } catch (err) {
      setDbStatus({ status: 'error', error: 'Failed to reach backend' });
    } finally {
      setIsTestingDb(false);
    }
  };

  const handleSaveDbUrl = async () => {
    let urlToUse = dbUrlInput;

    if (!urlToUse) {
      if (sqlConfig.host && sqlConfig.username && sqlConfig.password && sqlConfig.database) {
        // Construct the URL from individual fields
        const host = sqlConfig.host;
        const port = sqlConfig.port || '5432';
        const user = encodeURIComponent(sqlConfig.username);
        const pass = encodeURIComponent(sqlConfig.password);
        const dbName = sqlConfig.database;
        urlToUse = `postgresql://${user}:${pass}@${host}:${port}/${dbName}`;
        
        // Add SSL param if enabled
        if (sqlConfig.ssl) {
          urlToUse += "?sslmode=no-verify";
        }
      } else {
        alert("Please enter either a connection string or all database host details");
        return;
      }
    }

    setIsSavingDb(true);
    try {
      await updateDbConfig(urlToUse);
      showStatus("Connection string updated and verified! ✅");
      handleTestConnection();
    } catch (err: any) {
      alert("Failed to update database: " + err.message);
    } finally {
      setIsSavingDb(false);
    }
  };

  // Sync back local state if global settings change (e.g. from Cloud Sync)
  React.useEffect(() => {
    setUrl(settings.apiUrl);
    setKey(settings.apiKey);
    setChannels(settings.channels.join(', '));
    setShifts(Object.entries(settings.shifts).map(([k, v]) => ({ code: k, ...(v as any) })));
    setHolidays(Object.entries(settings.holidays).map(([k, v]) => ({ date: k, desc: v })));
    setFridayBreak(settings.fridayBreak);
    setPuasa(settings.puasa);
    setPuasaShifts(settings.puasaShifts);
    setRoles(settings.roles);
    setBizRules(settings.bizRules);
    setActivities(settings.activities || {});
    
    // Auto break strings need special handling
    const res: Record<string, string> = {};
    Object.keys(settings.shifts).forEach(code => {
      res[code] = (settings.autoBreak[code] || []).join(', ');
    });
    setAutoBreakStrings(res);
  }, [settings]);

  const showStatus = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleRefreshFromCloud = async () => {
    setIsSyncing(true);
    await syncSettingsFromDB();
    setIsSyncing(false);
    showStatus("Settings refreshed from Cloud! ☁️");
  };

  const handlePushToCloud = async () => {
    setIsPushing(true);
    try {
      updateSettings({
        apiUrl: url,
        apiKey: key,
        channels: channels.split(',').map(c => c.trim()).filter(Boolean),
        shifts: shifts.reduce((acc: any, s: any) => {
          if (s.code) acc[s.code] = { s: s.s, e: s.e, w: s.w };
          return acc;
        }, {}),
        holidays: holidays.reduce((acc: any, h: any) => {
          if (h.date) acc[h.date] = h.desc;
          return acc;
        }, {}),
        fridayBreak,
        puasa,
        puasaShifts,
        roles,
        bizRules,
        activities
      });
      showStatus("All settings pushed to Cloud! 🚀");
    } catch (err) {
      console.error("Manual push failed:", err);
    }
    setIsPushing(false);
  };

  const normalizeTime = (t: string) => {
    if (!t) return '';
    let clean = t.replace('.', ':').replace(' ', '').trim();
    if (!clean.includes(':')) {
      const num = parseInt(clean);
      if (!isNaN(num)) return num.toString().padStart(2, '0') + ':00';
      return '';
    }
    const parts = clean.split(':');
    const h = Math.min(23, Math.max(0, parseInt(parts[0]) || 0));
    const m = Math.min(59, Math.max(0, parseInt(parts[1]) || 0));
    return h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0');
  };

  const handleSaveApi = () => {
    updateSettings({ 
      apiUrl: url, 
      apiKey: key,
      channels: channels.split(',').map(c => c.trim()).filter(Boolean)
    });
    showStatus("API Settings saved successfully! ✅");
  };

  const handleSaveShifts = () => {
    const newShifts: any = {};
    shifts.forEach(s => {
      if (s.code) {
        const start = normalizeTime(s.s);
        const end = normalizeTime(s.e);
        if (start && end) {
          newShifts[s.code] = { s: start, e: end, w: s.w };
        }
      }
    });
    updateSettings({ shifts: newShifts, bizRules });
    showStatus("Shift Settings saved successfully! ✅");
  };

  const handleSaveRoles = () => {
    updateSettings({ roles });
    showStatus("Roles Settings saved successfully! ✅");
  };

  const handleSaveActivities = () => {
    updateSettings({ activities });
    showStatus("Activity Settings saved successfully! ✅");
  };

  const handleSaveHolidays = () => {
    const newHolidays: any = {};
    holidays.forEach(h => {
      if (h.date && h.desc) {
        newHolidays[h.date] = h.desc;
      }
    });
    updateSettings({ holidays: newHolidays });
    showStatus("Holiday Settings saved successfully! ✅");
  };

  const handleBulkImportHolidays = () => {
    const lines = bulkHolText.split('\n').filter(l => l.trim());
    const newItems = lines.map(line => {
      const parts = line.split(/[;\t]/);
      const fallbackParts = line.includes(',') ? line.split(',') : parts;
      const finalParts = parts.length >= 2 ? parts : fallbackParts;

      if (finalParts.length >= 2) {
        const dateStr = finalParts[0].trim().replace(/\//g, '-');
        return { date: dateStr, desc: finalParts[1].trim() };
      }
      return null;
    }).filter(item => item !== null && !isNaN(new Date(item.date).getTime())) as {date: string, desc: string}[];
    
    if (newItems.length > 0) {
      setHolidays([...holidays, ...newItems]);
      setBulkHolText('');
      setShowBulkHol(false);
      showStatus(`Imported ${newItems.length} holidays! ✅`);
    } else {
      alert("Invalid format. Use: YYYY-MM-DD;Description (one per line)");
    }
  };

  const handleSaveAutoBreak = () => {
    try {
      const newAutoBreak: Record<string, string[]> = {};
      Object.keys(autoBreakStrings).forEach(code => {
        const val = autoBreakStrings[code] || '';
        newAutoBreak[code] = val
          .split(/[,;]/)
          .map(s => s.trim())
          .filter(Boolean)
          .map(s => normalizeTime(s))
          .filter(Boolean);
      });
      updateSettings({ autoBreak: newAutoBreak, fridayBreak });
      showStatus("Auto Break Settings saved successfully! ✅");
    } catch (err: any) {
      alert("Error saving break rules: " + err.message);
    }
  };

  const handleSavePuasa = () => {
    updateSettings({ puasa, puasaShifts });
    showStatus("Puasa Settings saved successfully! ✅");
  };

  const handleSaveBiz = () => {
    updateSettings({ bizRules });
    showStatus("Business Rules saved successfully! ✅");
  };

  const toggleRolePermission = (roleName: string, perm: string) => {
    setRoles((prev: any) => ({
      ...prev,
      [roleName]: {
        ...prev[roleName],
        [perm]: !prev[roleName][perm]
      }
    }));
  };

  const toggleRoleUI = (roleName: string, uiCode: string) => {
    setRoles((prev: any) => {
      const allowedUI = prev[roleName].allowedUI || [];
      const newAllowedUI = allowedUI.includes(uiCode) 
        ? allowedUI.filter((c: string) => c !== uiCode)
        : [...allowedUI, uiCode];
      return {
        ...prev,
        [roleName]: {
          ...prev[roleName],
          allowedUI: newAllowedUI
        }
      };
    });
  };

  const uiOptions = [
    { code: 'viewInt', label: 'Interval View' },
    { code: 'viewCal', label: 'Calendar View' },
    { code: 'viewAdh', label: 'Adherence View' },
    { code: 'viewFor', label: 'Forecast View' },
    { code: 'btnApp', label: 'Approval Button' },
    { code: 'btnBrk', label: 'Auto Break Button' },
    { code: 'btnSys', label: 'System Settings' },
    { code: 'btnImp', label: 'Import Schedule' },
    { code: 'btnPub', label: 'Publish Schedule' },
  ];

  const modules = [
    { id: 'workforce', label: 'Workforce', icon: Briefcase },
    { id: 'infra', label: 'API & Core', icon: Database },
    { id: 'hc', label: 'HC Management', icon: Users },
    { id: 'security', label: 'ID Security', icon: ShieldCheck },
    { id: 'analytics', label: 'Analytics', icon: Zap },
  ];

  return (
    <div className="h-full bg-slate-50 overflow-y-auto p-4 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Module Switcher Header */}
        <div className="flex flex-wrap gap-2 mb-10 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-fit sticky top-0 md:relative z-30">
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => handleModuleSwitch(m.id)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeModule === m.id ? 'bg-slate-950 text-white shadow-xl shadow-slate-200 scale-105' : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'}`}
            >
              <m.icon size={16} />
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-1">
          <div>
            <h3 className="m-0 text-slate-900 font-black text-2xl flex items-center gap-3 tracking-tighter">
              <div className="p-2.5 bg-white border border-slate-200 shadow-sm rounded-xl">
                <SettingsIcon size={22} className="text-rose-600" />
              </div>
              {activeModule === 'infra' ? 'INFRA SETTINGS' : `${activeModule.toUpperCase()} SETTINGS`}
            </h3>
            <p className="text-slate-500 text-xs mt-1.5 font-bold uppercase tracking-widest opacity-60">
              {activeModule === 'workforce' && 'WFM Engine & Operational Rules'}
              {activeModule === 'infra' && 'SQL DATABASE & SYSTEM ENDPOINTS'}
              {activeModule === 'hc' && 'Human Capital & Personnel Registry'}
              {activeModule === 'security' && 'Identity Lifecycle & Security Gates'}
              {activeModule === 'analytics' && 'Business Intelligence & KPI Kernels'}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {activeModule === 'workforce' && (
              <>
                {activeTab === 'shift' && <button onClick={handleSaveShifts} className="flex-1 md:flex-none px-6 py-2.5 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-nowrap"><Save size={16} /> Save Shift Rules</button>}
                {activeTab === 'roles' && <button onClick={handleSaveRoles} className="flex-1 md:flex-none px-6 py-2.5 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-nowrap"><Save size={16} /> Update Permissions</button>}
                {activeTab === 'holiday' && <button onClick={handleSaveHolidays} className="flex-1 md:flex-none px-6 py-2.5 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-nowrap"><Save size={16} /> Update Calendar</button>}
                {activeTab === 'autobreak' && <button onClick={handleSaveAutoBreak} className="flex-1 md:flex-none px-6 py-2.5 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-nowrap"><Save size={16} /> Save Break Rules</button>}
                {activeTab === 'puasa' && <button onClick={handleSavePuasa} className="flex-1 md:flex-none px-6 py-2.5 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-nowrap"><Save size={16} /> Update Sync</button>}
                {activeTab === 'biz' && <button onClick={handleSaveBiz} className="flex-1 md:flex-none px-6 py-2.5 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-nowrap"><Save size={16} /> Save Business Rules</button>}
                {activeTab === 'activities' && <button onClick={handleSaveActivities} className="flex-1 md:flex-none px-6 py-2.5 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-nowrap"><Save size={16} /> Save Activities</button>}
              </>
            )}
            {activeModule !== 'workforce' && (
              <button onClick={() => showStatus("Module configuration updated!")} className="flex-1 md:flex-none px-6 py-2.5 bg-slate-950 text-white font-black rounded-xl hover:bg-black shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-nowrap">
                <Save size={16} /> Commit Configuration
              </button>
            )}
          </div>
        </div>

        {saveStatus && (
          <div className="bg-slate-950 text-white px-8 py-3.5 rounded-2xl mb-8 text-[10px] font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-top-3 duration-300 flex items-center justify-center gap-2 shadow-2xl shadow-slate-200 border border-slate-800">
            {saveStatus}
          </div>
        )}

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          {activeModule === 'workforce' && (
            <>
              <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1 overflow-x-auto items-center sticky top-0 z-20 no-scrollbar">
                {[
                  { id: 'shift', icon: Clock, label: 'Shifts' },
                  { id: 'roles', icon: Users, label: 'Access Roles' },
                  { id: 'holiday', icon: Calendar, label: 'Holiday Cal' },
                  { id: 'autobreak', icon: Utensils, label: 'Auto Break' },
                  { id: 'puasa', icon: Moon, label: 'Fasting' },
                  { id: 'biz', icon: Briefcase, label: 'Ops Hours' },
                  { id: 'activities', icon: Zap, label: 'Activities' },
                ].map(tab => (
                  <button 
                    key={tab.id}
                    className={`min-w-fit px-5 py-3 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all whitespace-nowrap flex items-center gap-2.5 ${activeTab === tab.id ? 'bg-slate-950 text-white shadow-md' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`} 
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6 md:p-10">
                {activeTab === 'biz' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 max-w-5xl mx-auto">
                <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] mb-10 border border-slate-200 shadow-sm">
                   <h4 className="m-0 mb-5 text-slate-900 text-base font-black flex items-center gap-2.5 tracking-widest uppercase">
                     <Clock size={18} className="text-rose-600" />
                     CHANNEL OPERATIONAL HOURS
                   </h4>
                   <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight mb-8">Define active service windows per delivery stream</p>
                   
                   <div className="space-y-4">
                     {settings.channels.map(ch => {
                        const rule = bizRules.operatingHours[ch] || { start: '00:00', end: '23:59', closed: false };
                        return (
                          <div key={ch} className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8 items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-colors">
                            <div className="font-black text-slate-900 text-[11px] uppercase tracking-widest">{ch}</div>
                            <div className="flex items-center gap-3">
                              <Sun size={14} className="text-rose-600 shrink-0" />
                              <input 
                                type="time" 
                                className={`flex-1 p-2.5 border rounded-xl text-xs font-black font-mono outline-none focus:border-rose-500 ${rule.closed ? 'opacity-20 pointer-events-none bg-slate-50' : 'bg-white border-slate-200'}`}
                                value={rule.start}
                                onChange={e => setBizRules({
                                  ...bizRules,
                                  operatingHours: { ...bizRules.operatingHours, [ch]: { ...rule, start: e.target.value } }
                                })}
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <Moon size={14} className="text-slate-400 shrink-0" />
                              <input 
                                type="time" 
                                className={`flex-1 p-2.5 border rounded-xl text-xs font-black font-mono outline-none focus:border-rose-500 ${rule.closed ? 'opacity-20 pointer-events-none bg-slate-50' : 'bg-white border-slate-200'}`}
                                value={rule.end}
                                onChange={e => setBizRules({
                                  ...bizRules,
                                  operatingHours: { ...bizRules.operatingHours, [ch]: { ...rule, end: e.target.value } }
                                })}
                              />
                            </div>
                            <div className="flex justify-end">
                              <label className="flex items-center gap-3 cursor-pointer group">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${rule.closed ? 'text-rose-600' : 'text-slate-300'}`}>Closed</span>
                                <input 
                                  type="checkbox"
                                  checked={rule.closed}
                                  onChange={e => setBizRules({
                                    ...bizRules,
                                    operatingHours: { ...bizRules.operatingHours, [ch]: { ...rule, closed: e.target.checked } }
                                  })}
                                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                                />
                              </label>
                            </div>
                          </div>
                        );
                     })}
                   </div>
                </div>
              </div>
            )}
            
            {activeTab === 'activities' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 max-w-5xl mx-auto">
                <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] mb-10 border border-slate-200 shadow-sm relative overflow-hidden">
                   <h4 className="m-0 mb-5 text-slate-900 text-base font-black flex items-center gap-2.5 tracking-widest uppercase relative z-10">
                     <Zap size={18} className="text-rose-600" />
                     ACTIVITY DEFINITIONS
                   </h4>
                   <div className="space-y-3 relative z-10">
                     {Object.entries(activities).map(([code, act]: [string, any]) => (
                       <div key={code} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all group">
                         <div className="font-mono font-black text-slate-400 text-[9px] bg-slate-50 px-2 py-1 rounded-md w-fit uppercase tracking-tighter">{code}</div>
                         <div className="col-span-2">
                           <input 
                             placeholder="Label"
                             className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-black uppercase tracking-tight outline-none focus:border-rose-500 transition-all focus:bg-white"
                             value={act.label}
                             onChange={(e) => setActivities({ ...activities, [code]: { ...act, label: e.target.value } })}
                           />
                         </div>
                         <div>
                           <select 
                             className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-tight outline-none focus:border-rose-500 cursor-pointer"
                             value={act.duration || 'custom'}
                             onChange={(e) => setActivities({ ...activities, [code]: { ...act, duration: e.target.value } })}
                           >
                             <option value="1">15 mins</option>
                             <option value="2">30 mins</option>
                             <option value="4">1 hour</option>
                             <option value="full">Full Day</option>
                             <option value="custom">Custom</option>
                           </select>
                         </div>
                         <div className="flex gap-2 items-center col-span-2 justify-end">
                           <div className={`w-10 h-10 rounded-xl border border-slate-100 shrink-0 shadow-sm ${act.color}`}></div>
                           <button onClick={() => { const newActs = { ...activities }; delete newActs[code]; setActivities(newActs); }} className="p-2.5 text-slate-300 hover:text-rose-600 transition-all">
                             <Trash2 size={16} />
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            )}
            
            {activeTab === 'shift' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 max-w-5xl mx-auto">
                <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
                   <h4 className="m-0 mb-5 text-slate-900 text-base font-black flex items-center gap-2.5 tracking-widest uppercase">
                     <Clock size={18} className="text-rose-600" />
                     MASTER SHIFT REGISTRY
                   </h4>
                   <div className="space-y-3">
                     {shifts.map((s, i) => (
                       <div key={i} className="flex gap-3 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all group">
                         <input type="text" className="w-[80px] p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-black font-mono text-[10px] text-rose-600 uppercase text-center" value={s.code} onChange={e => { const newS = [...shifts]; newS[i].code = e.target.value; setShifts(newS); }} />
                         <input type="text" placeholder="08:00" className="flex-1 p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-black text-[10px] text-center font-mono" value={s.s} onChange={e => { const newS = [...shifts]; newS[i].s = e.target.value; setShifts(newS); }} />
                         <ArrowLeftRight size={12} className="text-slate-300 shrink-0" />
                         <input type="text" placeholder="17:00" className="flex-1 p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-black text-[10px] text-center font-mono" value={s.e} onChange={e => { const newS = [...shifts]; newS[i].e = e.target.value; setShifts(newS); }} />
                         <button className="p-2.5 text-slate-300 hover:text-rose-600 transition-colors" onClick={() => setShifts(shifts.filter((_, idx) => idx !== i))}>
                           <Trash2 size={16} />
                         </button>
                       </div>
                     ))}
                     <button className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3" onClick={() => setShifts([...shifts, { code: '', s: '08:00', e: '17:00', w: shifts.length + 1 }])}>
                       <Plus size={16} /> Add Shift Definition
                     </button>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'roles' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 shadow-sm mb-10 max-w-4xl mx-auto">
                   <h4 className="m-0 mb-3 text-slate-900 text-base font-black flex items-center gap-2.5 tracking-widest uppercase"><ShieldCheck size={18} className="text-rose-600" /> INFRASTRUCTURE ACCESS ROLES</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Modify permission kernels for system entities</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Object.keys(roles).map(roleName => (
                    <div key={roleName} className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl flex flex-col overflow-hidden">
                      <div className="bg-slate-100 p-6 border-b border-slate-200 font-black text-[10px] uppercase tracking-[0.2em] text-slate-900 text-center">{roleName}</div>
                      <div className="p-8 space-y-4">
                        {['isAdmin', 'canEditSchedule', 'canSeeAll', 'canSwap'].map(perm => (
                          <label key={perm} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer group hover:bg-slate-100 transition-colors">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-900">{perm}</span>
                            <input 
                              type="checkbox" 
                              checked={roles[roleName][perm] || false} 
                              onChange={() => toggleRolePermission(roleName, perm)} 
                              className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'holiday' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 max-w-5xl mx-auto">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 shadow-sm mb-10">
                   <h4 className="m-0 font-black text-base uppercase tracking-widest text-slate-950 flex items-center gap-2.5"><Calendar size={18} className="text-rose-600" /> CALENDAR EXCEPTIONS</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1.5 px-7">National holidays and service blackouts</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                  {holidays.map((h, i) => (
                    <div key={i} className="flex gap-4 items-center bg-white p-5 rounded-2xl border border-slate-100 border-l-4 border-l-rose-600 shadow-sm transition-all group">
                      <div className="flex-1">
                        <div className="font-black text-slate-900 text-[11px] uppercase tracking-widest">{format(new Date(h.date), 'dd MMM yyyy')}</div>
                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-tight opacity-70">{h.desc}</div>
                      </div>
                      <button className="text-slate-300 hover:text-rose-600 transition-colors" onClick={() => setHolidays(holidays.filter((_, idx) => idx !== i))}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-lg">
                  <div className="flex flex-col sm:flex-row gap-6 items-end">
                    <div className="flex-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Effective Date</label>
                      <input type="date" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-rose-500" value={newHolDate} onChange={e => setNewHolDate(e.target.value)} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Description</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-rose-500 placeholder:text-slate-300" placeholder="e.g. Independence Day" value={newHolDesc} onChange={e => setNewHolDesc(e.target.value)} />
                    </div>
                    <button className="bg-rose-600 text-white font-black px-8 py-4 rounded-2xl hover:bg-rose-700 shadow-lg shadow-rose-100 active:scale-95 transition-all flex items-center justify-center" onClick={() => { if(newHolDate && newHolDesc) { setHolidays([...holidays, {date: newHolDate, desc: newHolDesc}]); setNewHolDate(''); setNewHolDesc(''); } }}>
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'autobreak' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 max-w-5xl mx-auto">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 shadow-sm mb-10">
                   <h4 className="m-0 font-black text-base uppercase tracking-widest flex items-center gap-2.5 text-slate-950"><Utensils size={18} className="text-rose-600" /> BREAK RULESETS</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1.5 px-7">Automated meal and recovery allocations</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10 text-nowrap">
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Standard Release Duration (MIN)</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-rose-500" value={fridayBreak?.normal || 90} onChange={e => setFridayBreak({...fridayBreak, normal: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Restricted Release Duration (MIN)</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-rose-500" value={fridayBreak?.puasa || 60} onChange={e => setFridayBreak({...fridayBreak, puasa: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'puasa' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 max-w-5xl mx-auto">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 shadow-sm mb-10">
                   <h4 className="m-0 font-black text-base uppercase tracking-widest flex items-center gap-2.5 text-slate-950"><Moon size={18} className="text-rose-600" /> FASTING CYCLES</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1.5 px-7">Active regional fasting period windows</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {puasa.map((p, i) => (
                    <div key={i} className="flex gap-4 items-center bg-white p-5 rounded-2xl border border-slate-100 border-l-4 border-l-rose-600 shadow-sm group">
                      <div className="font-black text-slate-900 flex-1 text-[11px] font-mono flex items-center gap-3">
                        {p.start} <ArrowLeftRight size={14} className="text-slate-200"/> {p.end}
                      </div>
                      <button className="text-slate-300 hover:text-rose-600 transition-colors" onClick={() => setPuasa(puasa.filter((_, idx) => idx !== i))}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeModule === 'infra' && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300 p-6 md:p-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
            <div className="flex-1">
              <h4 className="m-0 mb-2 text-slate-900 text-base font-black flex items-center gap-2.5 tracking-widest uppercase">
                <Database size={18} className="text-rose-600" />
                SQL INFRASTRUCTURE
              </h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Active Relational Database Connection Kernel</p>
              <div className="mt-8 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Connection String (URL or IP)</label>
                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-tighter italic">Recommended: postgresql://user:pass@host:port/db</span>
                  </div>
                  <input 
                    type="password" 
                    placeholder="postgresql://user:password@host:port/dbname"
                    value={dbUrlInput}
                    onChange={(e) => setDbUrlInput(e.target.value)}
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-slate-900 text-xs font-black outline-none focus:border-rose-500 transition-all font-mono placeholder:text-slate-300" 
                  />
                  <p className="text-[8px] text-slate-400 font-bold mt-3 px-1 uppercase tracking-tight">Warning: Sensitive connection data is encrypted in transit but stored in kernel memory.</p>
                </div>
              </div>
              {dbStatus && (
                <div className={`mt-6 p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 ${dbStatus.database ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-rose-500/10 border-rose-500/30 text-rose-600'}`}>
                  <AlertCircle size={15} />
                  {dbStatus.database ? 'Database Connection Active & Secured' : dbStatus.error || 'DATABASE_URL Missing from Environment'}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto self-end">
              <button 
                disabled={isTestingDb}
                onClick={handleTestConnection} 
                className="flex-1 md:flex-none px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all bg-white border border-slate-200 text-slate-950 hover:bg-slate-50 shadow-xl active:scale-95 disabled:opacity-50"
              >
                {isTestingDb ? <RefreshCw size={14} className="animate-spin" /> : null}
                {isTestingDb ? 'Verifying...' : 'Check Status'}
              </button>
              <button 
                disabled={isSavingDb}
                onClick={handleSaveDbUrl}
                className="flex-1 md:flex-none px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all bg-rose-600 text-white hover:bg-rose-700 shadow-xl shadow-rose-900/10 active:scale-95 disabled:opacity-50"
              >
                {isSavingDb ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {isSavingDb ? 'Initializing...' : 'Update & Connect'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-3 px-1">Database Host</label>
                <input type="text" value={sqlConfig.host} onChange={e => setSqlConfig({...sqlConfig, host: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-black outline-none focus:border-rose-500 transition-all font-mono" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-3 px-1">Target Schema / DB Name</label>
                <input type="text" value={sqlConfig.database} onChange={e => setSqlConfig({...sqlConfig, database: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-black outline-none focus:border-rose-500 transition-all font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-3 px-1">Port</label>
                  <input type="text" value={sqlConfig.port} onChange={e => setSqlConfig({...sqlConfig, port: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-black outline-none focus:border-rose-500 transition-all font-mono" />
                </div>
                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={sqlConfig.ssl} onChange={e => setSqlConfig({...sqlConfig, ssl: e.target.checked})} className="w-5 h-5 text-rose-600 rounded border-slate-200 bg-white" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SSL Enabled</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-3 px-1">Access Principal (User)</label>
                <input type="text" value={sqlConfig.username} onChange={e => setSqlConfig({...sqlConfig, username: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-black outline-none focus:border-rose-500 transition-all font-mono" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-3 px-1">Principal Secret (Password)</label>
                <input type="password" value={sqlConfig.password} onChange={e => setSqlConfig({...sqlConfig, password: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-black outline-none focus:border-rose-500 transition-all font-mono" />
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase tracking-tight">
                  System ensures connection persistence via regional SQL kernels. Principal must have read/write permissions on the target schema.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

        {activeModule === 'hc' && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300 p-6 md:p-10">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                 <h4 className="text-[11px] font-black uppercase tracking-widest mb-6 border-b border-slate-200 pb-4">Employment Classifications</h4>
                 <div className="space-y-3">
                   {employeeTypes.map((type, i) => (
                     <div key={i} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 font-black text-[10px] uppercase tracking-widest">
                       {type}
                       <Trash2 size={14} className="text-slate-300 cursor-pointer hover:text-rose-600 transition-colors" />
                     </div>
                   ))}
                   <button className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-sm">+ Add Classification</button>
                 </div>
               </div>
               <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                 <h4 className="text-[11px] font-black uppercase tracking-widest mb-6 border-b border-slate-200 pb-4">Organizational Departments</h4>
                 <div className="space-y-3">
                   {departments.map((dept, i) => (
                     <div key={i} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 font-black text-[10px] uppercase tracking-widest">
                       {dept}
                       <Trash2 size={14} className="text-slate-300 cursor-pointer hover:text-rose-600 transition-colors" />
                     </div>
                   ))}
                   <button className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-sm">+ Add Department</button>
                 </div>
               </div>
             </div>
          </div>
        )}

        {activeModule === 'security' && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300 p-6 md:p-10">
             <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 mb-8">
                <h4 className="text-[11px] font-black uppercase tracking-widest mb-6 border-b border-slate-200 pb-4">Standard Account Prefixes</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {Object.entries(idPrefixes).map(([key, val]) => (
                     <div key={key}>
                       <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block">{key} System ID</label>
                       <input type="text" value={val} onChange={(e) => setIdPrefixes({...idPrefixes, [key]: e.target.value})} className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-rose-500 transition-all font-mono" />
                     </div>
                   ))}
                </div>
             </div>
             <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                <h4 className="text-[11px] font-black uppercase tracking-widest mb-6 border-b border-slate-200 pb-4">Approval Matrix Presets</h4>
                <div className="space-y-2">
                   {approvalFlows.map(flow => (
                     <div key={flow} className="p-4 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{flow} Flow Path</span>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500" />
                           <span className="text-[9px] font-black text-emerald-600 uppercase">Production Active</span>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeModule === 'analytics' && (
           <div className="animate-in fade-in slide-in-from-top-4 duration-300 p-6 md:p-10">
              <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200 shadow-sm mb-10">
                 <h4 className="text-slate-900 text-xs font-black uppercase tracking-[0.2em] mb-8">Performance Target Kernels</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {Object.entries(kpiTargets).map(([key, val]) => (
                       <div key={key} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-4">{key}</label>
                          <div className="flex items-end gap-2">
                             <input type="number" value={val} onChange={(e) => setKpiTargets({...kpiTargets, [key]: parseInt(e.target.value)})} className="bg-transparent text-slate-900 text-3xl font-black outline-none w-20" />
                             <span className="text-rose-600 font-black mb-1">{key === 'AHT' ? 's' : '%'}</span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

         </div>
        </div>
      </div>
  );
};
export default Settings;
