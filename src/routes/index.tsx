import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, User, Stethoscope, ClipboardPlus, ChefHat, ArrowRight, ShieldCheck, QrCode, Activity, Sparkles, TrendingUp } from "lucide-react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TenaMeal — Hospital Nutrition & Meal Management" },
      { name: "description", content: "Doctor-approved, allergy-safe hospital meals — from patient intake to kitchen delivery." },
    ],
  }),
  component: Landing,
});

const roles = [
  {
    to: "/patient" as const,
    label: "Patient",
    desc: "View approved meals, schedule, and meal history.",
    icon: User,
    accent: "from-emerald-500 to-teal-600",
  },
  {
    to: "/nurse" as const,
    label: "Nurse / Staff",
    desc: "Register patients, record vitals, generate QR codes.",
    icon: ClipboardPlus,
    accent: "from-teal-500 to-emerald-600",
  },
  {
    to: "/doctor" as const,
    label: "Doctor",
    desc: "Review patients, approve or reject meals, add notes.",
    icon: Stethoscope,
    accent: "from-emerald-600 to-amber-500",
  },
  {
    to: "/kitchen" as const,
    label: "Kitchen",
    desc: "Receive orders, prep meals, scan QR before delivery.",
    icon: ChefHat,
    accent: "from-amber-500 to-orange-500",
  },
];

function Landing() {
  const meals = useStore((s) => s.meals);
  const patients = useStore((s) => s.patients);

  const pendingApprovals = meals.filter((m) => m.status === "pending_doctor").length;
  const cookingCount = meals.filter((m) => m.status === "preparing").length;
  const readyCount = meals.filter((m) => m.status === "ready").length;
  const activePatients = patients.filter((p) => !p.discharged).length;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-between">
      {/* Decorative Orbs */}
      <div className="absolute top-[10%] left-[-10%] size-[400px] bg-primary glow-orb opacity-10 dark:opacity-20" />
      <div className="absolute bottom-[20%] right-[-10%] size-[500px] bg-accent glow-orb opacity-10 dark:opacity-25" />
      
      <header className="relative z-10 px-6 md:px-12 py-6 flex items-center justify-between bg-background/50 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="size-10 rounded-xl gradient-hero grid place-items-center text-primary-foreground shadow-glow-primary">
            <Leaf className="size-5" />
          </div>
          <div>
            <div className="font-display font-semibold text-xl leading-none">TenaMeal</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5 font-medium">Hospital Nutrition</div>
          </div>
        </div>
        <a href="#roles" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
          Access Portals <ArrowRight className="size-4 animate-pulse-glow" />
        </a>
      </header>

      <main className="relative z-10 flex-1 flex flex-col justify-center py-12">
        <section className="px-6 md:px-12 max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            
            {/* Left Hero Text */}
            <div className="space-y-6 text-left">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20">
                <ShieldCheck className="size-4 text-primary" /> Safe meals, every tray
              </div>
              <h1 className="font-display text-5xl md:text-7xl leading-[1.05] tracking-tight animate-fade-in-up">
                Doctor-approved meals,
                <span className="text-gradient-primary"> patient by patient.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl font-normal leading-relaxed">
                TenaMeal connects patients, nurses, doctors, and the kitchen — providing a secure verification pipeline so the wrong tray never reaches the right bed.
              </p>

              {/* Highlight Features */}
              <div className="pt-4 grid grid-cols-3 gap-4 max-w-lg">
                {[
                  { icon: QrCode, label: "QR-Verified Delivery" },
                  { icon: Activity, label: "Allergy Checker" },
                  { icon: ShieldCheck, label: "Physician Approval" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-start gap-2.5 p-3 rounded-xl bg-glass border border-border/40 shadow-soft">
                    <div className="size-9 rounded-lg bg-primary/10 grid place-items-center text-primary">
                      <Icon className="size-4" />
                    </div>
                    <span className="text-xs font-semibold text-foreground/80 leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side Live Facility Monitor */}
            <div className="p-6 md:p-8 rounded-3xl bg-glass-strong border border-border/60 shadow-soft space-y-6 relative">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  <h3 className="font-display font-medium text-lg">Facility Live Feed</h3>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-primary/15 text-primary font-bold px-2 py-0.5 rounded-full">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse-glow" /> Live
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-card border border-border/40 space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Inpatients</div>
                  <div className="text-3xl font-display font-bold text-foreground">{activePatients}</div>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border/40 space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pending Approvals</div>
                  <div className="text-3xl font-display font-bold text-amber-600">{pendingApprovals}</div>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border/40 space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Prep</div>
                  <div className="text-3xl font-display font-bold text-teal-600">{cookingCount}</div>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border/40 space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Trays Ready</div>
                  <div className="text-3xl font-display font-bold text-primary">{readyCount}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-2.5 text-xs text-muted-foreground leading-normal">
                <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Real-time status synchronizes roles across the clinic. Doctors approve dietary exceptions; kitchen staff scan QR codes for bedside verification.
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* Roles portals selection */}
        <section id="roles" className="px-6 md:px-12 py-16 max-w-6xl mx-auto w-full">
          <div className="flex flex-wrap items-end justify-between mb-8 gap-4 border-b border-border/40 pb-4">
            <div>
              <h2 className="font-display text-3xl font-medium">Select Portal Role</h2>
              <p className="text-sm text-muted-foreground mt-1">Authorized access points for medical and nutritional teams.</p>
            </div>
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/60 bg-muted px-2.5 py-1 rounded-md">
              Staging Environment
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {roles.map((r) => {
              const Icon = r.icon;
              return (
                <Link
                  key={r.to}
                  to={r.to}
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-glass p-6 hover:bg-glass-strong card-modern shadow-soft transition-all duration-300"
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${r.accent}`} />
                  <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-display text-xl font-medium text-foreground">{r.label}</h3>
                  <p className="text-sm text-muted-foreground mt-2 mb-6 min-h-[40px] leading-snug">{r.desc}</p>
                  <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Open Workspace <ArrowRight className="size-4 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/40 py-6 px-6 md:px-12 text-xs text-muted-foreground bg-background/50 backdrop-blur-md flex flex-wrap gap-4 justify-between items-center">
        <span>© TenaMeal — Modern Hospital Nutrition & Safety Network</span>
        <span>Secured, Doctor-Approved Service</span>
      </footer>
    </div>
  );
}
