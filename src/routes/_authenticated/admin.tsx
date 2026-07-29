import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    // Cek apakah user sudah login
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw redirect({
        to: "/auth",
      });
    }

    // Ambil role user
    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (roleError) {
      console.error("Failed to load user roles:", roleError);
      throw roleError;
    }

    // Pastikan user memiliki role admin
    const isAdmin = roles?.some((role) => role.role === "admin") ?? false;

    if (!isAdmin) {
      throw redirect({
        to: "/admin",
      });
    }
  },

  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}
