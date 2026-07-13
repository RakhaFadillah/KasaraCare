import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";
import { fmtDate, generateMRN, todayISO } from "@/lib/format";
import { CheckCircle2, Loader2, Ticket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/register")({
  head: () => ({ meta: [{ title: "Register Treatment — MediCare" }] }),
  component: RegisterPage,
});

const schema = z.object({
  clinic_id: z.string().uuid("Choose a clinic"),
  doctor_id: z.string().uuid("Choose a doctor"),
  schedule_id: z.string().uuid("Choose a schedule"),
  visit_date: z.string().min(1),
  complaint: z.string().trim().min(3, "Describe your complaint").max(500),
  insurance: z.enum(["BPJS","Private","Self-Pay","Corporate"]),
  bpjs_number: z.string().trim().max(30).optional().or(z.literal("")),
  referral_number: z.string().trim().max(30).optional().or(z.literal("")),
});

function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [ticket, setTicket] = useState<any>(null);
  const [form, setForm] = useState<{
    clinic_id: string; doctor_id: string; schedule_id: string; visit_date: string;
    complaint: string; insurance: "BPJS" | "Private" | "Self-Pay" | "Corporate";
    bpjs_number: string; referral_number: string; full_name: string;
  }>({
    clinic_id: "", doctor_id: "", schedule_id: "",
    visit_date: todayISO(), complaint: "",
    insurance: "Self-Pay", bpjs_number: "", referral_number: "",
    full_name: "",
  });

  const clinicsQ = useQuery({ queryKey: ["clinics"], queryFn: async () => (await supabase.from("clinics").select("*").eq("is_active", true).order("name")).data ?? [] });
  const doctorsQ = useQuery({
    queryKey: ["doctors", form.clinic_id], enabled: !!form.clinic_id,
    queryFn: async () => (await supabase.from("doctors").select("*").eq("clinic_id", form.clinic_id).eq("status", "Available").order("full_name")).data ?? [],
  });
  const schedulesQ = useQuery({
    queryKey: ["schedules", form.doctor_id, form.visit_date], enabled: !!form.doctor_id && !!form.visit_date,
    queryFn: async () => {
      const dow = new Date(form.visit_date).getDay();
      const { data } = await supabase.from("schedules").select("*").eq("doctor_id", form.doctor_id).eq("day_of_week", dow).eq("is_active", true).order("start_time");
      return data ?? [];
    },
  });

  const patientQ = useQuery({
    queryKey: ["me-patient", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("patients").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  const submit = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse(form);
      let patient = patientQ.data;
      if (!patient) {
        const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user!.id).maybeSingle();
        const name = form.full_name || profile?.full_name || user!.email!;
        const { data: created, error } = await supabase.from("patients").insert({
          user_id: user!.id, medical_record_no: generateMRN(), full_name: name,
          phone: profile?.phone, insurance: parsed.insurance, bpjs_number: parsed.bpjs_number || null,
        }).select().single();
        if (error) throw error;
        patient = created;
      }
      const { data: reg, error: regErr } = await supabase.from("registrations").insert({
        patient_id: patient!.id,
        clinic_id: parsed.clinic_id, doctor_id: parsed.doctor_id, schedule_id: parsed.schedule_id,
        visit_date: parsed.visit_date, complaint: parsed.complaint,
        insurance: parsed.insurance,
        bpjs_number: parsed.bpjs_number || null, referral_number: parsed.referral_number || null,
      }).select("*, doctors(full_name, specialization), clinics(name)").single();
      if (regErr) throw regErr;
      return reg;
    },
    onSuccess: (reg) => {
      toast.success(`Registered! Queue #${reg.queue_number}`);
      qc.invalidateQueries();
      setTicket(reg);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to register"),
  });

  const needFullName = !patientQ.data && !patientQ.isLoading;
  const chosenSchedule = useMemo(() => schedulesQ.data?.find((s: any) => s.id === form.schedule_id), [schedulesQ.data, form.schedule_id]);

  if (ticket) {
    return (
      <DashboardShell title="Registration confirmed" description="Save your digital ticket below.">
        <div className="mx-auto max-w-lg">
          <div className="glass-card overflow-hidden rounded-3xl shadow-elegant">
            <div className="gradient-hero p-8 text-primary-foreground">
              <div className="flex items-center gap-2 text-sm opacity-90"><CheckCircle2 className="h-4 w-4" /> Queue confirmed</div>
              <p className="mt-2 font-display text-5xl font-bold tracking-tight">#{ticket.queue_number}</p>
              <p className="mt-1 text-sm opacity-90">{ticket.doctors?.full_name} · {ticket.clinics?.name}</p>
            </div>
            <div className="space-y-3 p-6 text-sm">
              <Row label="Patient" value={patientQ.data?.full_name ?? form.full_name} />
              <Row label="MRN" value={patientQ.data?.medical_record_no ?? "—"} />
              <Row label="Visit date" value={fmtDate(ticket.visit_date)} />
              <Row label="Estimated time" value={new Date(ticket.estimated_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} />
              <Row label="Insurance" value={ticket.insurance} />
              <Row label="Status" value={ticket.status} />
            </div>
            <div className="flex gap-2 border-t border-border/60 p-4">
              <Button variant="outline" className="flex-1" onClick={() => setTicket(null)}>Register another</Button>
              <Button className="flex-1 gradient-primary text-primary-foreground shadow-soft" onClick={() => navigate({ to: "/queue" })}>Track queue</Button>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Register a treatment" description="Fill in your visit details. Doctors and schedules load from live data.">
      <form onSubmit={(e) => { e.preventDefault(); submit.mutate(); }} className="glass-card grid gap-5 rounded-3xl p-6 md:grid-cols-2">
        {needFullName && (
          <div className="md:col-span-2 space-y-1.5">
            <Label>Full name (creates your medical record)</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required maxLength={100} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Clinic</Label>
          <Select value={form.clinic_id} onValueChange={(v) => setForm({ ...form, clinic_id: v, doctor_id: "", schedule_id: "" })}>
            <SelectTrigger><SelectValue placeholder="Select clinic" /></SelectTrigger>
            <SelectContent>{clinicsQ.data?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Doctor</Label>
          <Select value={form.doctor_id} onValueChange={(v) => setForm({ ...form, doctor_id: v, schedule_id: "" })} disabled={!form.clinic_id}>
            <SelectTrigger><SelectValue placeholder={form.clinic_id ? "Select doctor" : "Choose clinic first"} /></SelectTrigger>
            <SelectContent>{doctorsQ.data?.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.full_name} · {d.specialization}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Visit date</Label>
          <Input type="date" min={todayISO()} value={form.visit_date} onChange={(e) => setForm({ ...form, visit_date: e.target.value, schedule_id: "" })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Schedule</Label>
          <Select value={form.schedule_id} onValueChange={(v) => setForm({ ...form, schedule_id: v })} disabled={!form.doctor_id}>
            <SelectTrigger><SelectValue placeholder={schedulesQ.data && schedulesQ.data.length === 0 ? "No schedule that day" : "Select time"} /></SelectTrigger>
            <SelectContent>{schedulesQ.data?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.start_time.slice(0,5)} – {s.end_time.slice(0,5)} (quota {s.quota})</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>Chief complaint</Label>
          <Textarea rows={3} maxLength={500} value={form.complaint} onChange={(e) => setForm({ ...form, complaint: e.target.value })} placeholder="Describe your symptoms briefly…" required />
        </div>
        <div className="space-y-1.5">
          <Label>Insurance</Label>
          <Select value={form.insurance} onValueChange={(v) => setForm({ ...form, insurance: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["BPJS","Private","Self-Pay","Corporate"].map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {form.insurance === "BPJS" && (
          <>
            <div className="space-y-1.5">
              <Label>BPJS number</Label>
              <Input value={form.bpjs_number} onChange={(e) => setForm({ ...form, bpjs_number: e.target.value })} maxLength={30} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Referral number</Label>
              <Input value={form.referral_number} onChange={(e) => setForm({ ...form, referral_number: e.target.value })} maxLength={30} />
            </div>
          </>
        )}

        {chosenSchedule && (
          <div className="md:col-span-2 flex items-center gap-2 rounded-xl bg-primary/10 p-3 text-sm text-primary">
            <Ticket className="h-4 w-4" /> Estimated wait window: {chosenSchedule.start_time.slice(0,5)}–{chosenSchedule.end_time.slice(0,5)}. Queue number is assigned on submit.
          </div>
        )}

        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={submit.isPending} className="gradient-primary text-primary-foreground shadow-soft">
            {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm registration
          </Button>
        </div>
      </form>
    </DashboardShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-dashed border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
