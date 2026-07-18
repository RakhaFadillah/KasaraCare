import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, icon, hint, className }: {
  label: string; value: ReactNode; icon?: ReactNode; hint?: string; className?: string;
}) {
  // Mengecek apakah kartu menggunakan warna biru
  const isBlue = className?.includes("bg-[#00a3e0]");

  return (
    <div className={cn(
      "glass-card rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-elegant",
      isBlue ? "text-white" : "text-slate-900", // Jika biru, teks putih. Jika putih, teks hitam.
      className
    )}>
      <div className="flex items-center justify-between">
        <p className={cn("text-sm font-medium", isBlue ? "text-white/80" : "text-muted-foreground")}>
          {label}
        </p>
        
        {icon && (
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            isBlue ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
          )}>
            {icon}
          </div>
        )}
      </div>
      
      <p className="mt-3 font-display text-3xl font-bold tracking-tight">
        {value}
      </p>
      
      {hint && (
        <p className={cn("mt-1 text-xs", isBlue ? "text-white/70" : "text-muted-foreground")}>
          {hint}
        </p>
      )}
    </div>
  );
}