import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ClipboardPlus, ListOrdered, FileHeart, Users, Megaphone,
  Shield, Building2, Stethoscope, CalendarClock, LogOut, HeartPulse,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-role";
import { toast } from "sonner";

const patientNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Register Treatment", url: "/register", icon: ClipboardPlus },
  { title: "Live Queue", url: "/queue", icon: ListOrdered },
  { title: "Medical History", url: "/history", icon: FileHeart },
  { title: "Doctors", url: "/doctors", icon: Users },
  { title: "Announcements", url: "/announcements", icon: Megaphone },
];

const adminNav = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Patients", url: "/admin/patients", icon: Users },
  { title: "Doctors", url: "/admin/doctors", icon: Stethoscope },
  { title: "Clinics", url: "/admin/clinics", icon: Building2 },
  { title: "Schedules", url: "/admin/schedules", icon: CalendarClock },
  { title: "Registrations", url: "/admin/registrations", icon: ClipboardPlus },
  { title: "Queues", url: "/admin/queues", icon: ListOrdered },
  { title: "Announcements", url: "/admin/announcements", icon: Megaphone },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const isAdmin = useIsAdmin();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (u: string) => u === "/admin" ? pathname === "/admin" : pathname === u || pathname.startsWith(u + "/");

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    window.location.href = "/auth";
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-soft">
            <HeartPulse className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-display text-sm font-bold leading-tight">MediCare</p>
              <p className="text-[10px] text-muted-foreground">Hospital System</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Patient</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {patientNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-1"><Shield className="h-3 w-3" /> Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start gap-2">
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sign out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
