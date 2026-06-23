import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useStore, type MenuItem, type Patient } from "@/lib/store";
import {
  Stethoscope, AlertTriangle, Check, X, Activity, ClipboardList, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/doctor")({
  head: () => ({ meta: [{ title: "Doctor Portal — TenaMeal" }] }),
  component: DoctorRoute,
});

function DoctorRoute() {
  return (
    <AppShell role="Doctor" nav={[{ to: "/doctor", label: "Approvals & patients", icon: Stethoscope }]}>
      <DoctorHome />
    </AppShell>
  );
}

function DoctorHome() {
  const meals = useStore((s) => s.meals);
  const patients = useStore((s) => s.patients.filter((p) => !p.discharged));
  const updateMeal = useStore((s) => s.updateMeal);
  const notify = useStore((s) => s.notify);
  const updatePatient = useStore((s) => s.updatePatient);

  const pending = meals.filter((m) => m.status === "pending_doctor");
  const inFlight = meals.filter((m) => ["approved", "preparing", "ready"].includes(m.status));

  const [reviewing, setReviewing] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [restrictionPatient, setRestrictionPatient] = useState<string | null>(null);
  const [planFor, setPlanFor] = useState<Patient | null>(null);
  const [tab, setTab] = useState<"queue" | "patients" | "alerts">("queue");

  // Calculate caloric data for chart
  const chartData = useMemo(() => {
    const groups = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    meals.filter((m) => ["approved", "preparing", "ready", "delivered"].includes(m.status)).forEach((m) => {
      const type = m.type as keyof typeof groups;
      if (groups[type] !== undefined) {
        groups[type] += m.calories;
      }
    });
    return Object.entries(groups).map(([name, calories]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      Calories: calories,
    }));
  }, [meals]);

  // critical alerts
  const alerts = useMemo(() => {
    const out: { patient: Patient; reason: string }[] = [];
    patients.forEach((p) => {
      const sys = parseInt(p.bp?.split("/")[0] ?? "", 10);
      const sugar = parseInt(p.sugar ?? "", 10);
      if (!Number.isNaN(sys) && sys >= 150) out.push({ patient: p, reason: `High BP ${p.bp}` });
      if (!Number.isNaN(sugar) && sugar >= 180) out.push({ patient: p, reason: `High sugar ${p.sugar}` });
      if (p.vitals[0] && Date.now() - p.vitals[0].at > 24 * 3600 * 1000) {
        out.push({ patient: p, reason: "No vitals in 24h" });
      }
    });
    return out;
  }, [patients]);

  // stats today
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayMeals = meals.filter((m) => new Date(m.createdAt).getTime() >= today.getTime());
  const stats = {
    approved: todayMeals.filter((m) => m.status === "approved" || m.status === "preparing" || m.status === "ready" || m.status === "delivered").length,
    rejected: todayMeals.filter((m) => m.status === "rejected").length,
    pending: pending.length,
  };

  const approve = (id: string) => {
    const m = meals.find((x) => x.id === id);
    updateMeal(id, { status: "approved", doctorNote: note || "Approved." });
    notify({ patientId: m?.patientId, role: "patient", message: `Your ${m?.mealName} has been approved.` });
    notify({ role: "kitchen", message: `New approved meal: ${m?.mealName}` });
    toast.success("Meal approved");
    setReviewing(null); setNote("");
  };
  const reject = (id: string) => {
    const m = meals.find((x) => x.id === id);
    updateMeal(id, { status: "rejected", rejectionReason: note || "Not suitable." });
    notify({ patientId: m?.patientId, role: "patient", message: `Your ${m?.mealName} was rejected. Reason: ${note || "Not suitable."}` });
    toast("Meal rejected", { description: note || "Not suitable." });
    setReviewing(null); setNote("");
  };

  const reviewMeal = meals.find((m) => m.id === reviewing);
  const reviewPatient = reviewMeal && patients.find((p) => p.id === reviewMeal.patientId);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            Medical Supervision
          </span>
          <h1 className="font-display text-3xl font-semibold mt-1">Doctor Portal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pending.length} pending reviews · {alerts.length} critical patient alerts
          </p>
        </div>
      </div>

      {/* Stats and Chart Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stats Column */}
        <div className="lg:col-span-1 grid sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <Stat label="Pending Queue" value={stats.pending} icon={ClipboardList} tone="warning" />
          <Stat label="Approved Today" value={stats.approved} icon={Check} tone="success" />
          <Stat label="Rejected Today" value={stats.rejected} icon={X} tone="danger" />
          <Stat label="Critical Vitals Alert" value={alerts.length} icon={AlertTriangle} tone={alerts.length ? "danger" : "muted"} />
        </div>

        {/* Nutritional Chart Column */}
        <Card className="lg:col-span-2 p-5 rounded-3xl border border-border/40 bg-glass shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-border/30">
            <div>
              <h3 className="font-semibold text-sm">Caloric Load by Meal Type</h3>
              <p className="text-xs text-muted-foreground">Sum of active calories approved across all inpatients.</p>
            </div>
            <TrendingUp className="size-4 text-primary" />
          </div>
          <div className="h-44 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="color-mix(in oklab, var(--border) 40%, transparent)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: "color-mix(in oklab, var(--primary) 5%, transparent)" }}
                  contentStyle={{ 
                    background: "var(--card)", 
                    borderColor: "var(--border)", 
                    borderRadius: "12px", 
                    fontSize: "12px" 
                  }} 
                />
                <Bar dataKey="Calories" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="flex gap-1.5 p-1 bg-muted/50 border border-border/30 rounded-2xl w-fit">
        {[
          { id: "queue" as const, label: `Queue (${pending.length})` },
          { id: "patients" as const, label: `Inpatients (${patients.length})` },
          { id: "alerts" as const, label: `Urgent (${alerts.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
              tab === t.id 
                ? "bg-card shadow-sm border border-border/40 text-foreground font-bold" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "queue" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {pending.length === 0 && (
              <Card className="p-12 text-center text-muted-foreground border-dashed border-border/80 col-span-full rounded-3xl bg-glass">
                <Check className="size-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="font-medium text-sm">All caught up — no pending approvals.</p>
              </Card>
            )}
            {pending.map((m) => {
              const p = patients.find((x) => x.id === m.patientId);
              const allergyHit = p?.allergies.some((a) =>
                m.ingredients.some((i) => i.toLowerCase().includes(a.toLowerCase())),
              );
              return (
                <Card 
                  key={m.id} 
                  className={`p-6 rounded-3xl border shadow-soft card-modern flex flex-col justify-between space-y-4 ${
                    allergyHit 
                      ? "border-destructive/40 bg-destructive/5 shadow-[0_0_12px_rgba(239,68,68,0.06)] animate-pulse-slow" 
                      : "border-border/50 bg-glass"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Room {p?.room} · {p?.name}</div>
                        <h3 className="font-display text-xl font-medium text-foreground mt-1">{m.mealName}</h3>
                        <div className="text-xs text-muted-foreground mt-0.5">{m.calories} kcal · {m.type}</div>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                    {allergyHit && (
                      <div className="flex gap-2 p-3 rounded-2xl bg-destructive/10 text-destructive text-xs leading-normal font-semibold">
                        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                        <span>Possible allergy conflict — check meal ingredients.</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.ingredients.map((i) => (
                        <span key={i} className="text-[10px] font-semibold text-muted-foreground bg-muted border border-border/30 px-2 py-0.5 rounded-full">{i}</span>
                      ))}
                    </div>
                    {p && (
                      <div className="pt-3 border-t border-border/30 text-xs space-y-1 text-muted-foreground">
                        <div><strong className="text-foreground/80">Conditions:</strong> {p.diseases.join(", ") || "—"}</div>
                        <div><strong className="text-foreground/80">Allergies:</strong> {p.allergies.join(", ") || "—"}</div>
                        <div><strong className="text-foreground/80">Diet directives:</strong> {p.restrictions.join(", ") || "—"}</div>
                      </div>
                    )}
                  </div>
                  <Button className="w-full rounded-xl" onClick={() => { setReviewing(m.id); setNote(""); }}>Review & Approve</Button>
                </Card>
              );
            })}
          </div>

          <div>
            <h2 className="font-display text-xl mb-4 font-medium">In Progress Meals</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {inFlight.length === 0 && (
                <Card className="p-6 text-center text-xs text-muted-foreground border-dashed rounded-2xl bg-glass/30 col-span-full">No meals in progress.</Card>
              )}
              {inFlight.map((m) => {
                const p = patients.find((x) => x.id === m.patientId);
                return (
                  <Card key={m.id} className="p-4 flex items-center justify-between rounded-2xl border border-border/40 bg-glass shadow-soft card-modern">
                    <div>
                      <div className="font-semibold text-foreground text-sm">{m.mealName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{p?.name} · Room {p?.room}</div>
                    </div>
                    <StatusBadge status={m.status} />
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "patients" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
          {patients.map((p) => (
            <Card key={p.id} className="p-5 rounded-3xl border border-border/45 bg-glass shadow-soft card-modern flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-foreground text-base">{p.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">ID: {p.id} · {p.age} yrs · {p.gender}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                    Rm {p.room}
                  </span>
                </div>
                
                <div className="pt-2 border-t border-border/30 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">BP</span>
                    <span className="font-semibold text-foreground">{p.bp ?? "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Sugar</span>
                    <span className="font-semibold text-foreground">{p.sugar ?? "—"}</span>
                  </div>
                </div>

                <div className="text-xs space-y-1 pt-1">
                  <div>
                    <span className="text-muted-foreground font-medium">Allergies: </span>
                    {p.allergies.length > 0 ? (
                      <span className="text-destructive font-semibold">{p.allergies.join(", ")}</span>
                    ) : (
                      <span className="text-muted-foreground/50">None</span>
                    )}
                  </div>
                  <div className="truncate">
                    <span className="text-muted-foreground font-medium">Directives: </span>
                    <span className="text-foreground/80">{p.restrictions.join(", ") || "None"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
                <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => setRestrictionPatient(p.id)}>
                  Restrictions
                </Button>
                <Button size="sm" className="rounded-xl text-xs" onClick={() => setPlanFor(p)}>
                  Prescribe Day
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "alerts" && (
        <div className="space-y-3">
          {alerts.length === 0 && (
            <Card className="p-12 text-center text-muted-foreground border-dashed rounded-3xl bg-glass">
              <Check className="size-8 mx-auto text-success mb-2" />
              <p className="font-medium text-sm">No critical alerts.</p>
            </Card>
          )}
          {alerts.map((a, i) => (
            <Card key={i} className="p-4 flex items-center justify-between border-destructive/30 bg-destructive/5 rounded-2xl shadow-soft hover:shadow-glow-primary transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-destructive/10 text-destructive grid place-items-center shrink-0">
                  <AlertTriangle className="size-5 animate-pulse-glow" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">{a.patient.name} (Room {a.patient.room})</div>
                  <div className="text-xs text-destructive font-semibold mt-0.5">{a.reason}</div>
                </div>
              </div>
              <Button size="sm" className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => setPlanFor(a.patient)}>
                Plan Meals
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Review dialog */}
      <Dialog open={!!reviewing} onOpenChange={() => setReviewing(null)}>
        <DialogContent>
          {reviewMeal && (
            <>
              <DialogHeader>
                <DialogTitle>Review meal</DialogTitle>
                <p className="text-sm text-muted-foreground">{reviewMeal.mealName} for {reviewPatient?.name}</p>
              </DialogHeader>
              <div className="space-y-3">
                <Textarea rows={3} placeholder="Doctor note or rejection reason..." value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => approve(reviewMeal.id)}>
                    <Check className="size-4 mr-1.5" /> Approve
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => reject(reviewMeal.id)}>
                    <X className="size-4 mr-1.5" /> Reject
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Restriction dialog */}
      <Dialog open={!!restrictionPatient} onOpenChange={() => setRestrictionPatient(null)}>
        <DialogContent>
          {restrictionPatient && (
            <RestrictionEditor patientId={restrictionPatient} onClose={() => setRestrictionPatient(null)} updatePatient={updatePatient} />
          )}
        </DialogContent>
      </Dialog>

      {/* Prescribe day plan dialog */}
      <Dialog open={!!planFor} onOpenChange={() => setPlanFor(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {planFor && <PrescribePlan patient={planFor} onDone={() => setPlanFor(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Check; tone: "success" | "warning" | "danger" | "muted" }) {
  const toneClass = {
    success: "text-success bg-success/10",
    warning: "text-accent-foreground bg-accent/30",
    danger: "text-destructive bg-destructive/10",
    muted: "text-muted-foreground bg-muted",
  }[tone];
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={`size-10 rounded-lg grid place-items-center ${toneClass}`}><Icon className="size-5" /></div>
      <div>
        <div className="text-2xl font-display leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </Card>
  );
}

function PrescribePlan({ patient, onDone }: { patient: Patient; onDone: () => void }) {
  const menu = useStore((s) => s.menu);
  const prescribe = useStore((s) => s.prescribeMeal);
  const conflicts = (item: MenuItem) =>
    patient.allergies.some((a) => item.ingredients.some((i) => i.toLowerCase().includes(a.toLowerCase())));

  const slots: { type: "breakfast" | "lunch" | "dinner"; hour: number }[] = [
    { type: "breakfast", hour: 8 },
    { type: "lunch", hour: 13 },
    { type: "dinner", hour: 19 },
  ];

  const [picks, setPicks] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  const submit = () => {
    const tomorrow = new Date();
    let count = 0;
    slots.forEach((slot) => {
      const id = picks[slot.type];
      if (!id) return;
      const item = menu.find((m) => m.id === id);
      if (!item) return;
      const when = new Date(tomorrow);
      when.setHours(slot.hour, 0, 0, 0);
      prescribe({
        patientId: patient.id,
        mealName: item.name,
        type: slot.type,
        scheduledFor: when.toISOString(),
        calories: item.calories,
        ingredients: item.ingredients,
        doctorNote: note || "Prescribed by doctor.",
      });
      count++;
    });
    if (count === 0) {
      toast.error("Pick at least one meal");
      return;
    }
    toast.success(`Prescribed ${count} meals for ${patient.name}`);
    onDone();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Prescribe day plan</DialogTitle>
        <p className="text-sm text-muted-foreground">{patient.name} · {patient.diseases.join(", ") || "—"}</p>
      </DialogHeader>
      <div className="space-y-5">
        {slots.map((slot) => (
          <div key={slot.type}>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              {slot.type} · {slot.hour}:00
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {menu.filter((m) => m.type === slot.type).map((item) => {
                const danger = conflicts(item);
                const selected = picks[slot.type] === item.id;
                return (
                  <button
                    key={item.id}
                    disabled={danger}
                    onClick={() => setPicks({ ...picks, [slot.type]: item.id })}
                    className={`text-left p-3 rounded-lg border text-sm transition ${
                      selected ? "border-primary bg-primary-soft" : "border-border bg-card"
                    } ${danger ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50"}`}
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.calories} kcal</div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {item.tags.slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted">{t}</span>
                      ))}
                    </div>
                    {danger && (
                      <div className="text-[11px] text-destructive mt-1.5 flex items-center gap-1">
                        <AlertTriangle className="size-3" /> Allergy conflict
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <Textarea rows={2} placeholder="Note for kitchen / patient" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button onClick={submit} className="w-full">Prescribe selected meals</Button>
      </div>
    </>
  );
}

function RestrictionEditor({
  patientId, onClose, updatePatient,
}: {
  patientId: string;
  onClose: () => void;
  updatePatient: (id: string, patch: Partial<{ restrictions: string[] }>) => void;
}) {
  const patient = useStore((s) => s.patients.find((p) => p.id === patientId))!;
  const [v, setV] = useState(patient.restrictions.join(", "));
  const save = () => {
    updatePatient(patientId, { restrictions: v.split(",").map((x) => x.trim()).filter(Boolean) });
    toast.success("Restrictions updated");
    onClose();
  };
  return (
    <>
      <DialogHeader>
        <DialogTitle>{patient.name}</DialogTitle>
        <p className="text-sm text-muted-foreground">Dietary restrictions (comma-separated)</p>
      </DialogHeader>
      <Textarea rows={3} value={v} onChange={(e) => setV(e.target.value)} />
      <Button onClick={save}>Save</Button>
    </>
  );
}
