import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  className,
}: StatCardProps) {
  const isPrimary = className?.includes("bg-[#00a3e0]");

  return (
    <div
      className={cn(
        "rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1",
        isPrimary
          ? "bg-[#00a3e0] text-white shadow-xl shadow-cyan-500/25"
          : "glass-card text-slate-900",
        className
      )}
    >
      <div className="flex items-start justify-between">

        <div>
          <p
            className={cn(
              "text-sm font-semibold",
              isPrimary
                ? "text-white/85"
                : "text-slate-500"
            )}
          >
            {label}
          </p>

          <h2
            className={cn(
              "mt-3 text-4xl font-bold tracking-tight",
              isPrimary ? "text-white" : "text-slate-900"
            )}
          >
            {value}
          </h2>

          {hint && (
            <p
              className={cn(
                "mt-2 text-xs",
                isPrimary
                  ? "text-white/75"
                  : "text-slate-500"
              )}
            >
              {hint}
            </p>
          )}
        </div>

        {icon && (
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              isPrimary
                ? "bg-white/20 text-white"
                : "bg-sky-100 text-sky-600"
            )}
          >
            {icon}
          </div>
        )}

      </div>
    </div>
  );
}