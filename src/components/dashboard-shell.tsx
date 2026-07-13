import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { useAuth } from "@/hooks/use-auth";

export function DashboardShell({ children, title, description, actions }: {
  children: ReactNode; title?: string; description?: string; actions?: ReactNode;
}) {
  const { user } = useAuth();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-lg">
            <SidebarTrigger />
            <div className="flex-1" />
            <div className="text-right text-xs">
              <p className="font-medium text-foreground">{user?.email}</p>
              <p className="text-muted-foreground">Signed in</p>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8">
            {(title || actions) && (
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  {title && <h1 className="font-display text-2xl font-bold md:text-3xl">{title}</h1>}
                  {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                </div>
                {actions}
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
