import React, { useState } from "react";
import { motion } from "motion/react";
import { User, Lock, ChevronRight, Globe, ShieldCheck } from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  console.log("LoginPage rendering...");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate login logic
    setTimeout(() => {
      if (username === "admin" && password === "password123") {
        onLogin();
      } else {
        setError("Invalid credentials. Please use admin / password123");
        setIsLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8D7D7] p-4 font-sans relative overflow-hidden">
      {/* Red Border Overlay like the image */}
      <div className="absolute inset-4 border-2 border-[#D1102B]/30 rounded-3xl pointer-events-none" />

      {/* Decorative Dots in corner */}
      <div className="absolute top-12 right-12 flex gap-2">
        <div className="w-3 h-3 rounded-full bg-gray-400 opacity-50" />
        <div className="w-3 h-3 rounded-full bg-black" />
        <div className="w-3 h-3 rounded-full bg-[#D1102B]" />
      </div>

      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
        {/* Left Side: Branding */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 space-y-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-[#D1102B] flex items-center justify-center relative overflow-hidden group">
              <Globe className="w-8 h-8 text-[#D1102B] group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-[#D1102B]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-4xl font-black tracking-tighter text-black uppercase">trans</span>
                <span className="text-4xl font-black tracking-tighter text-[#D1102B] uppercase">force</span>
              </div>
              <div className="h-1 bg-[#D1102B] w-full mt-1 mb-1 shadow-[0_2px_4px_rgba(209,16,43,0.3)]" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-[0.5em] text-neutral-gray uppercase">Management System</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            <h1 className="text-5xl font-extrabold text-black leading-tight tracking-tight">
              Powering <span className="text-[#D1102B]">Workforce</span> Intelligence.
            </h1>
            <p className="text-neutral-gray font-medium leading-relaxed">
              Access your global management dashboard for real-time P&L analysis, 
              capacity planning, and organizational excellence.
            </p>
          </div>

          <div className="flex items-center gap-6 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D1102B]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-black">Enterprise Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-black" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-black">Secure Access</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-[400px]"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white p-8 relative overflow-hidden group">
            {/* Header in Card */}
            <div className="text-center mb-8">
               <div className="inline-flex flex-col items-center mb-4">
                  <div className="flex items-center gap-0.5">
                    <span className="text-lg font-bold tracking-tighter text-black uppercase">TRANS</span>
                    <span className="text-lg font-bold tracking-tighter text-[#D1102B] uppercase">FORCE</span>
                  </div>
                  <div className="w-full h-[1px] bg-gray-200 mt-1 mb-1" />
                  <span className="text-[8px] font-bold tracking-[0.3em] text-neutral-gray uppercase">MANAGEMENT</span>
               </div>
               <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Sign In to Continue</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">{error}</span>
                </motion.div>
              )}
              <div className="space-y-2">
                <div className="relative group/input">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/input:text-[#D1102B] transition-colors" />
                  <input
                    type="text"
                    required
                    placeholder="Username or ID"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#D1102B]/20 focus:border-[#D1102B] transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/input:text-[#D1102B] transition-colors" />
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#D1102B]/20 focus:border-[#D1102B] transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="w-4 h-4 rounded border border-gray-300 bg-white peer-checked:bg-[#D1102B] peer-checked:border-[#D1102B] transition-all" />
                    <div className="absolute opacity-0 peer-checked:opacity-100 text-white flex items-center justify-center pointer-events-none">
                      <div className="w-1.5 h-1 text-white border-b-2 border-l-2 rotate-[-45deg] translate-y-[-1px]" />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 group-hover:text-black transition-colors">Remember me</span>
                </label>
                <a href="#" className="text-xs font-bold text-[#D1102B] hover:underline decoration-2 underline-offset-4">Forgot Password?</a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#001F3F] text-white rounded-2xl py-4 font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 hover:bg-[#002b57] active:scale-[0.98] transition-all shadow-xl shadow-[#001F3F]/20 disabled:opacity-70 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    LOGIN
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-center gap-4">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secure session encrypted</span>
            </div>
          </div>

          <p className="text-center mt-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            © 2026 TransForce Group. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
