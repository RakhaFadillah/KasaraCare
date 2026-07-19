// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Stethoscope } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/registrations")({
  head: () => ({ meta: [{ title: "Pendaftaran Operasi — Admin" }] }),
  component: RegistrationsAdmin,
});

function RegistrationsAdmin() {
  const [patientOptions, setPatientOptions] = useState([]);
  const [doctorOptions, setDoctorOptions] = useState([]);
  const [showQueue, setShowQueue] = useState(false);
  const [queueData, setQueueData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Pasien
      const { data: pData } = await supabase.from("patients").select("nama").order("nama", { ascending: true });
      if (pData) setPatientOptions(pData.map(p => ({ label: p.nama, value: p.nama })));

      // Fetch Dokter dari tabel public.doctors (sesuai gambar Anda)
      const { data: dData } = await supabase.from("doctors").select("full_name").order("full_name", { ascending: true });
      if (dData) setDoctorOptions(dData.map(d => ({ label: d.full_name, value: d.full_name })));
    };
    fetchData();
  }, []);

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
    <AdminDashboardShell title="Pendaftaran Operasi" description="Kelola jadwal operasi dan penugasan dokter.">
      
      <div className="mb-6 flex justify-end">
        <Button onClick={loadUpcomingQueue} className="bg-[#00a3e0] text-white font-semibold">
          Lihat Jadwal Operasi Terdekat
        </Button>
      </div>

      {showQueue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Antrean Operasi Terdekat</h2>
              <Button variant="outline" size="sm" onClick={() => setShowQueue(false)}>Tutup</Button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              {queueData.map((op) => (
                <div key={op.id} className="p-5 border border-gray-200 rounded-xl flex justify-between items-center shadow-sm">
                  <div>
                    <div className="font-bold text-lg text-gray-800">{op.nama_pasien}</div>
                    <div className="text-sm text-gray-600">{op.nama_operasi}</div>
                    <div className="text-sm font-semibold text-[#00a3e0] mt-2 flex items-center gap-1">
                      <Stethoscope className="h-4 w-4" /> {op.nama_dokter}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{op.tanggal_operasi}</div>
                    <div className="text-sm">{op.jam_operasi}</div>
                    <Badge className="mt-2">{op.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <CrudTable<any>
        table="surgeries"
        title="Data Operasi"
        searchKeys={["nama_pasien", "nama_dokter", "nama_operasi", "status"]}
        columns={[
          { key: "nama_pasien", label: "Nama Pasien" },
          { key: "nama_dokter", label: "Dokter" },
          { key: "nama_operasi", label: "Tindakan" },
          { key: "tanggal_operasi", label: "Tgl Operasi" },
          { key: "status", label: "Status", render: (r) => <Badge>{r.status}</Badge> },
        ]}
        fields={[
          { key: "nama_pasien", label: "Pasien", type: "select", required: true, options: patientOptions },
          { key: "nama_dokter", label: "Dokter Penanggung Jawab", type: "select", required: true, options: doctorOptions },
          { key: "nama_operasi", label: "Nama Operasi", required: true },
          { key: "status", label: "Status", type: "select", options: ["Belum Operasi", "Sudah Operasi", "Lagi Operasi", "Selesai"].map(v => ({value:v, label:v})) },
          { key: "tanggal_operasi", label: "Tgl Operasi", type: "date", required: true },
          { key: "jam_operasi", label: "Jam Operasi", required: true },
        ]}
      />
    </AdminDashboardShell>
  );
}