import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Star,
  Calendar,
  IndianRupee,
  GraduationCap,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Mail,
  Building2,
  Loader2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

const Profile = () => {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [monthlyJobs, setMonthlyJobs] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      setProfile(prof);

      if (role === "student") {
        const { data: sd } = await supabase
          .from("student_details")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        setStudentDetails(sd);

        const { data: apps } = await supabase
          .from("applications")
          .select("*, jobs(title, shift_date, pay_amount, location_text)")
          .eq("student_id", user.id)
          .order("applied_at", { ascending: false })
          .limit(8);
        setRecentApps(apps ?? []);

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        setMonthlyJobs(
          (apps ?? []).filter(
            (a) =>
              new Date(a.applied_at) >= monthStart &&
              (a.status === "confirmed" || a.status === "completed"),
          ).length,
        );
      } else if (role === "client") {
        const { data: cd } = await supabase
          .from("client_details")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        setClientDetails(cd);
      }

      setLoading(false);
    };
    load();
  }, [user, role]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const monthlyLimit = 8;
  const noShows = studentDetails?.no_show_count ?? 0;
  const rating = studentDetails?.rating ?? 5.0;
  const ringPercent = (monthlyJobs / monthlyLimit) * 100;
  const isSuspended =
    studentDetails?.suspended_until && new Date(studentDetails.suspended_until) > new Date();

  const totalEarned = recentApps
    .filter((a) => a.status === "completed")
    .reduce((s, a) => s + Number(a.jobs?.pay_amount ?? 0), 0);

  const initial = (profile?.full_name || user?.email || "?")[0].toUpperCase();
  const isClient = role === "client";

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container py-8 space-y-6">
        {/* Identity */}
        <div className="rounded-3xl bg-gradient-card border border-border p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-2xl bg-gradient-primary grid place-items-center text-4xl font-bold text-primary-foreground shadow-elegant">
                {initial}
              </div>
              {(studentDetails?.verification_status === "verified" || clientDetails?.verified) && (
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-success grid place-items-center border-4 border-background">
                  <ShieldCheck className="h-4 w-4 text-success-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {profile?.full_name || "Your Profile"}
                </h1>
                <Badge
                  className={`${
                    studentDetails?.verification_status === "verified" || clientDetails?.verified
                      ? "bg-success/15 text-success border-success/30"
                      : "bg-warning/15 text-warning border-warning/30"
                  }`}
                >
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  {studentDetails?.verification_status === "verified" || clientDetails?.verified
                    ? "Verified"
                    : "Pending verification"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                {isClient ? (
                  <>
                    <Building2 className="h-4 w-4" />
                    {clientDetails?.business_name ?? "Your business"}
                  </>
                ) : (
                  <>
                    <GraduationCap className="h-4 w-4" />
                    {studentDetails?.college_name || "Add your college"}
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground mt-3">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {user?.email}
                </span>
              </div>
            </div>

            {!isClient && (
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center text-warning">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="text-2xl font-bold">{Number(rating).toFixed(1)}</span>
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Reliability
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {!isClient && (
          <>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="rounded-2xl bg-gradient-card border border-border p-6 flex flex-col items-center text-center">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Monthly Job Counter
                </div>
                <div className="relative mt-4 h-44 w-44">
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="url(#g)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(Math.min(100, ringPercent) / 100) * 263.9} 263.9`}
                    />
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="hsl(var(--primary))" />
                        <stop offset="1" stopColor="hsl(var(--primary-glow))" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 grid place-items-center">
                    <div>
                      <div className="text-5xl font-extrabold">{monthlyJobs}</div>
                      <div className="text-sm text-muted-foreground">of {monthlyLimit} jobs</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  {Math.max(0, monthlyLimit - monthlyJobs)} shift
                  {monthlyLimit - monthlyJobs === 1 ? "" : "s"} left this month
                </div>
              </div>

              <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
                <ProfileStat
                  icon={IndianRupee}
                  label="Earned (completed)"
                  value={`₹${totalEarned.toLocaleString("en-IN")}`}
                  sub="From completed shifts"
                  accent="primary"
                />
                <ProfileStat
                  icon={Calendar}
                  label="Total shifts"
                  value={(studentDetails?.total_shifts ?? 0).toString()}
                  sub="Since you joined"
                  accent="primary"
                />
                <ProfileStat
                  icon={TrendingUp}
                  label="Reliability"
                  value={`${Number(rating).toFixed(1)} ★`}
                  sub="Based on client ratings"
                  accent="success"
                />
                <ProfileStat
                  icon={AlertTriangle}
                  label="No-shows"
                  value={`${noShows} / 3`}
                  sub={
                    isSuspended
                      ? "Account suspended"
                      : `${Math.max(0, 3 - noShows)} strike${3 - noShows === 1 ? "" : "s"} until 90-day suspension`
                  }
                  accent={noShows >= 2 ? "warning" : "success"}
                />
              </div>
            </div>

            {/* Recent shifts */}
            <div className="rounded-2xl bg-gradient-card border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Recent shifts</h2>
              </div>
              {recentApps.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  No shifts yet. Browse jobs to accept your first shift.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentApps.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 ${
                            r.status === "completed"
                              ? "bg-success/15 text-success"
                              : r.status === "no_show"
                                ? "bg-destructive/15 text-destructive"
                                : "bg-primary/15 text-primary"
                          }`}
                        >
                          {r.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : r.status === "no_show" ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <Calendar className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {r.jobs?.title ?? "Shift"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.jobs?.shift_date
                              ? format(new Date(r.jobs.shift_date), "d MMM")
                              : ""}{" "}
                            · {r.jobs?.location_text}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm flex items-center justify-end">
                          <IndianRupee className="h-3.5 w-3.5" />
                          {Number(r.jobs?.pay_amount ?? 0).toLocaleString("en-IN")}
                        </div>
                        <div
                          className={`text-[11px] uppercase tracking-wider ${
                            r.status === "completed"
                              ? "text-success"
                              : r.status === "no_show"
                                ? "text-destructive"
                                : "text-primary"
                          }`}
                        >
                          {r.status === "completed"
                            ? "Paid"
                            : r.status === "no_show"
                              ? "No-show"
                              : "Confirmed"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {isClient && (
          <div className="rounded-2xl bg-gradient-card border border-border p-6">
            <h2 className="font-semibold text-lg mb-2">Business profile</h2>
            <p className="text-sm text-muted-foreground">
              Manage postings and applicants from your{" "}
              <Button variant="link" className="p-0 h-auto" asChild>
                <a href="/dashboard">dashboard</a>
              </Button>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileStat = ({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  accent: "primary" | "success" | "warning";
}) => {
  const tones = {
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
  };
  return (
    <div className="rounded-2xl bg-gradient-card border border-border p-5">
      <div className={`h-10 w-10 rounded-xl grid place-items-center ${tones[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-0.5">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
};

export default Profile;
