// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/patients")({
  head: () => ({ meta: [{ title: "Pasien — Admin" }] }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      filter: search.filter as string | undefined,
    };
  },
  component: PatientsAdmin,
});

function PatientsAdmin() {
  const { filter } = Route.useSearch();

  // State untuk menampung data treatment dari database
  const [treatmentOptions, setTreatmentOptions] = useState([]);
  // State penahan form agar menunggu data selesai ditarik
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadTreatments = async () => {
      // Tarik data dari tabel Jenis Layanan (services)
      const { data } = await supabase.from("services").select("service_name, status");

      if (data) {
        // Saring hanya yang tersedia/aktif
        const layananTersedia = data.filter((x) => x.status === "Tersedia" || x.status === "Aktif");
        // Ubah format untuk dropdown form
        setTreatmentOptions(
          layananTersedia.map((x) => ({
            label: x.service_name,
            value: x.service_name,
          })),
        );
      }

      // Buka gembok render tabel
      setIsReady(true);
    };

    loadTreatments();
  }, []);

  return (
    <AdminDashboardShell
      title="Manajemen Pasien"
      description="Kelola data pendaftaran pasien dan jenis treatment."
    >
      {!isReady ? (
        <div className="w-full flex flex-col items-center justify-center py-20 bg-white dark:bg-[#151722] rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
          <p className="text-slate-500">Menyinkronkan data layanan...</p>
        </div>
      ) : (
        <CrudTable<any>
          table="patients"
          title={filter ? `Data Pasien: ${filter}` : "Semua Pasien"}
          defaultSearch={filter || ""}
          searchKeys={["nama", "nomor_hp", "jenis_treatment"]}
          columns={[
            { key: "nama", label: "Nama Pasien" },
            { key: "umur", label: "Umur" },
            { key: "jenis_kelamin", label: "L/P" },
            { key: "berat_badan", label: "BB (kg)" },
            { key: "tinggi_badan", label: "TB (cm)" },
            { key: "nomor_hp", label: "Nomor HP" },
            { key: "jenis_treatment", label: "Jenis Treatment" },
          ]}
          fields={[
            { key: "nama", label: "Nama Lengkap", required: true },
            { key: "umur", label: "Umur (Tahun)", type: "number", required: true },
            {
              key: "jenis_kelamin",
              label: "Jenis Kelamin",
              type: "select",
              options: [
                { value: "Laki-laki", label: "Laki-laki" },
                { value: "Perempuan", label: "Perempuan" },
              ],
            },
            { key: "berat_badan", label: "Berat Badan (kg)", type: "number" },
            { key: "tinggi_badan", label: "Tinggi Badan (cm)", type: "number" },
            { key: "nomor_hp", label: "Nomor HP (Wajib format @c.us)", required: true },
            {
              key: "jenis_treatment",
              label: "Jenis Treatment (Hanya yang Tersedia)",
              type: "select",
              required: true,
              // Data otomatis mengambil dari State yang ditarik dari Database
              options: treatmentOptions,
            },
          ]}
        />
      )}
    </AdminDashboardShell>
  );
}
