import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { HeartPulse, Calendar, Clock, Users, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate({ to: "/dashboard" });
    }
  }, [session, navigate]);

  return (
    // Background biru super muda khas medis
    <div className="min-h-screen bg-[#f4f9fd]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          {/* Ikon Header Bulat Biru Solid */}
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#00a2ed] text-white shadow-md">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold">RS Sehat Sentosa</div>
            <div className="text-[11px] text-muted-foreground">Pelayanan Kesehatan Terpadu</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost">Masuk</Button>
          </Link>
          <Link to="/auth" search={{ mode: "signup" }}>
            {/* Tombol Biru Solid */}
            <Button className="bg-[#00a2ed] hover:bg-[#0089c9] text-white">Daftar</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-10 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            {/* Badge BPJS dengan outline dan text biru */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00a2ed]/20 bg-[#00a2ed]/10 px-3 py-1 text-xs font-medium text-[#00a2ed]">
              <ShieldCheck className="h-3.5 w-3.5" /> Terintegrasi BPJS & Asuransi
            </div>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Pendaftaran & Antrean{" "}
              {/* Teks Biru Solid, BUKAN Gradient */}
              <span className="text-[#00a2ed]">
                Rumah Sakit
              </span>{" "}
              dalam Genggaman
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Daftar poliklinik, pantau nomor antrean secara realtime, dan akses riwayat medis Anda kapan saja.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" search={{ mode: "signup" }}>
                {/* Tombol Utama Biru Solid */}
                <Button size="lg" className="bg-[#00a2ed] hover:bg-[#0089c9] text-white shadow-lg shadow-[#00a2ed]/30">
                  Mulai Sekarang <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="bg-white hover:bg-slate-50">
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
                className="bg-white rounded-2xl p-5 transition hover:-translate-y-0.5 shadow-sm hover:shadow-md border border-slate-100"
              >
                {/* Ikon Card Biru Solid dengan Ikon Putih di dalamnya */}
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#00a2ed] text-white">
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