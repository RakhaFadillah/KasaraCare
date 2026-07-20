// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { BedDouble, ChevronUp, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/rooms")({
  head: () => ({ meta: [{ title: "Bed Management" }] }),
  component: BedManagement,
});

function BedManagement() {
  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*").order("room_number");
      if (error) throw new Error("Gagal memuat data kamar");
      return data;
    }
  });

  // Kalkulasi Data Global
  const totalBeds = rooms.reduce((acc, room) => acc + (room.capacity || 0), 0);
  const occupiedBeds = rooms.reduce((acc, room) => acc + (room.occupied_beds || 0), 0);
  const availableBeds = totalBeds - occupiedBeds;
  const maintenanceRooms = rooms.filter(r => r.status === "Perbaikan").length;

  return (
    <AdminDashboardShell title="" description="">
      {/* BACKGROUND DARK MODE KHUSUS DASHBOARD INI */}
      <div className="bg-[#0b0c10] min-h-screen p-6 -mt-6 -mx-6 text-gray-200 font-sans rounded-xl">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Bed Management</h1>
          <p className="text-sm text-gray-500">Monitor and manage bed availability</p>
        </div>

        {/* ========================================== */}
        {/* BAGIAN 1: SUMMARY CARDS TOP                  */}
        {/* ========================================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard title="Total Beds" value={totalBeds} valueColor="text-white" />
          <SummaryCard title="Occupied" value={occupiedBeds} valueColor="text-yellow-500" />
          <SummaryCard title="Available" value={availableBeds} valueColor="text-green-500" />
          <SummaryCard title="Maintenance" value={maintenanceRooms} valueColor="text-red-500" />
        </div>

        {/* ========================================== */}
        {/* BAGIAN 2: ROOM GRID CARDS (VISUAL PER KAMAR) */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative">
          {rooms.map((room) => {
            const capacity = room.capacity || 0;
            const occupied = room.occupied_beds || 0;
            const maintenance = room.status === "Perbaikan" ? capacity : 0; 
            const available = capacity - occupied - maintenance;
            
            const occupancyRate = capacity > 0 ? (occupied / capacity) * 100 : 0;
            // Warna bar sesuai screenshot: Kuning/Orange jika banyak terisi, Hijau jika kosong
            const barColor = occupancyRate >= 80 ? "bg-orange-500" : occupancyRate >= 50 ? "bg-yellow-500" : "bg-green-500";

            return (
              <div key={room.id} className="bg-[#181920] border border-gray-800 rounded-2xl p-5 flex flex-col justify-between">
                
                {/* Header Kamar */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{room.room_number}</h3>
                    <p className="text-gray-500 text-xs">{room.room_type}</p>
                  </div>
                  <div className="bg-[#1f2133] p-2 rounded-xl">
                    <BedDouble size={20} className="text-indigo-500" />
                  </div>
                </div>

                {/* 3 Kotak Status (Available, Occupied, Maintenance) */}
                <div className="flex justify-between items-center mb-6 space-x-2">
                  <div className="bg-[#101b17] border border-green-900/30 rounded-xl px-2 py-3 flex-1 text-center">
                    <p className="text-green-500 text-[10px] mb-1">Available</p>
                    <p className="text-green-500 font-bold text-xl">{available < 0 ? 0 : available}</p>
                  </div>
                  <div className="bg-[#1e1b12] border border-yellow-900/30 rounded-xl px-2 py-3 flex-1 text-center">
                    <p className="text-yellow-500 text-[10px] mb-1">Occupied</p>
                    <p className="text-yellow-500 font-bold text-xl">{occupied}</p>
                  </div>
                  <div className="bg-[#201214] border border-red-900/30 rounded-xl px-2 py-3 flex-1 text-center">
                    <p className="text-red-500 text-[10px] mb-1">Maintenance</p>
                    <p className="text-red-500 font-bold text-xl">{maintenance}</p>
                  </div>
                </div>

                {/* Progress Bar & Footer */}
                <div>
                  <div className="w-full bg-[#2a2b36] rounded-full h-1.5 mb-2">
                    <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${occupancyRate}%` }}></div>
                  </div>
                  <p className="text-center text-[10px] text-gray-500">
                    {occupied} of {capacity} beds occupied
                  </p>
                </div>

              </div>
            );
          })}

          {/* Floating Buttons (Scroll Up/Down simulasi dari gambar) */}
          <div className="absolute right-[-15px] top-1/2 transform -translate-y-1/2 flex flex-col gap-2 hidden lg:flex">
            <button className="bg-[#2a2b36] hover:bg-gray-600 p-2 rounded-full text-white shadow-lg transition"><ChevronUp size={24} /></button>
            <button className="bg-[#2a2b36] hover:bg-gray-600 p-2 rounded-full text-white shadow-lg transition"><ChevronDown size={24} /></button>
          </div>
        </div>

        {/* ========================================== */}
        {/* BAGIAN 3: CRUD TABLE (TETAP ADA DI BAWAH)  */}
        {/* ========================================== */}
        <div className="mt-12 bg-white rounded-xl p-4">
           <h2 className="text-lg font-bold text-black mb-4 px-2">Pengaturan Data Kamar</h2>
           <CrudTable<any>
            table="rooms" 
            title="" 
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
              { key: "capacity", label: "Total Kasur", defaultValue: 4, type: "number" } as any,
              { key: "occupied_beds", label: "Kasur Terisi", defaultValue: 0, type: "number" } as any,
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
        </div>

      </div>
    </AdminDashboardShell>
  );
}

// Komponen Card Summary (Disamakan persis dengan gambar)
function SummaryCard({ title, value, valueColor }: { title: string, value: number | string, valueColor: string }) {
  return (
    <div className="bg-[#15161c] border border-gray-800 rounded-2xl p-5 flex flex-col justify-center">
      <span className="text-xs text-gray-500 font-medium mb-1">{title}</span>
      <span className={`text-3xl font-bold ${valueColor}`}>{value}</span>
    </div>
  );
}