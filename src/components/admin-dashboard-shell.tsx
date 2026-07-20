import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "./admin-sidebar";
import { Sun, Moon } from "lucide-react";

interface AdminDashboardShellProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function AdminDashboardShell({
  children,
  title,
  description,
  actions,
}: AdminDashboardShellProps) {
  
  // ==========================================
  // 1. LOGIKA PENYIMPANAN DARK MODE
  // ==========================================
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // ==========================================
  // 2. LOGIKA SIDEBAR TERKONTROL PENUH
  // ==========================================
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("medicare-sidebar-state") !== "false";
    }
    return true;
  });

  const handleSidebarToggle = (open: boolean) => {
    setIsSidebarOpen(open);
    localStorage.setItem("medicare-sidebar-state", String(open));
  };

  // ==========================================
  // 3. LOGIKA JAM & TANGGAL REAL-TIME (ZONA BATAM / WIB)
  // ==========================================
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Tanggal (Contoh: Selasa, 21 Juli 2026)
  const formattedDate = time.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Format Jam (Contoh: 14:30:45 WIB)
  const formattedTime = time.toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\./g, ':') + ' WIB';

  return (
    <SidebarProvider 
      open={isSidebarOpen} 
      onOpenChange={handleSidebarToggle}
    >
      <div className="flex min-h-screen w-full bg-slate-50 dark:bg-[#0f111a] transition-colors duration-300">
        
        <AdminSidebar />

        <div className="flex flex-1 flex-col min-w-0">
          
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#151722]/80 backdrop-blur-md px-6 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" />
            </div>

            <div className="flex items-center gap-5">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 cursor-pointer"
                title={isDarkMode ? "Beralih ke Light Mode" : "Beralih ke Dark Mode"}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* ========================================== */}
              {/* HANYA BAGIAN INI YANG DIGANTI SESUAI PERMINTAAN */}
              {/* ========================================== */}
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 transition-colors">
                  {formattedDate}
                </p>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 transition-colors tabular-nums">
                  {formattedTime}
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-8 text-slate-900 dark:text-slate-100 transition-colors duration-300">
            {(title || description || actions) && (
              <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  {title && (
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
                      {title}
                    </h1>
                  )}
                  {description && (
                    <p className="mt-2 text-slate-500 dark:text-slate-400 transition-colors">
                      {description}
                    </p>
                  )}
                </div>
                {actions && <div>{actions}</div>}
              </div>
            )}

            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}