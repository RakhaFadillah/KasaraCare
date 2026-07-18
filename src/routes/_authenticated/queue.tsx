import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/admin-dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtTime, todayISO } from "@/lib/format";
import { ListOrdered, Radio, Timer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/queue")({
  head: () => ({ meta: [{ title: "Live Queue — MediCare" }] }),
  component: QueuePage,
});

function QueuePage() {
  const { user } = useAuth();
  const [tick, setTick] = useState(0);

  const meQ = useQuery({
    queryKey: ["my-queue-today", user?.id, tick],
    enabled: !!user,
    queryFn: async () => {
      const { data: patient } = await supabase.from("patients").select("id").eq("user_id", user!.id).maybeSingle();
      if (!patient) return null;
      const { data } = await supabase.from("registrations")
        .select("id, queue_number, doctor_id, visit_date, status, doctors(full_name, specialization), clinics(name)")
        .eq("patient_id", patient.id).eq("visit_date", todayISO()).order("estimated_time").maybeSingle();
      return data;
    },
  });

  const queueQ = useQuery({
    queryKey: ["queue-live", meQ.data?.doctor_id, tick],
    enabled: !!meQ.data?.doctor_id,
    queryFn: async () => {
      const { data } = await supabase.from("queues").select("*")
        .eq("doctor_id", meQ.data!.doctor_id).eq("visit_date", todayISO())
        .order("queue_number");
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!meQ.data?.doctor_id) return;
    const ch = supabase.channel(`queue-${meQ.data.doctor_id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "queues", filter: `doctor_id=eq.${meQ.data.doctor_id}` },
        () => setTick((t) => t + 1))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [meQ.data?.doctor_id]);

  const currentServing = queueQ.data?.find((q) => q.status === "Serving" || q.status === "Called");
  const mine = queueQ.data?.find((q) => q.registration_id === meQ.data?.id);
  const remaining = mine ? queueQ.data!.filter((q) => q.queue_number < mine.queue_number && q.status !== "Done" && q.status !== "Skipped").length : 0;
  const eta = remaining * 15;

  return (
    <DashboardShell title="Live Queue" description="Realtime queue tracking for today.">
      {meQ.isLoading ? <Skeleton className="h-40 w-full rounded-3xl" /> : !meQ.data ? (
        <EmptyState title="No queue for today" description="You have no registration scheduled today." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="glass-card overflow-hidden rounded-3xl lg:col-span-2">
            <div className="gradient-hero p-8 text-primary-foreground">
              <div className="flex items-center justify-between">
                <div>
                  <p className="flex items-center gap-1.5 text-xs opacity-90"><Radio className="h-3 w-3 animate-pulse" /> Live now</p>
                  <p className="mt-1 text-xs opacity-90">{meQ.data.doctors?.full_name} · {meQ.data.clinics?.name}</p>
                </div>
                <Badge className="bg-white/20 text-primary-foreground border-white/20">{meQ.data.status}</Badge>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs opacity-80">Now serving</p>
                  <p className="font-display text-4xl font-bold">#{currentServing?.queue_number ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs opacity-80">Your queue</p>
                  <p className="font-display text-4xl font-bold">#{meQ.data.queue_number}</p>
                </div>
                <div>
                  <p className="text-xs opacity-80">Ahead of you</p>
                  <p className="font-display text-4xl font-bold">{remaining}</p>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm opacity-90">
                <Timer className="h-4 w-4" /> Estimated wait: ~{eta} min
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6">
            <div className="mb-3 flex items-center gap-2">
              <ListOrdered className="h-4 w-4" />
              <h2 className="font-display text-lg font-semibold">All queues</h2>
            </div>
            <div className="max-h-[400px] space-y-1.5 overflow-auto pr-1">
              {queueQ.data?.map((q) => (
                <div key={q.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${q.registration_id === meQ.data?.id ? "border-primary bg-primary/10" : "border-border/60"}`}>
                  <span className="font-mono font-semibold">#{q.queue_number}</span>
                  <Badge variant={q.status === "Serving" ? "default" : q.status === "Done" ? "secondary" : "outline"} className="text-[10px]">{q.status}</Badge>
                </div>
              ))}
              {(!queueQ.data || queueQ.data.length === 0) && <p className="text-xs text-muted-foreground">No queues yet.</p>}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Auto-updates via realtime · last refresh {fmtTime(new Date())}</p>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
