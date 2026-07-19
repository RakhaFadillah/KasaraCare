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
    <AdminDashboardShell title="Manajemen Jenis Layanan" description="Kelola daftar layanan medis, kategori, dan tarif dasar rumah sakit.">
      <CrudTable<any>
        table="services" 
        title="Jenis Layanan" 
        searchKeys={["service_name", "category"]}
        columns={[
          { key: "service_name", label: "Nama Layanan" },
          { key: "category", label: "Kategori" },
          { 
            key: "base_price", 
            label: "Tarif Dasar",
            render: (r) => {
              // Menambahkan format titik ribuan tanpa merusak/mengubah tipe data aslinya di DB
              return `Rp ${Number(r.base_price).toLocaleString("id-ID")}`;
            }
          },
          { 
            key: "status", 
            label: "Status", 
            render: (r) => {
              const variant = r.status === "Tersedia" ? "default" : "destructive";
              return <Badge variant={variant as any}>{r.status}</Badge>;
            } 
          },
        ]}
        fields={[
          { key: "service_name", label: "Nama Layanan", required: true },
          { 
            key: "category", 
            label: "Kategori", 
            type: "select", 
            options: [
              { value: "Konsultasi", label: "Konsultasi" },
              { value: "Gawat Darurat", label: "Gawat Darurat" },
              { value: "Rawat Inap", label: "Rawat Inap" },
              { value: "Laboratorium", label: "Laboratorium" },
              { value: "Radiologi", label: "Radiologi" },
              { value: "Diagnostik", label: "Diagnostik" },
              { value: "Bedah", label: "Bedah" },
              { value: "Tindakan", label: "Tindakan" },
              { value: "Vaksinasi", label: "Vaksinasi" },
              { value: "Transportasi", label: "Transportasi" },
              { value: "Paket", label: "Paket" },
            ] 
          },
          { key: "base_price", label: "Tarif (Hanya Angka)", defaultValue: 0 } as any,
          { 
            key: "status", 
            label: "Status", 
            type: "select", 
            options: [
              { value: "Tersedia", label: "Tersedia" }, 
              { value: "Tidak Tersedia", label: "Tidak Tersedia" }
            ] 
          },
        ]}
      />
    </AdminDashboardShell>
  );
}