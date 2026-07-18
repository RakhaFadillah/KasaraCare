import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/admin-dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDateTime } from "@/lib/format";
import { Megaphone, Pin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({ meta: [{ title: "Announcements — MediCare" }] }),
  component: () => {
    const q = useQuery({ queryKey: ["announcements-all"], queryFn: async () => (await supabase.from("announcements").select("*").order("is_pinned", { ascending: false }).order("published_at", { ascending: false })).data ?? [] });
    return (
      <DashboardShell title="Announcements" description="Latest news and information from the hospital.">
        {q.isLoading ? <Skeleton className="h-40" /> : (q.data?.length ?? 0) === 0 ? (
          <EmptyState icon={<Megaphone className="h-5 w-5" />} title="No announcements" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {q.data!.map((a) => (
              <article key={a.id} className="glass-card rounded-2xl p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{a.category}</Badge>
                      {a.is_pinned && <span className="inline-flex items-center gap-1 text-primary"><Pin className="h-3 w-3" /> Pinned</span>}
                    </p>
                    <h3 className="font-display text-lg font-semibold">{a.title}</h3>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-3 text-[11px] text-muted-foreground">{fmtDateTime(a.published_at)}</p>
              </article>
            ))}
          </div>
        )}
      </DashboardShell>
    );
  },
});
