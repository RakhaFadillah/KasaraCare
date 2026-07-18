import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/doctors")({
  head: () => ({ meta: [{ title: "Doctors — Admin" }] }),
  component: DoctorsAdmin,
});

function DoctorsAdmin() {
  const clinicsQ = useQuery({ 
    queryKey: ["clinics-opts"], 
    queryFn: async () => {
      const { data, error } = await supabase.from("clinics").select("id, name").order("name");
      if (error) throw new Error("Failed to load clinics data");
      return data ?? [];
    } 
  });
  
  const options = clinicsQ.data?.map((c: any) => ({ value: c.id, label: c.name })) ?? [];
  
  return (
    <AdminDashboardShell title="Doctors" description="Manage medical staff.">
      <CrudTable<any>
        table="doctors" 
        title="Doctor" 
        select="*, clinics(name)" 
        searchKeys={["full_name", "specialization"]}
        columns={[
          { key: "full_name", label: "Name" },
          { key: "specialization", label: "Specialization" },
          { key: "clinic", label: "Clinic", render: (r) => r.clinics?.name ?? "—" },
          { key: "license_no", label: "License" },
          { key: "status", label: "Status", render: (r) => <Badge>{r.status}</Badge> },
        ]}
        fields={[
          { key: "full_name", label: "Full name", required: true },
          { key: "specialization", label: "Specialization", required: true },
          { key: "clinic_id", label: "Clinic", type: "select", options },
          { key: "license_no", label: "License number" },
          { key: "bio", label: "Bio", type: "textarea" },
          { key: "photo_url", label: "Photo URL" },
          { key: "status", label: "Status", type: "select", options: [{ value: "Available", label: "Available" }, { value: "OnLeave", label: "On Leave" }, { value: "Inactive", label: "Inactive" }] },
        ]}
      />
    </AdminDashboardShell>
  );
}