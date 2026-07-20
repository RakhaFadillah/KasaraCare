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
    // PERBAIKAN: Menambahkan 'relative' dan 'overflow-hidden' pada pembungkus utama
    <div 
      className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #f0f9ff 40%, #ffffff 100%)' }}
    >
      
      {/* ========================================== */}
      {/* LAPISAN BACKGROUND KARAKTER CHOPPER */}
      {/* ========================================== */}
      <div className="absolute inset-0 z-0 flex items-end justify-center pointer-events-none opacity-15">
        <img 
          src="/chopper-bg.png" 
          alt="Chopper Background" 
          className="w-full max-w-2xl object-contain object-bottom" 
          // Jika gambar kurang besar/pas, Anda bisa menyesuaikan class 'max-w-2xl' menjadi 'max-w-4xl' atau 'w-full h-full object-cover'
        />
      </div>

      {/* PERBAIKAN: Menambahkan 'relative z-10' agar kotak form login berada di ATAS gambar background */}
      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-3 hover:opacity-90 transition-opacity">
          
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-md bg-[#00a2ed]">
            <img src="/chopper-logo.jpg" alt="ChopperCare Logo" className="h-full w-full object-cover" />
          </div>
          
          <div>
            <p className="font-display text-xl font-bold leading-none text-slate-900 tracking-tight">ChopperCare</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Admin Portal</p>
          </div>
        </Link>

        <div className="rounded-3xl p-8 shadow-xl border border-white/60" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)' }}>
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
                className="focus-visible:ring-[#00a2ed] bg-white/70"
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
                className="focus-visible:ring-[#00a2ed] bg-white/70"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full mt-4 h-11 text-base font-bold shadow-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#00a2ed', color: 'white' }}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400 font-medium">
            <div className="h-px flex-1 bg-slate-200" /> or <div className="h-px flex-1 bg-slate-200" />
          </div>
          
          <Button variant="outline" className="w-full h-11 font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 bg-white/70" onClick={handleGoogle} disabled={loading}>
            Continue with Google
          </Button>
        </div>
        
        <p className="mt-6 text-center text-xs font-medium text-slate-500">
          Unauthorized access is strictly prohibited.
        </p>
      </div>
    </div>
  );
}