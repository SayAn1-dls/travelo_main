import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AirplaneTilt, GoogleLogo, FacebookLogo } from "@phosphor-icons/react";
import { toast } from "sonner";

const SIDE_IMG = "https://images.unsplash.com/photo-1486912500284-6f2462ba07ea?auto=format&fit=crop&w=1200&q=80";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fbEnabled, setFbEnabled] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/auth/facebook/status").then((r) => setFbEnabled(!!r.data.configured)).catch(() => {});
    if (new URLSearchParams(window.location.search).get("fb_error")) {
      toast.error("Facebook sign-in didn't go through — please try again");
      window.history.replaceState({}, "", "/auth");
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiError(err));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#F9F8F6]">
      <div className="hidden lg:block relative overflow-hidden">
        <img src={SIDE_IMG} alt="Destination" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 p-12 text-white">
          <h2 className="font-display text-4xl font-bold leading-tight">Every trip starts<br />with a single tap.</h2>
          <p className="text-white/80 mt-3 max-w-sm">Book journeys, discover local transport and settle group expenses — all inside Travelo.</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <button data-testid="auth-logo" onClick={() => navigate("/")} className="flex items-center gap-2 mb-10">
            <AirplaneTilt size={28} weight="duotone" className="text-[#FF5A36]" />
            <span className="font-display font-bold text-2xl">Travelo</span>
          </button>

          <h1 className="font-display text-3xl sm:text-4xl font-bold">{mode === "login" ? "Welcome back" : "Join the journey"}</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {mode === "login" ? "Sign in to continue planning." : "Create your free account in seconds."}
          </p>

          <div className="grid grid-cols-2 gap-3 mt-8">
            <Button
              data-testid="auth-google-btn"
              variant="outline"
              className="rounded-xl h-11"
              onClick={() => {
                // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
                const redirectUrl = window.location.origin + "/dashboard";
                window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
              }}
            >
              <GoogleLogo size={18} className="mr-2" /> Google
            </Button>
            <Button
              data-testid="auth-facebook-btn"
              variant="outline"
              className="rounded-xl h-11"
              disabled={!fbEnabled}
              title={fbEnabled ? "Continue with Facebook" : "Add your Facebook OAuth keys to enable"}
              onClick={() => {
                window.location.href = `${process.env.REACT_APP_BACKEND_URL}/api/auth/facebook/login`;
              }}
            >
              <FacebookLogo size={18} className="mr-2" /> Facebook
            </Button>
          </div>
          {!fbEnabled && <p className="text-[11px] text-muted-foreground mt-2 text-center">Facebook login activates once you add your Meta OAuth credentials.</p>}

          <div className="flex items-center gap-3 my-6">
            <div className="h-px bg-border flex-1" />
            <span className="text-xs text-muted-foreground">or with email</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label>Full name</Label>
                <Input data-testid="auth-name-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Aarav Sharma" className="h-11 rounded-xl" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input data-testid="auth-email-input" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input data-testid="auth-password-input" required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="h-11 rounded-xl" />
            </div>
            {error && <p data-testid="auth-error" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>}
            <Button data-testid="auth-submit-btn" type="submit" disabled={loading} className="w-full h-12 rounded-full bg-[#FF5A36] hover:bg-[#E64322] text-base">
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            {mode === "login" ? "New to Travelo?" : "Already have an account?"}{" "}
            <button data-testid="auth-mode-toggle" className="text-[#FF5A36] font-semibold hover:underline" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
              {mode === "login" ? "Create account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
