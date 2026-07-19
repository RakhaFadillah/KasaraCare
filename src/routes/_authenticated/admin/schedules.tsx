import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/schedules")({
  head: () => ({ meta: [{ title: "Schedules — Admin" }] }),
  component: Schedules,
});

function Schedules() {
  // 1. Fetch data Dokter DAN Pasien sekaligus dengan Promise.all
  const { data: options } = useQuery({ 
    queryKey: ["schedule-opts"], 
    queryFn: async () => {
      const [doctorsRes, patientsRes] = await Promise.all([
        supabase.from("doctors").select("id, full_name").order("full_name"),
        supabase.from("patients").select("id, nama").order("nama")
      ]);

      if (doctorsRes.error) throw new Error("Gagal memuat data dokter");
      if (patientsRes.error) throw new Error("Gagal memuat data pasien");

      return {
        doctors: doctorsRes.data ?? [],
        patients: patientsRes.data ?? []
      };
    } 
  });
  
  // 2. Format data untuk Dropdown
  const doctorOpts = options?.doctors.map((d: any) => ({ value: d.id, label: d.full_name })) ?? [];
  const patientOpts = options?.patients.map((p: any) => ({ value: p.id, label: p.nama })) ?? [];
  
  return (
    <AdminDashboardShell title="Manajemen Jadwal" description="Kelola jadwal pertemuan dokter dan pasien.">
      <CrudTable<any>
        table="schedules" 
        title="Jadwal Pemeriksaan" 
        // 3. JOIN dengan tabel doctors dan patients untuk mengambil nama
        select="*, doctors(full_name), patients(nama)" 
        orderBy="tanggal" 
        ascending={false} // Jadwal terbaru di atas
        searchKeys={["poli", "jenis_pelayanan", "status"]}
        
        // 4. Konfigurasi Tampilan Tabel (Sesuai Permintaan Anda)
        columns={[
          { key: "doctor", label: "Dokter", render: (r) => r.doctors?.full_name ?? "—" },
          { key: "patient", label: "Pasien", render: (r) => r.patients?.nama ?? "—" },
          { key: "tanggal", label: "Tanggal", render: (r) => r.tanggal ?? "—" },
          { key: "jam", label: "Jam", render: (r) => r.jam?.slice(0,5) ?? "—" },
          { key: "poli", label: "Poli" },
          { key: "jenis_pelayanan", label: "Layanan" },
          { 
            key: "status", 
            label: "Status", 
            render: (r) => (
              <Badge variant={r.status === "Done" ? "default" : "secondary"}>
                {r.status}
              </Badge>
            ) 
          },
        ]}
        
        // 5. Konfigurasi Form Input (Sesuai Permintaan Anda)
        fields={[
          { key: "doctor_id", label: "Dokter", type: "select", required: true, options: doctorOpts },
          { key: "patient_id", label: "Pasien", type: "select", required: true, options: patientOpts },
          { key: "tanggal", label: "Tanggal", type: "date", required: true },
          { key: "jam", label: "Jam", type: "time", required: true },
          { key: "poli", label: "Poli", required: true },
          { key: "jenis_pelayanan", label: "Jenis Pelayanan", required: true },
          { 
            key: "status", 
            label: "Status", 
            type: "select", 
            required: true, 
            options: [
              { value: "Undone", label: "Undone" },
              { value: "Done", label: "Done" }
            ] 
          },
        ]}
      />
    </AdminDashboardShell>
  );
}