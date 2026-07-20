// @ts-nocheck
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Building2,
  Stethoscope,
  CalendarClock,
  ClipboardPlus,
  LogOut,
  HeartPulse,
  BedDouble,
  Syringe,
  Layers,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { useAuth } from "@/hooks/use-auth"; // Mengambil data user untuk Footer Profile
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ==========================================
// PENGELOMPOKAN MENU ALA "KRAVIO" STYLE
// ==========================================
const menuGroups = [
  {
    label: "Main Navigation",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Manajemen Medis",
    items: [
      { title: "Pasien", url: "/admin/patients", icon: Users },
      { title: "Dokter", url: "/admin/doctors", icon: Stethoscope },
      { title: "Perawat", url: "/admin/nurses", icon: Syringe },
    ],
  },
  {
    label: "Fasilitas & Layanan",
    items: [
      { title: "Poli", url: "/admin/clinics", icon: Building2 },
      { title: "Kamar", url: "/admin/rooms", icon: BedDouble },
      { title: "Jenis Layanan", url: "/admin/services", icon: Layers },
    ],
  },
  {
    label: "Operasional",
    items: [
      { title: "Jadwal", url: "/admin/schedules", icon: CalendarClock },
      { title: "Pendaftaran Operasi", url: "/admin/registrations", icon: ClipboardPlus },
    ],
  }
];

export default function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user } = useAuth(); // Data admin yang sedang login

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const isActive = (url: string) => {
    if (url === "/admin") {
      return pathname === "/admin";
    }
    return pathname === url || pathname.startsWith(url + "/");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Berhasil Keluar");
    window.location.href = "/auth";
  };

  // Mengambil inisial email untuk avatar (cth: admin@gmail.com -> A)
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "A";

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 dark:border-slate-800 dark:bg-[#10121b] transition-colors duration-300">
      
      {/* ================= HEADER LOGO ================= */}
      <SidebarHeader className="border-b border-transparent pt-4 pb-2">
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <HeartPulse className="h-5 w-5" />
          </div>

          {!collapsed && (
            <div className="flex flex-col truncate">
              <h2 className="font-display text-lg font-black tracking-tight text-slate-900 dark:text-white transition-colors">
                MediCare
              </h2>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* ================= MAIN CONTENT ================= */}
      <SidebarContent className="pt-2">
        {menuGroups.map((group, index) => (
          <SidebarGroup key={index} className="mb-2">
            
            {/* Label Kategori Kravio Style */}
            {!collapsed && (
              <div className="px-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 transition-colors">
                {group.label}
              </div>
            )}
            
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className={`transition-all duration-200 ${
                          active 
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-600/10 dark:text-blue-400 font-semibold" 
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 py-2 px-1">
                          <item.icon className={`h-[18px] w-[18px] ${active ? "text-blue-600 dark:text-blue-400" : ""}`} />
                          {!collapsed && <span>{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ================= FOOTER / USER PROFILE ================= */}
      <SidebarFooter className="border-t border-slate-200 dark:border-slate-800/50 p-4 transition-colors duration-300">
        {collapsed ? (
          <button 
            onClick={signOut} 
            className="flex h-10 w-full items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
            title="Keluar"
          >
            <LogOut className="h-5 w-5" />
          </button>
        ) : (
          <div className="flex items-center justify-between w-full bg-slate-100 dark:bg-slate-800/40 p-2.5 rounded-2xl border border-transparent dark:border-slate-800 transition-colors duration-300">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-9 w-9 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm transition-colors duration-300">
                {userInitial}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold truncate text-slate-900 dark:text-slate-200 transition-colors">
                  Administrator
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate transition-colors">
                  {user?.email || "admin@medicare.com"}
                </span>
              </div>
            </div>
            
            <button 
              onClick={signOut} 
              className="p-2 ml-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors" 
              title="Keluar dari sistem"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        )}
      </SidebarFooter>
      
    </Sidebar>
  );
}