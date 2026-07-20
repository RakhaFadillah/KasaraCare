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
    onSuccess: () => { toast.success("Tersimpan"); qc.invalidateQueries({ queryKey: [table] }); setOpen(false); setEditing(null); setForm({}); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal menyimpan data"),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from(table as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Dihapus"); qc.invalidateQueries({ queryKey: [table] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal menghapus data"),
  });

  const openCreate = () => { setEditing(null); setForm({}); setOpen(true); };
  const openEdit = (row: T) => {
    setEditing(row);
    const init: Record<string, any> = {};
    fields.forEach((f) => { init[f.key] = (row as any)[f.key] ?? ""; });
    setForm(init); setOpen(true);
  };

  const filtered = q.data?.filter((r) => !search || searchKeys.some((k) => {
    // Penanganan khusus untuk search relasi bersarang (misal "clinics.name")
    const keys = k.split(".");
    let val: any = r;
    for (const key of keys) {
      val = val?.[key];
    }
    return String(val ?? "").toLowerCase().includes(search.toLowerCase());
  })) ?? [];

  return (
    // PERBAIKAN 1: Gaya Kotak Utama Kravio Style (Mendukung Dark Mode)
    <div className="bg-white dark:bg-[#1a1d27] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
      
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Input 
          placeholder="Search…" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="max-w-xs dark:bg-[#151722] dark:border-slate-700 dark:text-white transition-colors" 
        />
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm dark:shadow-blue-900/20 transition-all">
              <Plus className="mr-1 h-4 w-4" /> New
            </Button>
          </DialogTrigger>
          
          {/* PERBAIKAN 2: Pop-up Form mendukung Dark Mode */}
          <DialogContent className="max-h-[90vh] overflow-auto dark:bg-[#1a1d27] dark:border-slate-800 transition-colors duration-300">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">
                {editing ? `Edit ${title}` : `New ${title}`}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-3">
              {fields.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                    {f.label}{f.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {f.type === "textarea" ? (
                    <textarea 
                      className="w-full rounded-lg border border-input dark:border-slate-700 bg-background dark:bg-[#151722] px-3 py-2 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors" 
                      rows={3}
                      value={form[f.key] ?? ""} 
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} 
                      required={f.required} 
                    />
                  ) : f.type === "select" ? (
                    <select 
                      className="w-full rounded-lg border border-input dark:border-slate-700 bg-background dark:bg-[#151722] px-3 py-2 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                      value={form[f.key] ?? ""} 
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} 
                      required={f.required}
                    >
                      <option value="" className="dark:bg-[#1a1d27]">— select —</option>
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value} className="dark:bg-[#1a1d27]">
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "checkbox" ? (
                    <input 
                      type="checkbox" 
                      checked={!!form[f.key]} 
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  ) : (
                    <Input 
                      type={f.type ?? "text"} 
                      value={form[f.key] ?? ""} 
                      onChange={(e) => setForm({ ...form, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })} 
                      required={f.required} 
                      min={f.min} 
                      max={f.max} 
                      className="dark:bg-[#151722] dark:border-slate-700 dark:text-white transition-colors"
                    />
                  )}
                </div>
              ))}
            </div>
            
            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setOpen(false)} className="dark:bg-transparent dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Cancel
              </Button>
              <Button onClick={() => upsertM.mutate()} disabled={upsertM.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                {upsertM.isPending ? "Menyimpan..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* PERBAIKAN 3: Area Tabel */}
      <div className="text-slate-800 dark:text-slate-200">
        {q.isLoading ? (
          <Skeleton className="h-40 w-full dark:bg-slate-800/50" />
        ) : filtered.length === 0 ? (
          <EmptyState title="Belum ada data" description={`Tidak ada data ${title.toLowerCase()} untuk ditampilkan.`} />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800/60">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/30">
                <TableRow className="dark:border-slate-800/60 hover:bg-transparent">
                  {columns.map((c) => (
                    <TableHead key={c.key} className="font-semibold text-slate-600 dark:text-slate-400">
                      {c.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-right font-semibold text-slate-600 dark:text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((r) => (
                  <TableRow key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-transparent">
                    {columns.map((c) => (
                      <TableCell key={c.key} className="py-3">
                        {c.render ? c.render(r) : String((r as any)[c.key] ?? "—")}
                      </TableCell>
                    ))}
                    <TableCell className="text-right py-3">
                      <div className="flex justify-end gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => openEdit(r)}
                          className="h-8 w-8 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 dark:hover:bg-blue-900/20"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => { if (confirm("Yakin ingin menghapus data ini?")) deleteM.mutate(r.id); }}
                          className="h-8 w-8 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}