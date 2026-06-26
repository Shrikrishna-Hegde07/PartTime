import { Briefcase, MapPin, Clock, Users, Zap, IndianRupee, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export type DBJob = {
  id: string;
  client_id: string;
  title: string;
  category: string;
  pay_amount: number;
  pay_unit: string;
  shift_date: string;
  start_time: string | null;
  end_time: string | null;
  location_text: string;
  city: string;
  slots_total: number;
  slots_filled: number;
  is_flash: boolean;
  flash_expires_at: string | null;
  status: string;
  business_name?: string;
};

interface Props {
  job: DBJob;
  alreadyApplied?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onApply?: (jobId: string) => void;
  applyLoading?: boolean;
  isClientView?: boolean;
}

export const JobCard = ({
  job,
  alreadyApplied,
  disabled,
  disabledReason,
  onApply,
  applyLoading,
  isClientView,
}: Props) => {
  const flashHoursLeft = job.flash_expires_at
    ? Math.max(0, Math.round((new Date(job.flash_expires_at).getTime() - Date.now()) / 36e5))
    : 0;

  const dateLabel = (() => {
    try {
      const d = new Date(job.shift_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
      if (diff === 0) return "Today";
      if (diff === 1) return "Tomorrow";
      return format(d, "EEE, d MMM");
    } catch {
      return job.shift_date;
    }
  })();

  const timeLabel = job.start_time && job.end_time
    ? `${job.start_time.slice(0, 5)} – ${job.end_time.slice(0, 5)}`
    : "Full shift";

  const isFull = job.slots_filled >= job.slots_total;

  return (
    <article
      className={cn(
        "group relative rounded-2xl bg-gradient-card border border-border p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant animate-fade-up",
        job.is_flash && "border-flash/40",
      )}
    >
      {job.is_flash && flashHoursLeft > 0 && (
        <div className="absolute -top-3 left-5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-flash text-flash-foreground text-[11px] font-semibold uppercase tracking-wider shadow-[0_0_30px_-5px_hsl(var(--flash))] animate-flash-pulse">
          <Zap className="h-3 w-3 fill-current" />
          Flash · {flashHoursLeft}h left
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <Badge variant="outline" className="mb-2 border-primary/30 text-primary bg-primary/5">
            <Briefcase className="h-3 w-3 mr-1" />
            {job.category}
          </Badge>
          <h3 className="font-semibold text-lg leading-tight text-balance">{job.title}</h3>
          {job.business_name && (
            <p className="text-sm text-muted-foreground mt-0.5">{job.business_name}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center justify-end text-2xl font-bold">
            <IndianRupee className="h-5 w-5" />
            {Number(job.pay_amount).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
            per {job.pay_unit}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 my-4 text-xs">
        <Stat icon={MapPin} label={`${job.location_text}, ${job.city}`} />
        <Stat icon={Clock} label={`${dateLabel} · ${timeLabel}`} />
        <Stat icon={Users} label={`${job.slots_filled}/${job.slots_total} filled`} />
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success" />
          <span>Verified Client</span>
        </div>
      </div>

      {!isClientView && (
        <div className="flex items-center gap-2 pt-3 border-t border-border/60">
          <Button
            variant={job.is_flash ? "destructive" : "default"}
            size="sm"
            className="flex-1"
            disabled={disabled || alreadyApplied || isFull || applyLoading}
            onClick={() => onApply?.(job.id)}
          >
            {applyLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {alreadyApplied
              ? "Applied ✓"
              : isFull
                ? "Slots Full"
                : disabled
                  ? "Limit Reached"
                  : job.is_flash
                    ? "Accept Flash Job"
                    : "Accept Shift"}
          </Button>
        </div>
      )}

      {disabled && disabledReason && !alreadyApplied && (
        <p className="text-[11px] text-warning mt-2 text-center">{disabledReason}</p>
      )}
    </article>
  );
};

const Stat = ({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) => (
  <div className="flex items-center gap-2 text-muted-foreground">
    <Icon className="h-3.5 w-3.5 text-primary/80" />
    <span className="truncate">{label}</span>
  </div>
);
