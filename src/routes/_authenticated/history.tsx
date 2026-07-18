import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/admin-dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/format";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Medical History — MediCare" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const q = useQuery({
    queryKey: ["history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: patient } = await supabase.from("patients").select("id").eq("user_id", user!.id).maybeSingle();
      if (!patient) return [];
      const { data } = await supabase.from("medical_history").select("*, doctors(full_name, specialization)").eq("patient_id", patient.id).order("visit_date", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = q.data?.filter((h) => !search || h.diagnosis.toLowerCase().includes(search.toLowerCase()) || h.doctors?.full_name?.toLowerCase().includes(search.toLowerCase())) ?? [];

  return (
    <DashboardShell title="Medical history" description="Your visits, diagnoses, and prescriptions.">
      <div className="glass-card rounded-3xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search diagnosis or doctor…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        </div>
        {q.isLoading ? <Skeleton className="h-40 w-full" /> : filtered.length === 0 ? (
          <EmptyState title="No records yet" description="Once you visit a doctor, your medical history will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead><TableHead>Doctor</TableHead>
                  <TableHead>Diagnosis</TableHead><TableHead>Prescription</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((h) => (
                  <TableRow key={h.id} className="cursor-pointer" onClick={() => setSelected(h)}>
                    <TableCell>{fmtDate(h.visit_date)}</TableCell>
                    <TableCell>{h.doctors?.full_name ?? "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{h.diagnosis}</Badge></TableCell>
                    <TableCell className="max-w-[280px] truncate text-muted-foreground">{h.prescription ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Visit details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <Row label="Date" value={fmtDate(selected.visit_date)} />
              <Row label="Doctor" value={selected.doctors?.full_name ?? "—"} />
              <Row label="Diagnosis" value={selected.diagnosis} />
              <Block label="Doctor notes" value={selected.doctor_notes} />
              <Block label="Prescription" value={selected.prescription} />
              <Block label="Laboratory" value={selected.lab_results} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}
function Block({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">{value || "—"}</p>
    </div>
  );
}
