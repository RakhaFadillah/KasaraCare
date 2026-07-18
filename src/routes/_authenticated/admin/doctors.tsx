import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/doctors")({
  head: () => ({ meta: [{ title: "Dokter — Admin" }] }),
  component: DoctorsAdmin,
});

// Fungsi untuk menghasilkan Nomor Izin Praktik acak secara otomatis
const generateLicense = () => {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `SIP-${randomNum}`;
};

function DoctorsAdmin() {
  const clinicsQ = useQuery({ 
    queryKey: ["clinics-opts"], 
    queryFn: async () => {
      const { data, error } = await supabase.from("clinics").select("id, name").order("name");
      if (error) throw new Error("Gagal memuat data poli");
      return data ?? [];
    } 
  });
  
  const options = clinicsQ.data?.map((c: any) => ({ value: c.id, label: c.name })) ?? [];
  
  return (
    <AdminDashboardShell title="Dokter" description="Manajemen data staf medis dan dokter.">
      <CrudTable<any>
        table="doctors" 
        title="Dokter" 
        select="*, clinics(name)" 
        searchKeys={["full_name", "specialization"]}
        columns={[
          { key: "full_name", label: "Nama Lengkap" },
          { key: "specialization", label: "Spesialisasi" },
          { key: "clinic", label: "Poli", render: (r) => r.clinics?.name ?? "—" },
          { key: "license_no", label: "No. Izin Praktik" },
          { 
            key: "status", 
            label: "Status", 
            render: (r) => {
              const statusLabel = r.status === "Available" ? "Tersedia" : 
                                  r.status === "OnLeave" ? "Cuti" : 
                                  r.status === "Inactive" ? "Nonaktif" : r.status;
                                  
              const badgeVariant = r.status === "Available" ? "default" : 
                                   r.status === "OnLeave" ? "outline" : "secondary";

              return <Badge variant={badgeVariant as any}>{statusLabel}</Badge>;
            } 
          },
        ]}
        fields={[
          { key: "full_name", label: "Nama Lengkap", required: true },
          { key: "specialization", label: "Spesialisasi", required: true },
          { key: "clinic_id", label: "Poli", type: "select", options },
          
          // PERBAIKAN: Menambahkan "as any" untuk mengabaikan error TypeScript
          { key: "license_no", label: "Nomor Izin Praktik", defaultValue: generateLicense() } as any,
          
          { key: "bio", label: "Bio / Profil", type: "textarea" },
          { 
            key: "status", 
            label: "Status", 
            type: "select", 
            options: [
              { value: "Available", label: "Tersedia" }, 
              { value: "OnLeave", label: "Cuti" }, 
              { value: "Inactive", label: "Nonaktif" }
            ] 
          },
        ]}
      />
    </AdminDashboardShell>
  );
}