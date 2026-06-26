import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  GraduationCap,
  MapPin,
  Calendar,
  TrendingUp,
  Building2,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import heroImage from "@/assets/hero.jpg";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-7 animate-fade-up">
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              India's first verified-only student gig platform
            </Badge>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-balance">
              Earn between classes.
              <br />
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Hire verified students.
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              On-demand 1–2 day gigs for catering, stock audits and event
              management. Strict verification, fair pay, zero spam.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="bg-gradient-primary shadow-elegant text-base h-12 px-7">
                <Link to="/jobs">
                  <GraduationCap className="h-5 w-5" />
                  I'm a Student
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base h-12 px-7 border-border">
                <Link to="/dashboard">
                  <Building2 className="h-5 w-5" />
                  I'm a Business
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-muted-foreground">
              <Trust icon={ShieldCheck} text="College ID verified" />
              <Trust icon={Zap} text="4-hour flash hires" />
              <Trust icon={TrendingUp} text="Same-day payouts" />
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative animate-fade-up [animation-delay:120ms]">
            <div className="absolute -inset-6 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
            <div className="relative rounded-3xl overflow-hidden border border-border shadow-elegant">
              <img
                src={heroImage}
                alt="Verified college students working a catering event"
                className="w-full h-[460px] object-cover"
                width={1600}
                height={1024}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

              {/* Floating cards */}
              <div className="absolute top-5 left-5 glass rounded-xl p-3 flex items-center gap-3 animate-fade-up [animation-delay:400ms]">
                <div className="h-10 w-10 rounded-lg bg-flash/20 grid place-items-center">
                  <Zap className="h-5 w-5 text-flash" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Flash Job</div>
                  <div className="text-sm font-semibold">12 students notified</div>
                </div>
              </div>

              <div className="absolute bottom-5 right-5 glass rounded-xl p-3 flex items-center gap-3 animate-fade-up [animation-delay:600ms]">
                <div className="h-10 w-10 rounded-lg bg-success/20 grid place-items-center">
                  <ShieldCheck className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Verified Student</div>
                  <div className="text-sm font-semibold">Priya · 4.9 ★</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-border/60 bg-secondary/20">
        <div className="container py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Stat number="12K+" label="Verified Students" />
          <Stat number="850+" label="Partner Businesses" />
          <Stat number="₹2.4Cr" label="Paid to Students" />
          <Stat number="98%" label="Show-up Rate" />
        </div>
      </section>

      {/* DUAL VALUE PROP */}
      <section className="container py-20">
        <div className="grid md:grid-cols-2 gap-6">
          <ValueCard
            tone="student"
            title="For Students"
            subtitle="Money. Skills. No burnout."
            features={[
              { icon: Calendar, title: "Max 8 jobs / month", desc: "Built-in study guard. We disable the button so you don't overdo it." },
              { icon: MapPin, title: "Within 5km radius", desc: "Walk or short cab. No 2-hour commutes for a 3-hour shift." },
              { icon: TrendingUp, title: "Same-day payouts", desc: "Paid directly to your UPI within 12 hours of clock-out." },
            ]}
            cta={{ label: "Browse Jobs", to: "/jobs" }}
          />
          <ValueCard
            tone="business"
            title="For Businesses"
            subtitle="Reliable crew. On demand."
            features={[
              { icon: ShieldCheck, title: "Pre-verified roster", desc: "College ID + Aadhaar + 3-strike no-show penalty system." },
              { icon: Zap, title: "Flash Jobs in <4 hrs", desc: "Need 5 servers tonight? Blast a flash alert to nearby students." },
              { icon: Users, title: "Bulk slots, one post", desc: "Hire 1 or 30 students from a single shift posting." },
            ]}
            cta={{ label: "Post a Job", to: "/dashboard" }}
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container pb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="mb-4">How it works</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Three steps. One reliable shift.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            { n: "01", t: "Verify your college ID", d: "Scan student card + selfie. Approved in under 6 hours." },
            { n: "02", t: "Pick your radius", d: "Set a 5km zone. Get only relevant jobs that fit your timetable." },
            { n: "03", t: "Show up & get paid", d: "Clock in via QR. Money hits your UPI by midnight." },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl bg-gradient-card border border-border p-6 hover:border-primary/40 transition-colors"
            >
              <div className="text-5xl font-extrabold bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-transparent">
                {s.n}
              </div>
              <h3 className="mt-3 font-semibold text-lg">{s.t}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container pb-20">
        <div className="rounded-3xl bg-gradient-primary p-10 md:p-14 text-center shadow-elegant relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground tracking-tight">
              Ready when you are.
            </h2>
            <p className="text-primary-foreground/80 mt-3 max-w-xl mx-auto">
              Join 12,000+ students earning on their own terms — without messing
              with their grades.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" variant="secondary" className="h-12 px-7">
                <Link to="/jobs">Find My First Gig <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-7 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground bg-transparent">
                <Link to="/dashboard">Hire Students</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-primary grid place-items-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Work Time</span>
            <span>· Verified student gigs</span>
          </div>
          <div>© {new Date().getFullYear()} Work Time. Built for students.</div>
        </div>
      </footer>
    </div>
  );
};

const Trust = ({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) => (
  <div className="flex items-center gap-2">
    <Icon className="h-4 w-4 text-success" />
    {text}
  </div>
);

const Stat = ({ number, label }: { number: string; label: string }) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
      {number}
    </div>
    <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
      {label}
    </div>
  </div>
);

const ValueCard = ({
  tone,
  title,
  subtitle,
  features,
  cta,
}: {
  tone: "student" | "business";
  title: string;
  subtitle: string;
  features: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }[];
  cta: { label: string; to: string };
}) => (
  <div className="relative rounded-3xl bg-gradient-card border border-border p-8 overflow-hidden group hover:border-primary/40 transition-colors">
    <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl group-hover:bg-primary/20 transition-colors" />
    <div className="relative">
      <Badge variant="outline" className="border-primary/30 text-primary">
        {tone === "student" ? <GraduationCap className="h-3 w-3 mr-1" /> : <Building2 className="h-3 w-3 mr-1" />}
        {title}
      </Badge>
      <h3 className="mt-4 text-2xl font-bold tracking-tight">{subtitle}</h3>

      <ul className="mt-6 space-y-4">
        {features.map((f) => (
          <li key={f.title} className="flex gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center shrink-0">
              <f.icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">{f.title}</div>
              <div className="text-sm text-muted-foreground">{f.desc}</div>
            </div>
          </li>
        ))}
      </ul>

      <Button asChild className="mt-6 w-full" variant={tone === "student" ? "default" : "secondary"}>
        <Link to={cta.to}>{cta.label} <ArrowRight className="h-4 w-4" /></Link>
      </Button>
    </div>
  </div>
);

export default Index;
