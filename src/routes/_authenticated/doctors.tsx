import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Search, User, Stethoscope, Clock } from "lucide-react";
import { dayName } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/doctors")({
  head: () => ({ meta: [{ title: "Doctors — MediCare" }] }),
  component: DoctorsPage,
});

function DoctorsPage() {
  const [search, setSearch] = useState("");
  const [clinicId, setClinicId] = useState<string>("all");

  const clinicsQ = useQuery({ queryKey: ["clinics"], queryFn: async () => (await supabase.from("clinics").select("id, name").order("name")).data ?? [] });
  const doctorsQ = useQuery({
    queryKey: ["doctors-all", clinicId],
    queryFn: async () => {
      let q = supabase.from("doctors").select("*, clinics(name), schedules(day_of_week, start_time, end_time)").order("full_name");
      if (clinicId !== "all") q = q.eq("clinic_id", clinicId);
      const { data } = await q;
      return data ?? [];
    },
  });

  const filtered = doctorsQ.data?.filter((d: any) => !search || d.full_name.toLowerCase().includes(search.toLowerCase()) || d.specialization.toLowerCase().includes(search.toLowerCase())) ?? [];

  return (
    <DashboardShell title="Doctor directory" description="Browse specialists and their practice schedules.">
      <div className="glass-card mb-6 flex flex-wrap gap-3 rounded-2xl p-4">
        <div className="flex flex-1 min-w-[220px] items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name or specialty" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={clinicId} onValueChange={setClinicId}>
          <SelectTrigger className="w-56"><SelectValue placeholder="All clinics" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clinics</SelectItem>
            {clinicsQ.data?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {doctorsQ.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No doctors found" description="Adjust your filters." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d: any) => {
            const days = Array.from(new Set((d.schedules ?? []).map((s: any) => s.day_of_week))).sort();
            return (
              <div key={d.id} className="glass-card rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-elegant">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-soft">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-display font-semibold">{d.full_name}</p>
                    <p className="text-xs text-muted-foreground">{d.specialization}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5 text-xs">
                  <p className="flex items-center gap-1.5 text-muted-foreground"><Stethoscope className="h-3 w-3" /> {d.clinics?.name ?? "—"}</p>
                  <p className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3 w-3" /> {days.length ? days.map((n: any) => dayName(n)).join(", ") : "No schedule"}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant={d.status === "Available" ? "default" : "secondary"}>{d.status}</Badge>
                  {d.bio && <p className="line-clamp-1 text-[11px] text-muted-foreground italic">"{d.bio}"</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
