import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/clinics")({
  head: () => ({ meta: [{ title: "Clinics — Admin" }] }),
  component: () => (
    <DashboardShell title="Clinics" description="Manage hospital departments.">
      <CrudTable<any>
        table="clinics" title="Clinic" searchKeys={["name","location"]}
        columns={[
          { key: "name", label: "Name" },
          { key: "location", label: "Location" },
          { key: "description", label: "Description" },
          { key: "is_active", label: "Active", render: (r) => <Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Yes" : "No"}</Badge> },
        ]}
        fields={[
          { key: "name", label: "Name", required: true },
          { key: "description", label: "Description", type: "textarea" },
          { key: "location", label: "Location" },
          { key: "icon", label: "Icon (lucide name)" },
          { key: "is_active", label: "Active", type: "checkbox" },
        ]}
      />
    </DashboardShell>
  ),
});
