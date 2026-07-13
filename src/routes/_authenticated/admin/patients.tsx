import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/patients")({
  head: () => ({ meta: [{ title: "Patients — Admin" }] }),
  component: () => (
    <DashboardShell title="Patients" description="Manage patient records.">
      <CrudTable<any>
        table="patients" title="Patient"
        select="*" orderBy="created_at" searchKeys={["full_name","medical_record_no","phone"]}
        columns={[
          { key: "medical_record_no", label: "MRN", render: (r) => <span className="font-mono text-xs">{r.medical_record_no}</span> },
          { key: "full_name", label: "Name" },
          { key: "phone", label: "Phone" },
          { key: "insurance", label: "Insurance", render: (r) => <Badge variant="outline">{r.insurance}</Badge> },
          { key: "status", label: "Status", render: (r) => <Badge>{r.status}</Badge> },
          { key: "created_at", label: "Created", render: (r) => fmtDate(r.created_at) },
        ]}
        fields={[
          { key: "medical_record_no", label: "Medical Record No.", required: true },
          { key: "full_name", label: "Full Name", required: true },
          { key: "date_of_birth", label: "Date of birth", type: "date" },
          { key: "gender", label: "Gender", type: "select", options: [{value:"Male",label:"Male"},{value:"Female",label:"Female"}] },
          { key: "phone", label: "Phone" },
          { key: "address", label: "Address", type: "textarea" },
          { key: "insurance", label: "Insurance", type: "select", required: true, options: ["BPJS","Private","Self-Pay","Corporate"].map(v => ({value:v,label:v})) },
          { key: "bpjs_number", label: "BPJS number" },
          { key: "status", label: "Status", type: "select", required: true, options: [{value:"Active",label:"Active"},{value:"Inactive",label:"Inactive"}] },
        ]}
      />
    </DashboardShell>
  ),
});
