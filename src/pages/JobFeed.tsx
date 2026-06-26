import { useEffect, useMemo, useState } from "react";
import { Search, MapPin, Filter, Zap, AlertCircle, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { JobCard, type DBJob } from "@/components/JobCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const categories = ["All", "Catering", "Stock Audit", "Event Mgmt"] as const;
const cities = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai"];

const JobFeed = () => {
  const { user, role } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [city, setCity] = useState("Bengaluru");
  const [showFlashOnly, setShowFlashOnly] = useState(false);

  const [jobs, setJobs] = useState<DBJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const [monthlyJobs, setMonthlyJobs] = useState(0);
  const [suspendedUntil, setSuspendedUntil] = useState<Date | null>(null);
  const monthlyLimit = 8;
  const limitReached = monthlyJobs >= monthlyLimit;
  const isSuspended = suspendedUntil && suspendedUntil > new Date();

  // Fetch jobs + applications + student status
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Jobs joined with client business name
      const { data: jobsData, error: jobsErr } = await supabase
        .from("jobs")
        .select("*, client_details!inner(business_name)")
        .eq("status", "open")
        .order("is_flash", { ascending: false })
        .order("shift_date", { ascending: true });

      if (jobsErr) {
        toast.error("Failed to load jobs");
      } else {
        const mapped = (jobsData ?? []).map((j: any) => ({
          ...j,
          business_name: j.client_details?.business_name,
        })) as DBJob[];
        setJobs(mapped);
      }

      if (user && role === "student") {
        const { data: apps } = await supabase
          .from("applications")
          .select("job_id, applied_at, status")
          .eq("student_id", user.id);
        if (apps) {
          setAppliedIds(new Set(apps.map((a) => a.job_id)));
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          const count = apps.filter(
            (a) =>
              new Date(a.applied_at) >= monthStart &&
              (a.status === "confirmed" || a.status === "completed"),
          ).length;
          setMonthlyJobs(count);
        }

        const { data: details } = await supabase
          .from("student_details")
          .select("suspended_until")
          .eq("user_id", user.id)
          .maybeSingle();
        if (details?.suspended_until) {
          setSuspendedUntil(new Date(details.suspended_until));
        }
      }

      setLoading(false);
    };
    load();
  }, [user, role]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (category !== "All" && j.category !== category) return false;
      if (showFlashOnly && !j.is_flash) return false;
      if (city && j.city !== city) return false;
      if (
        query &&
        !`${j.title} ${j.business_name ?? ""}`.toLowerCase().includes(query.toLowerCase())
      )
        return false;
      return true;
    });
  }, [jobs, query, category, city, showFlashOnly]);

  const flashCount = jobs.filter((j) => j.is_flash).length;

  const handleApply = async (jobId: string) => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    if (role !== "student") {
      toast.error("Only students can accept shifts");
      return;
    }
    setApplyingId(jobId);
    try {
      // Server-side guard
      const { data: check, error: checkErr } = await supabase.rpc("check_student_can_apply", {
        _student_id: user.id,
      });
      if (checkErr) throw checkErr;
      const result = check?.[0];
      if (!result?.can_apply) {
        toast.error(result?.reason ?? "Cannot apply right now");
        return;
      }

      const { error } = await supabase
        .from("applications")
        .insert({ job_id: jobId, student_id: user.id });
      if (error) throw error;

      setAppliedIds((s) => new Set(s).add(jobId));
      setMonthlyJobs((n) => n + 1);
      // Optimistic slot bump
      setJobs((js) =>
        js.map((j) => (j.id === jobId ? { ...j, slots_filled: j.slots_filled + 1 } : j)),
      );
      toast.success("Shift accepted! Check your profile for details.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to accept shift";
      toast.error(msg);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Shifts near you</h1>
            <p className="text-muted-foreground mt-1">
              Showing open jobs in {city}
            </p>
          </div>
          <Badge className="bg-flash/15 text-flash border-flash/30 hover:bg-flash/20 w-fit">
            <Zap className="h-3 w-3 mr-1" />
            {flashCount} Flash Jobs Live
          </Badge>
        </div>

        {/* Auth nudge */}
        {!user && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-3">
            <div className="text-sm">
              <span className="font-semibold">Sign in to accept shifts.</span>{" "}
              <span className="text-muted-foreground">Browsing is free.</span>
            </div>
            <Button asChild size="sm" className="bg-gradient-primary">
              <Link to="/auth?mode=signup&role=student">Join as student</Link>
            </Button>
          </div>
        )}

        {/* Limit / suspension banner */}
        {user && role === "student" && (
          <div
            className={`rounded-2xl border p-4 flex items-start gap-3 ${
              isSuspended || limitReached
                ? "border-warning/40 bg-warning/10"
                : "border-primary/30 bg-primary/5"
            }`}
          >
            <div
              className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${
                isSuspended || limitReached ? "bg-warning/20" : "bg-primary/15"
              }`}
            >
              <AlertCircle
                className={`h-5 w-5 ${
                  isSuspended || limitReached ? "text-warning" : "text-primary"
                }`}
              />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">
                {isSuspended
                  ? `Account suspended until ${suspendedUntil!.toDateString()}`
                  : limitReached
                    ? "Monthly limit reached. Focus on your studies!"
                    : `Student Guard: ${monthlyJobs} of ${monthlyLimit} jobs accepted this month`}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {isSuspended
                  ? "Three no-shows trigger a 90-day suspension."
                  : limitReached
                    ? "Resets on the 1st of next month."
                    : `You can accept ${monthlyLimit - monthlyJobs} more shift${monthlyLimit - monthlyJobs === 1 ? "" : "s"} before your monthly cap.`}
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full ${
                    limitReached ? "bg-warning" : "bg-gradient-primary"
                  }`}
                  style={{ width: `${Math.min(100, (monthlyJobs / monthlyLimit) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="rounded-2xl bg-gradient-card border border-border p-4 grid md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search jobs or companies"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-secondary/40 border-border h-11"
            />
          </div>
          <div className="md:col-span-3">
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="bg-secondary/40 border-border h-11">
                <MapPin className="h-4 w-4 text-primary" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3">
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as typeof category)}
            >
              <SelectTrigger className="bg-secondary/40 border-border h-11">
                <Filter className="h-4 w-4 text-primary" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant={showFlashOnly ? "destructive" : "outline"}
            className="md:col-span-1 h-11"
            onClick={() => setShowFlashOnly((v) => !v)}
          >
            <Zap className="h-4 w-4" />
          </Button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="py-20 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No open shifts match your filters.
            {role === "client" && (
              <div className="mt-4">
                <Button asChild size="sm" className="bg-gradient-primary">
                  <Link to="/dashboard">Post the first shift</Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 pt-2">
            {filtered.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                alreadyApplied={appliedIds.has(job.id)}
                disabled={
                  role === "student" && (limitReached || !!isSuspended)
                }
                disabledReason={
                  isSuspended
                    ? "Account suspended"
                    : limitReached
                      ? "Monthly limit reached"
                      : undefined
                }
                onApply={handleApply}
                applyLoading={applyingId === job.id}
                isClientView={role === "client"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobFeed;
