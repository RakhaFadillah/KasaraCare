import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { HeartPulse, Calendar, Clock, Users, ShieldCheck, ArrowRight } from "lucide-react";

// 1. PERBAIKAN: Gunakan use-auth.ts yang memang ADA di folder Anda
import { useAuth } from "../hooks/use-auth"; 
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  // 2. PERBAIKAN: Gunakan useAuth bawaan template
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Jika sudah login, langsung lempar ke dashboard
    if (session) {
      navigate({ to: "/dashboard" });
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen gradient-hero">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl gradient-medical text-primary-foreground shadow-glow">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            {/* 3. PERBAIKAN: Tulis langsung nama RS di sini karena file hospital.ts tidak ada */}
            <div className="text-sm font-bold">RS Sehat Sentosa</div>
            <div className="text-[11px] text-muted-foreground">Pelayanan Kesehatan Terpadu</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost">Masuk</Button>
          </Link>
          <Link to="/auth" search={{ mode: "signup" }}>
            <Button className="gradient-medical text-primary-foreground">Daftar</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-10 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Terintegrasi BPJS & Asuransi
            </div>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Pendaftaran & Antrean{" "}
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Rumah Sakit
              </span>{" "}
              dalam Genggaman
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Daftar poliklinik, pantau nomor antrean secara realtime, dan akses riwayat medis Anda kapan saja.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" className="gradient-medical text-primary-foreground shadow-glow">
                  Mulai Sekarang <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline">
                  Masuk Akun
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Calendar, title: "Pendaftaran Online", desc: "Pilih poli, dokter, dan jadwal dalam hitungan detik." },
              { icon: Clock, title: "Antrean Realtime", desc: "Estimasi waktu tunggu diperbarui otomatis." },
              { icon: Users, title: "Direktori Dokter", desc: "Cari spesialis dan lihat jadwal praktiknya." },
              { icon: HeartPulse, title: "Riwayat Medis", desc: "Diagnosis, resep, dan hasil lab dalam satu tempat." },
            ].map((f) => (
              <div
                key={f.title}
                className="glass-card rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-glow"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg gradient-medical text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="mt-3 font-semibold">{f.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} RS Sehat Sentosa. Seluruh hak cipta dilindungi.
      </footer>
    </div>
  );
}