import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { HeartPulse, CalendarClock, ListOrdered, FileHeart, Shield, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-soft">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-lg font-bold leading-none">MediCare</p>
            <p className="text-[11px] text-muted-foreground">Hospital System</p>
          </div>
        </div>
        <Link to="/auth" className="inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90">
          Sign in <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-10 md:pt-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" /> Digital Patient Portal
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Care that feels <span className="bg-clip-text text-transparent gradient-hero">effortless</span>.
            </h1>
            <p className="mt-4 max-w-lg text-base text-muted-foreground md:text-lg">
              Register visits, track your queue in realtime, review medical history, and browse our specialists — all in one calm, modern portal.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" className="inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:-translate-y-0.5">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/doctors" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold shadow-soft transition hover:bg-muted">
                Browse doctors
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: CalendarClock, label: "Online Registration", desc: "Book in seconds" },
                { icon: ListOrdered, label: "Live Queue", desc: "No more waiting rooms" },
                { icon: FileHeart, label: "Medical Records", desc: "Always at your fingertips" },
                { icon: Shield, label: "Private & Secure", desc: "Encrypted end-to-end" },
              ].map((f) => (
                <div key={f.label} className="glass-card rounded-2xl p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 font-display font-semibold">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MediCare Hospital · A modern Hospital Information System
      </footer>
    </div>
  );
}
