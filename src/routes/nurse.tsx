import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { QRCode } from "@/components/QRCode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore, type Patient } from "@/lib/store";
import {
  Users, UserPlus, Activity, Search, LogOut, BedDouble, AlertTriangle, Check,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/nurse")({
  head: () => ({ meta: [{ title: "Nurse Portal — TenaMeal" }] }),
  component: NurseRoute,
});

function NurseRoute() {
  return (
    <AppShell
      role="Nurse / Staff"
      nav={[
        { to: "/nurse", label: "Patients", icon: Users },
      ]}
    >
      <NurseHome />
    </AppShell>
  );
}

function NurseHome() {
  const patients = useStore((s) => s.patients);
  const meals = useStore((s) => s.meals);
  const dischargePatient = useStore((s) => s.dischargePatient);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [vitalsFor, setVitalsFor] = useState<Patient | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"active" | "rounds" | "discharged">("active");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients.filter((p) => {
      if (tab === "active" && p.discharged) return false;
      if (tab === "discharged" && !p.discharged) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.room.toLowerCase().includes(q) ||
        p.diseases.some((d) => d.toLowerCase().includes(q))
      );
    });
  }, [patients, query, tab]);

  // rounds: who needs vitals (no log in last 8h)
  const dueForRounds = useMemo(() => {
    const cutoff = Date.now() - 8 * 3600 * 1000;
    return patients
      .filter((p) => !p.discharged)
      .map((p) => ({ p, last: p.vitals[0]?.at ?? 0 }))
      .filter((x) => x.last < cutoff)
      .sort((a, b) => a.last - b.last);
  }, [patients]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header and Action Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-glass border border-border/50 p-6 md:p-8 shadow-soft flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            Clinical Registry
          </div>
          <h1 className="font-display text-3xl font-semibold mt-1">Patient Registry</h1>
          <p className="text-sm text-muted-foreground font-medium">
            {patients.filter((p) => !p.discharged).length} active inpatients · {dueForRounds.length} due for vitals check
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-glow-primary">
              <UserPlus className="size-4 mr-2" /> Register Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Register new patient</DialogTitle></DialogHeader>
            <RegisterForm onDone={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, patient ID, room, or illness..."
            className="pl-10 h-11 rounded-xl bg-glass border-border/60 focus:border-primary/50 text-sm"
          />
        </div>
        <div className="flex gap-1.5 p-1 bg-muted/50 border border-border/30 rounded-2xl">
          {(["active", "rounds", "discharged"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                tab === t 
                  ? "bg-card shadow-sm border border-border/40 text-foreground font-bold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "rounds" ? `Rounds (${dueForRounds.length})` : `${t} cases`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      {tab === "rounds" ? (
        <div className="space-y-3">
          {dueForRounds.length === 0 && (
            <Card className="p-12 text-center text-muted-foreground border-dashed border-border/80 rounded-3xl bg-glass">
              <Check className="size-10 mx-auto text-success mb-3 animate-pulse-glow" />
              <p className="font-semibold text-sm">All patients have fresh vitals logged.</p>
              <p className="text-xs mt-1">Excellent! Checks are up to date.</p>
            </Card>
          )}
          {dueForRounds.map(({ p, last }) => {
            const hours = last ? Math.round((Date.now() - last) / 3600000) : null;
            const isCriticalTime = !last || (hours && hours >= 12);
            return (
              <Card key={p.id} className={`p-4 rounded-2xl border shadow-soft card-modern flex flex-wrap items-center gap-4 justify-between transition-all duration-300 ${
                isCriticalTime ? "border-destructive/30 bg-destructive/5" : "border-border/40 bg-glass"
              }`}>
                <div>
                  <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                    {p.name}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">Room {p.room}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <span className={`inline-block size-2 rounded-full ${isCriticalTime ? "bg-destructive animate-pulse-glow" : "bg-warning"}`} />
                    Last logged: {last ? (
                      <span className={isCriticalTime ? "text-destructive font-bold" : "font-medium text-foreground/80"}>{hours}h ago</span>
                    ) : (
                      <span className="text-destructive font-bold uppercase tracking-wider text-[10px]">Never logged</span>
                    )}
                  </div>
                </div>
                <Button size="sm" className="rounded-xl" onClick={() => setVitalsFor(p)}>
                  <Activity className="size-4 mr-1.5" /> Log vitals
                </Button>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
          {filtered.length === 0 && (
            <Card className="p-12 text-center text-muted-foreground border-dashed border-border/80 col-span-full rounded-3xl bg-glass">No patients match your search criteria.</Card>
          )}
          {filtered.map((p) => {
            const active = meals.filter((m) => m.patientId === p.id && m.status !== "delivered" && m.status !== "rejected").length;
            return (
              <Card key={p.id} className={`p-5 rounded-3xl border shadow-soft card-modern flex flex-col justify-between space-y-4 ${p.discharged ? "opacity-60 bg-muted/40" : "bg-glass"}`}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelected(p)}>
                    <div>
                      <h3 className="font-semibold text-foreground text-base hover:text-primary transition-colors">{p.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.id} · {p.age} yrs · {p.gender}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                      <BedDouble className="size-3.5 inline mr-1 shrink-0" /> Rm {p.room}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-foreground/70 flex items-center gap-1.5">
                    <span>Care Team:</span>
                    <span className="text-primary">{p.doctor}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.diseases.slice(0, 2).map((d) => (
                      <span key={d} className="text-[10px] font-semibold text-muted-foreground bg-muted border border-border/30 px-2 py-0.5 rounded-full">{d}</span>
                    ))}
                    {p.allergies.length > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-destructive bg-destructive/10 border border-destructive/20 px-2.5 py-0.5 rounded-full">
                        <AlertTriangle className="size-3 inline mr-0.5 shrink-0" />
                        {p.allergies.length} allergy
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-border/30">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <div>
                      BP <strong className="text-foreground/80">{p.bp ?? "—"}</strong> · Sugar <strong className="text-foreground/80">{p.sugar ?? "—"}</strong>
                    </div>
                    <div>
                      <strong className="text-primary font-semibold">{active}</strong> active meal{active === 1 ? "" : "s"}
                    </div>
                  </div>

                  {!p.discharged && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="flex-1 rounded-xl" onClick={() => setVitalsFor(p)}>
                        <Activity className="size-3.5 mr-1.5" /> Vitals
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl hover:bg-destructive/5 hover:text-destructive transition-colors border border-border/30"
                        onClick={() => {
                          if (confirm(`Discharge patient ${p.name}?`)) {
                            dischargePatient(p.id);
                            toast.success(`${p.name} discharged`);
                          }
                        }}
                      >
                        <LogOut className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && <PatientDetail patient={selected} onClose={() => setSelected(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!vitalsFor} onOpenChange={() => setVitalsFor(null)}>
        <DialogContent>
          {vitalsFor && <VitalsForm patient={vitalsFor} onDone={() => setVitalsFor(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const addPatient = useStore((s) => s.addPatient);
  const [f, setF] = useState({
    name: "", age: "", gender: "F" as "M" | "F", room: "", doctor: "Dr. Alemu",
    weight: "", height: "", bp: "", sugar: "",
    diseases: "", allergies: "", medications: "", restrictions: "",
    emergencyContact: "",
  });
  const [created, setCreated] = useState<Patient | null>(null);

  if (created) {
    return (
      <div className="text-center py-4 space-y-4">
        <h3 className="font-display text-xl">Patient registered</h3>
        <p className="text-sm text-muted-foreground">
          Wristband QR is ready. {created.name} has been added to Rm {created.room}.
        </p>
        <div className="flex justify-center"><QRCode value={created.id} /></div>
        <Button onClick={onDone} className="mt-2">Done</Button>
      </div>
    );
  }

  const submit = () => {
    if (!f.name || !f.room || !f.age) {
      toast.error("Name, age, and room are required");
      return;
    }
    const p = addPatient({
      name: f.name, age: parseInt(f.age, 10), gender: f.gender, room: f.room, doctor: f.doctor,
      weight: f.weight ? parseFloat(f.weight) : undefined,
      height: f.height ? parseFloat(f.height) : undefined,
      bp: f.bp || undefined, sugar: f.sugar || undefined,
      diseases: csv(f.diseases), allergies: csv(f.allergies),
      medications: csv(f.medications), restrictions: csv(f.restrictions),
      emergencyContact: f.emergencyContact || undefined,
    });
    setCreated(p);
    toast.success("Patient registered");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Full name" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
        <Field label="Age" type="number" value={f.age} onChange={(v) => setF({ ...f, age: v })} />
        <div>
          <Label className="text-xs">Gender</Label>
          <div className="flex gap-2 mt-1.5">
            {(["F", "M"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setF({ ...f, gender: g })}
                className={`flex-1 h-9 rounded-md border text-sm ${
                  f.gender === g ? "bg-primary text-primary-foreground border-primary" : "border-input"
                }`}
              >
                {g === "F" ? "Female" : "Male"}
              </button>
            ))}
          </div>
        </div>
        <Field label="Room number" value={f.room} onChange={(v) => setF({ ...f, room: v })} />
        <Field label="Assigned doctor" value={f.doctor} onChange={(v) => setF({ ...f, doctor: v })} />
        <Field label="Emergency contact" value={f.emergencyContact} onChange={(v) => setF({ ...f, emergencyContact: v })} />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <Field label="Weight (kg)" value={f.weight} onChange={(v) => setF({ ...f, weight: v })} />
        <Field label="Height (cm)" value={f.height} onChange={(v) => setF({ ...f, height: v })} />
        <Field label="Blood pressure" value={f.bp} onChange={(v) => setF({ ...f, bp: v })} placeholder="120/80" />
        <Field label="Blood sugar" value={f.sugar} onChange={(v) => setF({ ...f, sugar: v })} placeholder="92 mg/dL" />
      </div>
      <Area label="Diseases (comma-separated)" value={f.diseases} onChange={(v) => setF({ ...f, diseases: v })} />
      <Area label="Allergies (comma-separated)" value={f.allergies} onChange={(v) => setF({ ...f, allergies: v })} />
      <Area label="Medications (comma-separated)" value={f.medications} onChange={(v) => setF({ ...f, medications: v })} />
      <Area label="Dietary restrictions (comma-separated)" value={f.restrictions} onChange={(v) => setF({ ...f, restrictions: v })} />
      <Button className="w-full" onClick={submit}>Register & generate QR</Button>
    </div>
  );
}

function VitalsForm({ patient, onDone }: { patient: Patient; onDone: () => void }) {
  const logVitals = useStore((s) => s.logVitals);
  const [bp, setBp] = useState("");
  const [sugar, setSugar] = useState("");
  const [pulse, setPulse] = useState("");
  const [temp, setTemp] = useState("");
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");

  const save = () => {
    if (!bp && !sugar && !pulse && !temp && !weight) {
      toast.error("Enter at least one vital");
      return;
    }
    logVitals(patient.id, {
      bp: bp || undefined,
      sugar: sugar || undefined,
      pulse: pulse || undefined,
      temp: temp || undefined,
      weight: weight ? parseFloat(weight) : undefined,
      note: note || undefined,
      by: "Nurse on duty",
    });
    toast.success("Vitals logged");
    onDone();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Log vitals — {patient.name}</DialogTitle>
        <p className="text-sm text-muted-foreground">Rm {patient.room} · {patient.id}</p>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Blood pressure" value={bp} onChange={setBp} placeholder="120/80" />
        <Field label="Blood sugar" value={sugar} onChange={setSugar} placeholder="95 mg/dL" />
        <Field label="Pulse (bpm)" value={pulse} onChange={setPulse} placeholder="72" />
        <Field label="Temperature (°C)" value={temp} onChange={setTemp} placeholder="36.8" />
        <Field label="Weight (kg)" value={weight} onChange={setWeight} />
      </div>
      <Area label="Note" value={note} onChange={setNote} />
      <Button onClick={save} className="w-full">Save vitals</Button>
      {patient.vitals.length > 0 && (
        <div className="mt-2 max-h-40 overflow-y-auto border-t border-border pt-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Recent</div>
          <div className="space-y-1.5 text-xs">
            {patient.vitals.slice(0, 5).map((v) => (
              <div key={v.id} className="flex justify-between bg-muted rounded px-2 py-1.5">
                <span>{new Date(v.at).toLocaleString()}</span>
                <span className="text-muted-foreground">
                  {[v.bp && `BP ${v.bp}`, v.sugar && `Sugar ${v.sugar}`, v.pulse && `Pulse ${v.pulse}`].filter(Boolean).join(" · ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function PatientDetail({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const meals = useStore((s) => s.meals.filter((m) => m.patientId === patient.id));
  return (
    <div className="space-y-5">
      <DialogHeader>
        <DialogTitle>{patient.name}</DialogTitle>
        <p className="text-sm text-muted-foreground">{patient.id} · Room {patient.room} · {patient.doctor}</p>
      </DialogHeader>

      <div className="grid grid-cols-[1fr_auto] gap-4">
        <div className="space-y-3 text-sm">
          <Info label="Diseases" value={patient.diseases.join(", ") || "—"} />
          <Info label="Allergies" value={patient.allergies.join(", ") || "—"} tone="danger" />
          <Info label="Medications" value={patient.medications.join(", ") || "—"} />
          <Info label="Restrictions" value={patient.restrictions.join(", ") || "—"} />
          <Info label="Emergency contact" value={patient.emergencyContact ?? "—"} />
        </div>
        <QRCode value={patient.id} size={130} />
      </div>

      <div className="border-t border-border pt-4">
        <h4 className="font-medium mb-3 text-sm">Vitals history ({patient.vitals.length})</h4>
        {patient.vitals.length === 0 ? (
          <div className="text-xs text-muted-foreground">No vitals logged yet.</div>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {patient.vitals.map((v) => (
              <div key={v.id} className="text-xs flex justify-between p-2 bg-muted rounded">
                <span>{new Date(v.at).toLocaleString()}</span>
                <span className="text-muted-foreground">
                  {[v.bp && `BP ${v.bp}`, v.sugar && `Sugar ${v.sugar}`, v.pulse && `${v.pulse} bpm`, v.temp && `${v.temp}°C`].filter(Boolean).join(" · ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <h4 className="font-medium mb-3 text-sm">Meal activity ({meals.length})</h4>
        <div className="space-y-2">
          {meals.slice(0, 6).map((m) => (
            <div key={m.id} className="text-xs flex justify-between p-2 bg-muted rounded">
              <span>{m.mealName}</span>
              <span className="text-muted-foreground capitalize">{m.status.replace("_", " ")}</span>
            </div>
          ))}
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1.5" />
    </div>
  );
}
function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5" />
    </div>
  );
}
function Info({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  return (
    <div className="flex gap-2">
      <div className="w-32 shrink-0 text-xs text-muted-foreground uppercase tracking-wider pt-0.5">{label}</div>
      <div className={tone === "danger" && value !== "—" ? "text-destructive" : ""}>{value}</div>
    </div>
  );
}
function csv(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}
