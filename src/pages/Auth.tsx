import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { GraduationCap, Building2, Zap, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const signUpSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email" }).max(255),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(72),
  fullName: z.string().trim().min(2, { message: "Enter your name" }).max(100),
  phone: z.string().trim().min(10).max(15),
  extra: z.string().trim().min(2, { message: "Required" }).max(150),
});

const signInSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email" }).max(255),
  password: z.string().min(1, { message: "Password required" }).max(72),
});

const Auth = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRole = (params.get("role") as "student" | "client") ?? "student";
  const initialMode = (params.get("mode") as "signin" | "signup") ?? "signup";

  const { user, role: existingRole, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [role, setRole] = useState<"student" | "client">(initialRole);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    extra: "",
  });

  // redirect if already signed in
  if (!authLoading && user && existingRole) {
    navigate(existingRole === "client" ? "/dashboard" : "/jobs", { replace: true });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        const parsed = signUpSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.errors[0].message);
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: form.fullName,
              phone: form.phone,
              role,
              ...(role === "student"
                ? { college_name: form.extra }
                : { business_name: form.extra }),
            },
          },
        });
        if (error) throw error;
        toast.success("Welcome to Work Time! Redirecting...");
        setTimeout(() => navigate(role === "client" ? "/dashboard" : "/jobs"), 600);
      } else {
        const parsed = signInSchema.safeParse({ email: form.email, password: form.password });
        if (!parsed.success) {
          toast.error(parsed.error.errors[0].message);
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        setTimeout(() => navigate("/jobs"), 400);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered")) {
        toast.error("This email is already registered. Try signing in.");
      } else if (msg.toLowerCase().includes("invalid login")) {
        toast.error("Invalid email or password");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-secondary/40 to-background border-r border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-50" />
        <Link to="/" className="relative flex items-center gap-2 group w-fit">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-elegant">
            <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-bold tracking-tight text-lg">Work Time</span>
        </Link>

        <div className="relative space-y-6 max-w-md">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-balance">
            Verified student gigs.
            <br />
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              On demand.
            </span>
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Join 12,000+ students and 850+ businesses already using Work Time
            for short-term shifts.
          </p>
        </div>

        <div className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} Work Time
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col justify-center p-6 md:p-10">
        <div className="max-w-md w-full mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>

          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-muted-foreground mt-1.5">
            {mode === "signup" ? "Sign up in 30 seconds" : "Sign in to continue"}
          </p>

          {mode === "signup" && (
            <Tabs value={role} onValueChange={(v) => setRole(v as "student" | "client")} className="mt-6">
              <TabsList className="grid grid-cols-2 w-full bg-secondary/40 h-11">
                <TabsTrigger value="student" className="data-[state=active]:bg-background">
                  <GraduationCap className="h-4 w-4" />
                  Student
                </TabsTrigger>
                <TabsTrigger value="client" className="data-[state=active]:bg-background">
                  <Building2 className="h-4 w-4" />
                  Business
                </TabsTrigger>
              </TabsList>
              <TabsContent value="student" className="mt-1 text-xs text-muted-foreground">
                Earn between classes. Max 8 jobs/month.
              </TabsContent>
              <TabsContent value="client" className="mt-1 text-xs text-muted-foreground">
                Hire verified students for 1-2 day shifts.
              </TabsContent>
            </Tabs>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            {mode === "signup" && (
              <>
                <div className="space-y-1.5">
                  <Label>Full name</Label>
                  <Input
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Priya Sharma"
                    className="h-11 bg-secondary/40 border-border"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98••• •••••"
                    className="h-11 bg-secondary/40 border-border"
                    maxLength={15}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{role === "student" ? "College name" : "Business name"}</Label>
                  <Input
                    value={form.extra}
                    onChange={(e) => setForm({ ...form, extra: e.target.value })}
                    placeholder={role === "student" ? "Christ University" : "Skyline Events Co."}
                    className="h-11 bg-secondary/40 border-border"
                    maxLength={150}
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="h-11 bg-secondary/40 border-border"
                maxLength={255}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                className="h-11 bg-secondary/40 border-border"
                maxLength={72}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-primary shadow-elegant"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground mt-6">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("signin")} className="text-primary hover:underline">
                  Sign in
                </button>
              </>
            ) : (
              <>
                New to Work Time?{" "}
                <button onClick={() => setMode("signup")} className="text-primary hover:underline">
                  Create account
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
