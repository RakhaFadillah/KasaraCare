import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/admin-dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/registrations")({
  head: () => ({ meta: [{ title: "Registrations — Admin" }] }),
  component: () => (
    <DashboardShell title="Registrations" description="All patient registrations.">
      <CrudTable<any>
        table="registrations" title="Registration"
        select="*, patients(full_name, medical_record_no), doctors(full_name), clinics(name)"
        searchKeys={[]}
        columns={[
          { key: "queue_number", label: "#", render: (r) => <Badge>#{r.queue_number}</Badge> },
          { key: "patient", label: "Patient", render: (r) => r.patients?.full_name },
          { key: "clinic", label: "Clinic", render: (r) => r.clinics?.name },
          { key: "doctor", label: "Doctor", render: (r) => r.doctors?.full_name },
          { key: "visit_date", label: "Date", render: (r) => fmtDate(r.visit_date) },
          { key: "insurance", label: "Insurance" },
          { key: "status", label: "Status", render: (r) => <Badge variant="outline">{r.status}</Badge> },
        ]}
        fields={[
          { key: "status", label: "Status", type: "select", required: true, options: ["Pending","Confirmed","InQueue","InProgress","Completed","Cancelled"].map(v => ({value:v,label:v})) },
          { key: "complaint", label: "Complaint", type: "textarea" },
        ]}
      />
    </DashboardShell>
  ),
});
