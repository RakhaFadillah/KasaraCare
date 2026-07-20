import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ 
    meta: [
      { title: "Admin Login — ChopperCare" }, 
      { name: "description", content: "Sign in to the hospital administration portal." }
    ] 
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back, Admin");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid credentials");
    } finally { 
      setLoading(false); 
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) { 
      toast.error(res.error.message ?? "Google sign-in failed"); 
      setLoading(false); 
      return; 
    }
    if (res.redirected) return;
    navigate({ to: "/admin" });
  };

  return (
    <div 
      className="flex min-h-screen items-center justify-center p-4 sm:p-8"
      style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #f0f9ff 40%, #ffffff 100%)' }}
    >
      
      {/* ========================================== */}
      {/* KARTU LEBAR (SPLIT LAYOUT) KIRI & KANAN      */}
      {/* ========================================== */}
      <div className="flex w-full max-w-[900px] rounded-[2rem] shadow-2xl border border-white/60 bg-white/80 backdrop-blur-xl overflow-hidden">

        {/* SISI KIRI: GAMBAR CHOPPER (Disembunyikan di HP, muncul di tablet/PC) */}
        <div className="hidden md:flex w-1/2 flex-col items-center justify-center bg-blue-50/60 p-10 relative">
          
          {/* Efek cahaya tipis di belakang Chopper */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#00a2ed]/5 to-transparent"></div>

          {/* 
            Gambar Chopper: 
            - w-72: Ukuran proporsional (tidak raksasa)
            - drop-shadow-2xl: Efek bayangan elegan
            - Tanpa opacity: Warna jelas & tidak pudar! 
          */}
          <img 
            src="/chopper-bg.png" 
            alt="Chopper Character" 
            className="relative z-10 w-72 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
          />
          
          <div className="relative z-10 mt-8 text-center">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">ChopperCare Admin</h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">Pusat Kendali Operasional</p>
          </div>
        </div>


        {/* SISI KANAN: FORM LOGIN */}
        <div className="flex w-full md:w-1/2 flex-col justify-center p-8 sm:p-12 bg-white">
          <Link to="/" className="mb-8 flex items-center justify-center gap-3 hover:opacity-90 transition-opacity">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-md bg-[#00a2ed]">
              <img src="/chopper-logo.jpg" alt="ChopperCare Logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold leading-none text-slate-900 tracking-tight">ChopperCare</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Admin Portal</p>
            </div>
          </Link>

          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Login</h1>
            <p className="text-sm text-slate-500 mt-1.5 font-medium">Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-semibold text-slate-700">Email address</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="admin@choppercare.com" 
                className="focus-visible:ring-[#00a2ed] h-11 bg-slate-50/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-semibold text-slate-700">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••" 
                className="focus-visible:ring-[#00a2ed] h-11 bg-slate-50/50"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full mt-4 h-12 text-base font-bold shadow-lg hover:opacity-90 hover:-translate-y-0.5 transition-all"
              style={{ backgroundColor: '#00a2ed', color: 'white' }}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400 font-medium">
            <div className="h-px flex-1 bg-slate-200" /> or <div className="h-px flex-1 bg-slate-200" />
          </div>
          
          <Button variant="outline" className="w-full h-11 font-semibold text-slate-600 border-slate-200 hover:bg-slate-50" onClick={handleGoogle} disabled={loading}>
            Continue with Google
          </Button>
          
          <p className="mt-8 text-center text-[11px] font-medium text-slate-400">
            Unauthorized access is strictly prohibited.
          </p>
        </div>

      </div>
    </div>
  );
}