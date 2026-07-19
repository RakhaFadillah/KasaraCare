// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/registrations")({
  head: () => ({ meta: [{ title: "Pendaftaran Operasi — Admin" }] }),
  component: RegistrationsAdmin,
});

function RegistrationsAdmin() {
  const [patientOptions, setPatientOptions] = useState([]);
  const [showQueue, setShowQueue] = useState(false);
  const [queueData, setQueueData] = useState([]);

  // Mengambil daftar nama pasien dari database untuk Dropdown
  useEffect(() => {
    const fetchPatients = async () => {
      const { data } = await supabase.from("patients").select("nama").order("nama", { ascending: true });
      if (data) {
        setPatientOptions(data.map(p => ({ label: p.nama, value: p.nama })));
      }
    };
    fetchPatients();
  }, []);

  // Memuat jadwal operasi terdekat
  const loadUpcomingQueue = async () => {
    const { data } = await supabase
      .from("surgeries")
      .select("*")
      .in("status", ["Belum Operasi", "Sudah Operasi", "Lagi Operasi"]) 
      .order("tanggal_operasi", { ascending: true })
      .order("jam_operasi", { ascending: true });
    
    if (data) setQueueData(data);
    setShowQueue(true);
  };

  return (
    <AdminDashboardShell title="Pendaftaran Operasi" description="Kelola data pendaftaran operasi pasien, jadwal, dan status tindakan.">
      
      {/* Tombol Antrean Jadwal Operasi di atas pencarian */}
      <div className="mb-6 flex justify-end">
        <Button onClick={loadUpcomingQueue} className="bg-[#00a3e0] hover:bg-[#008bc0] text-white shadow-md font-semibold">
          Lihat Jadwal Operasi Terdekat
        </Button>
      </div>

      {/* Modal / Popup Jadwal Operasi Terdekat */}
      {showQueue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Antrean Operasi Terdekat</h2>
              <Button variant="outline" size="sm" onClick={() => setShowQueue(false)}>Tutup</Button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              {queueData.length === 0 ? (
                <div className="text-center text-gray-500 py-10">Tidak ada jadwal operasi dalam waktu dekat.</div>
              ) : (
                queueData.map((op) => (
                  <div key={op.id} className="p-4 border border-gray-200 rounded-xl flex justify-between items-center bg-white shadow-sm hover:shadow-md transition-all">
                    <div>
                      <div className="font-bold text-lg text-gray-800">{op.nama_pasien}</div>
                      <div className="text-sm font-medium text-gray-600">{op.nama_operasi}</div>
                      <div className="text-xs text-gray-500 mt-1">{op.keterangan}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#00a3e0]">{op.tanggal_operasi}</div>
                      <div className="text-sm font-medium text-gray-700">{op.jam_operasi} WIB</div>
                      <div className="mt-2 inline-block px-3 py-1 text-xs font-bold rounded-full border border-gray-300">
                        {op.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabel Data Registrasi Operasi */}
      <CrudTable<any>
        table="surgeries"
        title="Data Operasi"
        searchKeys={["nama_pasien", "nama_operasi", "status"]}
        columns={[
          { key: "nama_pasien", label: "Nama Pasien" },
          { key: "nama_operasi", label: "Tindakan Operasi" },
          { key: "tanggal_operasi", label: "Tgl Operasi" },
          { key: "jam_operasi", label: "Jam" },
          { 
            key: "status", 
            label: "Status", 
            render: (r) => {
              // Logika warna status
              let bgColor = "#e5e7eb"; // Belum Operasi (Abu-abu)
              let textColor = "#374151";

              if (r.status === "Sudah Operasi") {
                bgColor = "#3b82f6"; // Biru
                textColor = "#ffffff";
              } else if (r.status === "Lagi Operasi") {
                bgColor = "#22c55e"; // Hijau
                textColor = "#ffffff";
              } else if (r.status === "Selesai") {
                bgColor = "#f97316"; // Orange
                textColor = "#ffffff";
              }

              return (
                <span style={{ backgroundColor: bgColor, color: textColor }} className="px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                  {r.status}
                </span>
              );
            } 
          },
          { 
            key: "tanggal_selesai", 
            label: "Selesai",
            render: (r) => r.tanggal_selesai ? `${r.tanggal_selesai} (${r.jam_selesai})` : "-"
          },
        ]}
        fields={[
          { 
            key: "nama_pasien", 
            label: "Nama Pasien (Pilih dari Database)", 
            type: "select", 
            required: true,
            options: patientOptions.length > 0 ? patientOptions : [{ label: "Memuat Data Pasien...", value: "" }]
          },
          { key: "nama_operasi", label: "Nama Operasi", required: true },
          { key: "keterangan", label: "Keterangan Operasi", type: "textarea" },
          { 
            key: "status", 
            label: "Status Operasi", 
            type: "select", 
            options: [
              { value: "Belum Operasi", label: "Belum Operasi" },
              { value: "Sudah Operasi", label: "Sudah Operasi (Biru)" },
              { value: "Lagi Operasi", label: "Lagi Operasi (Hijau)" },
              { value: "Selesai", label: "Selesai (Orange)" }
            ] 
          },
          { key: "tanggal_operasi", label: "Tanggal Mulai Operasi", type: "date", required: true },
          { key: "jam_operasi", label: "Jam Mulai (Contoh: 08:30)", required: true },
          { key: "tanggal_selesai", label: "Tanggal Selesai (Kosongkan jika belum)", type: "date" },
          { key: "jam_selesai", label: "Jam Selesai (Kosongkan jika belum)" },
        ]}
      />
    </AdminDashboardShell>
  );
}