// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/services")({
  head: () => ({ meta: [{ title: "Jenis Layanan — Admin" }] }),
  component: ServicesAdmin,
});

function ServicesAdmin() {
  return (
    <AdminDashboardShell
      title="Manajemen Jenis Layanan"
      description="Kelola daftar layanan dan tarif dasar."
    >
      <CrudTable<any>
        table="services"
        title="Jenis Layanan"
        searchKeys={["service_name"]}
        columns={[
          { key: "service_name", label: "Nama Layanan" },
          {
            key: "base_price",
            label: "Tarif Dasar",
            render: (r) => {
              // Menambahkan format titik ribuan tanpa merusak/mengubah tipe data aslinya di DB
              return `Rp ${Number(r.base_price).toLocaleString("id-ID")}`;
            },
          },
          {
            key: "status",
            label: "Status",
            render: (r) => {
              const variant = r.status === "Tersedia" ? "default" : "destructive";
              return <Badge variant={variant as any}>{r.status}</Badge>;
            },
          },
        ]}
        fields={[
          {
            key: "service_name",
            label: "Nama Layanan",
            type: "select",
            required: true,
            options: [
              {
                value: "Facial Cleansing / Deep Cleansing",
                label: "Facial Cleansing / Deep Cleansing",
              },
              { value: "Facial Acne", label: "Facial Acne" },
              { value: "Facial Brightening / Whitening", label: "Facial Brightening / Whitening" },
              { value: "Chemical Peeling", label: "Chemical Peeling" },
              { value: "Mikrodermabrasi", label: "Mikrodermabrasi" },
              { value: "Dermapen / Microneedling", label: "Dermapen / Microneedling" },
              { value: "Intense Pulsed Light (IPL)", label: "Intense Pulsed Light (IPL)" },
              { value: "Nd:YAG Laser / Picosure", label: "Nd:YAG Laser / Picosure" },
              { value: "Fractional CO2 Laser", label: "Fractional CO2 Laser" },
              { value: "Botox (Botulinum Toxin)", label: "Botox (Botulinum Toxin)" },
              { value: "Dermal Fillers", label: "Dermal Fillers" },
              {
                value: "Skin Booster (Profhilo, Salmon DNA, dll)",
                label: "Skin Booster (Profhilo, Salmon DNA, dll)",
              },
              { value: "Thread Lift (Tanam Benang)", label: "Thread Lift (Tanam Benang)" },
              { value: "Cryolipolysis (CoolSculpting)", label: "Cryolipolysis (CoolSculpting)" },
              { value: "Radio Frequency (RF)", label: "Radio Frequency (RF)" },
              { value: "Meso Lipo", label: "Meso Lipo" },
              {
                value: "PRP (Platelet-Rich Plasma / Vampire Facial)",
                label: "PRP (Platelet-Rich Plasma / Vampire Facial)",
              },
              { value: "Infus Whitening / Vitamin C", label: "Infus Whitening / Vitamin C" },
            ],
          },
          { key: "base_price", label: "Tarif (Hanya Angka)", defaultValue: 0 } as any,
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "Tersedia", label: "Tersedia" },
              { value: "Tidak Tersedia", label: "Tidak Tersedia" },
            ],
          },
        ]}
      />
    </AdminDashboardShell>
  );
}
