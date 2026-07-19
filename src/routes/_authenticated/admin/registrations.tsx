// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Stethoscope } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/registrations")({
  head: () => ({ meta: [{ title: "Pendaftaran Operasi" }] }),
  component: RegistrationsAdmin,
});

function RegistrationsAdmin() {
  const [pOptions, setPOptions] = useState([]);
  const [dOptions, setDOptions] = useState([]);
  const [showQueue, setShowQueue] = useState(false);
  const [queueData, setQueueData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const { data: p } = await supabase.from("patients").select("id, nama");
      const { data: d } = await supabase.from("doctors").select("id, full_name");
      
      // Kita tetap ambil ID untuk database, tapi simpan label namanya
      if (p) setPOptions(p.map(x => ({ label: x.nama, value: x.id })));
      if (d) setDOptions(d.map(x => ({ label: x.full_name, value: x.id })));
    };
    loadData();
  }, []);

  const loadQueue = async () => {
    // Join data untuk modal antrean
    const { data } = await supabase.from("surgeries").select("*, patients(nama), doctors(full_name)").order("tanggal_operasi");
    if (data) {
      setQueueData(data);
      setShowQueue(true);
    }
  };

  return (
    <AdminDashboardShell title="Pendaftaran Operasi" description="Kelola jadwal operasi dan tim dokter.">
      <div className="mb-6 flex justify-end">
        <Button onClick={loadQueue} className="bg-[#00a3e0] text-white">Lihat Jadwal Operasi</Button>
      </div>

      {showQueue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Antrean Operasi</h2>
              <Button variant="outline" onClick={() => setShowQueue(false)}>Tutup</Button>
            </div>
            {queueData.map((op) => (
              <div key={op.id} className="p-4 border-b flex justify-between items-center">
                <div>
                  <div className="font-bold">{op.patients?.nama || '—'}</div>
                  <div className="text-sm text-gray-500">{op.nama_operasi}</div>
                  <div className="text-xs font-bold text-blue-600 mt-1">{op.doctors?.full_name || '—'}</div>
                </div>
                <Badge>{op.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <CrudTable<any>
        table="surgeries"
        title="Daftar Operasi"
        searchKeys={["nama_operasi"]}
        columns={[
          { 
            key: "patient_id", 
            label: "Pasien", 
            // Trik jitu: Kita cocokkan ID di tabel dengan Nama di options yang sudah kita load!
            render: (r) => pOptions.find(opt => opt.value === r.patient_id)?.label || '—' 
          },
          { 
            key: "doctor_id", 
            label: "Dokter", 
            render: (r) => dOptions.find(opt => opt.value === r.doctor_id)?.label || '—' 
          },
          { key: "nama_operasi", label: "Tindakan" },
          { key: "status", label: "Status", render: (r) => <Badge>{r.status}</Badge> },
          { key: "tanggal_operasi", label: "Tgl Operasi" },
          { key: "jam_operasi", label: "Jam Operasi" }, // SAYA KEMBALIKAN KOLOM JAMNYA!
        ]}
        fields={[
          { key: "patient_id", label: "Nama Pasien", type: "select", required: true, options: pOptions },
          { key: "doctor_id", label: "Nama Dokter", type: "select", options: dOptions },
          { key: "nama_operasi", label: "Nama Operasi", required: true },
          { key: "status", label: "Status", type: "select", required: true, options: ["Belum Operasi", "Sudah Operasi", "Lagi Operasi", "Selesai"].map(v => ({value:v, label:v})) },
          { key: "tanggal_operasi", label: "Tgl Operasi", type: "date" },
          { key: "jam_operasi", label: "Jam Operasi" }, // required: true dihapus agar tidak error Save Failed
        ]}
      />
    </AdminDashboardShell>
  );
}