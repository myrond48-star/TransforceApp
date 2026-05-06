import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  ArrowLeft,
  Layout,
  HardDrive,
  FileCheck,
  Wifi
} from 'lucide-react';

interface FacilityTrackerModuleProps {
  onBack: () => void;
}

export default function FacilityTrackerModule({ onBack }: FacilityTrackerModuleProps) {
  const [activeTab, setActiveTab] = useState('seat');

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

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden flex-grow flex flex-col">
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

        <div className="p-6 md:p-10 flex-grow">
          <AnimatePresence mode="wait">
            {activeTab === 'seat' && (
              <motion.div key="seat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-5xl mx-auto h-full flex items-center justify-center">
                <div className="bg-slate-50 p-6 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm text-center py-20 w-full">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
                    <Layout className="text-active-red" size={28} />
                  </div>
                  <h4 className="text-slate-900 text-base font-black uppercase tracking-widest mb-2">Seat Management Kernel</h4>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight max-w-xs mx-auto">Dynamic spatial allocation and workstation availability tracking.</p>
                  <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Total Capacity</label>
                      <div className="text-2xl font-black text-slate-950">1,240</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Active Floor</label>
                      <div className="text-2xl font-black text-slate-950">Level 04</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Occupancy</label>
                      <div className="text-2xl font-black text-active-red">82%</div>
                    </div>
                  </div>
                </div>
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
