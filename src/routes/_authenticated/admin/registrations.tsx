import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// 1. Mendefinisikan Interface untuk Type Safety (Menggantikan @ts-nocheck dan <any>)
interface Patient {
  id: string;
  nama: string;
}

interface Doctor {
  id: string;
  full_name: string;
}

interface Surgery {
  id: string;
  patient_id: string; 
  doctor_id: string | null; 
  nama_operasi: string;
  status: "Belum Operasi" | "Sudah Operasi" | "Lagi Operasi" | "Selesai";
  tanggal_operasi: string | null;
  jam_operasi: string | null;
  // Field virtual hasil JOIN dari database
  patients?: { nama: string };
  doctors?: { full_name: string };
}

export const Route = createFileRoute("/_authenticated/admin/registrations")({
  head: () => ({ meta: [{ title: "Pendaftaran Operasi" }] }),
  component: RegistrationsAdmin,
});

function RegistrationsAdmin() {
  const [patientOptions, setPatientOptions] = useState<{ label: string; value: string }[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<{ label: string; value: string }[]>([]);
  const [showQueue, setShowQueue] = useState(false);
  const [queueData, setQueueData] = useState<Surgery[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

  // 2. Fetch Data Relasi (Pasien & Dokter) menggunakan ID sebagai Value
  useEffect(() => {
    let isMounted = true;
    const fetchOptions = async () => {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          supabase.from("patients").select("id, nama"),
          supabase.from("doctors").select("id, full_name")
        ]);

        if (patientsRes.error) throw patientsRes.error;
        if (doctorsRes.error) throw doctorsRes.error;

        if (isMounted) {
          // Value dikirim sebagai UUID, Label ditampilkan sebagai Teks
          setPatientOptions(patientsRes.data.map(p => ({ label: p.nama, value: p.id })));
          setDoctorOptions(doctorsRes.data.map(d => ({ label: d.full_name, value: d.id })));
        }
      } catch (error) {
         console.error("Gagal memuat data opsi:", error);
      }
    };
    fetchOptions();
    return () => { isMounted = false; };
  }, []);

  // 3. Fetch Data Antrean dengan Relasi (JOIN)
  const loadQueue = async () => {
    setIsLoadingQueue(true);
    try {
      const { data, error } = await supabase
        .from("surgeries")
        .select("*, patients(nama), doctors(full_name)") // Mengambil nama dari tabel relasi
        .order("tanggal_operasi");

      if (error) throw error;
      
      if (data) {
        setQueueData(data as Surgery[]);
        setShowQueue(true);
      }
    } catch (error) {
       console.error("Gagal memuat antrean:", error);
    } finally {
       setIsLoadingQueue(false);
    }
  };

  return (
    <AdminDashboardShell title="Pendaftaran Operasi" description="Kelola jadwal operasi dan tim dokter.">
      <div className="mb-6 flex justify-end">
        <Button onClick={loadQueue} className="bg-[#00a3e0] hover:bg-[#008fce] text-white" disabled={isLoadingQueue}>
          {isLoadingQueue ? "Memuat..." : "Lihat Jadwal Operasi"}
        </Button>
      </div>

      {showQueue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-2 border-b">
              <h2 className="text-xl font-bold text-gray-800">Antrean Operasi</h2>
              <Button variant="outline" size="sm" onClick={() => setShowQueue(false)}>Tutup</Button>
            </div>
            
            {queueData.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Tidak ada antrean operasi saat ini.</p>
            ) : (
              <div className="space-y-3">
                {queueData.map((op) => (
                  <div key={op.id} className="p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div>
                      {/* Menampilkan nama dari object patients dan doctors */}
                      <div className="font-bold text-gray-900">{op.patients?.nama || 'Pasien Tidak Diketahui'}</div>
                      <div className="text-sm text-gray-600">{op.nama_operasi}</div>
                      <div className="text-xs font-semibold text-blue-600 mt-1.5">{op.doctors?.full_name || 'Dokter Belum Ditentukan'}</div>
                    </div>
                    <Badge variant={op.status === "Selesai" ? "default" : "secondary"}>
                      {op.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Konfigurasi CrudTable dengan Relasi UUID dan Custom Render */}
      <CrudTable<Surgery>
        table="surgeries"
        title="Daftar Operasi"
        searchKeys={["nama_operasi"]} 
        columns={[
          { key: "patient_id", label: "Pasien", render: (r) => <span>{r.patients?.nama || '—'}</span> },
          { key: "doctor_id", label: "Dokter", render: (r) => <span>{r.doctors?.full_name || '—'}</span> },
          { key: "nama_operasi", label: "Tindakan" },
          { key: "status", label: "Status", render: (r) => <Badge variant={r.status === "Selesai" ? "default" : "secondary"}>{r.status}</Badge> },
          { key: "tanggal_operasi", label: "Tgl Operasi", render: (r) => <span>{r.tanggal_operasi || '—'}</span> },
        ]}
        fields={[
          { key: "patient_id", label: "Nama Pasien", type: "select", required: true, options: patientOptions },
          { key: "doctor_id", label: "Nama Dokter", type: "select", options: doctorOptions }, // Dibiarkan tidak required agar bisa diedit nanti
          { key: "nama_operasi", label: "Nama Operasi", required: true },
          { key: "status", label: "Status", type: "select", required: true, options: [
            { value: "Belum Operasi", label: "Belum Operasi" },
            { value: "Sudah Operasi", label: "Sudah Operasi" },
            { value: "Lagi Operasi", label: "Lagi Operasi" },
            { value: "Selesai", label: "Selesai" }
          ]},
          { key: "tanggal_operasi", label: "Tgl Operasi", type: "date" }, // Disesuaikan dengan arsitektur DB (tidak required)
          { key: "jam_operasi", label: "Jam Operasi" }, // "required: true" dihapus sesuai sesi pemecahan masalah sebelumnya
        ]}
      />
    </AdminDashboardShell>
  );
}