import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/clinics")({
  head: () => ({ meta: [{ title: "Poli — Admin" }] }),
  component: ClinicsAdmin,
});

function ClinicsAdmin() {
  return (
    <AdminDashboardShell title="Poli" description="Manajemen Poli">
      <CrudTable<any>
        table="clinics" 
        title="Poli" 
        searchKeys={["name", "location"]}
        columns={[
          { key: "name", label: "Nama Poli" },
          { key: "location", label: "Lokasi" },
          { key: "description", label: "Deskripsi" },
          { 
            key: "is_active", 
            label: "Status", 
            render: (r) => (
              <Badge variant={r.is_active ? "default" : "secondary"}>
                {r.is_active ? "Aktif" : "Nonaktif"}
              </Badge>
            ) 
          },
        ]}
        fields={[
          { key: "name", label: "Nama Poli", required: true },
          { key: "description", label: "Deskripsi", type: "textarea" },
          { key: "location", label: "Lokasi" },
          { key: "icon", label: "Ikon (nama lucide)" },
          { key: "is_active", label: "Aktif", type: "checkbox" },
        ]}
      />
    </AdminDashboardShell>
  );
}