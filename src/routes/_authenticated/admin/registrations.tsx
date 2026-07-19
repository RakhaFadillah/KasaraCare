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
  const [patientOptions, setPatientOptions] = useState([]);
  const [doctorOptions, setDoctorOptions] = useState([]);
  const [showQueue, setShowQueue] = useState(false);
  const [queueData, setQueueData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      // Mengambil data pasien dan dokter
      const { data: pData } = await supabase.from("patients").select("nama").order("nama");
      const { data: dData } = await supabase.from("doctors").select("full_name").order("full_name");
      
      if (pData) setPatientOptions(pData.map(p => ({ label: p.nama, value: p.nama })));
      if (dData) setDoctorOptions(dData.map(d => ({ label: d.full_name, value: d.full_name })));
    };
    fetchData();
  }, []);

  const loadUpcomingQueue = async () => {
    const { data } = await supabase
      .from("surgeries")
      .select("*")
      .order("tanggal_operasi", { ascending: true });
    
    if (data) setQueueData(data);
    setShowQueue(true);
  };

  return (
    <AdminDashboardShell title="Pendaftaran Operasi" description="Kelola jadwal operasi dan tim dokter.">
      <div className="mb-6 flex justify-end">
        <Button onClick={loadUpcomingQueue} className="bg-[#00a3e0] text-white">Lihat Jadwal Operasi</Button>
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
                  <div className="font-bold">{op.nama_pasien}</div>
                  <div className="text-sm text-gray-500">{op.nama_operasi}</div>
                  <div className="flex items-center text-sm font-semibold text-blue-600 mt-1">
                    <Stethoscope className="h-3 w-3 mr-1" /> {op.nama_dokter}
                  </div>
                </div>
                <Badge variant="secondary">{op.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <CrudTable<any>
        table="surgeries"
        title="Daftar Operasi"
        searchKeys={["nama_pasien", "nama_dokter", "nama_operasi"]}
        columns={[
          { key: "nama_pasien", label: "Nama Pasien" },
          { key: "nama_dokter", label: "Dokter", render: (r) => <span className="font-medium text-blue-600">{r.nama_dokter}</span> },
          { key: "nama_operasi", label: "Tindakan" },
          { key: "status", label: "Status", render: (r) => <Badge>{r.status}</Badge> },
          { key: "tanggal_operasi", label: "Tgl Operasi" },
        ]}
        fields={[
          { key: "nama_pasien", label: "Nama Pasien", type: "select", required: true, options: patientOptions },
          { key: "nama_dokter", label: "Nama Dokter", type: "select", required: true, options: doctorOptions },
          { key: "nama_operasi", label: "Nama Operasi", required: true },
          { key: "status", label: "Status", type: "select", required: true, options: ["Belum Operasi", "Sudah Operasi", "Lagi Operasi", "Selesai"].map(v => ({value:v, label:v})) },
          { key: "tanggal_operasi", label: "Tgl Operasi", type: "date", required: true },
          { key: "jam_operasi", label: "Jam Operasi (Contoh: 08:00)", required: true },
        ]}
      />
    </AdminDashboardShell>
  );
}