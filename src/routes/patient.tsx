import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { QRCode } from "@/components/QRCode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import {
  CalendarDays, Utensils, History, Bell, LogOut, QrCode as QrIcon,
  AlertTriangle, Star, Plus, User, Activity, Pill, Heart,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/patient")({
  head: () => ({ meta: [{ title: "Patient Portal — TenaMeal" }] }),
  component: PatientRoute,
});

function PatientRoute() {
  const currentPatientId = useStore((s) => s.currentPatientId);
  return (
    <AppShell role="Patient" nav={[{ to: "/patient", label: "My meals", icon: Utensils }]}>
      {currentPatientId ? <PatientHome /> : <PatientLogin />}
    </AppShell>
  );
}

function PatientLogin() {
  const [id, setId] = useState("PT-1042");
  const [showQR, setShowQR] = useState(false);
  const loginPatient = useStore((s) => s.loginPatient);

  const handleLogin = () => {
    if (loginPatient(id.trim())) toast.success("Welcome back");
    else toast.error("Patient ID not found. Try PT-1042, PT-1058, or PT-1071.");
  };

  return (
    <div className="max-w-md mx-auto pt-8">
      <Card className="p-8 shadow-soft">
        <h2 className="font-display text-2xl">Patient sign in</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Use your Patient ID or scan your wristband QR.
        </p>
        <div className="mt-6 space-y-3">
          <label className="text-sm font-medium">Patient ID</label>
          <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="PT-1042" className="h-11" />
          <Button className="w-full h-11" onClick={handleLogin}>Sign in</Button>
          <Button variant="outline" className="w-full h-11" onClick={() => setShowQR((v) => !v)}>
            <QrIcon className="size-4 mr-2" /> {showQR ? "Hide" : "Show"} demo QR
          </Button>
        </div>
        {showQR && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <QRCode value={id || "PT-1042"} />
            <p className="text-xs text-muted-foreground">Scanning would log you in instantly.</p>
          </div>
        )}
        <div className="mt-8 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
          <strong className="text-foreground">Demo IDs:</strong> PT-1042, PT-1058, PT-1071
        </div>
      </Card>
    </div>
  );
}

