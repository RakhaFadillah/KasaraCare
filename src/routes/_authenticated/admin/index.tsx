// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
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

function AdminOverview() {
  const [timeScale, setTimeScale] = useState('bulanan');

  // 1. QUERY STATISTIK KOTAK ATAS (Cepat & Ringan)
  const statsQ = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [p, doc, room, preOp] = await Promise.all([
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase.from("doctors").select("*", { count: "exact", head: true }),
        supabase.from("rooms").select("*", { count: "exact", head: true }),
        supabase.from("surgeries").select("*", { count: "exact", head: true }).eq("status", "Belum Operasi"),
      ]);

      return {
        patients: p.count ?? 0, 
        doctors: doc.count ?? 0, 
        rooms: room.count ?? 0, 
        preOp: preOp.count ?? 0,
      };
    },
  });

  // 2. QUERY DATA GRAFIK (Menarik data asli untuk dihitung)
  const chartDataQ = useQuery({
    queryKey: ["chart-real-data"],
    queryFn: async () => {
      const [patientsRes, roomsRes] = await Promise.all([
        supabase.from("patients").select("tanggal_masuk, tanggal_keluar, golongan"),
        supabase.from("rooms").select("created_at, occupied_beds")
      ]);
      return {
        patients: patientsRes.data || [],
        rooms: roomsRes.data || []
      };
    }
  });

  // 3. QUERY JADWAL DOKTER TERDEKAT
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

  // ==========================================
  // LOGIKA PERHITUNGAN DATA OTOMATIS
  // ==========================================
  const parsedData = useMemo(() => {
    const pData = chartDataQ.data?.patients || [];
    const rData = chartDataQ.data?.rooms || [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayString = now.toISOString().split('T')[0];

    // Struktur Wadah Data Kosong
    const rawMingguan = [
      { name: 'Min', kunjungan: 0 }, { name: 'Sen', kunjungan: 0 }, { name: 'Sel', kunjungan: 0 },
      { name: 'Rab', kunjungan: 0 }, { name: 'Kam', kunjungan: 0 }, { name: 'Jum', kunjungan: 0 }, { name: 'Sab', kunjungan: 0 }
    ];
    const dataBulanan = [
      { name: 'Jan', kunjungan: 0 }, { name: 'Feb', kunjungan: 0 }, { name: 'Mar', kunjungan: 0 },
      { name: 'Apr', kunjungan: 0 }, { name: 'Mei', kunjungan: 0 }, { name: 'Jun', kunjungan: 0 },
      { name: 'Jul', kunjungan: 0 }, { name: 'Ags', kunjungan: 0 }, { name: 'Sep', kunjungan: 0 },
      { name: 'Okt', kunjungan: 0 }, { name: 'Nov', kunjungan: 0 }, { name: 'Des', kunjungan: 0 }
    ];
    const tahunanMap: Record<string, number> = {};

    let bpjsTotal = 0, bpjsHari = 0, bpjsMinggu = 0, bpjsBulan = 0;
    let nonBpjsTotal = 0, nonBpjsHari = 0, nonBpjsMinggu = 0, nonBpjsBulan = 0;

    // Helper: Menentukan apakah tanggal masuk di minggu yang sama dengan hari ini
    const getWeekNumber = (d: Date) => {
      const date = new Date(d.getTime());
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
      const week1 = new Date(date.getFullYear(), 0, 4);
      return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    };
    const currentWeekNumber = getWeekNumber(now);

    // 1. Looping Data Pasien
    pData.forEach(p => {
      if (!p.tanggal_masuk) return;
      const d = new Date(p.tanggal_masuk);
      const dMonth = d.getMonth();
      const dYear = d.getFullYear();
      const dString = p.tanggal_masuk;

      // Hitung Kunjungan
      rawMingguan[d.getDay()].kunjungan += 1; // Harian dalam seminggu
      if (dYear === currentYear) dataBulanan[dMonth].kunjungan += 1; // Bulanan tahun ini
      tahunanMap[dYear] = (tahunanMap[dYear] || 0) + 1; // Tahunan

      // Hitung Donut BPJS / Non BPJS
      const isHari = dString === todayString;
      const isBulan = (dMonth === currentMonth && dYear === currentYear);
      const isMinggu = (getWeekNumber(d) === currentWeekNumber && dYear === currentYear);

      if (p.golongan === 'BPJS') {
        bpjsTotal++;
        if (isHari) bpjsHari++;
        if (isMinggu) bpjsMinggu++;
        if (isBulan) bpjsBulan++;
      } else if (p.golongan === 'Non BPJS') {
        nonBpjsTotal++;
        if (isHari) nonBpjsHari++;
        if (isMinggu) nonBpjsMinggu++;
        if (isBulan) nonBpjsBulan++;
      }
    });

    // Urutkan Hari Senin -> Minggu
    const dataMingguan = [
      rawMingguan[1], rawMingguan[2], rawMingguan[3], rawMingguan[4], rawMingguan[5], rawMingguan[6], rawMingguan[0]
    ];

    // Format Data Tahunan
    const dataTahunan = Object.keys(tahunanMap).sort().map(year => ({ name: year, kunjungan: tahunanMap[year] }));
    if (dataTahunan.length === 0) dataTahunan.push({ name: currentYear.toString(), kunjungan: 0 });

    // 2. Looping Data Kamar (Berdasarkan created_at)
    const dataHunian = [
      { name: 'Mgg 1', terisi: 0 }, { name: 'Mgg 2', terisi: 0 }, 
      { name: 'Mgg 3', terisi: 0 }, { name: 'Mgg 4', terisi: 0 }
    ];
    rData.forEach(r => {
      if (!r.created_at) return;
      const d = new Date(r.created_at);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const dateObj = d.getDate();
        let w = 0;
        if (dateObj <= 7) w = 0;
        else if (dateObj <= 14) w = 1;
        else if (dateObj <= 21) w = 2;
        else w = 3;
        dataHunian[w].terisi += (r.occupied_beds || 0);
      }
    });

    return {
      dataMingguan, dataBulanan, dataTahunan, dataHunian,
      bpjsTotal, nonBpjsTotal,
      bpjsBreakdown: [
        { name: 'Hari Ini', value: bpjsHari },
        { name: 'Minggu Ini', value: bpjsMinggu },
        { name: 'Bulan Ini', value: bpjsBulan }
      ],
      nonBpjsBreakdown: [
        { name: 'Hari Ini', value: nonBpjsHari },
        { name: 'Minggu Ini', value: nonBpjsMinggu },
        { name: 'Bulan Ini', value: nonBpjsBulan }
      ]
    };
  }, [chartDataQ.data]);

  const s = statsQ.data || { patients: 0, doctors: 0, rooms: 0, preOp: 0 };
  const schedules = schedulesQ.data || [];
  
  // Pilih data yang tampil di grafik berdasarkan tombol Toggle
  const activeChartData = timeScale === 'mingguan' ? parsedData.dataMingguan : 
                          timeScale === 'bulanan' ? parsedData.dataBulanan : 
                          parsedData.dataTahunan;

  // Palet Warna Grafik Donut
  const colorsBPJS = ['#1e3a8a', '#3b82f6', '#93c5fd'];
  const colorsNonBPJS = ['#9a3412', '#f97316', '#fdba74'];

  return (
    <AdminDashboardShell title="Analytics" description="Monitor performa dan aktivitas rumah sakit.">
      
      <div className="bg-slate-50 min-h-screen p-6 -mt-6 -mx-6 text-gray-800 font-sans rounded-xl">
        
        {/* ========================================== */}
        {/* BAGIAN 1: GRID METRIK 6 KOTAK              */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          <MetricCard label="Total Pasien" value={s.patients} icon={<Users size={20} />} color="blue" />
          <MetricCard label="Pre-Operasi" value={s.preOp} icon={<ClipboardPlus size={20} />} color="orange" />
          
          <DonutCardPremium 
            title="BPJS" total={parsedData.bpjsTotal} 
            data={parsedData.bpjsBreakdown} colors={colorsBPJS} 
          />
          <DonutCardPremium 
            title="NON BPJS" total={parsedData.nonBpjsTotal} 
            data={parsedData.nonBpjsBreakdown} colors={colorsNonBPJS} 
          />

          <MetricCard label="Total Dokter" value={s.doctors} icon={<Stethoscope size={20} />} color="emerald" />
          <MetricCard label="Jumlah Kamar" value={s.rooms} icon={<BedDouble size={20} />} color="indigo" />

        </div>

        {/* ========================================== */}
        {/* BAGIAN 2: GRAFIK PREMIUM & JADWAL          */}
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
                <AreaChart data={parsedData.dataHunian} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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

// Komponen Donut dengan Data Asli
function DonutCardPremium({ title, total, data, colors }: any) {
  const safeTotal = total > 0 ? total : 1;
  const remainder = safeTotal - data.reduce((acc, val) => acc + val.value, 0);
  
  const pieData = total > 0 
    ? [...data, { name: 'Sisa/Lama', value: remainder > 0 ? remainder : 0 }] 
    : [{ name: 'Kosong', value: 1 }];
    
  const safeColors = total > 0 ? [...colors, '#f1f5f9'] : ['#f1f5f9'];

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm col-span-1 md:row-span-2 flex flex-col justify-between hover:shadow-md transition-all duration-300">
      <div>
        <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-black text-gray-900">{total}</h3>
      </div>
      
      <div className="flex flex-col xl:flex-row items-center justify-between mt-4 flex-1 gap-2">
        <div className="w-24 h-24 relative flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} dataKey="value" stroke="none">
                {pieData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={safeColors[index % safeColors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
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