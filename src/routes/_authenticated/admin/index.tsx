import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { StatCard } from "@/components/stat-card";
import { 
  Users, Stethoscope, Building2, ClipboardPlus, 
  BedDouble, UserCheck, Activity, UsersRound, PieChart as PieIcon, BarChart3
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import type { ReactNode } from "react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard Admin — MediCare" }] }),
  component: AdminOverview,
});

const COLORS = ["#00a3e0", "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE"];

function AdminOverview() {
  const statsQ = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [p, doc, pol, nurse, room, preOp, inpat, bpjs, nonBpjs] = await Promise.all([
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase.from("doctors").select("*", { count: "exact", head: true }),
        supabase.from("clinics").select("*", { count: "exact", head: true }),
        supabase.from("nurses").select("*", { count: "exact", head: true }),
        supabase.from("rooms").select("*", { count: "exact", head: true }),
        supabase.from("registrations").select("*", { count: "exact", head: true }).eq("status", "pre-op"),
        supabase.from("inpatients").select("*", { count: "exact", head: true }),
        supabase.from("patients").select("*", { count: "exact", head: true }).eq("insurance_type", "BPJS"),
        supabase.from("patients").select("*", { count: "exact", head: true }).eq("insurance_type", "Non-BPJS"),
      ]);

      return {
        patients: p.count ?? 0, doctors: doc.count ?? 0, poli: pol.count ?? 0,
        nurses: nurse.count ?? 0, rooms: room.count ?? 0, preOp: preOp.count ?? 0,
        inpatient: inpat.count ?? 0, bpjs: bpjs.count ?? 0, nonBpjs: nonBpjs.count ?? 0,
      };
    },
  });

  return (
    <AdminDashboardShell title="Dashboard" description="Dashboard Manajemen Rumah Sakit">
      {/* Kartu Statistik */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="Total Pasien" value={statsQ.data?.patients ?? "0"} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Pre-Operasi" value={statsQ.data?.preOp ?? "0"} icon={<ClipboardPlus className="h-4 w-4" />} />
        <StatCard label="Dokter" value={statsQ.data?.doctors ?? "0"} icon={<Stethoscope className="h-4 w-4" />} />
        <StatCard label="Poli" value={statsQ.data?.poli ?? "0"} icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="Jumlah Kamar" value={statsQ.data?.rooms ?? "0"} icon={<BedDouble className="h-4 w-4" />} />
        <StatCard label="Rawat Inap" value={statsQ.data?.inpatient ?? "0"} icon={<Activity className="h-4 w-4" />} />
        <StatCard label="Total Perawat" value={statsQ.data?.nurses ?? "0"} icon={<UsersRound className="h-4 w-4" />} />
        <StatCard label="Golongan BPJS" value={statsQ.data?.bpjs ?? "0"} icon={<UserCheck className="h-4 w-4" />} />
        <StatCard label="Non BPJS" value={statsQ.data?.nonBpjs ?? "0"} icon={<UserCheck className="h-4 w-4" />} />
      </div>

      {/* Grid 6 Chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 1. Tren Pendaftaran */}
        <ChartCard title="Tren Pendaftaran">
          <ResponsiveContainer width="100%" height={200}><LineChart data={[]}><Line type="monotone" dataKey="count" stroke="#00a3e0" /></LineChart></ResponsiveContainer>
        </ChartCard>
        
        {/* 2. Distribusi Poli */}
        <ChartCard title="Distribusi Poli">
          <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={[]} dataKey="value" nameKey="name" fill="#8884d8" /></PieChart></ResponsiveContainer>
        </ChartCard>

        {/* 3. Aktivitas Dokter */}
        <ChartCard title="Aktivitas Dokter">
          <ResponsiveContainer width="100%" height={200}><BarChart data={[]}><Bar dataKey="count" fill="#82ca9d" /></BarChart></ResponsiveContainer>
        </ChartCard>

        {/* 4. Status Pasien (Donut) */}
        <ChartCard title="Status Pasien">
           <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={[]} dataKey="value" innerRadius={50} outerRadius={80} fill="#ffc658" /></PieChart></ResponsiveContainer>
        </ChartCard>

        {/* 5. Tipe Pembayaran (Stacked Bar) */}
        <ChartCard title="Tipe Pembayaran">
           <ResponsiveContainer width="100%" height={200}><BarChart data={[]}><Bar dataKey="bpjs" stackId="a" fill="#00a3e0" /><Bar dataKey="nonBpjs" stackId="a" fill="#ff8042" /></BarChart></ResponsiveContainer>
        </ChartCard>

        {/* 6. Hunian Kamar (Area) */}
        <ChartCard title="Tren Hunian Kamar">
           <ResponsiveContainer width="100%" height={200}><AreaChart data={[]}><Area type="monotone" dataKey="terisi" stroke="#0088FE" fill="#0088FE" /></AreaChart></ResponsiveContainer>
        </ChartCard>
      </div>
    </AdminDashboardShell>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="glass-card rounded-3xl p-6 shadow-sm bg-white">
      <h3 className="mb-4 font-semibold text-gray-700">{title}</h3>
      {children}
    </div>
  );
}