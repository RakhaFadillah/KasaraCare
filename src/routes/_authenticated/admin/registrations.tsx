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
      const { data: p } = await supabase.from("patients").select("nama");
      const { data: d } = await supabase.from("doctors").select("full_name");
      if (p) setPOptions(p.map(x => ({ label: x.nama, value: x.nama })));
      if (d) setDOptions(d.map(x => ({ label: x.full_name, value: x.full_name })));
    };
    loadData();
  }, []);

  const loadQueue = async () => {
    const { data } = await supabase.from("surgeries").select("*").order("tanggal_operasi");
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
                  <div className="font-bold">{op.nama_pasien}</div>
                  <div className="text-sm text-gray-500">{op.nama_operasi}</div>
                  <div className="text-xs font-bold text-blue-600 mt-1">{op.nama_dokter}</div>
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
        searchKeys={["nama_pasien", "nama_dokter", "nama_operasi"]}
        columns={[
          { key: "nama_pasien", label: "Pasien" },
          { key: "nama_dokter", label: "Dokter" },
          { key: "nama_operasi", label: "Tindakan" },
          { key: "status", label: "Status", render: (r) => <Badge>{r.status}</Badge> },
          { key: "tanggal_operasi", label: "Tgl Operasi" },
        ]}
        fields={[
          { key: "nama_pasien", label: "Nama Pasien", type: "select", required: true, options: pOptions },
          { key: "nama_dokter", label: "Nama Dokter", type: "select", required: true, options: dOptions },
          { key: "nama_operasi", label: "Nama Operasi", required: true },
          { key: "status", label: "Status", type: "select", required: true, options: ["Belum Operasi", "Sudah Operasi", "Lagi Operasi", "Selesai"].map(v => ({value:v, label:v})) },
          { key: "tanggal_operasi", label: "Tgl Operasi", type: "date", required: true },
          { key: "jam_operasi", label: "Jam Operasi", required: true },
        ]}
      />
    </AdminDashboardShell>
  );
}