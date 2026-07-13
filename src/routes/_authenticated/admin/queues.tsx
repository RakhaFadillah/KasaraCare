import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { todayISO, fmtTime } from "@/lib/format";
import { Radio } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/queues")({
  head: () => ({ meta: [{ title: "Queues — Admin" }] }),
  component: QueuesAdmin,
});

function QueuesAdmin() {
  const qc = useQueryClient();
  const [doctorId, setDoctorId] = useState<string>("");
  const [date, setDate] = useState<string>(todayISO());

  const doctorsQ = useQuery({ queryKey: ["doctors-opts"], queryFn: async () => (await supabase.from("doctors").select("id, full_name").order("full_name")).data ?? [] });
  const queueQ = useQuery({
    queryKey: ["admin-queue", doctorId, date], enabled: !!doctorId && !!date,
    queryFn: async () => (await supabase.from("queues").select("*, registrations(patients(full_name, medical_record_no))")
      .eq("doctor_id", doctorId).eq("visit_date", date).order("queue_number")).data ?? [],
  });

  useEffect(() => {
    if (!doctorId) return;
    const ch = supabase.channel(`adm-q-${doctorId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "queues", filter: `doctor_id=eq.${doctorId}` }, () => qc.invalidateQueries({ queryKey: ["admin-queue"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [doctorId, qc]);

  const setStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "Called") patch.called_at = new Date().toISOString();
    if (status === "Serving") patch.served_at = new Date().toISOString();
    if (status === "Done") patch.finished_at = new Date().toISOString();
    const { error } = await supabase.from("queues").update(patch).eq("id", id);
    if (error) toast.error(error.message); else toast.success(`Marked ${status}`);
  };

  return (
    <DashboardShell title="Queue management" description="Realtime queue console for staff.">
      <div className="glass-card mb-4 flex flex-wrap items-end gap-3 rounded-2xl p-4">
        <div>
          <label className="text-xs text-muted-foreground">Doctor</label>
          <Select value={doctorId} onValueChange={setDoctorId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select doctor" /></SelectTrigger>
            <SelectContent>{doctorsQ.data?.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="block h-9 rounded-md border border-input bg-background px-3 text-sm" />
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground"><Radio className="h-3 w-3 animate-pulse text-primary" /> Live sync</div>
      </div>

      <div className="glass-card rounded-3xl p-4">
        {!doctorId ? <EmptyState title="Choose a doctor" /> : (queueQ.data?.length ?? 0) === 0 ? <EmptyState title="No queue for that day" /> : (
          <Table>
            <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Patient</TableHead><TableHead>MRN</TableHead><TableHead>Called</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {queueQ.data!.map((q: any) => (
                <TableRow key={q.id}>
                  <TableCell><Badge>#{q.queue_number}</Badge></TableCell>
                  <TableCell>{q.registrations?.patients?.full_name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{q.registrations?.patients?.medical_record_no ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{q.called_at ? fmtTime(q.called_at) : "—"}</TableCell>
                  <TableCell><Badge variant="outline">{q.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="outline" onClick={() => setStatus(q.id, "Called")}>Call</Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(q.id, "Serving")}>Serve</Button>
                    <Button size="sm" className="gradient-primary text-primary-foreground shadow-soft" onClick={() => setStatus(q.id, "Done")}>Done</Button>
                    <Button size="sm" variant="ghost" onClick={() => setStatus(q.id, "Skipped")}>Skip</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </DashboardShell>
  );
}
