import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  ArrowLeft,
  Layout,
  HardDrive,
  FileCheck,
  Wifi,
  MousePointer2,
  CheckCircle2,
  AlertCircle,
  Users,
  Grid3X3,
  ShoppingCart,
  Trash2,
  Info,
  Download,
  BarChart2,
  TrendingUp,
  Clock,
  Plus
} from 'lucide-react';

interface FacilityTrackerModuleProps {
  onBack: () => void;
}

type SeatStatus = 'available' | 'occupied' | 'maintenance' | 'selected';

interface Seat {
  id: string;
  row: number;
  col: number;
  status: SeatStatus;
}

export default function FacilityTrackerModule({ onBack }: FacilityTrackerModuleProps) {
  const [activeTab, setActiveTab] = useState('seat');
  const [seatSubTab, setSeatSubTab] = useState<'order' | 'ops' | 'mgmt'>('order');
  
  const [selectedSite, setSelectedSite] = useState('jakarta');
  const [selectedFloor, setSelectedFloor] = useState('04');

  const sites = {
    jakarta: { label: 'Jakarta HQ', floors: ['03', '04', '05', '06'] },
    jogja: { label: 'Jogja Hub', floors: ['01', '02'] },
    semarang: { label: 'Semarang Site', floors: ['Ground', '01'] }
  };

  // Group seats into "Pods" or "Blocks" to look more like an office
  const pods = useMemo(() => {
    const layout = [
      { id: 'Zone A', type: 'Office', rows: 4, cols: 4 },
      { id: 'Zone B', type: 'Flex', rows: 4, cols: 6 },
      { id: 'Zone C', type: 'Tech', rows: 4, cols: 4 },
      { id: 'Zone D', type: 'Support', rows: 3, cols: 8 },
    ];

    return layout.map(zone => {
      const seatsInZone: Seat[] = [];
      for (let r = 1; r <= zone.rows; r++) {
        for (let c = 1; c <= zone.cols; c++) {
          const sid = `${zone.id[5]}-${r}${c}`;
          let status: SeatStatus = 'available';
          if (Math.random() > 0.8) status = 'occupied';
          if (Math.random() > 0.96) status = 'maintenance';
          seatsInZone.push({ id: sid, row: r, col: c, status });
        }
      }
      return { ...zone, seats: seatsInZone };
    });
  }, [selectedSite, selectedFloor]);

  // Flattened for stats
  const allSeatsFlattened = useMemo(() => pods.flatMap(p => p.seats), [pods]);
  const [currentSeats, setCurrentSeats] = useState<Seat[]>(allSeatsFlattened);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Update local state when layout pods change
  useEffect(() => {
    setCurrentSeats(allSeatsFlattened);
    setSelectedSeatIds([]);
  }, [allSeatsFlattened]);

  const stats = useMemo(() => {
    const total = currentSeats.length;
    const occupied = currentSeats.filter(s => s.status === 'occupied').length;
    const maintenance = currentSeats.filter(s => s.status === 'maintenance').length;
    const available = total - occupied - maintenance;
    return { total, occupied, available, maintenance };
  }, [currentSeats]);

  const handleSeatClick = (id: string) => {
    const seat = currentSeats.find(s => s.id === id);
    if (!seat || seat.status === 'maintenance' || seat.status === 'occupied') return;

    setSelectedSeatIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(sid => sid !== id);
      }
      return isBulkMode ? [...prev, id] : [id];
    });
  };

  const clearSelection = () => setSelectedSeatIds([]);

  const handleOrder = () => {
    if (selectedSeatIds.length === 0) return;
    
    // Simulate API call to mark as occupied
    setCurrentSeats(prev => prev.map(s => 
      selectedSeatIds.includes(s.id) ? { ...s, status: 'occupied' } : s
    ));
    setSelectedSeatIds([]);
  };

  return (
    <div className="w-full flex-grow flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-100 hover:border-active-red hover:text-active-red transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black uppercase flex items-center gap-2">
              <Building2 className="w-6 h-6 text-active-red stroke-[2.5]" />
              Facility Tracker
            </h1>
            <p className="text-[10px] sm:text-xs text-neutral-gray font-bold uppercase tracking-widest mt-1">Spatial Resources & Asset Control</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden flex-grow flex flex-col min-h-[600px]">
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1 overflow-x-auto items-center sticky top-0 z-20 no-scrollbar">
          {[
            { id: 'seat', icon: Layout, label: 'Seat Management' },
            { id: 'asset', icon: HardDrive, label: 'Asset Management' },
            { id: 'license', icon: FileCheck, label: 'License Management' },
            { id: 'network', icon: Wifi, label: 'Network Occupancy' },
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

        <div className="p-4 md:p-8 flex-grow overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'seat' && (
              <motion.div 
                key="seat" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="space-y-6"
              >
                <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex-1 sm:flex-none">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Location Site</label>
                    <select 
                      value={selectedSite}
                      onChange={(e) => setSelectedSite(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-slate-900 transition-all font-mono"
                    >
                      {Object.keys(sites).map(s => <option key={s} value={s}>{sites[s as keyof typeof sites].label}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 sm:flex-none">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Floor Level</label>
                    <select 
                      value={selectedFloor}
                      onChange={(e) => setSelectedFloor(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-slate-900 transition-all font-mono"
                    >
                      {sites[selectedSite as keyof typeof sites].floors.map(f => <option key={f} value={f}>Floor {f}</option>)}
                    </select>
                  </div>
                  <div className="w-px h-10 bg-slate-200 mx-2 hidden sm:block" />
                  <div className="flex-1 sm:flex-none flex bg-slate-200/50 p-1 rounded-xl items-center">
                    {(['order', 'ops', 'mgmt'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setSeatSubTab(tab)}
                        className={`flex-1 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${seatSubTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {tab === 'order' ? 'Mapper' : tab === 'ops' ? 'Ops' : 'Mgmt'}
                      </button>
                    ))}
                  </div>
                </div>
                {seatSubTab === 'order' && (
                  <div className="flex flex-col xl:flex-row gap-8">
                    {/* Realistic Visual Map with Pods */}
                    <div className="flex-grow bg-slate-50 rounded-[2.5rem] border border-slate-200 p-8">
                      <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Floor Level {selectedFloor} — {sites[selectedSite as keyof typeof sites].label}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1 italic">Structural pods and cluster arrangement</p>
                        </div>
                        <div className="flex bg-white p-2 rounded-xl border border-slate-100 shadow-sm gap-6 px-6">
                           <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                             <div className="w-3 h-3 bg-white border border-slate-200 rounded" /> Available
                           </div>
                           <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                             <div className="w-3 h-3 bg-active-red rounded" /> Occupied
                           </div>
                           <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                             <div className="w-3 h-3 bg-blue-600 rounded" /> Select
                           </div>
                        </div>
                      </div>

                      <div className="space-y-12">
                        {pods.map(pod => (
                          <div key={pod.id} className="space-y-4">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                              {pod.id} — {pod.type}
                              <div className="flex-grow h-px bg-slate-200" />
                            </h5>
                            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-3">
                              {pod.seats.map(seat => {
                                const localSeat = currentSeats.find(s => s.id === seat.id);
                                const isSelected = selectedSeatIds.includes(seat.id);
                                return (
                                  <button
                                    key={seat.id}
                                    disabled={localSeat?.status === 'occupied' || localSeat?.status === 'maintenance'}
                                    onClick={() => handleSeatClick(seat.id)}
                                    className={`aspect-square sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-[9px] font-black transition-all transform active:scale-95 ${
                                      localSeat?.status === 'occupied' ? 'bg-active-red text-white shadow-lg shadow-red-200/50' :
                                      localSeat?.status === 'maintenance' ? 'bg-slate-200 text-slate-400 opacity-50 cursor-not-allowed' :
                                      isSelected ? 'bg-blue-600 text-white shadow-xl shadow-blue-200/50 scale-110 ring-2 ring-blue-600 ring-offset-2' :
                                      'bg-white text-slate-500 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                                    }`}
                                  >
                                    {seat.id}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-full xl:w-96 space-y-6">
                      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200 flex flex-col gap-6 sticky top-8">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Reservation Port</h4>
                          <button onClick={() => setIsBulkMode(!isBulkMode)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${isBulkMode ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/40'}`}>
                            {isBulkMode ? 'Bulk Active' : 'Single Select'}
                          </button>
                        </div>

                        {selectedSeatIds.length > 0 ? (
                          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div>
                               <label className="text-[9px] font-black uppercase tracking-widest opacity-40 block mb-3">Cart Contents</label>
                               <div className="flex flex-wrap gap-2">
                                 {selectedSeatIds.map(id => (
                                   <span key={id} className="bg-white/10 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-widest border border-white/5">
                                     {id}
                                   </span>
                                 ))}
                               </div>
                            </div>
                            <div className="pt-6 border-t border-white/10 space-y-6">
                               <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Total Workstations</span>
                                  <span className="text-2xl font-black">{selectedSeatIds.length}</span>
                               </div>
                               <button 
                                 onClick={handleOrder}
                                 className="w-full py-4.5 bg-active-red text-white hover:bg-rose-700 rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-rose-900/40"
                               >
                                 <Plus size={18} /> Confirm Order
                               </button>
                               <button onClick={() => setSelectedSeatIds([])} className="w-full text-center text-[10px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity">
                                 Discard Selection
                               </button>
                            </div>
                          </div>
                        ) : (
                          <div className="py-20 text-center space-y-4">
                             <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center mx-auto">
                               <MousePointer2 className="text-white/20" size={24} />
                             </div>
                             <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest max-w-[160px] mx-auto leading-relaxed">Please select a workstation pod on the map to begin.</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                           <Layout size={14} className="text-active-red" />
                           Capacity Status
                         </h4>
                         <div className="space-y-4">
                           {Object.entries(stats).map(([k, v]) => (
                             <div key={k} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{k}</span>
                               <span className="text-base font-black text-slate-900">{v}</span>
                             </div>
                           ))}
                         </div>
                      </div>
                    </div>
                  </div>
                )}

                {seatSubTab === 'ops' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                       <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                         <div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Current Occupancy Registry ({sites[selectedSite as keyof typeof sites].label})</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1 italic">Real-time floor utilization log</p>
                         </div>
                         <button className="px-6 py-3 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                           <Download size={14} /> Export Report
                         </button>
                       </div>
                       <div className="overflow-x-auto">
                         <table className="w-full text-left">
                           <thead className="bg-slate-50">
                             <tr>
                               <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Position ID</th>
                               <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Zone / Pod</th>
                               <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Assignment Status</th>
                               <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Last Ping</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                             {currentSeats.filter(s => s.status !== 'available').map(seat => (
                               <tr key={seat.id} className="hover:bg-slate-50/50 transition-colors">
                                 <td className="px-8 py-6">
                                   <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-black text-[10px] ${seat.status === 'occupied' ? 'bg-red-50 text-active-red' : 'bg-slate-100'}`}>
                                        {seat.id}
                                      </div>
                                      <span className="text-[11px] font-black text-slate-900 tracking-tight">Workstation {seat.id}</span>
                                   </div>
                                 </td>
                                 <td className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                   Pod {seat.id.split('-')[0]}
                                 </td>
                                 <td className="px-8 py-6">
                                   <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${seat.status === 'occupied' ? 'bg-red-50 text-active-red' : 'bg-slate-50 text-slate-400'}`}>
                                     {seat.status}
                                   </span>
                                 </td>
                                 <td className="px-8 py-6 text-[10px] font-bold text-slate-400 font-mono">
                                   09:24:12 - ACTIVE
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                    </div>
                  </motion.div>
                )}

                {seatSubTab === 'mgmt' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {[
                         { label: 'Site Efficiency', val: '94.2%', icon: TrendingUp, color: 'text-green-600' },
                         { label: 'Peak Hour Load', val: '11:00 AM', icon: Clock, color: 'text-slate-900' },
                         { label: 'Asset Alert', val: '02 Down', icon: AlertCircle, color: 'text-active-red' },
                       ].map((c, i) => (
                         <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
                           <div className="flex items-center gap-3 mb-6">
                             <div className={`p-2 rounded-lg bg-slate-50 ${c.color}`}>
                               <c.icon size={16} />
                             </div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.label}</span>
                           </div>
                           <div className="text-3xl font-black text-slate-950">{c.val}</div>
                         </div>
                       ))}
                    </div>
                    
                    <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200 flex items-center justify-center text-center">
                       <div className="space-y-4">
                         <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                           <BarChart2 className="text-active-red" size={28} />
                         </div>
                         <h4 className="text-base font-black text-slate-900 uppercase tracking-widest">Site Intelligence: {sites[selectedSite as keyof typeof sites].label}</h4>
                         <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight max-w-sm mx-auto">Analytical synthesis of workstation utilization over the last  business days across current site.</p>
                       </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'asset' && (
              <motion.div key="asset" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-5xl mx-auto h-full flex items-center justify-center">
                <div className="bg-slate-50 p-6 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm text-center py-20 w-full">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
                    <HardDrive className="text-active-red" size={28} />
                  </div>
                  <h4 className="text-slate-900 text-base font-black uppercase tracking-widest mb-2">Asset Lifecycle Registry</h4>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight max-w-xs mx-auto">Hardware inventory tracking and maintenance scheduling.</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'license' && (
              <motion.div key="license" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-5xl mx-auto h-full flex items-center justify-center">
                <div className="bg-slate-50 p-6 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm text-center py-20 w-full">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
                    <FileCheck className="text-active-red" size={28} />
                  </div>
                  <h4 className="text-slate-900 text-base font-black uppercase tracking-widest mb-2">Software Compliance Gate</h4>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight max-w-xs mx-auto">Centralized license pool management and utilization metrics.</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'network' && (
              <motion.div key="network" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-5xl mx-auto h-full flex items-center justify-center">
                <div className="bg-slate-50 p-6 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm text-center py-20 w-full">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
                    <Wifi className="text-active-red" size={28} />
                  </div>
                  <h4 className="text-slate-900 text-base font-black uppercase tracking-widest mb-2">Network Occupancy Kernel</h4>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight max-w-xs mx-auto">Real-time bandwidth utilization and endpoint connectivity status.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

