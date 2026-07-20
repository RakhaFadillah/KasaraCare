// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { 
  Users, Stethoscope, Building2, ClipboardPlus, 
  BedDouble, UserCheck, Activity, UsersRound, Settings
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Cell
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
const poliData = [
  { name: 'Umum', value: 400 }, { name: 'Gigi', value: 300 }, 
  { name: 'Mata', value: 200 }, { name: 'Bedah', value: 100 }
];
const doctorData = [
  { name: 'Pagi', count: 12 }, { name: 'Siang', count: 18 }, { name: 'Malam', count: 8 }
];
const statusData = [
  { name: 'Rawat Jalan', value: 65 }, { name: 'Rawat Inap', value: 25 }, { name: 'IGD', value: 10 }
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
  // LOGIKA DATABASE (Tetap dipertahankan persis seperti buatan Anda)
  const statsQ = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [p, doc, pol, nurse, room, preOp, inpat, bpjs, nonBpjs, serv] = await Promise.all([
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase.from("doctors").select("*", { count: "exact", head: true }),
        supabase.from("clinics").select("*", { count: "exact", head: true }),
        supabase.from("nurses").select("*", { count: "exact", head: true }),
        supabase.from("rooms").select("*", { count: "exact", head: true }),
        supabase.from("surgeries").select("*", { count: "exact", head: true }).eq("status", "Belum Operasi"),
        supabase.from("patients").select("*", { count: "exact", head: true }).ilike("jenis_layanan", "%Rawat Inap%"),
        supabase.from("patients").select("*", { count: "exact", head: true }).eq("golongan", "BPJS"),
        supabase.from("patients").select("*", { count: "exact", head: true }).eq("golongan", "Non BPJS"),
        supabase.from("services").select("*", { count: "exact", head: true }),
      ]);

      return {
        patients: p.count ?? 0, 
        doctors: doc.count ?? 0, 
        poli: pol.count ?? 0,
        nurses: nurse.count ?? 0, 
        rooms: room.count ?? 0, 
        preOp: preOp.count ?? 0,
        inpatient: inpat.count ?? 0, 
        bpjs: bpjs.count ?? 0, 
        nonBpjs: nonBpjs.count ?? 0,
        services: serv.count ?? 0
      };
    },
  });

  return (
    <AdminDashboardShell title="Dashboard Overview" description="Ringkasan aktivitas dan manajemen rumah sakit secara real-time.">
      
      {/* BACKGROUND LIGHT MODE */}
      <div className="bg-slate-50 min-h-screen p-6 -mt-6 -mx-6 text-gray-800 font-sans rounded-xl">
        
        {/* ========================================== */}
        {/* BAGIAN 1: METRIK KARTU                     */}
        {/* ========================================== */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          <MetricCard label="Total Pasien" value={statsQ.data?.patients ?? "0"} icon={<Users size={22} />} color="blue" />
          <MetricCard label="Pre-Operasi" value={statsQ.data?.preOp ?? "0"} icon={<ClipboardPlus size={22} />} color="orange" />
          <MetricCard label="Dokter" value={statsQ.data?.doctors ?? "0"} icon={<Stethoscope size={22} />} color="emerald" />
          <MetricCard label="Poli" value={statsQ.data?.poli ?? "0"} icon={<Building2 size={22} />} color="purple" />
          <MetricCard label="Jumlah Kamar" value={statsQ.data?.rooms ?? "0"} icon={<BedDouble size={22} />} color="indigo" />
          
          <MetricCard label="Rawat Inap" value={statsQ.data?.inpatient ?? "0"} icon={<Activity size={22} />} color="red" />
          <MetricCard label="Total Perawat" value={statsQ.data?.nurses ?? "0"} icon={<UsersRound size={22} />} color="teal" />
          <MetricCard label="Golongan BPJS" value={statsQ.data?.bpjs ?? "0"} icon={<UserCheck size={22} />} color="green" />
          <MetricCard label="Non BPJS" value={statsQ.data?.nonBpjs ?? "0"} icon={<UserCheck size={22} />} color="slate" />
          <MetricCard label="Jenis Layanan" value={statsQ.data?.services ?? "0"} icon={<Settings size={22} />} color="pink" />
        </div>

        {/* ========================================== */}
        {/* BAGIAN 2: GRAFIK RECHARTS                  */}
        {/* ========================================== */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          <ChartCard title="Tren Pendaftaran">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Distribusi Poli">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Pie data={poliData} cx="50%" cy="50%" outerRadius={70} dataKey="value" stroke="none">
                  {poliData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Aktivitas Dokter">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={doctorData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Status Pasien">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" stroke="none">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Tipe Pembayaran">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={paymentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="bpjs" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} barSize={20} />
                <Bar dataKey="nonBpjs" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Tren Hunian Kamar">
            <ResponsiveContainer width="100%" height={200}>
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
    purple: "bg-purple-50 text-purple-600",
    indigo: "bg-indigo-50 text-indigo-600",
    red: "bg-red-50 text-red-600",
    teal: "bg-teal-50 text-teal-600",
    green: "bg-green-50 text-green-600",
    slate: "bg-slate-100 text-slate-600",
    pink: "bg-pink-50 text-pink-600",
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group cursor-pointer">
      <div>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${colorMap[color]} group-hover:scale-110 transition-transform`}>
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