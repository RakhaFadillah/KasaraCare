import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/rooms")({
  head: () => ({ meta: [{ title: "Kamar — Admin" }] }),
  component: RoomsAdmin,
});

function RoomsAdmin() { // Karakter "=" sudah dihapus dari sini
  return (
    <AdminDashboardShell title="Manajemen Kamar" description="Kelola data ruangan, kapasitas, dan jumlah kasur terisi.">
      <CrudTable<any>
        table="rooms" 
        title="Kamar" 
        searchKeys={["room_number", "room_type", "status"]}
        columns={[
          { key: "room_number", label: "Nomor Kamar" },
          { key: "room_type", label: "Kelas" },
          { key: "capacity", label: "Kapasitas Kasur" },
          { key: "occupied_beds", label: "Terisi (Orang)" },
          { 
            key: "status", 
            label: "Status", 
            render: (r) => {
              const variant = r.status === "Kosong" ? "default" : 
                              r.status === "Penuh" ? "destructive" : 
                              r.status === "Terisi Sebagian" ? "secondary" : "outline";
              return <Badge variant={variant as any}>{r.status}</Badge>;
            } 
          },
        ]}
        fields={[
          { key: "room_number", label: "Nomor Kamar", required: true },
          { 
            key: "room_type", 
            label: "Kelas", 
            type: "select", 
            options: [
              { value: "Kelas 1", label: "Kelas 1" },
              { value: "Kelas 2", label: "Kelas 2" },
              { value: "Kelas 3", label: "Kelas 3" },
            ] 
          },
          { key: "capacity", label: "Total Kasur", defaultValue: 4 } as any,
          { key: "occupied_beds", label: "Kasur Terisi", defaultValue: 0 } as any,
          { 
            key: "status", 
            label: "Status", 
            type: "select", 
            options: [
              { value: "Kosong", label: "Kosong" }, 
              { value: "Terisi Sebagian", label: "Terisi Sebagian" }, 
              { value: "Penuh", label: "Penuh" },
              { value: "Perbaikan", label: "Perbaikan" }
            ] 
          },
        ]}
      />
    </AdminDashboardShell>
  );
}