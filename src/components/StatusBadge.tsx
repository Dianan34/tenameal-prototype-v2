import { statusLabel, type MealStatus } from "@/lib/store";

const tone: Record<MealStatus, string> = {
  pending_doctor: "bg-warning/15 text-warning-foreground border-warning/30",
  approved: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  preparing: "bg-accent/20 text-accent-foreground border-accent/40",
  ready: "bg-primary/10 text-primary border-primary/30",
  delivered: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: MealStatus }) {
  const isActive = ["pending_doctor", "preparing", "ready"].includes(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full border shadow-sm transition-all duration-300 ${tone[status]}`}
    >
      <span className={`size-1.5 rounded-full bg-current ${isActive ? "animate-pulse-glow" : "opacity-60"}`} />
      {statusLabel[status]}
    </span>
  );
}
