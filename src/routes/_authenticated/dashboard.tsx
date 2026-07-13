import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-role";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User, IdCard, Shield, ListOrdered, CalendarClock, ClipboardPlus, Megaphone,
  Stethoscope, ArrowRight, HeartPulse,
} from "lucide-react";
import { fmtDate, fmtTime, todayISO } from "@/lib/format";
import { bootstrapFirstAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MediCare" }] }),
  component: PatientDashboard,
});

function PatientDashboard() {
  const { user } = useAuth();

  const patientQ = useQuery({
    queryKey: ["me-patient", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const upcomingQ = useQuery({
    queryKey: ["me-upcoming", patientQ.data?.id],
    enabled: !!patientQ.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("registrations")
        .select("*, doctors(full_name, specialization), clinics(name)")
        .eq("patient_id", patientQ.data!.id).gte("visit_date", todayISO())
        .order("visit_date").limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const annQ = useQuery({
    queryKey: ["announcements-featured"],
    queryFn: async () => {
      const { data, error } = await supabase.from("announcements").select("*").order("is_pinned", { ascending: false }).order("published_at", { ascending: false }).limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  const next = upcomingQ.data?.[0];
  const profile = patientQ.data;

  return (
    <DashboardShell title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋`} description="Here's your health snapshot for today.">
      {/* Profile card */}
      <div className="glass-card mb-6 flex flex-wrap items-center gap-6 rounded-3xl p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-soft">
          <User className="h-8 w-8" />
        </div>
        <div className="flex-1 min-w-[220px]">
          <p className="font-display text-xl font-bold">{profile?.full_name ?? user?.email}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          {!profile && (
            <p className="mt-2 text-xs text-warning-foreground">
              <Badge variant="outline" className="border-warning/50 bg-warning/10 text-warning-foreground">Profile incomplete</Badge>
              <span className="ml-2">Register a treatment to create your medical record.</span>
            </p>
          )}
        </div>
        {profile && (
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground"><IdCard className="h-3 w-3" /> MRN</p>
              <p className="font-mono font-semibold">{profile.medical_record_no}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground"><Shield className="h-3 w-3" /> Status</p>
              <Badge variant={profile.status === "Active" ? "default" : "secondary"} className="mt-0.5">{profile.status}</Badge>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground"><HeartPulse className="h-3 w-3" /> Insurance</p>
              <p className="font-semibold">{profile.insurance}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Today's queue" value={next && next.visit_date === todayISO() ? `#${next.queue_number}` : "—"}
          icon={<ListOrdered className="h-4 w-4" />} hint={next && next.visit_date === todayISO() ? next.doctors?.full_name : "No queue today"} />
        <StatCard label="Upcoming visits" value={upcomingQ.data?.length ?? 0} icon={<CalendarClock className="h-4 w-4" />} hint="Next 30 days" />
        <StatCard label="Announcements" value={annQ.data?.length ?? 0} icon={<Megaphone className="h-4 w-4" />} hint="From the hospital" />
      </div>

      {/* Quick actions */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { to: "/register", label: "Register Treatment", icon: ClipboardPlus },
          { to: "/queue", label: "Track Queue", icon: ListOrdered },
          { to: "/history", label: "Medical History", icon: HeartPulse },
          { to: "/doctors", label: "Find a Doctor", icon: Stethoscope },
        ].map((a) => (
          <Link key={a.to} to={a.to} className="group glass-card flex items-center gap-3 rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-elegant">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <a.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{a.label}</p>
            </div>
            <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
          </Link>
        ))}
      </div>

      {/* Upcoming + Announcements */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card rounded-3xl p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Upcoming appointments</h2>
            <Link to="/register"><Button size="sm" className="gradient-primary text-primary-foreground shadow-soft">+ New</Button></Link>
          </div>
          {upcomingQ.isLoading ? (
            <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
          ) : upcomingQ.data && upcomingQ.data.length > 0 ? (
            <ul className="divide-y divide-border/60">
              {upcomingQ.data.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold">{r.doctors?.full_name} <span className="ml-2 text-xs text-muted-foreground">{r.doctors?.specialization}</span></p>
                    <p className="text-xs text-muted-foreground">{r.clinics?.name} · {fmtDate(r.visit_date)} · {fmtTime(r.estimated_time)}</p>
                  </div>
                  <div className="text-right">
                    <Badge>#{r.queue_number}</Badge>
                    <p className="mt-1 text-[10px] text-muted-foreground">{r.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No upcoming visits" description="Register a treatment to schedule your next visit." action={<Link to="/register"><Button className="gradient-primary text-primary-foreground shadow-soft">Register now</Button></Link>} />
          )}
        </div>

        <div className="glass-card rounded-3xl p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">Announcements</h2>
          {annQ.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : annQ.data && annQ.data.length > 0 ? (
            <ul className="space-y-3">
              {annQ.data.map((a) => (
                <li key={a.id} className="rounded-xl border border-border/60 bg-background/50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{a.title}</p>
                    {a.is_pinned && <Badge variant="secondary" className="text-[10px]">Pinned</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No announcements" description="Check back later for hospital updates." />
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
