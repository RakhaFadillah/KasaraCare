// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { Badge } from "@/components/ui/badge";

// 1. Menambahkan "validateSearch" agar halaman ini siap menerima parameter URL '?filter=...'
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
  // 2. Menangkap isi filter (misal: "BPJS" atau "Non BPJS") dari URL Dashboard
  const { filter } = Route.useSearch();

  return (
    <AdminDashboardShell title="Manajemen Pasien" description="Kelola data pendaftaran pasien, layanan medis, dan status rawat inap.">
      <CrudTable<any>
        table="patients"
        title={filter ? `Data Pasien: ${filter}` : "Semua Pasien"}
        
        // 3. Mengirimkan filter bawaan ke tabel pencarian Anda
        // CATATAN: Pastikan komponen CrudTable Anda mendukung props ini (seperti defaultSearch, initialSearch, atau globalFilter)
        defaultSearch={filter || ""} 
        
        searchKeys={["nama", "nomor_hp", "golongan", "kamar"]}
        columns={[
          { key: "nama", label: "Nama Pasien" },
          { key: "umur", label: "Umur" },
          { key: "jenis_kelamin", label: "L/P" },
          { key: "poli", label: "Poli" },
          { key: "jenis_layanan", label: "Layanan" },
          {
            key: "golongan",
            label: "Golongan",
            render: (r) => (
              <Badge variant={r.golongan === "BPJS" ? "default" : "secondary"}>
                {r.golongan}
              </Badge>
            ),
          },
          { key: "kamar", label: "Kamar" },
          { key: "tanggal_masuk", label: "Tgl Masuk" },
          {
            key: "tanggal_keluar",
            label: "Tgl Keluar",
            render: (r) => r.tanggal_keluar ? r.tanggal_keluar : <Badge variant="outline">Belum ditentukan</Badge>,
          },
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
          { key: "nomor_hp", label: "Nomor HP (Wajib format @c.us)", required: true },
          {
            key: "poli",
            label: "Poli",
            type: "select",
            options: [
              { value: "Poli Umum", label: "Poli Umum" },
              { value: "Poli Gigi", label: "Poli Gigi" },
              { value: "Poli Anak", label: "Poli Anak" },
              { value: "Poli Penyakit Dalam", label: "Poli Penyakit Dalam" },
              { value: "Poli Bedah", label: "Poli Bedah" },
              { value: "Poli Kandungan", label: "Poli Kandungan" },
              { value: "IGD", label: "IGD" },
            ],
          },
          {
            key: "jenis_layanan",
            label: "Jenis Layanan",
            type: "select",
            options: [
              { value: "Konsultasi Dokter Umum", label: "Konsultasi Dokter Umum" },
              { value: "Konsultasi Dokter Spesialis", label: "Konsultasi Dokter Spesialis" },
              { value: "Pemeriksaan UGD", label: "Pemeriksaan UGD" },
              { value: "Rawat Inap Kelas 1", label: "Rawat Inap Kelas 1" },
              { value: "Rawat Inap Kelas 2", label: "Rawat Inap Kelas 2" },
              { value: "Rawat Inap Kelas 3", label: "Rawat Inap Kelas 3" },
              { value: "Rawat Inap VIP", label: "Rawat Inap VIP" },
              { value: "Operasi Kecil", label: "Operasi Kecil" },
              { value: "Operasi Sedang", label: "Operasi Sedang" },
            ],
          },
          {
            key: "golongan",
            label: "Golongan",
            type: "select",
            options: [
              { value: "BPJS", label: "BPJS" },
              { value: "Non BPJS", label: "Non BPJS" },
            ],
          },
          { key: "kamar", label: "Kamar (Kosongkan jika bukan Rawat Inap)" },
          { key: "tanggal_masuk", label: "Tanggal Masuk", type: "date", required: true },
          { key: "tanggal_keluar", label: "Tanggal Keluar (Kosongkan jika belum keluar)", type: "date" },
        ]}
      />
    </AdminDashboardShell>
  );
}