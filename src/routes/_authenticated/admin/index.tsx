import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { StatCard } from "@/components/stat-card";
import { Users, Stethoscope, Building2, ListOrdered, ClipboardPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { todayISO } from "@/lib/format";
import type { ReactNode } from "react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Ikhtisar Admin — MediCare" }] }),
  component: AdminOverview,
});

const COLORS = ["oklch(0.58 0.16 235)","oklch(0.68 0.15 175)","oklch(0.72 0.16 300)","oklch(0.78 0.16 75)","oklch(0.62 0.18 25)","oklch(0.68 0.15 155)","oklch(0.55 0.17 260)","oklch(0.7 0.14 190)"];

function AdminOverview() {
  const statsQ = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        patientRes,
        doctorRes,
        clinicRes,
        registrationRes,
        queueRes,
      ] = await Promise.all([
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase.from("doctors").select("*", { count: "exact", head: true }),
        supabase.from("clinics").select("*", { count: "exact", head: true }),
        supabase
          .from("registrations")
          .select("*", { count: "exact", head: true })
          .eq("visit_date", todayISO()),
        supabase
          .from("queues")
          .select("*", { count: "exact", head: true })
          .eq("visit_date", todayISO())
          .in("status", ["Waiting", "Called", "Serving"]),
      ]);

      if (
        patientRes.error ||
        doctorRes.error ||
        clinicRes.error ||
        registrationRes.error ||
        queueRes.error
      ) {
        throw new Error("Failed to load dashboard statistics");
      }

      return {
        patients: patientRes.count ?? 0,
        doctors: doctorRes.count ?? 0,
        clinics: clinicRes.count ?? 0,
        todayReg: registrationRes.count ?? 0,
        activeQueue: queueRes.count ?? 0,
      };
    },
  });

  const monthlyQ = useQuery({
    queryKey: ["admin-monthly"],
    queryFn: async () => {
      const { data, error } = await supabase.from("registrations").select("created_at").gte("created_at", new Date(Date.now() - 180 * 864e5).toISOString());
      if (error) throw new Error("Failed to load monthly data");
      
      const byMonth: Record<string, number> = {};
      (data ?? []).forEach((r) => {
        const key = new Date(r.created_at!).toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
        byMonth[key] = (byMonth[key] ?? 0) + 1;
      });
      return Object.entries(byMonth).map(([month, count]) => ({ month, count }));
    },
  });

  const clinicDistQ = useQuery({
    queryKey: ["admin-clinic-dist"],
    queryFn: async () => {
      const { data, error } = await supabase.from("registrations").select("clinic_id, clinics(name)");
      if (error) throw new Error("Failed to load clinic distribution data");

      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => { const n = r.clinics?.name ?? "—"; map[n] = (map[n] ?? 0) + 1; });
      return Object.entries(map).map(([name, value]) => ({ name, value }));
    },
  });

  const doctorActivityQ = useQuery({
    queryKey: ["admin-doctor-activity"],
    queryFn: async () => {
      const { data, error } = await supabase.from("registrations").select("doctor_id, doctors(full_name)");
      if (error) throw new Error("Failed to load doctor activity data");

      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => { const n = r.doctors?.full_name ?? "—"; map[n] = (map[n] ?? 0) + 1; });
      return Object.entries(map).map(([name, count]) => ({ name: name.replace(/^Dr\.\s?/, ""), count })).sort((a,b)=>b.count-a.count).slice(0,8);
    },
  });

  return (
    <AdminDashboardShell title="Dashboard" description="Dashboard Manajemen Rumah Sakit">
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="Total Pasien" value={statsQ.data?.patients ?? "—"} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Pendaftaran Hari Ini" value={statsQ.data?.todayReg ?? "—"} icon={<ClipboardPlus className="h-4 w-4" />} />
        <StatCard label="Dokter" value={statsQ.data?.doctors ?? "—"} icon={<Stethoscope className="h-4 w-4" />} />
        <StatCard label="Klinik" value={statsQ.data?.clinics ?? "—"} icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="Antrean Aktif" value={statsQ.data?.activeQueue ?? "—"} icon={<ListOrdered className="h-4 w-4" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Tren Pendaftaran (6 bulan)">
          {monthlyQ.isLoading ? <Skeleton className="h-64 w-full" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyQ.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 235)" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Line type="monotone" dataKey="count" stroke="oklch(0.58 0.16 235)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Pendaftaran Berdasarkan Klinik">
          {clinicDistQ.isLoading ? <Skeleton className="h-64 w-full" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={clinicDistQ.data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {clinicDistQ.data?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Aktivitas Dokter" className="lg:col-span-2">
          {doctorActivityQ.isLoading ? <Skeleton className="h-64 w-full" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={doctorActivityQ.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 235)" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Bar dataKey="count" fill="oklch(0.58 0.16 235)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </AdminDashboardShell>
  );
}

function ChartCard({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`glass-card rounded-3xl p-6 ${className}`}>
      <h3 className="mb-4 font-display font-semibold">{title}</h3>
      {children}
    </div>
  );
}