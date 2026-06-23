import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useStore, type MealType } from "@/lib/store";
import {
  ChefHat, AlertTriangle, QrCode, ScanLine, BookOpen, Boxes, Plus, Trash2, Minus,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/kitchen")({
  head: () => ({ meta: [{ title: "Kitchen Portal — TenaMeal" }] }),
  component: KitchenRoute,
});

function KitchenRoute() {
  return (
    <AppShell role="Kitchen" nav={[{ to: "/kitchen", label: "Orders", icon: ChefHat }]}>
      <KitchenHome />
    </AppShell>
  );
}

function KitchenHome() {
  const [tab, setTab] = useState<"orders" | "menu" | "inventory">("orders");
  const meals = useStore((s) => s.meals);

  const counts = {
    active: meals.filter((m) => ["approved", "preparing", "ready"].includes(m.status)).length,
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Kitchen" subtitle={`${counts.active} active orders`} />

      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {[
          { id: "orders" as const, label: "Orders" },
          { id: "menu" as const, label: "Menu library" },
          { id: "inventory" as const, label: "Inventory" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              tab === t.id ? "bg-card shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "orders" && <OrdersBoard />}
      {tab === "menu" && <MenuLibrary />}
      {tab === "inventory" && <Inventory />}
    </div>
  );
}

function OrdersBoard() {
  const meals = useStore((s) => s.meals);
  const patients = useStore((s) => s.patients);
  const updateMeal = useStore((s) => s.updateMeal);
  const notify = useStore((s) => s.notify);
  const adjustInventory = useStore((s) => s.adjustInventory);
  const inventory = useStore((s) => s.inventory);

  const [floorFilter, setFloorFilter] = useState<string>("all");

  const floors = useMemo(() => {
    const set = new Set<string>();
    patients.forEach((p) => set.add(p.room.charAt(0)));
    return Array.from(set).sort();
  }, [patients]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof meals> = { approved: [], preparing: [], ready: [], delivered: [] };
    meals.forEach((m) => {
      if (!g[m.status]) return;
      if (floorFilter !== "all") {
        const p = patients.find((x) => x.id === m.patientId);
        if (!p || p.room.charAt(0) !== floorFilter) return;
      }
      g[m.status].push(m);
    });
    return g;
  }, [meals, patients, floorFilter]);

  const [deliverMeal, setDeliverMeal] = useState<string | null>(null);

  const advance = (id: string) => {
    const m = meals.find((x) => x.id === id);
    if (!m) return;
    const next = m.status === "approved" ? "preparing" : m.status === "preparing" ? "ready" : null;
    if (next) {
      updateMeal(id, { status: next });
      toast.success(`Moved to ${next}`);
      if (next === "preparing") {
        // Auto-consume inventory if matching items exist
        m.ingredients.forEach((ing) => {
          const item = inventory.find((i) => i.name.toLowerCase().includes(ing.toLowerCase()) || ing.toLowerCase().includes(i.name.toLowerCase()));
          if (item) adjustInventory(item.id, -0.2);
        });
      }
      if (next === "ready") {
        notify({ patientId: m.patientId, role: "patient", message: `Your ${m.mealName} is ready — on its way.` });
      }
    }
  };

  const columns = [
    { id: "approved" as const, label: "Approved" },
    { id: "preparing" as const, label: "Preparing" },
    { id: "ready" as const, label: "Ready" },
    { id: "delivered" as const, label: "Delivered" },
  ];

  return (
    <div className="space-y-6">
      {/* Floor Filter Bar */}
      <div className="flex flex-wrap gap-2 items-center bg-muted/40 border border-border/30 p-2.5 rounded-2xl w-fit">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">Filter Floor:</span>
        <button
          onClick={() => setFloorFilter("all")}
          className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold uppercase tracking-wider transition-all duration-300 ${
            floorFilter === "all" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All wards
        </button>
        {floors.map((f) => (
          <button
            key={f}
            onClick={() => setFloorFilter(f)}
            className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold uppercase tracking-wider transition-all duration-300 ${
              floorFilter === f ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Floor {f}
          </button>
        ))}
      </div>

      {/* Kanban Board Grid */}
      <div className="grid lg:grid-cols-4 gap-5">
        {columns.map((col) => {
          // Color styles for column headers
          const headerAccent = {
            approved: "border-t-4 border-t-emerald-500 bg-emerald-500/5",
            preparing: "border-t-4 border-t-amber-500 bg-amber-500/5",
            ready: "border-t-4 border-t-teal-500 bg-teal-500/5",
            delivered: "border-t-4 border-t-muted-foreground/30 bg-muted/10",
          }[col.id];

          return (
            <div key={col.id} className={`rounded-3xl border border-border/40 p-4 space-y-4 flex flex-col min-h-[300px] bg-glass/60 ${headerAccent}`}>
              <div className="flex items-center justify-between px-1.5 pb-2 border-b border-border/20">
                <h3 className="font-display font-medium text-sm text-foreground uppercase tracking-wider">{col.label}</h3>
                <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full border border-border/40">{grouped[col.id].length}</span>
              </div>
              
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[60vh] scrollbar-thin">
                {grouped[col.id].length === 0 && (
                  <div className="text-xs text-muted-foreground/50 border border-dashed border-border/60 rounded-2xl p-8 text-center bg-card/25">
                    No active meals
                  </div>
                )}
                {grouped[col.id].map((m) => {
                  const p = patients.find((x) => x.id === m.patientId);
                  const minutesSinceStart = m.status === "preparing" ? Math.floor((Date.now() - m.createdAt) / 60000) : 0;
                  return (
                    <Card key={m.id} className="p-4.5 rounded-2xl border border-border/40 bg-card shadow-soft hover:shadow-glow-primary transition-all duration-300 card-modern space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rm {p?.room} · {p?.name}</div>
                          <div className="font-semibold text-foreground text-sm mt-1">{m.mealName}</div>
                          <div className="text-[10px] text-muted-foreground capitalize mt-0.5">{m.type} · {m.calories} kcal</div>
                        </div>
                      </div>
                      
                      {m.status === "preparing" && (
                        <div className="text-[11px] font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg flex items-center gap-1.5 w-fit">
                          <span className="size-1.5 rounded-full bg-amber-500 animate-pulse-glow" />
                          <span>Timer: {minutesSinceStart} min cooking</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {m.ingredients.slice(0, 4).map((i) => (
                          <span key={i} className="text-[9px] font-medium text-muted-foreground bg-muted border border-border/30 px-2 py-0.5 rounded-md">{i}</span>
                        ))}
                      </div>

                      {p && (p.allergies.length > 0 || p.restrictions.length > 0) && (
                        <div className="p-2.5 rounded-xl bg-destructive/5 border border-destructive/20 text-[10px] space-y-1">
                          {p.allergies.length > 0 && (
                            <div className="text-destructive font-bold flex gap-1 items-start leading-tight">
                              <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                              <span>Allergen Conflict: {p.allergies.join(", ")}</span>
                            </div>
                          )}
                          {p.restrictions.length > 0 && (
                            <div className="text-muted-foreground/80 font-medium">
                              Directives: {p.restrictions.join(", ")}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {m.doctorNote && (
                        <div className="text-[10px] p-2 rounded-xl bg-primary-soft text-primary border border-primary/10 leading-relaxed">
                          <strong>Note:</strong> {m.doctorNote}
                        </div>
                      )}
                      
                      {col.id === "ready" ? (
                        <Button size="sm" className="w-full rounded-xl text-xs" onClick={() => setDeliverMeal(m.id)}>
                          <ScanLine className="size-3.5 mr-1.5" /> Bedside verification
                        </Button>
                      ) : col.id !== "delivered" ? (
                        <Button size="sm" variant="outline" className="w-full rounded-xl text-xs" onClick={() => advance(m.id)}>
                          {col.id === "approved" ? "Start Prep" : "Mark Ready"}
                        </Button>
                      ) : (
                        <div className="text-[10px] text-muted-foreground pt-1.5 border-t border-border/20 text-center font-medium">
                          Served at: {m.deliveredAt && new Date(m.deliveredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!deliverMeal} onOpenChange={() => setDeliverMeal(null)}>
        <DialogContent className="max-w-md">
          {deliverMeal && <DeliverFlow mealId={deliverMeal} onClose={() => setDeliverMeal(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeliverFlow({ mealId, onClose }: { mealId: string; onClose: () => void }) {
  const meal = useStore((s) => s.meals.find((m) => m.id === mealId))!;
  const patient = useStore((s) => s.patients.find((p) => p.id === meal.patientId))!;
  const updateMeal = useStore((s) => s.updateMeal);
  const notify = useStore((s) => s.notify);
  const [scan, setScan] = useState("");

  const confirm = () => {
    if (scan.trim().toLowerCase() !== patient.id.toLowerCase()) {
      toast.error(`QR mismatch! Expected ${patient.id}. Do not deliver.`);
      return;
    }
    updateMeal(mealId, { status: "delivered", deliveredAt: Date.now() });
    notify({ patientId: patient.id, role: "patient", message: `Your ${meal.mealName} has been delivered. Enjoy!` });
    toast.success("Meal delivered");
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Verify delivery</DialogTitle>
        <p className="text-sm text-muted-foreground">Scan {patient.name}'s wristband QR to confirm delivery.</p>
      </DialogHeader>
      <div className="bg-muted p-4 rounded-lg text-sm">
        <div className="text-muted-foreground text-xs uppercase tracking-wider">Expected patient</div>
        <div className="font-medium mt-1">{patient.name}</div>
        <div className="text-xs text-muted-foreground">Room {patient.room} · {patient.id}</div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground flex items-center gap-1.5">
          <QrCode className="size-3.5" /> QR value (type or scan)
        </label>
        <Input
          autoFocus value={scan} onChange={(e) => setScan(e.target.value)} placeholder="PT-..." className="mt-1.5"
          onKeyDown={(e) => e.key === "Enter" && confirm()}
        />
        <p className="text-[11px] text-muted-foreground mt-1">
          Hint: try <button className="underline" onClick={() => setScan(patient.id)}>{patient.id}</button>
        </p>
      </div>
      <Button onClick={confirm} className="w-full">Confirm delivery</Button>
    </>
  );
}

function MenuLibrary() {
  const menu = useStore((s) => s.menu);
  const addMenuItem = useStore((s) => s.addMenuItem);
  const removeMenuItem = useStore((s) => s.removeMenuItem);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<MealType | "all">("all");

  const filtered = filter === "all" ? menu : menu.filter((m) => m.type === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-primary" />
          <h2 className="font-display text-xl">Menu library</h2>
          <span className="text-xs text-muted-foreground">({menu.length} dishes)</span>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4 mr-1.5" /> Add dish
        </Button>
      </div>

      <div className="flex gap-1 flex-wrap">
        {(["all", "breakfast", "lunch", "dinner", "snack"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`text-xs px-3 py-1 rounded-full capitalize ${filter === t ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((m) => (
          <Card key={m.id} className="p-4 shadow-soft">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{m.type}</div>
                <div className="font-medium mt-1">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.calories} kcal</div>
              </div>
              <button onClick={() => { removeMenuItem(m.id); toast.success("Removed"); }} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              {m.ingredients.map((i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-muted">{i}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {m.tags.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary-soft text-primary">{t}</span>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add new dish</DialogTitle></DialogHeader>
          <NewDishForm
            onSave={(d) => { addMenuItem(d); toast.success("Dish added"); setOpen(false); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewDishForm({ onSave }: { onSave: (d: { name: string; type: MealType; calories: number; ingredients: string[]; tags: string[] }) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<MealType>("lunch");
  const [calories, setCalories] = useState("400");
  const [ingredients, setIngredients] = useState("");
  const [tags, setTags] = useState("");

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Dish name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Type</Label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as MealType)}
            className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {(["breakfast", "lunch", "dinner", "snack"] as const).map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs">Calories</Label>
          <Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} className="mt-1.5" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Ingredients (comma-separated)</Label>
        <Input value={ingredients} onChange={(e) => setIngredients(e.target.value)} className="mt-1.5" />
      </div>
      <div>
        <Label className="text-xs">Tags (e.g., low-sodium, vegan)</Label>
        <Input value={tags} onChange={(e) => setTags(e.target.value)} className="mt-1.5" />
      </div>
      <Button
        className="w-full"
        onClick={() => {
          if (!name) return toast.error("Name required");
          onSave({
            name, type, calories: parseInt(calories, 10) || 0,
            ingredients: ingredients.split(",").map((s) => s.trim()).filter(Boolean),
            tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
          });
        }}
      >
        Save dish
      </Button>
    </div>
  );
}

function Inventory() {
  const inventory = useStore((s) => s.inventory);
  const adjustInventory = useStore((s) => s.adjustInventory);
  const addInventory = useStore((s) => s.addInventory);
  const notify = useStore((s) => s.notify);
  const [open, setOpen] = useState(false);

  const low = inventory.filter((i) => i.stock <= i.reorderAt);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <Boxes className="size-5 text-primary" />
          <h2 className="font-display text-xl">Inventory</h2>
          {low.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
              {low.length} below reorder
            </span>
          )}
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4 mr-1.5" /> Add item
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {inventory.map((i) => {
          const isLow = i.stock <= i.reorderAt;
          const percentage = Math.min(100, Math.max(0, (i.stock / 40) * 100));
          return (
            <Card key={i.id} className={`p-5 rounded-2xl border shadow-soft transition-all duration-300 card-modern flex flex-col justify-between space-y-4 ${
              isLow ? "border-destructive/30 bg-destructive/5" : "border-border/40 bg-glass"
            }`}>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{i.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold uppercase tracking-wider">
                      Reorder threshold: {i.reorderAt} {i.unit}
                    </p>
                  </div>
                  <div className={`text-2xl font-display font-semibold ${isLow ? "text-destructive" : "text-primary"}`}>
                    {i.stock}
                    <span className="text-xs text-muted-foreground ml-1 font-sans font-normal">{i.unit}</span>
                  </div>
                </div>

                {/* Stock Health Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-muted-foreground/60 font-bold tracking-wider">
                    <span>STOCK HEALTH</span>
                    <span>{isLow ? "CRITICAL" : "STABLE"}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border/10">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLow ? "bg-destructive animate-pulse-glow" : "bg-primary"
                      }`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border/20">
                <Button size="sm" variant="outline" className="flex-1 rounded-xl" onClick={() => adjustInventory(i.id, -1)}>
                  <Minus className="size-3.5" />
                </Button>
                <Button size="sm" variant="outline" className="flex-1 rounded-xl" onClick={() => adjustInventory(i.id, 1)}>
                  <Plus className="size-3.5" />
                </Button>
                {isLow && (
                  <Button size="sm" className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={() => { notify({ role: "all", message: `Reorder request: ${i.name}` }); toast.success("Reorder requested"); }}>
                    Reorder
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add inventory item</DialogTitle></DialogHeader>
          <NewInventoryForm
            onSave={(d) => { addInventory(d); toast.success("Added"); setOpen(false); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewInventoryForm({ onSave }: { onSave: (d: { name: string; unit: string; stock: number; reorderAt: number }) => void }) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [stock, setStock] = useState("10");
  const [reorderAt, setReorderAt] = useState("3");
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Item name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Unit</Label>
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-xs">Stock</Label>
          <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-xs">Reorder at</Label>
          <Input type="number" value={reorderAt} onChange={(e) => setReorderAt(e.target.value)} className="mt-1.5" />
        </div>
      </div>
      <Button
        className="w-full"
        onClick={() => {
          if (!name) return toast.error("Name required");
          onSave({ name, unit, stock: parseFloat(stock) || 0, reorderAt: parseFloat(reorderAt) || 0 });
        }}
      >
        Save
      </Button>
    </div>
  );
}
