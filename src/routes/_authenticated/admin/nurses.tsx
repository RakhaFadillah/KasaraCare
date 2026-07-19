// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/nurses")({
  head: () => ({ meta: [{ title: "Perawat — Admin" }] }),
  component: NursesAdmin,
});

// Fungsi untuk menghasilkan Nomor STR acak secara otomatis jika dikosongkan
const generateLicense = () => {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `STR-${randomNum}`;
};

function NursesAdmin() {
  return (
    <AdminDashboardShell title="Manajemen Perawat" description="Kelola data staf perawat, jadwal shift, dan status aktif.">
      <CrudTable<any>
        table="nurses" 
        title="Perawat" 
        searchKeys={["full_name", "license_no", "shift"]}
        columns={[
          { key: "full_name", label: "Nama Lengkap" },
          { key: "license_no", label: "No. STR" },
          { key: "phone", label: "No. HP" },
          { key: "shift", label: "Shift Default" },
          { 
            key: "status", 
            label: "Status", 
            render: (r) => {
              const variant = r.status === "Active" ? "default" : 
                              r.status === "Cuti" ? "outline" : "secondary";
              return <Badge variant={variant as any}>{r.status}</Badge>;
            } 
          },
        ]}
        fields={[
          { key: "full_name", label: "Nama Lengkap", required: true },
          { key: "license_no", label: "Nomor STR", defaultValue: generateLicense() } as any,
          { key: "phone", label: "Nomor HP", required: true },
          { 
            key: "shift", 
            label: "Shift Default", 
            type: "select", 
            options: [
              { value: "Pagi", label: "Pagi" },
              { value: "Siang", label: "Siang" },
              { value: "Malam", label: "Malam" },
            ] 
          },
          { 
            key: "status", 
            label: "Status", 
            type: "select", 
            options: [
              { value: "Active", label: "Active" }, 
              { value: "Cuti", label: "Cuti" }, 
              { value: "Inactive", label: "Non Active" }
            ] 
          },
        ]}
      />
    </AdminDashboardShell>
  );
}