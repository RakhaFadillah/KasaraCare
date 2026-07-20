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
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from "recharts";
import type { ReactNode } from "react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard Admin — MediCare" }] }),
  component: AdminOverview,
});

// ==========================================
// DUMMY DATA UNTUK GRAFIK BAWAH
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

  // 1. QUERY STATISTIK METRIK UTAMA
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
  const activeChartData = timeScale === 'mingguan' ? dataMingguan : timeScale === 'bulanan' ? dataBulanan : dataTahunan;

  // KALKULASI PECAHAN DATA HARI/MINGGU/BULAN (Disesuaikan dari total database)
  // Catatan: Ini adalah estimasi rasio logis agar grafik 3 warna terbentuk sempurna dari total pasien
  const getBreakdown = (total: number) => {
    const hari = Math.round(total * 0.15) || (total > 0 ? 1 : 0);
    const minggu = Math.round(total * 0.35) || (total > 0 ? 2 : 0);
    const bulan = total - hari - minggu > 0 ? total - hari - minggu : (total > 0 ? total : 0);
    return [
      { name: 'Hari Ini', value: hari },
      { name: 'Minggu Ini', value: minggu },
      { name: 'Bulan Ini', value: bulan }
    ];
  };

  const bpjsBreakdown = getBreakdown(s.bpjs);
  const nonBpjsBreakdown = getBreakdown(s.nonBpjs);

  // Palet Warna Grafik Donut (3 Tingkatan Warna)
  const colorsBPJS = ['#1e3a8a', '#3b82f6', '#93c5fd']; // Biru Tua -> Biru Muda
  const colorsNonBPJS = ['#9a3412', '#f97316', '#fdba74']; // Oranye Tua -> Oranye Muda

  return (
    <AdminDashboardShell title="Analytics" description="Monitor performa dan aktivitas rumah sakit.">
      
      {/* BACKGROUND LIGHT MODE */}
      <div className="bg-slate-50 min-h-screen p-6 -mt-6 -mx-6 text-gray-800 font-sans rounded-xl">
        
        {/* ========================================== */}
        {/* BAGIAN 1: GRID METRIK (TATA LETAK BARU)    */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          {/* Baris Atas (Kolom 1 & 2) */}
          <MetricCard label="Total Pasien" value={s.patients} icon={<Users size={20} />} color="blue" />
          <MetricCard label="Pre-Operasi" value={s.preOp} icon={<ClipboardPlus size={20} />} color="orange" />
          
          {/* Kotak BPJS (Tinggi - Memakan 2 Baris di Kolom 3) */}
          <DonutCardPremium 
            title="BPJS" total={s.bpjs} 
            data={bpjsBreakdown} colors={colorsBPJS} 
          />
          
          {/* Kotak NON BPJS (Tinggi - Memakan 2 Baris di Kolom 4) */}
          <DonutCardPremium 
            title="NON BPJS" total={s.nonBpjs} 
            data={nonBpjsBreakdown} colors={colorsNonBPJS} 
          />

          {/* Baris Bawah (Kolom 1 & 2 otomatis mengisi ruang kosong) */}
          <MetricCard label="Total Dokter" value={s.doctors} icon={<Stethoscope size={20} />} color="emerald" />
          <MetricCard label="Jumlah Kamar" value={s.rooms} icon={<BedDouble size={20} />} color="indigo" />

        </div>

        {/* ========================================== */}
        {/* BAGIAN 2: GRAFIK PREMIUM & JADWAL BAWAH    */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* Chart Kunjungan Pasien */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 text-lg">Dinamika Kunjungan Pasien</h3>
                <div className="flex bg-slate-100 p-1 rounded-xl mt-3 sm:mt-0 shadow-inner">
                  <button onClick={() => setTimeScale('mingguan')} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${timeScale === 'mingguan' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Mingguan</button>
                  <button onClick={() => setTimeScale('bulanan')} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${timeScale === 'bulanan' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Bulanan</button>
                  <button onClick={() => setTimeScale('tahunan')} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${timeScale === 'tahunan' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Tahunan</button>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={activeChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px 14px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                  />
                  <Bar dataKey="kunjungan" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={timeScale === 'bulanan' ? 24 : 40} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Tren Hunian Kamar */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="mb-6 font-bold text-gray-800 text-lg">Tren Hunian Kamar (Bulan Ini)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dataHunian} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTerisi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#10b981" floodOpacity="0.3"/>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px 14px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="terisi" 
                    stroke="#10b981" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorTerisi)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#059669' }}
                    style={{ filter: 'url(#glow)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Kanan: Jadwal Dokter Terdekat */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 text-lg">Jadwal Terdekat</h3>
              <CalendarClock size={20} className="text-blue-500" />
            </div>

            <div className="flex-1 space-y-0 overflow-y-auto pr-2">
              {schedules.length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-10">Tidak ada jadwal mendatang.</div>
              ) : (
                schedules.map((sch, i) => (
                  <div key={i} className="flex justify-between items-center py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors rounded-lg px-2 -mx-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm shadow-sm border border-blue-100">
                        {sch.doctors?.full_name?.charAt(0) || "D"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{sch.doctors?.full_name || "Dokter"}</p>
                        <p className="text-[11px] text-gray-500 font-medium">{sch.patients?.nama || "Pasien"}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-xs font-bold text-slate-700">{sch.tanggal}</p>
                      <p className="text-[11px] text-slate-400 mb-1">{sch.jam}</p>
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
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 group col-span-1">
      <div className="flex justify-between items-start mb-3">
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{label}</p>
        <div className={`p-2 rounded-lg ${colorMap[color]} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      <h3 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
    </div>
  );
}

// Komponen Donut Baru (Lebih Tinggi & Detail)
function DonutCardPremium({ title, total, data, colors }: any) {
  // Jika tidak ada pasien sama sekali, beri nilai kosong agar grafik tetap berbentuk
  const safeData = total > 0 ? data : [{ name: 'Kosong', value: 1 }];
  const safeColors = total > 0 ? colors : ['#f1f5f9'];

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm col-span-1 md:row-span-2 flex flex-col justify-between hover:shadow-md transition-all duration-300">
      <div>
        <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-black text-gray-900">{total}</h3>
      </div>
      
      <div className="flex flex-col xl:flex-row items-center justify-between mt-4 flex-1 gap-2">
        {/* Lingkaran Donut */}
        <div className="w-24 h-24 relative flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={safeData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} dataKey="value" stroke="none">
                {safeData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={safeColors[index % safeColors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Keterangan / Legend (Hari, Minggu, Bulan) */}
        <div className="flex flex-col gap-2 w-full xl:w-auto xl:ml-2">
          {total > 0 ? (
            data.map((entry: any, i: number) => (
              <div key={i} className="flex items-center justify-between xl:justify-start gap-2 text-[10px] text-gray-500 font-medium bg-slate-50 xl:bg-transparent px-2 py-1 xl:p-0 rounded-md">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i] }}></div>
                  <span>{entry.name}</span>
                </div>
                <span className="font-bold text-gray-800 text-xs">{entry.value}</span>
              </div>
            ))
          ) : (
            <div className="text-[10px] text-gray-400 text-center">Belum ada data</div>
          )}
        </div>
      </div>
    </div>
  );
}