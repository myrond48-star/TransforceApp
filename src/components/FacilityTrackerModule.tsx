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
  Plus,
  Search,
  Check,
  X,
  Sliders,
  Maximize2,
  Minimize2,
  Database,
  Tv,
  HelpCircle,
  Layers,
  Thermometer,
  Activity,
  Cpu
} from 'lucide-react';

interface FacilityTrackerModuleProps {
  onBack: () => void;
}

type SeatStatus = 'available' | 'occupied' | 'maintenance' | 'selected';

interface Seat {
  id: string; // ID e.g., L1-A1, R3-B4
  zone: string; // West Wing, East Wing
  category: string; // 'Standard', 'VIP', 'Double Monitor', 'Leader'
  status: SeatStatus;
  userId?: string;
  userName?: string;
  department?: string;
  ipAddress?: string;
  bandwidthUsage?: number; // in Mbps
  lastPing?: string;
}

interface RoomDetail {
  id: string;
  name: string;
  englishName: string;
  type: 'server' | 'storage' | 'lift' | 'meeting' | 'monitoring' | 'coaching';
  status: string;
  metrics: { [key: string]: string | number };
  items?: string[];
}

export default function FacilityTrackerModule({ onBack }: FacilityTrackerModuleProps) {
  const [activeTab, setActiveTab] = useState('seat');
  const [seatSubTab, setSeatSubTab] = useState<'order' | 'ops' | 'mgmt'>('order');
  
  const [selectedSite, setSelectedSite] = useState('jakarta');
  const [selectedFloor, setSelectedFloor] = useState('04');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // Zoom level for the visual map grid

  // Mock list of employees for seat assignment
  const employeeRegistry = [
    { id: 'EMP001', name: 'Rian Hidayat', dept: 'Agent Operations' },
    { id: 'EMP002', name: 'Siti Aminah', dept: 'Quality Assurance' },
    { id: 'EMP003', name: 'Ahmad Fauzi', dept: 'IT Tech Support' },
    { id: 'EMP004', name: 'Budiman Santoso', dept: 'Supervisor Shift 1' },
    { id: 'EMP005', name: 'Larasati Putri', dept: 'Agent Operations' },
    { id: 'EMP006', name: 'Eko Prasetyo', dept: 'Database Administrator' },
    { id: 'EMP007', name: 'Indah Jaya Lestari', dept: 'Team Leader Support' },
    { id: 'EMP008', name: 'Rian Wijaya Kusuma', dept: 'Agent Operations' },
    { id: 'EMP009', name: 'Dewi Lestari', dept: 'Operations Manager' },
    { id: 'EMP010', name: 'Hadi Sucipto', dept: 'Network Engineer' }
  ];

  const sites = {
    jakarta: { label: 'Jakarta HQ', floors: ['03', '04', '05', '06'] },
    jogja: { label: 'Jogja Hub', floors: ['01', '02'] },
    semarang: { label: 'Semarang Site', floors: ['Ground', '01'] }
  };

  // 1. GENERATE STATIC MAP SEATS ON FIRST LAUNCH
  const [currentSeats, setCurrentSeats] = useState<Seat[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('portal_facility_seats_v2');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.warn("Failed parsing seats v2:", e); }
      }
    }

    const initialSeats: Seat[] = [];
    const depts = ['Ops', 'Tech', 'Support', 'QA', 'Manager'];
    const names = ['Agus', 'Bambang', 'Chandra', 'Diana', 'Evi', 'Fajar', 'Gita', 'Hendra', 'Iwan', 'Joko'];

    // Generate L1 (Columns 1 under Server room): 4 groups
    // Group A (3x2), Group B (3x2), Group C (4x2), Group D (3x2)
    const l1Groups = [
      { id: 'L1A', rows: 3, cols: 2 },
      { id: 'L1B', rows: 3, cols: 2 },
      { id: 'L1C', rows: 4, cols: 2 },
      { id: 'L1D', rows: 3, cols: 2 }
    ];
    l1Groups.forEach(grp => {
      for (let r = 1; r <= grp.rows; r++) {
        for (let c = 1; c <= grp.cols; c++) {
          const sid = `${grp.id}-${r}-${c}`;
          const occupied = Math.random() > 0.4;
          const status = occupied ? 'occupied' : (Math.random() > 0.9 ? 'maintenance' : 'available');
          const dept = depts[Math.floor(Math.random() * depts.length)];
          const userName = occupied ? names[Math.floor(Math.random() * names.length)] + ' ' + (r * c) : undefined;
          
          initialSeats.push({
            id: sid,
            zone: 'West Wing (L1)',
            category: 'Standard',
            status,
            userName,
            department: userName ? dept : undefined,
            ipAddress: `10.42.12.${Math.floor(Math.random() * 250) + 2}`,
            bandwidthUsage: occupied ? Math.floor(Math.random() * 15) + 1 : 0,
            lastPing: 'ACTIVE'
          });
        }
      }
    });

    // Generate L2, L3, L4 (Large islands): each 3 groups of (4x3)
    const mainLArrays = ['L2', 'L3', 'L4'];
    mainLArrays.forEach(prefix => {
      const subIslands = ['A', 'B', 'C'];
      subIslands.forEach(sub => {
        for (let r = 1; r <= 4; r++) {
          for (let c = 1; c <= 3; c++) {
            const sid = `${prefix}${sub}-${r}-${c}`;
            const occupied = Math.random() > 0.35;
            const status = occupied ? 'occupied' : (Math.random() > 0.95 ? 'maintenance' : 'available');
            const dept = depts[Math.floor(Math.random() * depts.length)];
            const userName = occupied ? names[Math.floor(Math.random() * names.length)] + ' (Pod ' + sub + ')' : undefined;

            initialSeats.push({
              id: sid,
              zone: `Central Block (${prefix})`,
              category: r === 1 ? 'Leader' : 'Standard',
              status,
              userName,
              department: userName ? dept : undefined,
              ipAddress: `10.42.13.${Math.floor(Math.random() * 250) + 2}`,
              bandwidthUsage: occupied ? Math.floor(Math.random() * 32) + 2 : 0,
              lastPing: 'ACTIVE'
            });
          }
        }
      });
    });

    // Generate R1, R2, R3, R4, R5, R6 (Right arrays below rooms/lift): each 2 groups of (4x2)
    const rightArrays = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];
    rightArrays.forEach(prefix => {
      const subIslands = ['A', 'B'];
      subIslands.forEach(sub => {
        for (let r = 1; r <= 4; r++) {
          for (let c = 1; c <= 2; c++) {
            const sid = `${prefix}${sub}-${r}-${c}`;
            const occupied = Math.random() > 0.45;
            const status = occupied ? 'occupied' : (Math.random() > 0.94 ? 'maintenance' : 'available');
            const dept = depts[Math.floor(Math.random() * depts.length)];
            const userName = occupied ? names[Math.floor(Math.random() * names.length)] + ' ' + sub + r + c : undefined;

            initialSeats.push({
              id: sid,
              zone: 'East Wing (Right)',
              category: r === 1 ? 'VIP' : 'Standard',
              status,
              userName,
              department: userName ? dept : undefined,
              ipAddress: `10.42.14.${Math.floor(Math.random() * 250) + 2}`,
              bandwidthUsage: occupied ? Math.floor(Math.random() * 22) + 1 : 0,
              lastPing: 'ACTIVE'
            });
          }
        }
      });
    });

    return initialSeats;
  });

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('portal_facility_seats_v2', JSON.stringify(currentSeats));
  }, [currentSeats]);

  // Selected State for workspace item clicked
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [activeDetailSeat, setActiveDetailSeat] = useState<Seat | null>(null);
  
  // Selected Room state
  const [selectedRoom, setSelectedRoom] = useState<RoomDetail | null>({
    id: 'Room_Server',
    name: 'Ruang Server',
    englishName: 'Server Room',
    type: 'server',
    status: 'OPTIMAL',
    metrics: { 'Temperature': '21.4 °C', 'Humidity': '44%', 'Active UPS Load': '68%', 'Cooling Status': 'Active (2/2 Chiller)' },
    items: ['Rack Core-A (Cisco Catalyst)', 'Rack Core-B (Fortigate Firewall)', 'Rack VM-01 & VM-02 (Proxmox cluster)', 'Storage NAS Synology (100TB)', 'Auxiliary PDU 3 Phase']
  });

  // Rooms based on the blueprint screenshot
  const blueprintRooms = useMemo<RoomDetail[]>(() => [
    {
      id: 'Room_Server',
      name: 'Ruang Server',
      englishName: 'Server Room',
      type: 'server',
      status: 'OPTIMAL',
      metrics: { 'Suhu Ruangan': '21.4 °C', 'Kelembaban': '44%', 'Beban UPS': '68%', 'Sistem Pendingin': 'Aktif (2/2 Unit Chiller)' },
      items: ['Core Switch Rack A (Cisco Nexus-9000)', 'Security Gateway Gateway (Fortigate FG-200F)', 'Server Backup NAS Synology', 'VM Main Host (4x Dell PowerEdge R740)']
    },
    {
      id: 'Room_Storage',
      name: 'Gudang Inventaris',
      englishName: 'Storage Room',
      type: 'storage',
      status: 'SECURE',
      metrics: { 'Kapasitas Rak': '82%', 'Kunci Akses': 'Elektronik (Biometrik)', 'Jumlah Aset Siap': '124 Unit Alat' },
      items: ['Cadangan Monitor IPS 24"', 'Keyboard & Mouse USB Logitech', 'Spareparts RAM & SSD 512GB', 'Kabel LAN Cat6 Roll', 'Access Point Cadangan']
    },
    {
      id: 'Room_Lift',
      name: 'Area Lift Mandiri',
      englishName: 'Lift Area',
      type: 'lift',
      status: 'OPERATIONAL',
      metrics: { 'Sistem Lift aktif': '4 Lift Aktif', 'Waktu Tunggu Rata': '45 Detik', 'Sensor Berat': 'Normal' },
      items: ['Lift Passenger #1 (Aktif)', 'Lift Passenger #2 (Aktif)', 'Lift Passenger #3 (Perawatan)', 'Lift Cargo (Aktif)', 'Control Core Panel Lift']
    },
    {
      id: 'Room_Meeting',
      name: 'Ruang Meeting DM',
      englishName: 'Meeting Room DM',
      type: 'meeting',
      status: 'FREE',
      metrics: { 'Kapasitas Kursi': '16 Kursi', 'Lebar Layar Proyektor': '110"', 'Sistem Konferensi': 'Polycom Studio X50' },
      items: ['Sound System Terintegrasi', 'Smart Screen TV 75"', 'Colokan HDMI & LAN Meja', 'Wireless Presenter Clicker']
    },
    {
      id: 'Room_Monitoring',
      name: 'Ruang Monitoring DM',
      englishName: 'Monitoring Room DM',
      type: 'monitoring',
      status: 'DUTY_ACTIVE',
      metrics: { 'Jumlah Monitor Server': '8 Monitor Panel', 'Petugas On Duty': 'Ahmad Fauzi & Hadi S.', 'Alert Terbuka': '0 Alert' },
      items: ['Main Video Wall 4x4 Panel', 'PC Server Remote Agent Launcher', 'NVR CCTV Console (64 Ch)', 'Sistem Telemetri Real-time']
    },
    {
      id: 'Room_Coaching',
      name: 'Ruang Coaching & Bincang',
      englishName: 'For Coaching room',
      type: 'coaching',
      status: 'BOOKED',
      metrics: { 'Kapasitas Kursi': '6 Kursi', 'Jadwal Aktif': 'Sesi Coaching Team Ops C', 'Suhu Udara': '23.0 °C' },
      items: ['Whiteboard Magnetik', 'Single Screen Smart TV 43"', 'Premium Ergonomic Couch', 'Nespresso Coffee Station']
    }
  ], []);

  // Filtered & Searched seats
  const filteredSeats = useMemo(() => {
    return currentSeats.filter(seat => {
      const matchesSearch = searchQuery === '' || 
        seat.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (seat.userName && seat.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (seat.department && seat.department.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || seat.status === statusFilter;
      const matchesZone = zoneFilter === 'all' || 
        (zoneFilter === 'west' && seat.zone.includes('West')) ||
        (zoneFilter === 'central' && seat.zone.includes('Central')) ||
        (zoneFilter === 'east' && seat.zone.includes('East'));

      return matchesSearch && matchesStatus && matchesZone;
    });
  }, [currentSeats, searchQuery, statusFilter, zoneFilter]);

  // Overall Statistics calculated instantly
  const stats = useMemo(() => {
    const total = currentSeats.length;
    const occupied = currentSeats.filter(s => s.status === 'occupied').length;
    const maintenance = currentSeats.filter(s => s.status === 'maintenance').length;
    const available = total - occupied - maintenance;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return { total, occupied, available, maintenance, occupancyRate };
  }, [currentSeats]);

  const handleSeatClick = (id: string) => {
    const seat = currentSeats.find(s => s.id === id);
    if (!seat) return;

    if (isBulkMode) {
      setSelectedRoom(null); // Deselect room
      setSelectedSeatIds(prev => {
        if (prev.includes(id)) {
          return prev.filter(sid => sid !== id);
        }
        return [...prev, id];
      });
      setActiveDetailSeat(null);
    } else {
      // Single select
      setSelectedRoom(null); // Deselect room
      setSelectedSeatIds([id]);
      setActiveDetailSeat(seat);
    }
  };

  // Assign user to chosen seat
  const handleAssignUser = (employeeId: string) => {
    if (!activeDetailSeat) return;
    const emp = employeeRegistry.find(e => e.id === employeeId);
    if (!emp) return;

    setCurrentSeats(prev => prev.map(s => {
      if (s.id === activeDetailSeat.id) {
        const updated = {
          ...s,
          status: 'occupied' as const,
          userName: emp.name,
          department: emp.dept,
          bandwidthUsage: Math.floor(Math.random() * 25) + 3
        };
        setActiveDetailSeat(updated);
        return updated;
      }
      return s;
    }));
  };

  // Deassign / Release workstation
  const handleReleaseSeat = (targetId: string) => {
    setCurrentSeats(prev => prev.map(s => {
      if (s.id === targetId) {
        const updated = {
          ...s,
          status: 'available' as const,
          userName: undefined,
          department: undefined,
          bandwidthUsage: 0
        };
        if (activeDetailSeat?.id === targetId) {
          setActiveDetailSeat(updated);
        }
        return updated;
      }
      return s;
    }));
  };

  // Change seat state directly (Admin controls)
  const handleUpdateSeatStatus = (targetId: string, nextStatus: SeatStatus) => {
    setCurrentSeats(prev => prev.map(s => {
      if (s.id === targetId) {
        const updated = {
          ...s,
          status: nextStatus,
          userName: nextStatus === 'available' || nextStatus === 'maintenance' ? undefined : s.userName,
          department: nextStatus === 'available' || nextStatus === 'maintenance' ? undefined : s.department,
          bandwidthUsage: nextStatus === 'occupied' ? (s.bandwidthUsage || 10) : 0
        };
        if (activeDetailSeat?.id === targetId) {
          setActiveDetailSeat(updated);
        }
        return updated;
      }
      return s;
    }));
  };

  // Bulk operation to book or free selected items
  const handleBulkSetStatus = (nextStatus: SeatStatus) => {
    if (selectedSeatIds.length === 0) return;
    setCurrentSeats(prev => prev.map(s => {
      if (selectedSeatIds.includes(s.id)) {
        return {
          ...s,
          status: nextStatus,
          userName: nextStatus === 'available' || nextStatus === 'maintenance' ? undefined : s.userName,
          department: nextStatus === 'available' || nextStatus === 'maintenance' ? undefined : s.department,
          bandwidthUsage: nextStatus === 'occupied' ? 12 : 0
        };
      }
      return s;
    }));
    setSelectedSeatIds([]);
    setIsBulkMode(false);
  };

  return (
    <div className="w-full flex-grow flex flex-col">
      {/* 2. MAIN HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
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
            <p className="text-[10px] sm:text-xs text-neutral-gray font-bold uppercase tracking-widest mt-1">
              Visualisasi Tata Letak Denah & Alokasi Workstation Terintegrasi
            </p>
          </div>
        </div>
        <div className="flex bg-slate-100/80 p-1 rounded-xl items-center self-stretch sm:self-auto">
          {(['seat', 'asset', 'license', 'network'] as const).map(tab => (
            <button 
              key={tab}
              className={`flex-1 sm:flex-initial px-4 py-2 font-black text-[10px] uppercase tracking-widest rounded-lg transition-all text-center whitespace-nowrap flex items-center justify-center gap-1.5 ${activeTab === tab ? 'bg-black text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`} 
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'seat' && <Layout size={12} />}
              {tab === 'asset' && <HardDrive size={12} />}
              {tab === 'license' && <FileCheck size={12} />}
              {tab === 'network' && <Wifi size={12} />}
              {tab === 'seat' ? 'Denah Kursi' : tab === 'asset' ? 'Aset Hardware' : tab === 'license' ? 'Lisensi Sofware' : 'Okupansi Network'}
            </button>
          ))}
        </div>
      </div>

      {/* 3. CAPACITIES AND LIVE GAUGES */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
        <div className="bg-white px-5 py-4.5 rounded-[1.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Kursi</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{stats.total}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase font-sans">Node</span>
          </div>
        </div>
        <div className="bg-white px-5 py-4.5 rounded-[1.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Terisi (Occupied)</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-active-red font-mono">{stats.occupied}</span>
            <span className="text-[10px] text-rose-400 font-bold uppercase font-sans">Aktif</span>
          </div>
        </div>
        <div className="bg-white px-5 py-4.5 rounded-[1.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Kosong (Available)</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-emerald-600 font-mono">{stats.available}</span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase font-sans">Siap Pakai</span>
          </div>
        </div>
        <div className="bg-white px-5 py-4.5 rounded-[1.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pemeliharaan</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-amber-500 font-mono">{stats.maintenance}</span>
            <span className="text-[10px] text-amber-500 font-bold uppercase font-sans">Offline</span>
          </div>
        </div>
        <div className="bg-white px-5 py-4.5 rounded-[1.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Rasio Utilitas</span>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-2xl font-black text-slate-950 font-mono">{stats.occupancyRate}%</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-active-red transition-all duration-500 rounded-full" 
                style={{ width: `${stats.occupancyRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden flex-grow flex flex-col min-h-[600px] mb-8">
        <div className="p-4 md:p-6 lg:p-8 flex-grow flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === 'seat' && (
              <motion.div 
                key="seat" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="w-full h-full flex flex-col flex-grow gap-6"
              >
                {/* 4. SELECTION BAR FILTERS */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-4.5 rounded-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[210px]">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari ID Kursi, Nama, Divisi..."
                        className="w-full bg-white border border-slate-200/80 rounded-xl pl-9 pr-4 py-2.5 text-[10px] font-black uppercase placeholder-slate-400 outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200/80">
                      <span className="text-[8px] font-black uppercase text-slate-400 px-2 tracking-widest">Status:</span>
                      {['all', 'available', 'occupied', 'maintenance'].map(st => (
                        <button
                          key={st}
                          onClick={() => setStatusFilter(st)}
                          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all leading-none ${statusFilter === st ? 'bg-black text-white' : 'text-slate-400 hover:text-slate-900'}`}
                        >
                          {st === 'all' ? 'Semua' : st === 'available' ? 'Kosong' : st === 'occupied' ? 'Terisi' : 'Perbaikan'}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200/80">
                      <span className="text-[8px] font-black uppercase text-slate-400 px-2 tracking-widest">Sektor:</span>
                      {['all', 'west', 'central', 'east'].map(zn => (
                        <button
                          key={zn}
                          onClick={() => setZoneFilter(zn)}
                          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all leading-none ${zoneFilter === zn ? 'bg-black text-white' : 'text-slate-400 hover:text-slate-900'}`}
                        >
                          {zn === 'all' ? 'Semua' : zn === 'west' ? 'Barat (L1)' : zn === 'central' ? 'Tengah (L2-L4)' : 'Timur (R)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        setIsBulkMode(!isBulkMode);
                        setSelectedSeatIds([]);
                        setActiveDetailSeat(null);
                      }} 
                      className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-2 ${isBulkMode ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'}`}
                    >
                      <Sliders size={12} />
                      {isBulkMode ? 'Selesai Bulk Select' : 'Reservasi Masal (Bulk)'}
                    </button>

                    <div className="hidden sm:flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-1">
                      <button onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.1))} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Zoom Out"><Minimize2 size={13} /></button>
                      <span className="text-[9px] font-black font-mono text-slate-400 px-1">{Math.round(zoomLevel * 100)}%</span>
                      <button onClick={() => setZoomLevel(prev => Math.min(1.3, prev + 0.1))} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Zoom In"><Maximize2 size={13} /></button>
                    </div>
                  </div>
                </div>

                {/* 5. WORKSPACE AND SIDEBAR GRIDS */}
                <div className="flex flex-col xl:flex-row gap-6 flex-grow items-stretch">
                  
                  {/* FLOOD MAP DESIGN mimicking the user PDF image */}
                  <div className="flex-grow bg-slate-950 rounded-[2rem] border border-slate-800/80 p-6 md:p-8 flex flex-col relative overflow-hidden min-h-[500px]">
                    <div className="absolute inset-0 bg-[radial-gradient(#1e1e2d_1px,transparent_1px)] [background-size:16px_16px] opacity-35" />
                    
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <div>
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] block">SISTEM INTEGRASI DENAH TATA LETAK</span>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider mt-0.5 font-sans">
                          DENAH ARCHITECTURAL LANTAI {selectedFloor} — Sektor Jakarta HQ
                        </h3>
                      </div>

                      <div className="flex gap-4 bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl text-white text-[10px]">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-800 border border-slate-700 rounded-sm" /> Available</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-active-red rounded-sm" /> Occupied</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-600 rounded-sm animate-pulse" /> Selected</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-sm" /> Maintenance</div>
                      </div>
                    </div>

                    {/* Scrollable Map Container */}
                    <div className="flex-grow overflow-auto relative z-10 p-2 custom-blueprint-scroll" style={{ cursor: 'grab' }}>
                      <div 
                        className="min-w-[1100px] space-y-8 transition-transform duration-200 origin-top-left"
                        style={{ transform: `scale(${zoomLevel})` }}
                      >
                        
                        {/* -------------------- ARCHITECTURAL ROOMS (TOP ROW) -------------------- */}
                        <div className="grid grid-cols-12 gap-4">
                          
                          {/* SERVER ROOM (Top Left) */}
                          <div 
                            onClick={() => {
                              setSelectedSeatIds([]);
                              setActiveDetailSeat(null);
                              setSelectedRoom(blueprintRooms[0]);
                            }}
                            className={`col-span-4 bg-slate-900/90 border-2 rounded-2xl p-4 cursor-pointer transition-all hover:bg-slate-900 h-32 flex flex-col justify-between ${selectedRoom?.id === 'Room_Server' ? 'border-rose-600 ring-2 ring-rose-950 shadow-lg shadow-rose-950/20' : 'border-slate-800 hover:border-slate-600'}`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="px-2 py-0.5 bg-rose-600/10 text-rose-500 border border-rose-500/20 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                <Database size={9} /> SERVER ROOM
                              </span>
                              <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              </div>
                            </div>
                            
                            {/* Server Rack Visual Icons inside */}
                            <div className="flex gap-2 items-center">
                              <div className="space-y-1">
                                <div className="w-8 h-12 bg-slate-800 border border-slate-700 rounded p-1 flex flex-col justify-between">
                                  <div className="flex justify-between"><div className="w-full h-1 bg-emerald-500" /><div className="w-1 h-1 rounded-full bg-emerald-500" /></div>
                                  <div className="flex justify-between"><div className="w-full h-1 bg-emerald-500" /><div className="w-1 h-1 rounded-full bg-emerald-500" /></div>
                                  <div className="flex justify-between"><div className="w-full h-1 bg-emerald-500" /><div className="w-1 h-1 rounded-full bg-emerald-500" /></div>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="w-8 h-12 bg-slate-800 border border-slate-700 rounded p-1 flex flex-col justify-between">
                                  <div className="flex justify-between"><div className="w-full h-1 bg-emerald-500" /><div className="w-1 h-1 rounded-full bg-emerald-400" /></div>
                                  <div className="flex justify-between"><div className="w-full h-1 bg-rose-500" /><div className="w-1 h-1 rounded-full bg-rose-500" /></div>
                                  <div className="flex justify-between"><div className="w-full h-1 bg-emerald-500" /><div className="w-1 h-1 rounded-full bg-emerald-500" /></div>
                                </div>
                              </div>
                              <div className="text-left ml-2">
                                <div className="text-[10px] font-black text-slate-200">RUANG SERVER UTAMA</div>
                                <div className="text-[8px] text-slate-400 font-bold font-mono">Temp: 21.4°C | AC OK</div>
                              </div>
                            </div>
                            {/* Sliding doors red indicator */}
                            <div className="h-1 bg-red-600/60 w-3/4 mx-auto rounded-full mt-1 border-t border-red-500" title="Slide Fireproof Door" />
                          </div>

                          {/* STORAGE ROOM (Top Centerish) */}
                          <div 
                            onClick={() => {
                              setSelectedSeatIds([]);
                              setActiveDetailSeat(null);
                              setSelectedRoom(blueprintRooms[1]);
                            }}
                            className={`col-span-3 bg-slate-900/70 border-2 rounded-2xl p-4 cursor-pointer transition-all hover:bg-slate-900 h-32 flex flex-col justify-between ${selectedRoom?.id === 'Room_Storage' ? 'border-amber-500 ring-2 ring-amber-950 shadow-md shadow-amber-950/10' : 'border-slate-800 hover:border-slate-600'}`}
                          >
                            <span className="self-start px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded text-[8px] font-black uppercase tracking-wider">
                              STORAGE & GUDANG
                            </span>
                            
                            <div className="flex justify-around items-center h-12">
                              {/* Circle Desk representation */}
                              <div className="w-8 h-8 rounded-full border-2 border-slate-700 flex items-center justify-center relative">
                                <div className="w-1 h-1 rounded-full bg-slate-600" />
                                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-slate-500" />
                              </div>
                              {/* Rectangular parts racks */}
                              <div className="w-14 h-6 border border-slate-700 bg-slate-800/60 rounded flex items-center justify-around">
                                <div className="w-2 h-full border-r border-slate-700" />
                                <div className="w-2 h-full border-r border-slate-700" />
                                <div className="w-2 h-full border-r border-slate-700" />
                              </div>
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">STORAGE ROOM</div>
                            <div className="h-1 bg-red-600/60 w-1/4 rounded-full" title="Storage Secure Swing Door" />
                          </div>

                          {/* SPACER CORRIDOR FOR DESIGN FIDELITY */}
                          <div className="col-span-1 h-32 border-l border-r border-slate-800/40 relative flex items-center justify-center">
                            <span className="text-[8px] font-mono tracking-widest text-slate-700 rotate-90 uppercase">Corridor Barat</span>
                          </div>

                          {/* LIFT AREA (Top Right Grid) */}
                          <div 
                            onClick={() => {
                              setSelectedSeatIds([]);
                              setActiveDetailSeat(null);
                              setSelectedRoom(blueprintRooms[2]);
                            }}
                            className={`col-span-4 bg-slate-900/50 border-2 rounded-2xl p-4 cursor-pointer transition-all hover:bg-slate-900 h-32 flex flex-col justify-between ${selectedRoom?.id === 'Room_Lift' ? 'border-indigo-500 ring-2 ring-indigo-950 shadow-md shadow-indigo-950/10' : 'border-slate-800 hover:border-slate-600'}`}
                          >
                            <span className="self-start px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[8px] font-black uppercase tracking-wider">
                              LIFT AREA & LOBBY ENTRANCE
                            </span>

                            {/* Elevator cells with vertical sliding doors */}
                            <div className="grid grid-cols-6 gap-1">
                              {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-slate-850 border border-slate-700 h-8 rounded flex flex-col justify-between p-1">
                                  <div className="flex justify-between items-center text-[7px] font-mono text-slate-500">
                                    <span>#{i}</span>
                                    <span className={i === 3 ? "text-amber-500" : "text-emerald-500"}>●</span>
                                  </div>
                                  <div className="flex gap-0.5 h-3">
                                    <div className="flex-1 bg-slate-700/80 rounded-l" />
                                    <div className="flex-1 bg-slate-700/80 rounded-r" />
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex justify-between items-center text-[8px] font-black text-slate-500 tracking-wider">
                              <span>LOBBY UTAMA</span>
                              <span className="font-mono text-emerald-400">PETA LIFT OPERASIONAL</span>
                            </div>
                          </div>

                        </div>

                        {/* ----------------- SEPARATOR/WALL LINE (ACCORDING TO PLAN) ----------------- */}
                        <div className="relative">
                          <div className="absolute left-0 right-0 h-1.5 bg-slate-800 rounded-full" />
                          <div className="absolute right-1/4 w-12 h-1.5 bg-red-600 rounded-full border-t border-red-500" title="Main Entrance Glass Doors" />
                          <div className="absolute left-1/3 w-10 h-1.5 bg-red-600 rounded-full border-t border-red-500" title="West Sector Safety Swing Doors" />
                        </div>

                        {/* -------------------- MIDDLE LAYOUT (MEETING/MONITORING/COACHING ROOMS) -------------------- */}
                        <div className="grid grid-cols-12 gap-4 pt-1">
                          
                          {/* Left Spacer for Left Open Space */}
                          <div className="col-span-4 flex items-center justify-center p-2 bg-slate-900/10 border border-dashed border-slate-800/40 rounded-xl h-24">
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Open Plan Area (West Section)</span>
                          </div>

                          {/* MEETING ROOM DM */}
                          <div 
                            onClick={() => {
                              setSelectedSeatIds([]);
                              setActiveDetailSeat(null);
                              setSelectedRoom(blueprintRooms[3]);
                            }}
                            className={`col-span-3 bg-slate-900/80 border-2 rounded-2xl p-3 cursor-pointer transition-all hover:bg-slate-900 h-24 flex flex-col justify-between ${selectedRoom?.id === 'Room_Meeting' ? 'border-sky-500 ring-2 ring-sky-950 shadow-md shadow-sky-950/10' : 'border-slate-800 hover:border-slate-600'}`}
                          >
                            <span className="self-start px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-[8px] font-black uppercase tracking-wider">
                              MEETING ROOM DM
                            </span>
                            {/* conference table inside */}
                            <div className="bg-slate-850 border border-slate-750 p-1.5 rounded flex items-center justify-around">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                              <div className="w-20 h-3 bg-slate-700/80 rounded-full border border-slate-600 flex items-center justify-around px-2">
                                <div className="w-1 h-1 bg-white rounded-full" />
                                <div className="w-1 h-1 bg-white rounded-full" />
                              </div>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                            </div>
                            <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider text-center">Kapasitas: 16 Pax | Screen Active</div>
                          </div>

                          {/* MONITORING ROOM DM */}
                          <div 
                            onClick={() => {
                              setSelectedSeatIds([]);
                              setActiveDetailSeat(null);
                              setSelectedRoom(blueprintRooms[4]);
                            }}
                            className={`col-span-2 bg-slate-900/80 border-2 rounded-2xl p-3 cursor-pointer transition-all hover:bg-slate-900 h-24 flex flex-col justify-between ${selectedRoom?.id === 'Room_Monitoring' ? 'border-teal-500 ring-2 ring-teal-950 shadow-md shadow-teal-950/10' : 'border-slate-800 hover:border-slate-600'}`}
                          >
                            <span className="self-start px-1.5 py-0.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded text-[7px] font-black uppercase tracking-wider block truncate">
                              MONITORING ROOM DM
                            </span>
                            <div className="flex gap-1.5 justify-center items-center">
                              {/* Mini matrix video wall representation */}
                              <div className="grid grid-cols-4 gap-0.5 bg-slate-800 p-1 rounded border border-slate-700">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(x => (
                                  <div key={x} className={`w-2.5 h-1.5 rounded-sm ${x === 3 || x === 6 ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                ))}
                              </div>
                              <div className="w-3.5 h-4.5 bg-slate-800 rounded border border-slate-750 flex items-center justify-center"><Cpu size={10} className="text-teal-400" /></div>
                            </div>
                            <div className="text-[7.5px] text-slate-400 font-bold uppercase text-center block tracking-tight">PC Server Remote</div>
                          </div>

                          {/* COACHING ROOM */}
                          <div 
                            onClick={() => {
                              setSelectedSeatIds([]);
                              setActiveDetailSeat(null);
                              setSelectedRoom(blueprintRooms[5]);
                            }}
                            className={`col-span-3 bg-slate-900/80 border-2 rounded-2xl p-3 cursor-pointer transition-all hover:bg-slate-900 h-24 flex flex-col justify-between ${selectedRoom?.id === 'Room_Coaching' ? 'border-fuchsia-500 ring-2 ring-fuchsia-950 shadow-md shadow-fuchsia-950/10' : 'border-slate-800 hover:border-slate-600'}`}
                          >
                            <span className="self-start px-2 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 rounded text-[8px] font-black uppercase tracking-wider">
                              FOR COACHING ROOM
                            </span>
                            <div className="flex justify-around items-center pt-0.5">
                              <div className="w-6 h-6 rounded-full border border-slate-700 bg-slate-800/80 flex items-center justify-center"><span className="text-[7px]">Table</span></div>
                              <div className="w-2.5 h-5 bg-slate-800 rounded border border-slate-700" />
                            </div>
                            <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest text-center">Coaching Section</div>
                          </div>

                        </div>

                        {/* -------------------- MAIN WORKSPACE AREA ARRAYS (WEST & EAST WINGS) -------------------- */}
                        <div className="pt-3">
                          <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                            <span>Sektor Workstation Agen & Operator</span>
                            <div className="flex-grow h-px bg-slate-800" />
                          </h4>

                          <div className="grid grid-cols-12 gap-5">
                            
                            {/* COL 1: WEST PERIPHERAL WORKSTATIONS (L1A, L1B, L1C, L1D) */}
                            <div className="col-span-3 bg-slate-900/10 border border-slate-800/40 p-4.5 rounded-2xl space-y-6">
                              <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest block border-b border-slate-800/40 pb-1 mb-2.5">West Row Left (L1 Array)</span>
                              
                              {/* 4 vertically stacked pods reflecting image */}
                              {['L1A', 'L1B', 'L1C', 'L1D'].map((grpId) => {
                                const grpSeats = filteredSeats.filter(s => s.id.startsWith(grpId));
                                return (
                                  <div key={grpId} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                                    <div className="flex justify-between items-center mb-2.5">
                                      <span className="text-[9px] font-black font-mono text-slate-400 uppercase">CLUSTER {grpId}</span>
                                      <span className="text-[8px] font-sans text-slate-500 uppercase font-black">({grpSeats.length} Desks)</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      {grpSeats.map(seat => {
                                        const isSelected = selectedSeatIds.includes(seat.id);
                                        return (
                                          <button
                                            key={seat.id}
                                            onClick={() => handleSeatClick(seat.id)}
                                            className={`h-9 rounded-lg flex flex-col justify-center items-center text-[8px] font-black font-mono transition-all transform active:scale-95 ${
                                              seat.status === 'occupied' ? 'bg-active-red text-white hover:bg-rose-700 border border-rose-800' :
                                              seat.status === 'maintenance' ? 'bg-slate-850 text-slate-500 border border-slate-800 hover:bg-slate-800' :
                                              isSelected ? 'bg-blue-600 text-white border border-blue-500 animate-pulse ring-2 ring-blue-900' :
                                              'bg-slate-900 text-slate-300 border border-slate-850 hover:bg-slate-800 hover:text-white hover:border-slate-700'
                                            }`}
                                            title={`Workstation ${seat.id} - ${seat.status.toUpperCase()} ${seat.userName ? `| ${seat.userName}` : ''}`}
                                          >
                                            <span className="font-mono text-[8px]">{seat.id.split('-').slice(1).join('-')}</span>
                                            {seat.userName && <span className="text-[6px] opacity-40 uppercase truncate w-10 block text-center mt-0.5">{seat.userName}</span>}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* CENTER-LEFT WORKSTATIONS ARRAYS: L2, L3, L4 (4x3 large islands) */}
                            <div className="col-span-5 bg-slate-900/10 border border-slate-800/40 p-4.5 rounded-2xl space-y-6">
                              <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest block border-b border-slate-800/40 pb-1 mb-2.5">Central Grid Rows (L2, L3, L4 Arrays)</span>
                              
                              <div className="grid grid-cols-3 gap-3.5">
                                {['L2', 'L3', 'L4'].map((grpPrefix) => (
                                  <div key={grpPrefix} className="space-y-4">
                                    <span className="text-[9px] font-mono font-black text-slate-300 uppercase tracking-wider block text-center bg-slate-900 border border-slate-850 py-1 rounded">{grpPrefix} Column</span>
                                    
                                    {['A', 'B', 'C'].map(sub => {
                                      const clusterId = `${grpPrefix}${sub}`;
                                      const clusterSeats = filteredSeats.filter(s => s.id.startsWith(clusterId));
                                      return (
                                        <div key={sub} className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80">
                                          <div className="text-[8px] font-mono text-slate-400 font-bold block mb-2 uppercase text-center">Pod {clusterId}</div>
                                          
                                          <div className="grid grid-cols-3 gap-1.5">
                                            {clusterSeats.map(seat => {
                                              const isSelected = selectedSeatIds.includes(seat.id);
                                              return (
                                                <button
                                                  key={seat.id}
                                                  onClick={() => handleSeatClick(seat.id)}
                                                  className={`h-8 rounded-md flex flex-col justify-center items-center text-[7.5px] font-mono font-black transition-all ${
                                                    seat.status === 'occupied' ? 'bg-active-red text-white hover:bg-rose-700' :
                                                    seat.status === 'maintenance' ? 'bg-slate-850 text-slate-500 border border-slate-800' :
                                                    isSelected ? 'bg-blue-600 text-white animate-pulse' :
                                                    'bg-slate-900 text-slate-300 border border-slate-850 hover:bg-slate-800 hover:text-white'
                                                  }`}
                                                  title={`Seat ${seat.id}`}
                                                >
                                                  <span>{seat.id.split('-').slice(1).join('-')}</span>
                                                  {seat.category === 'Leader' && <span className="text-[5px] text-amber-400 uppercase font-bold leading-none scale-90">Ldr</span>}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* SEPARATOR GAP FOR MIDDLE WALKWAY CORRIDOR */}
                            <div className="col-span-1 border-l border-r border-slate-800/40 flex flex-col justify-between py-10 items-center">
                              <span className="text-[8px] text-slate-700 font-mono tracking-[0.3em] uppercase rotate-90">Walkway Central</span>
                              <span className="text-[8px] text-slate-700 font-mono tracking-[0.3em] uppercase rotate-90">Aisle</span>
                              <span className="text-[8px] text-slate-700 font-mono tracking-[0.3em] uppercase rotate-90 font-bold tracking-widest text-emerald-600">Jalur Evakuasi</span>
                            </div>

                            {/* COL 3: EAST WORKSTATIONS ARRAYS (R1 to R6 columns) */}
                            <div className="col-span-3 bg-slate-900/10 border border-slate-800/40 p-4.5 rounded-2xl space-y-6">
                              <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest block border-b border-slate-800/40 pb-1 mb-2.5">East Wing (R1 - R6 Arrays)</span>
                              
                              <div className="grid grid-cols-2 gap-3">
                                {['R1', 'R2', 'R3', 'R4', 'R5', 'R6'].map(prefix => (
                                  <div key={prefix} className="space-y-3">
                                    <div className="text-[8px] font-mono font-black text-center text-slate-400 bg-slate-900/90 py-0.5 rounded border border-slate-850 uppercase">{prefix} Col</div>
                                    
                                    {['A', 'B'].map(sub => {
                                      const clId = `${prefix}${sub}`;
                                      const clSeats = filteredSeats.filter(s => s.id.startsWith(clId));
                                      return (
                                        <div key={sub} className="bg-slate-900/40 p-2 rounded-xl border border-slate-800/70">
                                          <div className="text-[7.5px] font-mono text-center text-slate-500 mb-1.5 uppercase font-bold">{clId}</div>
                                          <div className="grid grid-cols-2 gap-1">
                                            {clSeats.map(seat => {
                                              const isSelected = selectedSeatIds.includes(seat.id);
                                              return (
                                                <button
                                                  key={seat.id}
                                                  onClick={() => handleSeatClick(seat.id)}
                                                  className={`h-7 rounded flex flex-col justify-center items-center text-[7px] font-mono font-semibold transition-all ${
                                                    seat.status === 'occupied' ? 'bg-active-red text-white' :
                                                    seat.status === 'maintenance' ? 'bg-slate-850 text-slate-500 border border-slate-800' :
                                                    isSelected ? 'bg-blue-600 text-white animate-pulse' :
                                                    'bg-slate-900 text-slate-300 border border-slate-850 hover:bg-slate-800'
                                                  }`}
                                                  title={`Seat ${seat.id}`}
                                                >
                                                  <span>{seat.id.split('-').slice(1).join('-')}</span>
                                                  {seat.category === 'VIP' && <span className="text-[5px] text-cyan-400 leading-none">Vip</span>}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Touch Friendly Scrolling notice watermark */}
                    <div className="text-[9px] text-slate-500 mt-4 border-t border-slate-900 pt-3 flex items-center justify-between font-bold uppercase tracking-wider">
                      <span>* Catatan: Seret / geser denah ke samping untuk menjelajah area sisi kanan secara penuh</span>
                      <span>Sistem Terenkripsi SCRAM-SHA-255</span>
                    </div>
                  </div>

                  {/* SIDEBAR RESERVE / CONTROL PORT */}
                  <div className="w-full xl:w-96 shrink-0 flex flex-col gap-6">

                    {/* Room Detail Panel (If room clicked) */}
                    {selectedRoom && (
                      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-5 animate-in fade-in slide-in-from-right-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md tracking-wider">ROOM ARCHITECTURE</span>
                          <button onClick={() => setSelectedRoom(null)} className="text-slate-400 hover:text-slate-900"><X size={15} /></button>
                        </div>

                        <div>
                          <h4 className="text-base font-black text-slate-900 uppercase font-sans tracking-tight">{selectedRoom.name}</h4>
                          <span className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider">{selectedRoom.englishName}</span>
                        </div>

                        <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Telemetri & Metrik Ruang</div>
                          <div className="space-y-2 font-mono">
                            {Object.entries(selectedRoom.metrics).map(([key, value]) => (
                              <div key={key} className="flex justify-between items-center text-[10px] border-b border-dashed border-slate-200/50 pb-1.5 last:border-0 last:pb-0">
                                <span className="text-slate-500 font-bold uppercase">{key}</span>
                                <span className="text-slate-950 font-black">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3 block">Inventaris & Sub-Aset Terpasang:</div>
                          <div className="space-y-1.5">
                            {selectedRoom.items?.map((it, i) => (
                              <div key={i} className="flex items-center gap-2 text-[10.5px] text-slate-700 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                {it}
                              </div>
                            ))}
                          </div>
                        </div>

                        {selectedRoom.type === 'meeting' && (
                          <div className="pt-2">
                            <button 
                              onClick={() => alert('Fitur booking Ruang Rapat berhasil disimulasikan!')}
                              className="w-full py-3 bg-black hover:bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-md"
                            >
                              Jadwalkan Pertemuan Baru
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Single Workstation Reservation Detail */}
                    {activeDetailSeat && (
                      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-5 animate-in fade-in slide-in-from-right-4">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                          <div>
                            <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded tracking-widest">{activeDetailSeat.zone}</span>
                            <h4 className="text-lg font-black text-slate-900 font-mono mt-1">Meja {activeDetailSeat.id}</h4>
                          </div>
                          <button onClick={() => setActiveDetailSeat(null)} className="text-slate-400 hover:text-slate-900"><X size={15} /></button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                            <span className="text-[8px] font-black uppercase text-slate-400 block tracking-widest">Kategori Meja</span>
                            <span className="text-[11px] font-black text-slate-900 uppercase mt-1 block">{activeDetailSeat.category} Desk</span>
                          </div>
                          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                            <span className="text-[8px] font-black uppercase text-slate-400 block tracking-widest">Warna Status</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={`w-2.5 h-2.5 rounded-full ${
                                activeDetailSeat.status === 'occupied' ? 'bg-active-red' :
                                activeDetailSeat.status === 'maintenance' ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} />
                              <span className="text-[10px] font-black uppercase text-slate-900 font-mono">{activeDetailSeat.status}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                          <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-200/50 pb-1">Spesifikasi Meja Kerja:</div>
                          <div className="flex justify-between text-[10px] font-mono"><span className="text-slate-500">IP ADDRESS:</span><span className="text-slate-900 font-bold">{activeDetailSeat.ipAddress}</span></div>
                          <div className="flex justify-between text-[10px] font-mono"><span className="text-slate-500">THROUGHPUT:</span><span className="text-slate-900 font-bold">{activeDetailSeat.bandwidthUsage || 0} Mbps</span></div>
                          <div className="flex justify-between text-[10px] font-mono"><span className="text-slate-500">STATUS PING:</span><span className="text-emerald-500 font-bold">{activeDetailSeat.lastPing}</span></div>
                          <div className="flex justify-between text-[10px] font-mono"><span className="text-slate-500">SEKTOR KAWASAN:</span><span className="text-slate-900 uppercase font-black">{activeDetailSeat.zone}</span></div>
                        </div>

                        {/* Assignment Details */}
                        {activeDetailSeat.status === 'occupied' ? (
                          <div className="bg-red-50/50 border border-red-100/60 p-4 rounded-xl flex flex-col gap-3">
                            <span className="text-[8px] font-black uppercase tracking-widest text-red-600 block">Identitas Operator Terdaftar:</span>
                            <div>
                              <div className="text-xs font-black text-slate-900 uppercase tracking-tight">{activeDetailSeat.userName}</div>
                              <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{activeDetailSeat.department}</div>
                            </div>
                            <button
                              onClick={() => {
                                handleReleaseSeat(activeDetailSeat.id);
                              }}
                              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors"
                            >
                              Bebaskan Meja Kerja (Deassign)
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Pilih Karyawan Ops untuk Alokasi:</label>
                              <select
                                onChange={(e) => {
                                  if (e.target.value) handleAssignUser(e.target.value);
                                }}
                                defaultValue=""
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer"
                              >
                                <option value="" disabled>-- Pilih Karyawan --</option>
                                {employeeRegistry.map(emp => (
                                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.dept})</option>
                                ))}
                              </select>
                            </div>

                            <div className="flex gap-2">
                              {activeDetailSeat.status === 'maintenance' ? (
                                <button
                                  onClick={() => handleUpdateSeatStatus(activeDetailSeat.id, 'available')}
                                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-colors"
                                >
                                  Selesaikan Perbaikan
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateSeatStatus(activeDetailSeat.id, 'maintenance')}
                                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-colors"
                                >
                                  Tandai Perbaikan
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bulk Actions Console */}
                    {isBulkMode && selectedSeatIds.length > 0 && (
                      <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl flex flex-col gap-6 animate-in fade-in slide-in-from-right-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                          <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">BULK CONTROL CONSOLE</h4>
                          <span className="px-2.5 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 font-black font-mono text-[9px] rounded-lg">{selectedSeatIds.length} Node Terpilih</span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                          {selectedSeatIds.map(sid => (
                            <span key={sid} className="px-2 py-1 bg-white/10 border border-white/5 rounded text-[8.5px] font-mono tracking-widest">
                              {sid}
                            </span>
                          ))}
                        </div>

                        <div className="space-y-2.5">
                          <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400">Aksi Masal yang Tersedia:</span>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => handleBulkSetStatus('available')}
                              className="py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors"
                            >
                              Kosongkan
                            </button>
                            <button
                              onClick={() => handleBulkSetStatus('occupied')}
                              className="py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors"
                            >
                              Tandai Terisi
                            </button>
                            <button
                              onClick={() => handleBulkSetStatus('maintenance')}
                              className="py-2.5 bg-amber-500 hover:bg-amber-600 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors"
                            >
                              Perbaikan
                            </button>
                          </div>
                          <button
                            onClick={() => setSelectedSeatIds([])}
                            className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all mt-2"
                          >
                            Batalkan Pilihan
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Standard Instruction Sidebar Callout */}
                    {!selectedRoom && !activeDetailSeat && (!isBulkMode || selectedSeatIds.length === 0) && (
                      <div className="bg-slate-900 text-white p-7 rounded-[2rem] flex flex-col justify-between items-center text-center shadow-xl flex-grow min-h-[350px]">
                        <div className="my-auto space-y-4">
                          <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mx-auto shadow-inner animate-pulse">
                            <MousePointer2 className="text-rose-500" size={24} />
                          </div>
                          <div>
                            <h5 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">RESERVATION PORT</h5>
                            <h4 className="text-xs font-bold font-sans text-white uppercase mt-1 leading-relaxed max-w-[200px] mx-auto">
                              Silakan klik Meja Kerja atau Ruangan pada denah
                            </h4>
                          </div>
                          <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                            Melihat metrik real-time, status AC, alokasi operator, dan manajemen gateway hardware.
                          </p>
                        </div>

                        <div className="w-full pt-4 border-t border-slate-800">
                          <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase tracking-widest mx-2">
                            <span>SISTEM</span>
                            <span>ACTIVE STABLE</span>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              </motion.div>
            )}

            {/* UPGRADED HARDWARE INVENTORY LIFECYCLE */}
            {activeTab === 'asset' && (
              <motion.div key="asset" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <HardDrive size={16} className="text-active-red" /> Register Siklus Hidup Aset Hardware (Jakarta Floor 04)
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">Sistem Logging Inventaris Komputer, Router, Switch, IP Phone, dan UPS</p>
                  </div>
                  <button onClick={() => alert('Fitur tambah aset hardware berhasil disimulasikan!')} className="px-5 py-3 bg-black hover:bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md">
                    + Tambah Aset Baru
                  </button>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-[1.5rem] overflow-hidden">
                  <table className="w-full text-left font-sans">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Kode Serial Aset</th>
                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Model / Deskripsi</th>
                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Lokasi / Meja</th>
                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Status Kesehatan</th>
                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Pemeliharaan Terakhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[10.5px]">
                      {[
                        { sn: 'SN-DELL-992A', desc: 'Dell Optiplex 7080 SFF Core i7 16GB', loc: 'Meja L2A-1-1', health: 'SANGAT BAIK', last: '12 Mei 2026' },
                        { sn: 'SN-DELL-993A', desc: 'Dell Optiplex 7080 SFF Core i7 16GB', loc: 'Meja L2A-1-2', health: 'SANGAT BAIK', last: '12 Mei 2026' },
                        { sn: 'SN-CSCO-8832', desc: 'Cisco Live IP Phone 8832 Speaker', loc: 'Ruangan Meeting DM', health: 'OPTIMAL', last: '22 Apr 2026' },
                        { sn: 'SN-FTGT-202X', desc: 'Fortigate Firewall FG-200F Enterprise', loc: 'Ruangan Server Utama', health: 'CRITICAL HOT', last: '01 Juni 2026' },
                        { sn: 'SN-APCC-3000', desc: 'APC Smart-UPS SMT3000RM2UNC', loc: 'Ruangan Server Utama', health: 'OPTIMAL', last: '10 Feb 2026' },
                        { sn: 'SN-DELL-552C', desc: 'Dell PowerEdge R740 Server virtualizer', loc: 'Ruangan Server Utama', health: 'OPTIMAL', last: '15 Mei 2026' },
                        { sn: 'SN-LGIT-9921', desc: 'Monitor LG IPS 24" Ultra-thin (VIP Row)', loc: 'Meja R1A-1-1', health: 'BUTUH SERVIS', last: '02 Mar 2026' }
                      ].map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4.5 font-bold text-slate-900">{item.sn}</td>
                          <td className="px-6 py-4.5 font-sans text-slate-600 font-medium">{item.desc}</td>
                          <td className="px-6 py-4.5 font-sans font-black text-slate-500 uppercase">{item.loc}</td>
                          <td className="px-6 py-4.5">
                            <span className={`px-2.5 py-1 rounded text-[8.5px] font-sans font-black uppercase ${
                              item.health === 'SANGAT BAIK' || item.health === 'OPTIMAL' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              item.health === 'CRITICAL HOT' ? 'bg-red-50 text-active-red border border-red-100 animate-pulse' : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {item.health}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 font-sans text-slate-500 font-medium">{item.last}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* UPGRADED LICENSES TABLE AND ASSIGNMENT POOL */}
            {activeTab === 'license' && (
              <motion.div key="license" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <FileCheck size={16} className="text-active-red" /> Kepatuhan Pool Lisensi Software Korporat
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">Sistem Otomasi Validasi Kepatuhan Kursi Terdaftar terhadap Lisensi Sistem</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* License compliance lists */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Lisensi Utama Aktif</h5>
                    <div className="space-y-4">
                      {[
                        { name: 'Office 365 Business Premium', count: '142 / 160 Kursi', status: 'AMAN', color: 'text-emerald-500 bg-emerald-50' },
                        { name: 'Windows 11 Professional Pro KMS', count: '158 / 160 Kursi', status: 'LIMIT', color: 'text-amber-500 bg-amber-50' },
                        { name: 'Kaspersky Endpoint Security Suite', count: '135 / 160 Kursi', status: 'AMAN', color: 'text-emerald-500 bg-emerald-50' },
                        { name: 'Zria Voice Call SIP Launcher Pro', count: '96 / 100 Kursi', status: 'AMAN', color: 'text-emerald-500 bg-emerald-50' },
                        { name: 'Adobe Creative Cloud Suite Team', count: '11 / 10 Lisensi', status: 'MELANGGAR', color: 'text-rose-600 bg-rose-50 border-rose-100 animate-pulse' }
                      ].map((lic, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div>
                            <div className="text-xs font-black text-slate-800 uppercase tracking-tight">{lic.name}</div>
                            <div className="text-[9.5px] font-mono text-slate-400 mt-0.5">{lic.count} terpasang</div>
                          </div>
                          <span className={`px-2 py-1 text-[8px] font-black rounded uppercase ${lic.color}`}>{lic.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Audit Logs */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Aktivitas Audit Lisensi Terakhir</h5>
                    <div className="space-y-3.5 font-mono text-[10px]">
                      {[
                        { time: '09:12:45', act: 'Verifikasi Otomatis Kursi L2-B13-1 Mendeteksi Serial Windows Valid' },
                        { time: '08:55:12', act: 'Lisensi Office 365 Dialokasikan Otomatis ke Operator Baru Budiman S.' },
                        { time: '07:44:02', act: 'Audit Bulanan Kaspersky Client Berhasil diselesaikan (0 Ancaman)' },
                        { time: 'Kemarin', act: 'Peringatan Kepenuhan Lisensi Adobe CC oleh Admin IP 192.168.1.12' }
                      ].map((l, i) => (
                        <div key={i} className="flex gap-3 border-b border-dashed border-slate-100 pb-2.5 last:border-0 last:pb-0">
                          <span className="text-slate-400 font-bold shrink-0">{l.time}</span>
                          <span className="text-slate-700 font-sans">{l.act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* UPGRADED REAL-TIME TELEMETRY NETWORK BANDWIDTH OCCUPANCY */}
            {activeTab === 'network' && (
              <motion.div key="network" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Wifi size={16} className="text-active-red" /> Terminal Telemetri & Okupansi Jaringan Real-Time
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">Status Bandwidth Lokal Core Switch Floor 04 Gateway</p>
                  </div>
                  <div className="flex bg-white px-4 py-2 border border-slate-200 rounded-xl items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black font-mono uppercase text-slate-600">Bandwidth Utama: 894 Mbps / 1 Gbps Link</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Top bandwidth users */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm col-span-2">
                    <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between">
                      <span>Top Utilitas Bandwidth Meja Kerja</span>
                      <span className="text-[9px] text-emerald-500">Live Telemetry</span>
                    </h5>
                    
                    <div className="space-y-3">
                      {currentSeats
                        .filter(s => s.status === 'occupied')
                        .slice(0, 6)
                        .map((s, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <span className="font-mono text-[9px] font-bold text-slate-400 w-12">{s.id}</span>
                            <span className="font-sans text-[11px] text-slate-800 font-medium w-36 truncate">{s.userName || 'Operator Active'}</span>
                            <div className="flex-1 h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-slate-900 transition-all rounded-full" 
                                style={{ width: `${Math.min(100, ((s.bandwidthUsage || 10) / 35) * 100)}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] font-black text-slate-900 w-16 text-right">
                              {s.bandwidthUsage || Math.floor(Math.random() * 20) + 1} Mbps
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Right: Live log ticker */}
                  <div className="bg-slate-950 text-emerald-400 border border-slate-850 rounded-2xl p-6 shadow-xl font-mono text-[10px] h-[280px] overflow-hidden relative flex flex-col">
                    <div className="absolute top-3 right-3 text-[7px] text-rose-500 uppercase tracking-widest animate-pulse font-sans font-black flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-600" /> Live Logs
                    </div>
                    
                    <span className="text-slate-400 text-[9px] uppercase tracking-wider block border-b border-slate-900 pb-2 mb-3">Gateway Log Ticker</span>
                    
                    <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow">
                      <div><span className="text-slate-500">[09:25:52]</span> Meja L2C-4-3: Request DNS resolve ke google.com OK</div>
                      <div><span className="text-slate-500">[09:25:48]</span> Server VM-01: Auto balancing CPU load di 12.4%</div>
                      <div><span className="text-slate-500">[09:25:40]</span> Meja R3A-2-2: VoIP call dimulai (Codec opus-75kbps)</div>
                      <div><span className="text-slate-500">[09:25:31]</span> Meja L1A-2-1: DHCP release, IP dipinjamkan ke Mac-B04</div>
                      <div><span className="text-slate-500">[09:25:21]</span> Area Lift passenger #2: IoT sensor mendeteksi pintu tertutup</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
