// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { supabase } from "@/integrations/supabase/client";
import { BedDouble, X, Users, Save, Home, Wrench } from "lucide-react"; 
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/admin/rooms")({
  head: () => ({ meta: [{ title: "Manajemen Kamar" }] }),
  component: ManajemenKamar,
});

function ManajemenKamar() {
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomPatients, setRoomPatients] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});

  // 1. Fetch Data Kamar
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*").order("room_number");
      if (error) throw new Error("Gagal memuat data kamar");
      return data;
    }
  });

  // 2. Fetch Data Pasien saat Kamar Diklik
  useEffect(() => {
    if (selectedRoom) {
      const fetchPatients = async () => {
        const { data } = await supabase
          .from("patients")
          .select("nama, poli")
          .eq("kamar", selectedRoom.room_number)
          .is("tanggal_keluar", null); 
        
        setRoomPatients(data || []);
      };
      fetchPatients();
      setFormData(selectedRoom);
    }
  }, [selectedRoom]);

  // 3. Fungsi Simpan Perubahan Kamar
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("rooms")
        .update({
          room_type: formData.room_type,
          capacity: formData.capacity,
          occupied_beds: formData.occupied_beds,
          status: formData.status
        })
        .eq("id", selectedRoom.id);

      if (error) throw error;
      
      await queryClient.invalidateQueries(["rooms-dashboard"]);
      setSelectedRoom(null); 
    } catch (error) {
      alert("Gagal menyimpan data kamar!");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const totalKamar = rooms.length;
  const totalKasur = rooms.reduce((acc, room) => acc + (room.capacity || 0), 0);
  const terisi = rooms.reduce((acc, room) => acc + (room.occupied_beds || 0), 0);
  const perbaikan = rooms.filter(r => r.status === "Perbaikan").length;

  if (isLoading) return <div className="p-8 text-center text-gray-500">Memuat data kamar...</div>;

  return (
    <AdminDashboardShell title="Manajemen Kamar" description="Kelola data ruangan, kapasitas, dan jumlah kasur terisi.">
      
      <div className="bg-slate-50 min-h-screen p-6 -mt-6 -mx-6 text-gray-800 font-sans rounded-xl">
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard title="Total Kamar" value={totalKamar} valueColor="text-blue-600" />
          <SummaryCard title="Total Isi Kasur" value={totalKasur} valueColor="text-gray-800" />
          <SummaryCard title="Terisi" value={terisi} valueColor="text-yellow-600" />
          <SummaryCard title="Perbaikan" value={perbaikan} valueColor="text-red-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {rooms.map((room) => {
            const capacity = room.capacity || 0;
            const occupied = room.occupied_beds || 0;
            const maintenance = room.status === "Perbaikan" ? capacity : 0; 
            const available = capacity - occupied - maintenance;
            
            const occupancyRate = capacity > 0 ? (occupied / capacity) * 100 : 0;
            const barColor = room.status === "Perbaikan" ? "bg-red-500" : occupancyRate >= 80 ? "bg-red-500" : occupancyRate >= 50 ? "bg-yellow-500" : "bg-green-500";

            return (
              <div 
                key={room.id} 
                onClick={() => setSelectedRoom(room)}
                className="bg-white border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer rounded-2xl p-5 flex flex-col justify-between shadow-sm"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-gray-900 font-bold text-xl">{room.room_number}</h3>
                    <p className="text-gray-500 text-sm font-medium">{room.room_type}</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-xl">
                    <BedDouble size={22} className="text-blue-600" />
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6 space-x-2">
                  <div className="bg-green-50 border border-green-100 rounded-xl px-2 py-3 flex-1 text-center">
                    <p className="text-green-700 text-[11px] font-semibold mb-1">Tersedia</p>
                    <p className="text-green-700 font-bold text-xl">{available < 0 ? 0 : available}</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-2 py-3 flex-1 text-center">
                    <p className="text-yellow-700 text-[11px] font-semibold mb-1">Terisi</p>
                    <p className="text-yellow-700 font-bold text-xl">{occupied}</p>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-xl px-2 py-3 flex-1 text-center">
                    <p className="text-red-700 text-[11px] font-semibold mb-1">Perbaikan</p>
                    <p className="text-red-700 font-bold text-xl">{maintenance}</p>
                  </div>
                </div>

                <div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                    <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${room.status === "Perbaikan" ? 100 : occupancyRate}%` }}></div>
                  </div>
                  <p className="text-center text-[11px] font-medium text-gray-500">
                    {occupied} dari {capacity} kasur terisi
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-700"><Home size={24} /></div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Kamar {selectedRoom.room_number}</h2>
                  <p className="text-sm text-gray-500">Pengaturan Data & Daftar Pasien</p>
                </div>
              </div>
              <button onClick={() => setSelectedRoom(null)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Wrench size={18} className="text-blue-500" /> Form Pengaturan
                </h3>
                <form onSubmit={handleSaveRoom} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kelas Kamar</label>
                    <select 
                      value={formData.room_type || ""}
                      onChange={(e) => setFormData({...formData, room_type: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Kelas 1">Kelas 1</option>
                      <option value="Kelas 2">Kelas 2</option>
                      <option value="Kelas 3">Kelas 3</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Kasur (Kapasitas)</label>
                    <input 
                      type="number" min="1"
                      value={formData.capacity || 0}
                      onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kasur Terisi</label>
                    <input 
                      type="number" min="0" max={formData.capacity}
                      value={formData.occupied_beds || 0}
                      onChange={(e) => setFormData({...formData, occupied_beds: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Kamar</label>
                    <select 
                      value={formData.status || ""}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Kosong">Kosong</option>
                      <option value="Terisi Sebagian">Terisi Sebagian</option>
                      <option value="Penuh">Penuh</option>
                      <option value="Perbaikan">Perbaikan</option>
                    </select>
                  </div>
                  <button 
                    type="submit" disabled={isSaving}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 mt-4 transition"
                  >
                    <Save size={18} /> {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </form>
              </div>

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users size={18} className="text-green-600" /> Pasien Saat Ini
                </h3>
                
                {roomPatients.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <BedDouble size={48} className="mx-auto mb-3 opacity-20" />
                    <p>Tidak ada pasien di kamar ini.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {roomPatients.map((patient, idx) => (
                      <li key={idx} className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm flex flex-col">
                        <span className="font-bold text-gray-900">{patient.nama}</span>
                        <span className="text-xs text-gray-500">{patient.poli || "Rawat Inap"}</span>
                      </li>
                    ))}
                  </ul>
                )}
                
                <div className="mt-4 text-xs text-gray-400 text-center border-t border-gray-200 pt-4">
                  Jumlah kasur terisi di form harus sesuai dengan jumlah fisik pasien yang ada di ruangan.
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </AdminDashboardShell>
  );
}

function SummaryCard({ title, value, valueColor }: { title: string, value: number | string, valueColor: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-center shadow-sm hover:shadow-md transition">
      <span className="text-sm text-gray-500 font-semibold mb-1">{title}</span>
      <span className={`text-3xl font-black ${valueColor}`}>{value}</span>
    </div>
  );
}