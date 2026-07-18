import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/admin-dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { supabase } from "@/integrations/supabase/client";
import { dayName } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/schedules")({
  head: () => ({ meta: [{ title: "Schedules — Admin" }] }),
  component: Schedules,
});

function Schedules() {
  const doctorsQ = useQuery({ queryKey: ["doctors-opts"], queryFn: async () => (await supabase.from("doctors").select("id, full_name").order("full_name")).data ?? [] });
  const opts = doctorsQ.data?.map((d: any) => ({ value: d.id, label: d.full_name })) ?? [];
  return (
    <DashboardShell title="Doctor schedules" description="Manage practice hours.">
      <CrudTable<any>
        table="schedules" title="Schedule" select="*, doctors(full_name)" orderBy="day_of_week" ascending
        searchKeys={[]}
        columns={[
          { key: "doctor", label: "Doctor", render: (r) => r.doctors?.full_name ?? "—" },
          { key: "day_of_week", label: "Day", render: (r) => dayName(r.day_of_week) },
          { key: "time", label: "Time", render: (r) => `${r.start_time?.slice(0,5)} – ${r.end_time?.slice(0,5)}` },
          { key: "quota", label: "Quota" },
          { key: "is_active", label: "Active", render: (r) => <Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Yes" : "No"}</Badge> },
        ]}
        fields={[
          { key: "doctor_id", label: "Doctor", type: "select", required: true, options: opts },
          { key: "day_of_week", label: "Day (0=Sun … 6=Sat)", type: "number", required: true, min: 0, max: 6 },
          { key: "start_time", label: "Start time", type: "time", required: true },
          { key: "end_time", label: "End time", type: "time", required: true },
          { key: "quota", label: "Quota", type: "number", min: 1 },
          { key: "is_active", label: "Active", type: "checkbox" },
        ]}
      />
    </DashboardShell>
  );
}
