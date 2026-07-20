// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { 
  Users, Stethoscope, ClipboardPlus, 
  BedDouble, UserCheck
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, 
  LineChart, Line, AreaChart, Area, XAxis, Tooltip, CartesianGrid, Cell
} from "recharts";
import type { ReactNode } from "react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard Admin — MediCare" }] }),
  component: AdminOverview,
});

// ==========================================
// DUMMY DATA UNTUK GRAFIK (Agar Visual Hidup)
// ==========================================
const trendData = [
  { name: 'Sen', count: 45 }, { name: 'Sel', count: 52 }, { name: 'Rab', count: 38 },
  { name: 'Kam', count: 65 }, { name: 'Jum', count: 48 }, { name: 'Sab', count: 30 }, { name: 'Min', count: 20 }
];
const doctorData = [
  { name: 'Pagi', count: 12 }, { name: 'Siang', count: 18 }, { name: 'Malam', count: 8 }
];
const paymentData = [
  { name: 'Okt', bpjs: 400, nonBpjs: 240 }, { name: 'Nov', bpjs: 300, nonBpjs: 139 }, { name: 'Des', bpjs: 450, nonBpjs: 280 }
];
const roomData = [
  { name: 'Mgg 1', terisi: 60 }, { name: 'Mgg 2', terisi: 75 }, 
  { name: 'Mgg 3', terisi: 65 }, { name: 'Mgg 4', terisi: 85 }
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function AdminOverview() {
  // LOGIKA DATABASE: Hanya mengambil 6 Data yang Anda minta
  const statsQ = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [p, doc, room, preOp, bpjs, nonBpjs] = await Promise.all([
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase.from("doctors").select("*", { count: "exact", head: true }),
        supabase.from("rooms").select("*", { count: "exact", head: true }),
        supabase.from("surgeries").select("*", { count: "exact", head: true }).eq("status", "Belum Operasi"),
        supabase.from("patients").select("*", { count: "exact", head: true }).eq("golongan", "BPJS"),
        supabase.from("patients").select("*", { count: "exact", head: true }).eq("golongan", "Non BPJS"),
      ]);

      return {
        patients: p.count ?? 0, 
        doctors: doc.count ?? 0, 
        rooms: room.count ?? 0, 
        preOp: preOp.count ?? 0,
        bpjs: bpjs.count ?? 0, 
        nonBpjs: nonBpjs.count ?? 0,
      };
    },
  });

  const s = statsQ.data || { patients: 0, doctors: 0, rooms: 0, preOp: 0, bpjs: 0, nonBpjs: 0 };

  return (
    <AdminDashboardShell title="Dashboard Overview" description="Ringkasan aktivitas dan manajemen rumah sakit secara real-time.">
      
      {/* BACKGROUND LIGHT MODE */}
      <div className="bg-slate-50 min-h-screen p-6 -mt-6 -mx-6 text-gray-800 font-sans rounded-xl">
        
        {/* ========================================== */}
        {/* BAGIAN 1: METRIK KARTU (HANYA 6 KOTAK)     */}
        {/* ========================================== */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-3 gap-5">
          <MetricCard label="Total Pasien" value={s.patients} icon={<Users size={24} />} color="blue" />
          <MetricCard label="Pre-Operasi" value={s.preOp} icon={<ClipboardPlus size={24} />} color="orange" />
          <MetricCard label="Total Dokter" value={s.doctors} icon={<Stethoscope size={24} />} color="emerald" />
          
          <MetricCard label="Jumlah Kamar" value={s.rooms} icon={<BedDouble size={24} />} color="indigo" />
          <MetricCard label="Golongan BPJS" value={s.bpjs} icon={<UserCheck size={24} />} color="green" />
          <MetricCard label="Non BPJS" value={s.nonBpjs} icon={<UserCheck size={24} />} color="slate" />
        </div>

        {/* ========================================== */}
        {/* BAGIAN 2: GRAFIK RECHARTS                  */}
        {/* ========================================== */}
        <div className="grid gap-6 lg:grid-cols-2">
          
          <ChartCard title="Tren Pendaftaran">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Tipe Pembayaran">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={paymentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="bpjs" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} barSize={30} />
                <Bar dataKey="nonBpjs" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Aktivitas Dokter">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={doctorData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Tren Hunian Kamar">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={roomData}>
                <defs>
                  <linearGradient id="colorTerisi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="terisi" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTerisi)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>
      </div>
    </AdminDashboardShell>
  );
}

// ==========================================
// KOMPONEN PEMBANTU (UI ELEMENTS)
// ==========================================

function MetricCard({ label, value, icon, color }: any) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group cursor-pointer">
      <div>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{label}</p>
        <h3 className="text-4xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{value}</h3>
      </div>
      <div className={`p-4 rounded-xl ${colorMap[color]} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
      <h3 className="mb-6 font-bold text-gray-800">{title}</h3>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}