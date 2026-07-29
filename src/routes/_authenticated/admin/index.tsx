// @ts-nocheck
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { Users, Stethoscope, CalendarClock, UserCheck, ClipboardList } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard Admin — KasaraCare" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const navigate = useNavigate();
  const [timeScale, setTimeScale] = useState("bulanan");

  // ==========================================
  // FUNGSI PINDAH HALAMAN
  // ==========================================
  const handleNavigate = (path: string, filterValue?: string) => {
    if (filterValue) {
      navigate({ to: path, search: { filter: filterValue } } as any);
    } else {
      navigate({ to: path } as any);
    }
  };

  // ==========================================
  // 1. QUERY STATISTIK METRIK KOTAK ATAS
  // ==========================================
  const statsQ = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [p, doc, reg] = await Promise.all([
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase.from("doctors").select("*", { count: "exact", head: true }),
        supabase
          .from("registrations")
          .select("*", { count: "exact", head: true })
          .eq("status", "Menunggu"),
      ]);

      return {
        patients: p.count ?? 0,
        doctors: doc.count ?? 0,
        reservations: reg.count ?? 0,
      };
    },
  });

  // ==========================================
  // 2. QUERY GRAFIK KUNJUNGAN PASIEN (DARI RESERVASI)
  // ==========================================
  const chartDataQ = useQuery({
    queryKey: ["chart-real-data"],
    queryFn: async () => {
      // Menarik data tanggal reservasi (kecuali yang dibatalkan) untuk dihitung sebagai kunjungan
      const { data } = await supabase
        .from("registrations")
        .select("tanggal_reservasi")
        .neq("status", "Dibatalkan");
      return { visits: data || [] };
    },
  });

  // ==========================================
  // 3. QUERY DOKTER & TERAPIS AKTIF
  // ==========================================
  const activeDoctorsQ = useQuery({
    queryKey: ["active-doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("nama_lengkap, spesialisasi, status")
        .ilike("status", "Aktif")
        .limit(8);

      if (error) {
        console.error("Gagal mengambil data dokter:", error.message);
        return [];
      }
      return data || [];
    },
  });

  // ==========================================
  // 4. QUERY JADWAL RESERVASI TERDEKAT
  // ==========================================
  const schedulesTableQ = useQuery({
    queryKey: ["upcoming-schedules-table"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("registrations")
        .select("*, doctors(nama_lengkap), patients(nama)")
        .gte("tanggal_reservasi", today)
        .neq("status", "Selesai")
        .neq("status", "Dibatalkan")
        .order("tanggal_reservasi", { ascending: true })
        .order("waktu_reservasi", { ascending: true })
        .limit(5);

      return data || [];
    },
  });

  // ==========================================
  // 5. OLAH DATA GRAFIK (MINGGUAN, BULANAN, TAHUNAN)
  // ==========================================
  const parsedData = useMemo(() => {
    const vData = chartDataQ.data?.visits || [];
    const now = new Date();
    const currentYear = now.getFullYear();

    // Fungsi pembantu untuk mencari tahu ini minggu ke berapa di tahun ini
    const getWeekNumber = (d: Date) => {
      const date = new Date(d.getTime());
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
      const week1 = new Date(date.getFullYear(), 0, 4);
      return (
        1 +
        Math.round(
          ((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7,
        )
      );
    };
    const currentWeekNumber = getWeekNumber(now);

    const rawMingguan = [
      { name: "Min", kunjungan: 0 },
      { name: "Sen", kunjungan: 0 },
      { name: "Sel", kunjungan: 0 },
      { name: "Rab", kunjungan: 0 },
      { name: "Kam", kunjungan: 0 },
      { name: "Jum", kunjungan: 0 },
      { name: "Sab", kunjungan: 0 },
    ];
    const dataBulanan = [
      { name: "Jan", kunjungan: 0 },
      { name: "Feb", kunjungan: 0 },
      { name: "Mar", kunjungan: 0 },
      { name: "Apr", kunjungan: 0 },
      { name: "Mei", kunjungan: 0 },
      { name: "Jun", kunjungan: 0 },
      { name: "Jul", kunjungan: 0 },
      { name: "Ags", kunjungan: 0 },
      { name: "Sep", kunjungan: 0 },
      { name: "Okt", kunjungan: 0 },
      { name: "Nov", kunjungan: 0 },
      { name: "Des", kunjungan: 0 },
    ];
    const tahunanMap: Record<string, number> = {};

    vData.forEach((v) => {
      if (!v.tanggal_reservasi) return;
      const d = new Date(v.tanggal_reservasi);
      const dMonth = d.getMonth();
      const dYear = d.getFullYear();

      // Hitung Mingguan: Hanya jika berada di minggu yang sama dengan hari ini
      if (dYear === currentYear && getWeekNumber(d) === currentWeekNumber) {
        rawMingguan[d.getDay()].kunjungan += 1;
      }

      // Hitung Bulanan: Untuk tahun berjalan
      if (dYear === currentYear) {
        dataBulanan[dMonth].kunjungan += 1;
      }

      // Hitung Tahunan
      tahunanMap[dYear] = (tahunanMap[dYear] || 0) + 1;
    });

    // Urutkan format mingguan dimulai dari Senin (index 1) sampai Minggu (index 0)
    const dataMingguan = [
      rawMingguan[1],
      rawMingguan[2],
      rawMingguan[3],
      rawMingguan[4],
      rawMingguan[5],
      rawMingguan[6],
      rawMingguan[0],
    ];

    // Urutkan format tahunan
    const dataTahunan = Object.keys(tahunanMap)
      .sort()
      .map((year) => ({ name: year, kunjungan: tahunanMap[year] }));
    if (dataTahunan.length === 0) dataTahunan.push({ name: currentYear.toString(), kunjungan: 0 });

    return { dataMingguan, dataBulanan, dataTahunan };
  }, [chartDataQ.data]);

  const s = statsQ.data || { patients: 0, doctors: 0, reservations: 0 };
  const activeDoctors = activeDoctorsQ.data || [];
  const activeSchedules = schedulesTableQ.data || [];

  const activeChartData =
    timeScale === "mingguan"
      ? parsedData.dataMingguan
      : timeScale === "bulanan"
        ? parsedData.dataBulanan
        : parsedData.dataTahunan;

  return (
    <AdminDashboardShell
      title="Dashboard"
      description="Monitor performa klinik dan jadwal reservasi secara real-time."
    >
      <div className="w-full text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
        {/* ========================================== */}
        {/* BAGIAN 1: GRID METRIK */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <MetricCard
            label="Total Pasien"
            value={s.patients}
            icon={<Users size={20} />}
            color="blue"
            onClick={() => handleNavigate("/admin/patients")}
          />
          <MetricCard
            label="Reservasi Menunggu"
            value={s.reservations}
            icon={<ClipboardList size={20} />}
            color="orange"
            onClick={() => handleNavigate("/admin/registrations")}
          />
          <MetricCard
            label="Dokter & Terapis"
            value={s.doctors}
            icon={<Stethoscope size={20} />}
            color="emerald"
            onClick={() => handleNavigate("/admin/doctors")}
          />
        </div>

        {/* ========================================== */}
        {/* BAGIAN 2: GRAFIK KUNJUNGAN & DOKTER AKTIF  */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 flex">
            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.99] transition-all duration-300 w-full flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                  Dinamika Kunjungan Pasien
                </h3>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mt-3 sm:mt-0 shadow-inner">
                  <button
                    onClick={() => setTimeScale("mingguan")}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${timeScale === "mingguan" ? "bg-white dark:bg-[#252b3b] shadow text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
                  >
                    Mingguan
                  </button>
                  <button
                    onClick={() => setTimeScale("bulanan")}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${timeScale === "bulanan" ? "bg-white dark:bg-[#252b3b] shadow text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
                  >
                    Bulanan
                  </button>
                  <button
                    onClick={() => setTimeScale("tahunan")}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${timeScale === "tahunan" ? "bg-white dark:bg-[#252b3b] shadow text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
                  >
                    Tahunan
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={350} className="flex-1">
                <BarChart
                  data={activeChartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#f1f5f9"
                    opacity={0.1}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      backgroundColor: "#1e293b",
                      color: "#fff",
                      padding: "10px 14px",
                    }}
                    labelStyle={{ fontWeight: "bold", color: "#cbd5e1", marginBottom: "4px" }}
                  />
                  <Bar
                    dataKey="kunjungan"
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                    barSize={timeScale === "bulanan" ? 24 : 40}
                    animationDuration={1000}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1d27] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 h-full flex flex-col hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.99] transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 dark:text-white text-lg">Staf Aktif</h3>
              <UserCheck size={20} className="text-emerald-500" />
            </div>
            <div className="flex-1 space-y-0 overflow-y-auto pr-2">
              {activeDoctors.length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-10">Tidak ada staf aktif.</div>
              ) : (
                activeDoctors.map((doc, i) => {
                  const namaDokter = doc.nama_lengkap || "Nama Dokter";
                  const initial = namaDokter
                    .replace(/^(dr\.|drg\.)\s*/i, "")
                    .charAt(0)
                    .toUpperCase();
                  return (
                    <div
                      key={i}
                      className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-lg px-2 -mx-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm shadow-sm border border-emerald-100 dark:border-emerald-800/50">
                          {initial}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-slate-200">
                            {namaDokter}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                            {doc.spesialisasi || "Terapis"}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="default"
                        className="text-[10px] h-5 px-2 rounded bg-emerald-500 hover:bg-emerald-600 shadow-sm border-0"
                      >
                        {doc.status}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* BAGIAN 3: TABEL JADWAL RESERVASI           */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white dark:bg-[#1a1d27] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.99] transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                Jadwal Reservasi Terdekat
              </h3>
              <CalendarClock size={20} className="text-blue-500" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold rounded-tl-lg">Pasien</th>
                    <th className="py-3 px-4 font-semibold">Treatment</th>
                    <th className="py-3 px-4 font-semibold">Terapis/Dokter</th>
                    <th className="py-3 px-4 font-semibold">Jadwal</th>
                    <th className="py-3 px-4 font-semibold rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {activeSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        Tidak ada jadwal reservasi terdekat.
                      </td>
                    </tr>
                  ) : (
                    activeSchedules.map((sch, idx) => {
                      const pName = sch.patients?.nama || "Pasien";
                      const initial = pName.charAt(0).toUpperCase();
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                                {initial}
                              </div>
                              <span className="font-semibold text-gray-900 dark:text-slate-200">
                                {pName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-slate-400 font-medium">
                            {sch.treatment || "Konsultasi Umum"}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-slate-400">
                            {sch.doctors?.nama_lengkap || "Belum Dipilih"}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-800 dark:text-slate-300">
                                {sch.tanggal_reservasi}
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-slate-500">
                                {sch.waktu_reservasi}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className="text-[10px] text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-900/20"
                            >
                              {sch.status || "Menunggu"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardShell>
  );
}

// ==========================================
// KOMPONEN PEMBANTU (MENDUKUNG DARK MODE)
// ==========================================
function MetricCard({ label, value, icon, color, onClick }: any) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
  };

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-[#1a1d27] p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-300 group col-span-1"
    >
      <div className="flex justify-between items-start mb-3">
        <p className="text-gray-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          {label}
        </p>
        <div
          className={`p-2 rounded-lg ${colorMap[color]} group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
      </div>
      <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {value}
      </h3>
    </div>
  );
}
