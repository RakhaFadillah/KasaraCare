// @ts-nocheck
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  // Menambahkan fungsi sebelum halaman dimuat untuk langsung dialihkan (redirect)
  beforeLoad: () => {
    // Ubah "/admin" atau "/admin/login" sesuai dengan rute halaman login/dashboard admin kamu
    throw redirect({
      to: "/admin",
    });
  },
  component: () => null, // Tidak perlu merender apa pun karena langsung pindah
});
