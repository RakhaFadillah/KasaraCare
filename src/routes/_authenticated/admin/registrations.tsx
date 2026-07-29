// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarClock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/registrations")({
  head: () => ({ meta: [{ title: "Reservasi — Admin KasaraCare" }] }),
  component: RegistrationsAdmin,
});

function RegistrationsAdmin() {
  const [pOptions, setPOptions] = useState([]);
  const [dOptions, setDOptions] = useState([]);
  const [treatmentOptions, setTreatmentOptions] = useState([]);

  const [showQueue, setShowQueue] = useState(false);
  const [queueData, setQueueData] = useState([]);

  // KUNCI PERBAIKAN: Menahan form agar tidak di-render sebelum data difilter
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // 1. Tarik semua data secara bersamaan
      const [pRes, dRes, sRes] = await Promise.all([
        supabase.from("patients").select("id, nama"),
        supabase.from("doctors").select("id, nama_lengkap"),
        supabase.from("services").select("service_name, status"),
      ]);

      // 2. Set pilihan Pasien & Dokter
      if (pRes.data) {
        setPOptions(pRes.data.map((x) => ({ label: x.nama, value: x.id })));
      }
      if (dRes.data) {
        setDOptions(dRes.data.map((x) => ({ label: x.nama_lengkap, value: x.id })));
      }

      // 3. LOGIKA FILTER TREATMENT DARI TABEL LAYANAN
      if (sRes.data) {
        // Hanya ambil yang statusnya persis "Tersedia"
        const layananTersedia = sRes.data.filter((x) => x.status === "Tersedia");

        setTreatmentOptions(
          layananTersedia.map((x) => ({ label: x.service_name, value: x.service_name })),
        );
      }

      // 4. Buka penahan, izinkan CrudTable untuk muncul!
      setIsReady(true);
    };

    loadData();
  }, []);

  const loadQueue = async () => {
    const { data } = await supabase
      .from("registrations")
      .select("*, patients(nama), doctors(nama_lengkap)")
      .order("tanggal_reservasi")
      .order("waktu_reservasi");

    if (data) {
      setQueueData(data);
      setShowQueue(true);
    }
  };

  return (
    <AdminDashboardShell
      title="Manajemen Reservasi"
      description="Kelola jadwal janji temu pasien, pemilihan dokter/terapis, dan jenis treatment."
    >
      <div className="mb-6 flex justify-end">
        <Button
          onClick={loadQueue}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <CalendarClock size={18} />
          Lihat Jadwal Hari Ini
        </Button>
      </div>

      {showQueue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#151722] rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Jadwal Antrean Reservasi
              </h2>
              <Button variant="outline" size="sm" onClick={() => setShowQueue(false)}>
                Tutup
              </Button>
            </div>

            <div className="space-y-3">
              {queueData.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Belum ada reservasi terdaftar.
                </div>
              ) : (
                queueData.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-800/30 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {res.patients?.nama || "—"}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {res.treatment || "Konsultasi Umum"}
                      </div>
                      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-2">
                        {res.tanggal_reservasi} • {res.waktu_reservasi} |{" "}
                        {res.doctors?.nama_lengkap || "—"}
                      </div>
                    </div>
                    <Badge
                      variant={
                        res.status === "Selesai"
                          ? "default"
                          : res.status === "Dibatalkan"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {res.status || "Menunggu"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Jika data belum siap difilter, tampilkan loading */}
      {!isReady ? (
        <div className="w-full flex flex-col items-center justify-center py-20 bg-white dark:bg-[#151722] rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
          <p className="text-slate-500">Menyinkronkan data layanan...</p>
        </div>
      ) : (
        /* Jika sudah siap difilter, tampilkan CrudTable dengan options yang sudah bersih */
        <CrudTable<any>
          table="registrations"
          title="Daftar Reservasi Pasien"
          searchKeys={["keluhan", "treatment"]}
          columns={[
            {
              key: "patient_id",
              label: "Pasien",
              render: (r) => pOptions.find((opt) => opt.value === r.patient_id)?.label || "—",
            },
            {
              key: "doctor_id",
              label: "Dokter / Terapis",
              render: (r) => dOptions.find((opt) => opt.value === r.doctor_id)?.label || "—",
            },
            {
              key: "treatment",
              label: "Treatment",
            },
            {
              key: "jadwal",
              label: "Jadwal",
              render: (r) => (
                <div className="flex flex-col">
                  <span className="font-medium">{r.tanggal_reservasi}</span>
                  <span className="text-xs text-slate-500">{r.waktu_reservasi}</span>
                </div>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (r) => (
                <Badge
                  variant={
                    r.status === "Selesai"
                      ? "default"
                      : r.status === "Dibatalkan"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {r.status || "Menunggu"}
                </Badge>
              ),
            },
          ]}
          fields={[
            {
              key: "patient_id",
              label: "Pilih Pasien",
              type: "select",
              required: true,
              options: pOptions,
            },
            {
              key: "doctor_id",
              label: "Pilih Dokter / Terapis",
              type: "select",
              required: true,
              options: dOptions,
            },
            {
              key: "treatment",
              label: "Pilih Treatment (Hanya yang Tersedia)",
              type: "select",
              required: true,
              options: treatmentOptions, // Data yang sudah difilter murni dari Supabase!
            },
            { key: "tanggal_reservasi", label: "Tanggal Reservasi", type: "date", required: true },
            { key: "waktu_reservasi", label: "Waktu (Jam)", type: "time", required: true },
            {
              key: "keluhan",
              label: "Keluhan / Catatan Tambahan (Opsional)",
              placeholder: "Misal: Ingin fokus hilangkan bekas jerawat...",
            },
            {
              key: "status",
              label: "Status Reservasi",
              type: "select",
              options: [
                { value: "Menunggu", label: "Menunggu" },
                { value: "Sedang Proses", label: "Sedang Proses" },
                { value: "Selesai", label: "Selesai" },
                { value: "Dibatalkan", label: "Dibatalkan" },
              ],
              defaultValue: "Menunggu",
            },
          ]}
        />
      )}
    </AdminDashboardShell>
  );
}
