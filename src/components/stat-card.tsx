import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, icon, hint, className }: {
  label: string; value: ReactNode; icon?: ReactNode; hint?: string; className?: string;
}) {
  return (
    <div className={cn("glass-card rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-elegant", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>}
      </div>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
