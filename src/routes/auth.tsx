import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HeartPulse, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ 
    meta: [
      { title: "Admin Login — MediCare" }, 
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

  // Jika sudah login, langsung lempar ke /admin
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
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-soft">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-lg font-bold leading-none">MediCare</p>
            <p className="text-[11px] text-muted-foreground">Admin Portal</p>
          </div>
        </Link>

        <div className="glass-card rounded-3xl p-8 shadow-elegant bg-white">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold tracking-tight">System Login</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="admin@medicare.com" 
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••" 
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground shadow-soft mt-2">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in securely
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>
          
          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
            Continue with Google
          </Button>
        </div>
        
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Unauthorized access is strictly prohibited.
        </p>
      </div>
    </div>
  );
}