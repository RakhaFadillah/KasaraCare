// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { 
  Users, Stethoscope, ClipboardPlus, BedDouble, CalendarClock
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, 
  AreaChart, Area, XAxis, Tooltip, CartesianGrid, Cell
} from "recharts";
import type { ReactNode } from "react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard Admin — MediCare" }] }),
  component: AdminOverview,
});

// ==========================================
// DUMMY DATA UNTUK GRAFIK KUNJUNGAN
// ==========================================
const dataMingguan = [
  { name: 'Sen', kunjungan: 120 }, { name: 'Sel', kunjungan: 132 }, { name: 'Rab', kunjungan: 101 },
  { name: 'Kam', kunjungan: 145 }, { name: 'Jum', kunjungan: 150 }, { name: 'Sab', kunjungan: 80 }, { name: 'Min', kunjungan: 50 }
];
const dataBulanan = [
  { name: 'Jan', kunjungan: 400 }, { name: 'Feb', kunjungan: 350 }, { name: 'Mar', kunjungan: 500 },
  { name: 'Apr', kunjungan: 450 }, { name: 'Mei', kunjungan: 600 }, { name: 'Jun', kunjungan: 550 },
  { name: 'Jul', kunjungan: 700 }, { name: 'Ags', kunjungan: 650 }, { name: 'Sep', kunjungan: 800 },
  { name: 'Okt', kunjungan: 750 }, { name: 'Nov', kunjungan: 850 }, { name: 'Des', kunjungan: 900 }
];
const dataTahunan = [
  { name: '2022', kunjungan: 4500 }, { name: '2023', kunjungan: 5200 }, 
  { name: '2024', kunjungan: 6100 }, { name: '2025', kunjungan: 7800 }, { name: '2026', kunjungan: 8500 }
];

const dataHunian = [
  { name: 'Mgg 1', terisi: 60 }, { name: 'Mgg 2', terisi: 75 }, 
  { name: 'Mgg 3', terisi: 65 }, { name: 'Mgg 4', terisi: 85 }
];

function AdminOverview() {
  const [timeScale, setTimeScale] = useState('bulanan');

  // 1. QUERY STATISTIK METRIK
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

  // 2. QUERY JADWAL DOKTER TERDEKAT
  const schedulesQ = useQuery({
    queryKey: ["upcoming-schedules"],
    queryFn: async () => {
      // Mengambil jadwal hari ini ke depan, diurutkan paling dekat
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from("schedules")
        .select("*, doctors(full_name), patients(nama)")
        .gte("tanggal", today)
        .order("tanggal", { ascending: true })
        .order("jam", { ascending: true })
        .limit(6);
      return data || [];
    }
  });

  const s = statsQ.data || { patients: 0, doctors: 0, rooms: 0, preOp: 0, bpjs: 0, nonBpjs: 0 };
  const schedules = schedulesQ.data || [];

  // Menentukan data grafik yang aktif berdasarkan tombol yang diklik
  const activeChartData = timeScale === 'mingguan' ? dataMingguan : timeScale === 'bulanan' ? dataBulanan : dataTahunan;

  return (
    <AdminDashboardShell title="Analytics" description="Monitor performa dan aktivitas rumah sakit.">
      
      {/* BACKGROUND LIGHT MODE */}
      <div className="bg-slate-50 min-h-screen p-6 -mt-6 -mx-6 text-gray-800 font-sans rounded-xl">
        
        {/* ========================================== */}
        {/* BAGIAN 1: 6 KOTAK METRIK (Sesuai Savour Snap) */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Kiri: 4 Kotak Kecil */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <MetricCard label="Total Pasien" value={s.patients} icon={<Users size={22} />} color="blue" />
            <MetricCard label="Pre-Operasi" value={s.preOp} icon={<ClipboardPlus size={22} />} color="orange" />
            <MetricCard label="Total Dokter" value={s.doctors} icon={<Stethoscope size={22} />} color="emerald" />
            <MetricCard label="Jumlah Kamar" value={s.rooms} icon={<BedDouble size={22} />} color="indigo" />
          </div>

          {/* Kanan: 2 Donut Chart (BPJS & Non BPJS) */}
          <div className="grid grid-cols-2 gap-4">
            <DonutCard title="BPJS" value={s.bpjs} total={s.patients} color="#3b82f6" />
            <DonutCard title="Non BPJS" value={s.nonBpjs} total={s.patients} color="#f59e0b" />
          </div>

        </div>

        {/* ========================================== */}
        {/* BAGIAN 2: GRAFIK & JADWAL BAWAH            */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Kiri: 2 Grafik Besar */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Chart Kunjungan Pasien dengan Toggle */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800">Dinamika Kunjungan Pasien</h3>
                
                {/* Tombol Toggle Skala Waktu */}
                <div className="flex bg-gray-100 p-1 rounded-lg mt-3 sm:mt-0">
                  <button onClick={() => setTimeScale('mingguan')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${timeScale === 'mingguan' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Mingguan</button>
                  <button onClick={() => setTimeScale('bulanan')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${timeScale === 'bulanan' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Bulanan</button>
                  <button onClick={() => setTimeScale('tahunan')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${timeScale === 'tahunan' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Tahunan</button>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={activeChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="kunjungan" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={timeScale === 'bulanan' ? 20 : 40} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Tren Hunian Kamar (Saran dari saya) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="mb-6 font-bold text-gray-800">Tren Hunian Kamar (Bulan Ini)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dataHunian}>
                  <defs>
                    <linearGradient id="colorTerisi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="terisi" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTerisi)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Kanan: Jadwal Dokter Terdekat */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800">Jadwal Terdekat</h3>
              <CalendarClock size={18} className="text-gray-400" />
            </div>

            <div className="flex-1 space-y-0 overflow-y-auto pr-2">
              {schedules.length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-10">Tidak ada jadwal mendatang.</div>
              ) : (
                schedules.map((sch, i) => (
                  <div key={i} className="flex justify-between items-center py-4 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      {/* Avatar Inisial Dokter */}
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">
                        {sch.doctors?.full_name?.charAt(0) || "D"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{sch.doctors?.full_name || "Dokter"}</p>
                        <p className="text-[11px] text-gray-500 font-medium">{sch.patients?.nama || "Pasien"}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-xs font-bold text-gray-700">{sch.tanggal}</p>
                      <p className="text-[11px] text-gray-400 mb-1">{sch.jam}</p>
                      <Badge variant={sch.status === "Done" ? "default" : "outline"} className="text-[9px] h-4 px-1.5 rounded-sm">
                        {sch.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

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
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-4">
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{label}</p>
        <div className={`p-2 rounded-lg ${colorMap[color]} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      <h3 className="text-3xl font-black text-gray-900">{value}</h3>
    </div>
  );
}

function DonutCard({ title, value, total, color }: any) {
  // Mencegah error jika total pasien = 0
  const safeTotal = total > 0 ? total : 1;
  const remainder = safeTotal - value;
  
  const pieData = [
    { name: title, value: value },
    { name: 'Lainnya', value: remainder > 0 ? remainder : 0 }
  ];

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between items-center hover:shadow-md transition-shadow text-center">
      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 w-full text-left">{title}</p>
      <div className="relative w-28 h-28 flex justify-center items-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} dataKey="value" stroke="none">
              <Cell fill={color} />
              <Cell fill="#f1f5f9" /> {/* Warna abu-abu pudar untuk bagian kosong */}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Angka di Tengah Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-gray-900 leading-none">{value}</span>
        </div>
      </div>
    </div>
  );
}