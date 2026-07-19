// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/registrations")({
  head: () => ({ meta: [{ title: "Pendaftaran Operasi" }] }),
  component: RegistrationsAdmin,
});

function RegistrationsAdmin() {
  const [patientOptions, setPatientOptions] = useState([]);
  const [doctorOptions, setDoctorOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Pasien: Simpan 'id' sebagai value, 'nama' sebagai label
      const { data: pData } = await supabase.from("patients").select("id, nama");
      if (pData) setPatientOptions(pData.map(p => ({ label: p.nama, value: p.id })));

      // Fetch Dokter: Simpan 'id' sebagai value, 'full_name' sebagai label
      const { data: dData } = await supabase.from("doctors").select("id, full_name");
      if (dData) setDoctorOptions(dData.map(d => ({ label: d.full_name, value: d.id })));
    };
    fetchData();
  }, []);

  return (
    <AdminDashboardShell title="Pendaftaran Operasi" description="Kelola data operasi pasien.">
      <CrudTable<any>
        table="surgeries"
        title="Daftar Operasi"
        searchKeys={["nama_pasien", "nama_operasi"]}
        columns={[
          { key: "nama_pasien", label: "Pasien" },
          { key: "nama_operasi", label: "Tindakan" },
          { key: "status", label: "Status", render: (r) => <Badge variant="outline">{r.status}</Badge> },
          { key: "tanggal_operasi", label: "Tgl" },
        ]}
        fields={[
          { key: "patient_id", label: "Pilih Pasien", type: "select", required: true, options: patientOptions },
          { key: "doctor_id", label: "Pilih Dokter", type: "select", required: true, options: doctorOptions },
          { key: "nama_operasi", label: "Nama Operasi", required: true },
          { 
            key: "status", 
            label: "Status", 
            type: "select", 
            required: true, 
            options: ["Belum Operasi", "Sudah Operasi", "Lagi Operasi", "Selesai"].map(v => ({value:v, label:v})) 
          },
          { key: "tanggal_operasi", label: "Tgl Operasi", type: "date", required: true },
          { key: "jam_operasi", label: "Jam Operasi", required: true },
        ]}
      />
    </AdminDashboardShell>
  );
}