function PatientHome() {
  const pid = useStore((s) => s.currentPatientId)!;
  const patient = useStore((s) => s.patients.find((p) => p.id === pid));
  const meals = useStore((s) => s.meals.filter((m) => m.patientId === pid));
  const notifs = useStore((s) =>
    s.notifications.filter((n) => n.patientId === pid || n.role === "patient"),
  );
  const logout = useStore((s) => s.logoutPatient);
  const addMeal = useStore((s) => s.addMeal);
  const updateMeal = useStore((s) => s.updateMeal);

  const [tab, setTab] = useState<"today" | "schedule" | "history" | "profile" | "notif">("today");

  const today = useMemo(
    () => meals.filter((m) => m.status !== "delivered" && m.status !== "rejected"),
    [meals],
  );
  const history = useMemo(
    () => meals.filter((m) => m.status === "delivered" || m.status === "rejected"),
    [meals],
  );

  if (!patient) return null;

  const requestMeal = () => {
    const options = [
      { name: "Vegetable Soup", type: "lunch" as const, cal: 280, ing: ["Carrot", "Celery", "Tomato"] },
      { name: "Grilled Fish with Quinoa", type: "dinner" as const, cal: 460, ing: ["Tilapia", "Quinoa", "Lemon"] },
      { name: "Fruit Bowl", type: "snack" as const, cal: 150, ing: ["Apple", "Banana", "Berries"] },
    ];
    const pick = options[Math.floor(Math.random() * options.length)];
    addMeal({
      patientId: pid,
      mealName: pick.name,
      type: pick.type,
      scheduledFor: new Date(Date.now() + 3600000 * 2).toISOString(),
      calories: pick.cal,
      ingredients: pick.ing,
    });
    toast.success("Meal request sent for doctor approval");
  };

  // weekly schedule view (next 3 days)
  const scheduleDays = useMemo(() => {
    const days: { date: Date; meals: typeof meals }[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      const dayMeals = meals.filter((m) => {
        const md = new Date(m.scheduledFor);
        return md.toDateString() === d.toDateString();
      }).sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
      days.push({ date: d, meals: dayMeals });
    }
    return days;
  }, [meals]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Patient Greeting Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-glass border border-border/50 p-6 md:p-8 shadow-soft">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Utensils className="size-32" />
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
              <span className="size-1.5 rounded-full bg-primary animate-pulse-glow" /> Patient dashboard
            </div>
            <h1 className="font-display text-3xl font-semibold text-foreground mt-1">Hello, {patient.name}</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Room <span className="text-foreground font-semibold">{patient.room}</span> · Primary Care: <span className="text-foreground font-semibold">{patient.doctor}</span> · {patient.age} yrs
            </p>
          </div>
          <Button variant="outline" className="rounded-xl border-border/60 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-colors" onClick={logout}>
            <LogOut className="size-4 mr-2" /> Sign out
          </Button>
        </div>

        {patient.allergies.length > 0 && (
          <div className="mt-5 flex items-start gap-3 p-3.5 rounded-2xl bg-destructive/5 border border-destructive/20 text-sm">
            <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5 animate-pulse-glow" />
            <div>
              <span className="font-bold text-destructive text-xs uppercase tracking-wider block">Allergy conflicts flagged</span>
              <span className="text-foreground/80 text-sm mt-0.5 block">{patient.allergies.join(", ")}</span>
            </div>
          </div>
        )}
      </div>

      {/* Modern Segmented Navigation Control */}
      <div className="flex gap-1.5 p-1 bg-muted/50 border border-border/30 backdrop-blur-md rounded-2xl w-fit overflow-x-auto max-w-full">
        {[
          { id: "today" as const, label: "Today's Tray", icon: Utensils },
          { id: "schedule" as const, label: "Weekly Schedule", icon: CalendarDays },
          { id: "history" as const, label: "Order History", icon: History },
          { id: "profile" as const, label: "Health File", icon: User },
          { id: "notif" as const, label: `Alerts (${notifs.length})`, icon: Bell },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${
              tab === t.id 
                ? "bg-card shadow-sm border border-border/40 text-foreground font-bold" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="size-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "today" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-display text-2xl font-medium">Meal tracking</h2>
              <p className="text-xs text-muted-foreground">Monitor nutritional delivery pipeline in real-time.</p>
            </div>
            <Button className="rounded-xl shadow-soft" size="sm" onClick={requestMeal}>
              <Plus className="size-4 mr-1.5" /> Request meal
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {today.length === 0 && (
              <Card className="p-12 text-center text-muted-foreground border-dashed border-border/80 col-span-full rounded-3xl bg-glass">
                <Utensils className="size-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="font-medium text-sm">No meals active for today.</p>
                <p className="text-xs mt-1">Tap "Request meal" to order doctor-approved items.</p>
              </Card>
            )}
            
            {today.map((m) => {
              const steps = [
                { id: "pending_doctor", label: "Requested" },
                { id: "approved", label: "Approved" },
                { id: "preparing", label: "Cooking" },
                { id: "ready", label: "Transit" },
                { id: "delivered", label: "Served" },
              ];
              const statusIndex = {
                pending_doctor: 0,
                approved: 1,
                preparing: 2,
                ready: 3,
                delivered: 4,
                rejected: -1,
              }[m.status] ?? 0;

              return (
                <Card key={m.id} className="p-6 rounded-3xl border border-border/50 bg-glass shadow-soft space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">{m.type}</span>
                      <h3 className="font-display text-xl font-medium text-foreground mt-2">{m.mealName}</h3>
                      <div className="text-xs text-muted-foreground mt-1">
                        Scheduled: {new Date(m.scheduledFor).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {m.calories} kcal
                      </div>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {m.ingredients.map((i) => (
                      <span key={i} className="text-[10px] font-semibold text-muted-foreground bg-muted border border-border/30 px-2.5 py-0.5 rounded-full">{i}</span>
                    ))}
                  </div>

                  {/* Horizontal visual stepper */}
                  {m.status === "rejected" ? (
                    <div className="p-3 rounded-2xl bg-destructive/5 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                      <AlertTriangle className="size-4 shrink-0" />
                      <span>Meal rejected by doctor: {m.rejectionReason}</span>
                    </div>
                  ) : (
                    <div className="pt-2 pb-1">
                      <div className="relative flex items-center justify-between">
                        {/* Background line */}
                        <div className="absolute top-[9px] left-1.5 right-1.5 h-0.5 bg-muted/60 -translate-y-1/2 z-0" />
                        {/* Completed progress line */}
                        <div 
                          className="absolute top-[9px] left-1.5 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500" 
                          style={{ width: `${(statusIndex / 4) * 98}%` }}
                        />
                        {steps.map((st, idx) => {
                          const isCompleted = idx <= statusIndex;
                          const isActive = idx === statusIndex;
                          return (
                            <div key={st.id} className="relative z-10 flex flex-col items-center gap-1.5">
                              <div className={`size-4.5 rounded-full border-2 grid place-items-center transition-all duration-300 ${
                                isCompleted && !isActive
                                  ? "bg-primary border-primary text-primary-foreground text-[9px] font-bold" 
                                  : isActive 
                                    ? "bg-card border-primary text-primary ring-4 ring-primary/15 animate-pulse-glow" 
                                    : "bg-card border-muted-foreground/30 text-muted-foreground/30"
                              }`}>
                                {isCompleted && !isActive ? "✓" : ""}
                              </div>
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                isActive ? "text-primary" : "text-muted-foreground/60"
                              }`}>{st.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {m.doctorNote && (
                    <div className="mt-3 text-xs p-3 rounded-2xl bg-primary-soft text-primary border border-primary/10">
                      <strong>Physician Note:</strong> {m.doctorNote}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {tab === "schedule" && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-medium">Upcoming Schedule</h2>
            <p className="text-xs text-muted-foreground">Approved meal calendar for the coming days.</p>
          </div>
          <div className="space-y-6">
            {scheduleDays.map((d) => (
              <div key={d.date.toISOString()} className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
                  {d.date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                </div>
                {d.meals.length === 0 ? (
                  <Card className="p-4 text-xs text-muted-foreground border-dashed border-border/60 rounded-2xl bg-glass/30">No meals planned for this date.</Card>
                ) : (
                  <div className="relative pl-6 space-y-4 border-l-2 border-border/50 ml-2">
                    {d.meals.map((m) => (
                      <div key={m.id} className="relative">
                        <div className="absolute -left-[1.72rem] top-2 size-3.5 rounded-full bg-primary border-4 border-background" />
                        <Card className="p-4 flex flex-wrap gap-4 justify-between items-center rounded-2xl border border-border/40 bg-glass hover:bg-glass-strong transition-all duration-300">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {m.type} · {new Date(m.scheduledFor).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            <div className="font-semibold text-foreground mt-0.5">{m.mealName}</div>
                          </div>
                          <StatusBadge status={m.status} />
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-2xl font-medium">Order History</h2>
            <p className="text-xs text-muted-foreground">Review past meals served and provide nutritional feedback.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {history.length === 0 && (
              <Card className="p-12 text-center text-muted-foreground col-span-full border-dashed rounded-3xl bg-glass">No meal history yet.</Card>
            )}
            {history.map((m) => (
              <Card key={m.id} className="p-5 rounded-2xl border border-border/40 bg-glass space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-foreground">{m.mealName}</div>
                      <div className="text-xs text-muted-foreground capitalize mt-0.5">
                        {m.type} · {new Date(m.scheduledFor).toLocaleDateString()}
                      </div>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                  {m.rejectionReason && (
                    <div className="text-xs p-2.5 rounded-xl bg-destructive/5 text-destructive border border-destructive/10">
                      Rejected: {m.rejectionReason}
                    </div>
                  )}
                </div>

                {m.status === "delivered" && (
                  <div className="border-t border-border/40 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Rate this meal</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => updateMeal(m.id, { rating: n })}
                            className={`transition-transform duration-200 hover:scale-125 ${
                              n <= (m.rating ?? 0) ? "text-accent fill-current" : "text-muted-foreground/30"
                            }`}
                          >
                            <Star className="size-4.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <FeedbackBox mealId={m.id} initial={m.feedback ?? ""} />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "profile" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="p-6 md:col-span-2 space-y-6 rounded-3xl border border-border/40 bg-glass shadow-soft">
            <div>
              <h3 className="font-display text-xl font-medium">Medical Profile</h3>
              <p className="text-xs text-muted-foreground">Registered diagnostic information and diet directives.</p>
            </div>
            
            {/* Redesigned Vitals overview widgets */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-card border border-border/30 flex items-center gap-3.5">
                <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 shadow-soft">
                  <Heart className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Blood Pressure</div>
                  <div className="text-base font-semibold text-foreground mt-0.5">{patient.bp ?? "—"}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border/30 flex items-center gap-3.5">
                <div className="size-10 rounded-xl bg-accent/20 text-accent-foreground grid place-items-center shrink-0 shadow-soft">
                  <Activity className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Blood Sugar</div>
                  <div className="text-base font-semibold text-foreground mt-0.5">{patient.sugar ?? "—"}</div>
                </div>
              </div>
            </div>

            <div className="border-t border-border/40 pt-4 grid sm:grid-cols-2 gap-4 text-xs">
              <ProfileRow icon={User} label="Weight / Height" value={`${patient.weight ?? "—"} kg / ${patient.height ?? "—"} cm`} />
              <ProfileRow icon={AlertTriangle} label="Allergies" value={patient.allergies.join(", ") || "None"} />
              <ProfileRow icon={Activity} label="Conditions" value={patient.diseases.join(", ") || "None"} />
              <ProfileRow icon={Pill} label="Medications" value={patient.medications.join(", ") || "None"} />
              <ProfileRow icon={Utensils} label="Dietary restrictions" value={patient.restrictions.join(", ") || "None"} />
              <ProfileRow icon={User} label="Emergency contact" value={patient.emergencyContact ?? "—"} />
            </div>
          </Card>
          
          <Card className="p-6 flex flex-col items-center justify-between text-center gap-4 rounded-3xl border border-border/40 bg-glass shadow-soft">
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Digital Wristband</div>
              <p className="text-[11px] text-muted-foreground">Identify yourself for medication and meals.</p>
            </div>
            
            <div className="p-3 bg-white rounded-2xl shadow-soft border border-border/30 relative overflow-hidden group">
              <QRCode value={patient.id} size={150} />
              {/* Futuristic scanline element */}
              <div className="absolute inset-x-0 h-0.5 bg-primary/40 animate-scanline pointer-events-none" />
            </div>
            
            <div className="space-y-1">
              <div className="font-mono text-lg font-bold text-foreground">{patient.id}</div>
              <p className="text-[10px] text-muted-foreground max-w-[200px]">
                Hospital staff scans this QR code at bedside to complete tray delivery verification.
              </p>
            </div>
          </Card>

          <Card className="p-6 md:col-span-3 rounded-3xl border border-border/40 bg-glass shadow-soft">
            <h3 className="font-display text-lg font-medium mb-4">Diagnostic Vitals Log</h3>
            {patient.vitals.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">No logs recorded.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/40">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Timestamp</th>
                      <th className="text-left p-3">BP</th>
                      <th className="text-left p-3">Sugar</th>
                      <th className="text-left p-3">Pulse</th>
                      <th className="text-left p-3">Logged By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.vitals.map((v) => (
                      <tr key={v.id} className="border-t border-border/30 hover:bg-muted/10 transition-colors">
                        <td className="p-3 font-medium">{new Date(v.at).toLocaleString()}</td>
                        <td className="p-3">{v.bp ?? "—"}</td>
                        <td className="p-3 font-semibold text-foreground/80">{v.sugar ?? "—"}</td>
                        <td className="p-3">{v.pulse ? `${v.pulse} bpm` : "—"}</td>
                        <td className="p-3 text-muted-foreground">{v.by ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "notif" && (
        <div className="space-y-3">
          <div>
            <h2 className="font-display text-2xl font-medium">Alert Notifications</h2>
            <p className="text-xs text-muted-foreground">Broadcast logs relating to patient care and meal requests.</p>
          </div>
          <div className="space-y-3">
            {notifs.length === 0 && (
              <Card className="p-12 text-center text-muted-foreground border-dashed rounded-3xl bg-glass">No alerts.</Card>
            )}
            {notifs.map((n) => (
              <Card key={n.id} className="p-4 rounded-2xl border border-border/40 bg-glass flex items-start gap-4 shadow-soft transition-all duration-300 hover:border-primary/20">
                <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                  <Bell className="size-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-sm font-medium text-foreground">{n.message}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackBox({ mealId, initial }: { mealId: string; initial: string }) {
  const updateMeal = useStore((s) => s.updateMeal);
  const [v, setV] = useState(initial);
  const [editing, setEditing] = useState(!initial);
  if (!editing) {
    return (
      <div className="text-xs p-2 rounded bg-muted flex items-start justify-between gap-3">
        <span className="text-muted-foreground italic">"{v}"</span>
        <button onClick={() => setEditing(true)} className="text-primary">Edit</button>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <Textarea
        rows={2}
        placeholder="Leave a comment about this meal..."
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => { updateMeal(mealId, { feedback: v }); setEditing(false); toast.success("Thanks for the feedback"); }}>
          Save
        </Button>
        {initial && <Button size="sm" variant="ghost" onClick={() => { setV(initial); setEditing(false); }}>Cancel</Button>}
      </div>
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value }: { icon: typeof Heart; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="size-8 rounded-lg bg-primary-soft text-primary grid place-items-center shrink-0">
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}
