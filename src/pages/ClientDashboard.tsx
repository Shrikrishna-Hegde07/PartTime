import { useEffect, useState } from "react";
import {
  Briefcase,
  Calendar,
  IndianRupee,
  MapPin,
  Users,
  Zap,
  Plus,
  CheckCircle2,
  Eye,
  Loader2,
} from "lucide-react";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

type Posting = {
  id: string;
  title: string;
  category: string;
  shift_date: string;
  start_time: string | null;
  pay_amount: number;
  slots_total: number;
  slots_filled: number;
  location_text: string;
  is_flash: boolean;
};

const cities = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai"];

const jobSchema = z.object({
  title: z.string().trim().min(5, "Title too short").max(120),
  category: z.enum(["Catering", "Stock Audit", "Event Mgmt"]),
  shift_date: z.string().min(1, "Pick a date"),
  pay_amount: z.coerce.number().min(50, "Minimum ₹50").max(100000),
  slots_total: z.coerce.number().min(1).max(100),
  location_text: z.string().trim().min(2).max(120),
  city: z.string().min(2).max(60),
  description: z.string().max(2000).optional(),
});

const ClientDashboard = () => {
  const { user } = useAuth();
  const [postings, setPostings] = useState<Posting[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "Catering",
    shift_date: "",
    start_time: "",
    end_time: "",
    pay_amount: "",
    slots_total: "",
    location_text: "",
    city: "Bengaluru",
    description: "",
    is_flash: false,
  });

  const fetchPostings = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load your postings");
    else setPostings((data as Posting[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPostings();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsed = jobSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("jobs").insert({
        client_id: user.id,
        title: parsed.data.title,
        category: parsed.data.category,
        shift_date: parsed.data.shift_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        pay_amount: parsed.data.pay_amount,
        slots_total: parsed.data.slots_total,
        location_text: parsed.data.location_text,
        city: parsed.data.city,
        description: form.description || null,
        is_flash: form.is_flash,
        flash_expires_at: form.is_flash
          ? new Date(Date.now() + 4 * 3600 * 1000).toISOString()
          : null,
      });
      if (error) throw error;
      toast.success(
        form.is_flash ? "Flash job blasted to nearby students!" : "Job posted successfully",
      );
      setForm({
        title: "",
        category: "Catering",
        shift_date: "",
        start_time: "",
        end_time: "",
        pay_amount: "",
        slots_total: "",
        location_text: "",
        city: "Bengaluru",
        description: "",
        is_flash: false,
      });
      fetchPostings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to post job";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Client Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Post shifts and manage your verified student crew.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <DashStat icon={Briefcase} label="Active Postings" value={postings.length.toString()} />
          <DashStat
            icon={Users}
            label="Students Hired"
            value={postings.reduce((s, p) => s + p.slots_filled, 0).toString()}
          />
          <DashStat
            icon={Zap}
            label="Flash Jobs"
            value={postings.filter((p) => p.is_flash).length.toString()}
            accent="flash"
          />
          <DashStat icon={CheckCircle2} label="Show-up Rate" value="—" accent="success" />
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 rounded-2xl bg-gradient-card border border-border p-6 space-y-4 h-fit lg:sticky lg:top-24"
          >
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center">
                <Plus className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="font-semibold text-lg">Post a New Shift</h2>
            </div>

            <Field label="Job Title">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Wedding catering crew"
                className="bg-secondary/40 border-border"
                maxLength={120}
              />
            </Field>

            <Field label="Category">
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger className="bg-secondary/40 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Catering">Catering</SelectItem>
                  <SelectItem value="Stock Audit">Stock Audit</SelectItem>
                  <SelectItem value="Event Mgmt">Event Mgmt</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <Input
                  type="date"
                  value={form.shift_date}
                  onChange={(e) => setForm({ ...form, shift_date: e.target.value })}
                  className="bg-secondary/40 border-border"
                  min={new Date().toISOString().split("T")[0]}
                />
              </Field>
              <Field label="Pay (₹/shift)">
                <Input
                  type="number"
                  value={form.pay_amount}
                  onChange={(e) => setForm({ ...form, pay_amount: e.target.value })}
                  placeholder="1500"
                  className="bg-secondary/40 border-border"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Start time">
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="bg-secondary/40 border-border"
                />
              </Field>
              <Field label="End time">
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="bg-secondary/40 border-border"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="No. of students">
                <Input
                  type="number"
                  value={form.slots_total}
                  onChange={(e) => setForm({ ...form, slots_total: e.target.value })}
                  placeholder="5"
                  className="bg-secondary/40 border-border"
                />
              </Field>
              <Field label="City">
                <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
                  <SelectTrigger className="bg-secondary/40 border-border">
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
              </Field>
            </div>

            <Field label="Location / Area">
              <Input
                value={form.location_text}
                onChange={(e) => setForm({ ...form, location_text: e.target.value })}
                placeholder="Koramangala, near Forum Mall"
                className="bg-secondary/40 border-border"
                maxLength={120}
              />
            </Field>

            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Dress code, contact person, etc."
                className="bg-secondary/40 border-border min-h-[80px]"
                maxLength={2000}
              />
            </Field>

            <div className="flex items-center justify-between rounded-xl border border-flash/30 bg-flash/5 p-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-flash" />
                <div>
                  <div className="text-sm font-semibold">Flash Job</div>
                  <div className="text-xs text-muted-foreground">Need help in the next 4 hours</div>
                </div>
              </div>
              <Switch
                checked={form.is_flash}
                onCheckedChange={(v) => setForm({ ...form, is_flash: v })}
              />
            </div>

            <Button
              type="submit"
              className={`w-full h-11 ${form.is_flash ? "bg-gradient-flash hover:opacity-90" : "bg-gradient-primary"}`}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {form.is_flash ? (
                <>
                  <Zap className="h-4 w-4" /> Blast Flash Alert
                </>
              ) : (
                "Post Shift"
              )}
            </Button>
          </form>

          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Active Postings</h2>
              <span className="text-sm text-muted-foreground">{postings.length} live</span>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : postings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                No postings yet. Post your first shift on the left →
              </div>
            ) : (
              postings.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl bg-gradient-card border border-border p-5 hover:border-primary/40 transition-colors animate-fade-up"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                          {p.category}
                        </Badge>
                        {p.is_flash && (
                          <Badge className="bg-flash/15 text-flash border-flash/30 hover:bg-flash/20">
                            <Zap className="h-3 w-3 mr-1" /> Flash
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold leading-tight">{p.title}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(p.shift_date), "EEE, d MMM")}
                          {p.start_time ? ` · ${p.start_time.slice(0, 5)}` : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {p.location_text}
                        </span>
                        <span className="flex items-center gap-1">
                          <IndianRupee className="h-3.5 w-3.5" />
                          {Number(p.pay_amount).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                      Manage
                    </Button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/60">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {p.slots_filled} of {p.slots_total} students confirmed
                      </span>
                      <span className="font-semibold">
                        {Math.round((p.slots_filled / p.slots_total) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full ${p.is_flash ? "bg-gradient-flash" : "bg-gradient-primary"}`}
                        style={{
                          width: `${Math.min(100, (p.slots_filled / p.slots_total) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const DashStat = ({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: "flash" | "success";
}) => {
  const tone =
    accent === "flash"
      ? "bg-flash/15 text-flash"
      : accent === "success"
        ? "bg-success/15 text-success"
        : "bg-primary/15 text-primary";
  return (
    <div className="rounded-2xl bg-gradient-card border border-border p-5">
      <div className={`h-10 w-10 rounded-xl grid place-items-center ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
};

export default ClientDashboard;
