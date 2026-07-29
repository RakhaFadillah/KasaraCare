import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Users,
  ShieldCheck,
  ArrowRight,
  BedDouble,
  ClipboardPlus,
  PieChart,
  Layers,
} from "lucide-react";
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
      //Arahkan langsung ke dashboard admin
      navigate({ to: "/admin" });
    }
  }, [session, navigate]);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, #dbeafe 0%, #f0f9ff 40%, #ffffff 100%)",
      }}
    >
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          {/* LOGO KASARA */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-md bg-[#00a2ed]">
            <img src="/Kasara.png" alt="KasaraCare Logo" className="h-full w-full object-cover" />
          </div>

          <div>
            <div className="text-sm font-bold text-slate-900 tracking-tight">KasaraCare</div>
            <div className="text-[11px] font-medium text-slate-500">Pusat Kendali Operasional</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost" className="font-semibold text-slate-600 hover:text-[#00a2ed]">
              Masuk Admin
            </Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-10 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            {/* Badge Status */}
            <div
              className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide"
              style={{
                backgroundColor: "rgba(0, 162, 237, 0.1)",
                borderColor: "rgba(0, 162, 237, 0.2)",
                color: "#00a2ed",
              }}
            >
              <ShieldCheck className="h-4 w-4" /> Sistem Manajemen Terpadu
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.15] md:text-[54px] text-slate-900 tracking-tight">
              Pusat Kendali <br />
              <span style={{ color: "#00a2ed" }}>Operasional Klinik</span> <br />
            </h1>

            <p className="mt-6 max-w-lg text-lg text-slate-600 leading-relaxed font-medium">
              Kelola jadwal reservasi, data pasien, manajemen dokter/terapis dalam satu platform
              yang terintegrasi.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/auth">
                <Button
                  size="lg"
                  className="shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-[#00a2ed]/30 h-12 px-6 rounded-xl font-bold"
                  style={{
                    backgroundColor: "#00a2ed",
                    color: "white",
                  }}
                >
                  Masuk ke Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* 4 FITUR UTAMA ADMIN */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Users,
                title: "Manajemen Pasien & Dokter",
                desc: "Kelola rekam medis pasien dan jadwal praktik dokter harian.",
              },
              {
                icon: ClipboardPlus,
                title: "Jadwal Reservasi",
                desc: "Atur jadwal reservasi akurat & pantau status pelaksanaannya.",
              },
              {
                icon: Layers,
                title: "Jenis Treatment",
                desc: "Kelola berbagai layanan yang tersedia di klinik.",
              },
              {
                icon: PieChart,
                title: "Analitik Interaktif",
                desc: "Insight operasional dari grafik dinamis kunjungan.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 border border-white/60"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.75)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div
                  className="grid h-11 w-11 place-items-center rounded-xl shadow-sm mb-4"
                  style={{ backgroundColor: "#00a2ed", color: "white" }}
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="font-bold text-slate-900 text-base">{f.title}</div>
                <div className="mt-2 text-sm text-slate-500 leading-relaxed font-medium">
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200/60 py-8 text-center text-xs text-slate-500 font-semibold tracking-wide">
        © {new Date().getFullYear()} Refasya Rakha Fadillah. Seluruh hak cipta dilindungi.
      </footer>
    </div>
  );
}
