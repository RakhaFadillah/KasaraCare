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
    // PERBAIKAN: Background menggunakan efek linear-gradient dari biru muda ke putih transparan
    <div 
      className="min-h-screen" 
      style={{ 
        background: 'linear-gradient(135deg, #dbeafe 0%, #f0f9ff 40%, #ffffff 100%)' 
      }}
    >
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          {/* Ikon Header Bulat Biru Solid */}
          <div 
            className="grid h-10 w-10 place-items-center rounded-full shadow-md"
            style={{ backgroundColor: '#00a2ed', color: 'white' }}
          >
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
            <Button style={{ backgroundColor: '#00a2ed', color: 'white' }}>Daftar</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-10 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            {/* Badge BPJS */}
            <div 
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
              style={{ 
                backgroundColor: 'rgba(0, 162, 237, 0.1)', 
                borderColor: 'rgba(0, 162, 237, 0.2)', 
                color: '#00a2ed' 
              }}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Terintegrasi BPJS & Asuransi
            </div>
            
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Pendaftaran & Antrean{" "}
              <span style={{ color: '#00a2ed' }}>
                Rumah Sakit
              </span>{" "}
              dalam Genggaman
            </h1>
            
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Daftar poliklinik, pantau nomor antrean secara realtime, dan akses riwayat medis Anda kapan saja.
            </p>
            
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button 
                  size="lg" 
                  className="shadow-lg transition-transform hover:scale-105"
                  style={{ 
                    backgroundColor: '#00a2ed', 
                    color: 'white',
                    boxShadow: '0 10px 15px -3px rgba(0, 162, 237, 0.3)' 
                  }}
                >
                  Mulai Sekarang <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="bg-white/80 backdrop-blur-sm">
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
                className="rounded-2xl p-5 transition-all hover:-translate-y-1 shadow-sm hover:shadow-lg border border-white/50"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)' }}
              >
                <div 
                  className="grid h-10 w-10 place-items-center rounded-xl shadow-sm"
                  style={{ backgroundColor: '#00a2ed', color: 'white' }}
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="mt-3 font-semibold">{f.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-black/5 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} RS Sehat Sentosa. Seluruh hak cipta dilindungi.
      </footer>
    </div>
  );
}