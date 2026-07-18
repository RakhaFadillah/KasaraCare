import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Building2,
  Stethoscope,
  CalendarClock,
  ClipboardPlus,
  ListOrdered,
  Megaphone,
  LogOut,
  HeartPulse,
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

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const menuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Pasien",
    url: "/admin/patients",
    icon: Users,
  },
  {
    title: "Dokter",
    url: "/admin/doctors",
    icon: Stethoscope,
  },
  {
    title: "poli",
    url: "/admin/clinics",
    icon: Building2,
  },
  {
    title: "Jadwal",
    url: "/admin/schedules",
    icon: CalendarClock,
  },
  {
    title: "Pendaftaran",
    url: "/admin/registrations",
    icon: ClipboardPlus,
  },
  {
    title: "Antrean",
    url: "/admin/queues",
    icon: ListOrdered,
  },
  {
    title: "Pengumuman",
    url: "/admin/announcements",
    icon: Megaphone,
  },
];

export default function AdminSidebar() {
  const { state } = useSidebar();

  const collapsed = state === "collapsed";

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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-soft">
            <HeartPulse className="h-5 w-5" />
          </div>

          {!collapsed && (
            <div>
              <h2 className="font-display text-base font-bold">
                MediCare
              </h2>

              <p className="text-xs text-muted-foreground">
                Dashboard Admin
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                  >
                    <Link
                      to={item.url}
                      className="flex items-center gap-3"
                    >
                      <item.icon className="h-4 w-4" />

                      {!collapsed && (
                        <span>{item.title}</span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />

          {!collapsed && "Keluar"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}