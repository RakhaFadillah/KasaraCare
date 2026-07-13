import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import type { ReactNode } from "react";

export interface CrudColumn<T> { key: string; label: string; render?: (r: T) => ReactNode; }
export interface CrudField {
  key: string; label: string;
  type?: "text" | "textarea" | "number" | "select" | "date" | "time" | "checkbox";
  required?: boolean; options?: { value: string; label: string }[];
  min?: number; max?: number;
}

export function CrudTable<T extends { id: string }>({
  table, title, columns, fields, searchKeys = [], select = "*", orderBy = "created_at", ascending = false, defaults = {},
}: {
  table: string; title: string;
  columns: CrudColumn<T>[]; fields: CrudField[]; searchKeys?: string[];
  select?: string; orderBy?: string; ascending?: boolean; defaults?: Record<string, any>;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<T | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  const q = useQuery({
    queryKey: [table, "list"],
    queryFn: async () => {
      const { data, error } = await supabase.from(table as any).select(select).order(orderBy, { ascending });
      if (error) throw error;
      return (data ?? []) as unknown as T[];
    },
  });

  const upsertM = useMutation({
    mutationFn: async () => {
      const payload = { ...defaults, ...form };
      if (editing) {
        const { error } = await supabase.from(table as any).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: [table] }); setOpen(false); setEditing(null); setForm({}); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from(table as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: [table] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const openCreate = () => { setEditing(null); setForm({}); setOpen(true); };
  const openEdit = (row: T) => {
    setEditing(row);
    const init: Record<string, any> = {};
    fields.forEach((f) => { init[f.key] = (row as any)[f.key] ?? ""; });
    setForm(init); setOpen(true);
  };

  const filtered = q.data?.filter((r) => !search || searchKeys.some((k) => String((r as any)[k] ?? "").toLowerCase().includes(search.toLowerCase()))) ?? [];

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gradient-primary text-primary-foreground shadow-soft"><Plus className="mr-1 h-4 w-4" />New</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-auto">
            <DialogHeader><DialogTitle>{editing ? `Edit ${title}` : `New ${title}`}</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              {fields.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-sm font-medium">{f.label}{f.required && " *"}</label>
                  {f.type === "textarea" ? (
                    <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3}
                      value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} required={f.required} />
                  ) : f.type === "select" ? (
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} required={f.required}>
                      <option value="">— select —</option>
                      {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === "checkbox" ? (
                    <input type="checkbox" checked={!!form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} />
                  ) : (
                    <Input type={f.type ?? "text"} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })} required={f.required} min={f.min} max={f.max} />
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => upsertM.mutate()} disabled={upsertM.isPending} className="gradient-primary text-primary-foreground shadow-soft">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {q.isLoading ? <Skeleton className="h-40 w-full" /> : filtered.length === 0 ? (
        <EmptyState title="No records" description={`No ${title.toLowerCase()} yet.`} />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => <TableHead key={c.key}>{c.label}</TableHead>)}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  {columns.map((c) => <TableCell key={c.key}>{c.render ? c.render(r) : String((r as any)[c.key] ?? "—")}</TableCell>)}
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this record?")) deleteM.mutate(r.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
