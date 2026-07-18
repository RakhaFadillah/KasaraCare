import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, icon, hint, className }: {
  label: string; value: ReactNode; icon?: ReactNode; hint?: string; className?: string;
}) {
  return (
    // Kita tambahkan logic untuk mengubah warna teks jika className berisi bg-[#00a3e0]
    <div className={cn("glass-card rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-elegant", className)}>
      <div className="flex items-center justify-between">
        {/* Menggunakan "current" agar warna teks mengikuti warna container */}
        <p className="text-sm font-medium opacity-80">{label}</p>
        
        {/* Ikon dibuat menjadi putih agar kontras dengan latar biru */}
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white">
            {icon}
          </div>
        )}
      </div>
      
      <p className="mt-3 font-display text-3xl font-bold tracking-tight">{value}</p>
      
      {hint && <p className="mt-1 text-xs opacity-70">{hint}</p>}
    </div>
  );
}