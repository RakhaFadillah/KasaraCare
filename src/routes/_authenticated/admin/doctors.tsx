// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/doctors")({
  head: () => ({ meta: [{ title: "Dokter & Terapis — Admin" }] }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      filter: search.filter as string | undefined,
    };
  },
  component: DoctorsAdmin,
});

function DoctorsAdmin() {
  const { filter } = Route.useSearch();

  return (
    <AdminDashboardShell
      title="Manajemen Dokter & Terapis"
      description="Kelola data tenaga medis, dokter estetika, dan terapis kecantikan di klinik."
    >
      <CrudTable<any>
        table="doctors"
        title={filter ? `Pencarian: ${filter}` : "Semua Dokter & Terapis"}
        defaultSearch={filter || ""}
        searchKeys={["nama_lengkap", "spesialisasi", "nomor_hp"]}

        // ==========================================
        // 1. TAMPILAN KOLOM DI TABEL LUAR
        // ==========================================
        columns={[
          { key: "nama_lengkap", label: "Nama Lengkap" },
          { key: "spesialisasi", label: "Posisi / Spesialisasi" },
          { key: "nomor_hp", label: "Nomor HP" },
          {
            key: "status",
            label: "Status",
            render: (r) => (
              <Badge
                variant={
                  r.status === "Aktif"
                    ? "default"
                    : r.status === "Cuti"
                      ? "secondary"
                      : "destructive"
                }
              >
                {r.status || "Aktif"}
              </Badge>
            ),
          },
        ]}

        // ==========================================
        // 2. ISIAN FORM SAAT TOMBOL "NEW" DIKLIK
        // ==========================================
        fields={[
          { key: "nama_lengkap", label: "Nama Lengkap (beserta gelar)", required: true },
          {
            key: "spesialisasi",
            label: "Posisi / Spesialisasi",
            type: "select",
            required: true,
            options: [
              {
                value: "Dokter Spesialis Kulit (Sp.KK / Sp.DVE)",
                label: "Dokter Spesialis Kulit (Sp.KK / Sp.DVE)",
              },
              { value: "Dokter Estetika", label: "Dokter Estetika" },
              { value: "Perawat Estetika", label: "Perawat Estetika" },
              {
                value: "Terapis Kecantikan (Beautician)",
                label: "Terapis Kecantikan (Beautician)",
              },
            ],
          },
          { key: "nomor_hp", label: "Nomor HP / WhatsApp", required: true },
          {
            key: "status",
            label: "Status Pegawai",
            type: "select",
            options: [
              { value: "Aktif", label: "Aktif" },
              { value: "Cuti", label: "Cuti" },
              { value: "Nonaktif / Resign", label: "Nonaktif / Resign" },
            ],
          },
        ]}
      />
    </AdminDashboardShell>
  );
}
