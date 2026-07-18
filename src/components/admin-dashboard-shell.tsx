import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "./admin-sidebar";
import { useAuth } from "@/hooks/use-auth";

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
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Content */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold">
                {user?.email ?? "Administrator"}
              </p>
              <p className="text-xs text-muted-foreground">
                System Administrator
              </p>
            </div>
          </header>

          {/* Page */}
          <main className="flex-1 overflow-y-auto p-8">
            {(title || description || actions) && (
              <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  {title && (
                    <h1 className="text-3xl font-bold tracking-tight">
                      {title}
                    </h1>
                  )}

                  {description && (
                    <p className="mt-2 text-muted-foreground">
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