import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import LoginPage from "./components/LoginPage.tsx";
import WorkforceModule from "./components/WorkforceModule.tsx";
import HCManagementModule from "./components/HCManagementModule.tsx";
import PLAnalysisModule from "./components/PLAnalysisModule.tsx";
import AboutModule from "./components/AboutModule.tsx";
import KPITrackerModule from "./components/KPITrackerModule.tsx";
import { Settings as SettingsModule } from "./components/Settings.tsx";
import { 
  Users, 
  UserPlus, 
  LineChart, 
  Target, 
  Building2, 
  GraduationCap, 
  LifeBuoy, 
  Calendar,
  ChevronRight,
  TrendingUp,
  Settings as SettingsIcon,
  Bell,
  Menu,
  X,
  LogOut
} from "lucide-react";

interface Category {
  title: string;
  icon: React.ElementType;
  description: string;
}

const DASHBOARD_DATA: Category[] = [
  {
    title: "Workforce",
    icon: Users,
    description: "Manage human capital, capacity planning, and workforce analytics including PPM, PPH, and staffing trends.",
  },
  {
    title: "HC Management",
    icon: Users,
    description: "Specialized tools for managing personnel records, organizational structure, and headcount optimization.",
  },
  {
    title: "ID Creation & Deletion",
    icon: UserPlus,
    description: "Streamlined administration for user identity lifecycle management, access provisioning, and account deactivation.",
  },
  {
    title: "PL Analysis",
    icon: LineChart,
    description: "Comprehensive financial oversight featuring P&L forecasting, actual performance tracking, and billing submissions.",
  },
  {
    title: "KPI Tracker",
    icon: Target,
    description: "Monitor and evaluate key performance indicators to ensure operational excellence and target achievement.",
  },
  {
    title: "Facility Tracker",
    icon: Building2,
    description: "Optimize physical infrastructure through seat management, asset tracking, and license monitoring.",
  },
  {
    title: "People Development",
    icon: GraduationCap,
    description: "Empower talent via upskilling programs, syllabus management, and standardized competency assessments.",
  },
  {
    title: "Support",
    icon: LifeBuoy,
    description: "Specialized assistance for presale/aftersales capacity calculations, training, and automation requests.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function App() {
  console.log("App component initializing...");
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true" || sessionStorage.getItem("isLoggedIn") === "true";
  });
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const handleLogin = (remember: boolean) => {
    setIsLoggedIn(true);
    if (remember) {
      localStorage.setItem("isLoggedIn", "true");
    } else {
      sessionStorage.setItem("isLoggedIn", "true");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("isLoggedIn");
    setActiveTab("dashboard");
    setActiveModule(null);
  };

  const [activeTab, setActiveTab] = useState<"dashboard" | "settings" | "about">("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const NavLinks = () => (
    <>
      <button 
        onClick={() => { setActiveTab("dashboard"); setActiveModule(null); setIsMobileMenuOpen(false); }}
        className={`text-xs font-bold uppercase tracking-widest pb-1 transition-all text-left lg:text-center ${activeTab === "dashboard" ? "text-black lg:border-b-2 lg:border-active-red" : "text-neutral-gray hover:text-black"}`}
      >
        Dashboard
      </button>
      <button 
        onClick={() => { setActiveTab("settings"); setActiveModule(null); setIsMobileMenuOpen(false); }}
        className={`text-xs font-bold uppercase tracking-widest pb-1 transition-all text-left lg:text-center ${activeTab === "settings" ? "text-black lg:border-b-2 lg:border-active-red" : "text-neutral-gray hover:text-black"}`}
      >
        Settings
      </button>
      <button 
        onClick={() => { setActiveTab("about"); setActiveModule(null); setIsMobileMenuOpen(false); }}
        className={`text-xs font-bold uppercase tracking-widest pb-1 transition-all text-left lg:text-center ${activeTab === "about" ? "text-black lg:border-b-2 lg:border-active-red" : "text-neutral-gray hover:text-black"}`}
      >
        About
      </button>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-12">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-neutral-gray hover:text-black transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex flex-col group cursor-pointer" onClick={() => { setActiveTab("dashboard"); setActiveModule(null); }}>
              <div className="flex items-center gap-1">
                <span className="text-xl sm:text-2xl font-bold tracking-tighter text-black uppercase">trans</span>
                <span className="text-xl sm:text-2xl font-bold tracking-tighter text-active-red uppercase">force</span>
              </div>
              <div className="h-[2px] bg-active-red w-full mt-[-2px] mb-0.5 shadow-[0_1px_3px_rgba(209,16,43,0.2)]" />
              <span className="text-[8px] sm:text-[9px] font-bold tracking-[0.4em] text-neutral-gray uppercase text-center block">
                — Management —
              </span>
            </div>
            
            <nav className="hidden lg:flex items-center gap-8">
              <NavLinks />
            </nav>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden xl:flex items-center gap-2 text-neutral-gray px-4 py-1.5 rounded-full bg-gray-50 border border-gray-100">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-tight">{currentDate}</span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="relative p-2 text-neutral-gray hover:text-black transition-colors" id="btn-notifications">
                <Bell className="w-5 h-5 stroke-[1.5]" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-active-red rounded-full ring-2 ring-white" />
              </button>
              <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />
              <div className="flex items-center gap-3 pl-1">
                <div className="flex flex-col items-end hidden md:flex">
                  <span className="text-[10px] font-bold text-black leading-none">Admin Manager</span>
                  <span className="text-[9px] font-medium text-neutral-gray">Headquarters</span>
                </div>
                <div className="w-8 h-8 sm:w-9 h-9 rounded-full bg-black flex items-center justify-center text-white font-bold text-[10px] sm:text-xs shadow-lg shadow-black/10">
                  AM
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-neutral-gray hover:text-active-red transition-colors ml-1"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[101] lg:hidden shadow-2xl p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex flex-col">
                  <div className="flex items-center gap-0.5">
                    <span className="text-xl font-bold tracking-tighter text-black uppercase">trans</span>
                    <span className="text-xl font-bold tracking-tighter text-active-red uppercase">force</span>
                  </div>
                  <span className="text-[9px] font-bold tracking-[0.2em] text-neutral-gray uppercase">Management</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-neutral-gray hover:text-black">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-6">
                <NavLinks />
              </nav>
              <div className="mt-auto pt-10 border-t border-gray-100 italic">
                <p className="text-[10px] text-neutral-gray font-bold uppercase tracking-widest mb-1">Current Date</p>
                <p className="text-[11px] font-bold text-black">{currentDate}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 lg:py-14">
        <AnimatePresence mode="wait">
          {activeTab === "about" ? (
            <AboutModule onBack={() => setActiveTab("dashboard")} />
          ) : activeTab === "settings" ? (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
               <SettingsModule />
            </motion.div>
          ) : !activeModule ? (
            <motion.div 
              key="dashboard"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-x-6 lg:gap-y-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
            >
              {DASHBOARD_DATA.map((category, idx) => (
            <motion.div 
                  key={idx}
                  variants={itemVariants}
                  onClick={() => (category.title === "Workforce" || category.title === "HC Management" || category.title === "PL Analysis" || category.title === "KPI Tracker") && setActiveModule(category.title)}
                  className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-active-red/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-500 flex flex-col relative cursor-pointer ${
                    !(category.title === "Workforce" || category.title === "HC Management" || category.title === "PL Analysis" || category.title === "KPI Tracker") ? 'opacity-60 grayscale' : ''
                  }`}
                  id={`category-${idx}`}
                >
                  {/* Category Header */}
                  <div className="p-5 lg:p-6 pb-4">
                    <div className="flex flex-col gap-4">
                      <div className="w-10 lg:w-12 h-10 lg:h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-active-red/5 group-hover:scale-110 transition-all duration-500 border border-gray-100 group-hover:border-active-red/10">
                        <category.icon className="w-5 lg:w-6 h-5 lg:h-6 text-black group-hover:text-active-red stroke-[1.5] transition-colors" />
                      </div>
                      <h2 className="font-bold text-[11px] lg:text-xs text-black tracking-[0.15em] uppercase border-l-2 border-active-red pl-3 group-hover:pl-4 transition-all duration-300">
                        {category.title}
                      </h2>
                    </div>
                  </div>

                  {/* Description Wrapper */}
                  <div className="px-5 lg:px-6 py-2 lg:py-4 flex-grow">
                    <p className="text-xs lg:text-[13px] text-neutral-gray leading-relaxed font-medium group-hover:text-black/70 transition-colors duration-300">
                      {category.description}
                    </p>
                  </div>

                  {/* Action Footer */}
                  <div className="px-5 lg:px-6 py-4 lg:py-5 bg-gray-50/50 border-t border-gray-50 group-hover:bg-white transition-colors duration-500 mt-auto">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-gray group-hover:text-active-red uppercase tracking-widest transition-all w-full text-left">
                      Access Module
                      <div className="w-5 h-px bg-neutral-gray group-hover:bg-active-red group-hover:w-8 transition-all" />
                      <ChevronRight className="w-3 h-3 translate-y-[-0.5px]" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key={activeModule} 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
            >
              {activeModule === "Workforce" && <WorkforceModule onBack={() => setActiveModule(null)} />}
              {activeModule === "HC Management" && <HCManagementModule onBack={() => setActiveModule(null)} />}
              {activeModule === "PL Analysis" && <PLAnalysisModule onBack={() => setActiveModule(null)} />}
              {activeModule === "KPI Tracker" && <KPITrackerModule onBack={() => setActiveModule(null)} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-10 lg:mt-20 border-t border-gray-100 py-8 lg:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-0.5 text-sm uppercase">
              <span className="font-bold text-black">trans</span>
              <span className="font-bold text-active-red">force</span>
            </div>
            <div className="w-px h-4 bg-gray-200 hidden sm:block" />
            <p className="text-[10px] text-neutral-gray font-bold uppercase tracking-widest text-center sm:text-left">© 2026 Admin Portal v1.0.4-stable build 04052026.BUILD.772</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {['Compliance', 'Security', 'Network Status'].map((link) => (
              <a key={link} href="#" className="text-[10px] font-bold uppercase tracking-widest text-neutral-gray hover:text-black transition-colors">{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
