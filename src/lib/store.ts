import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MealStatus =
  | "pending_doctor"
  | "approved"
  | "rejected"
  | "preparing"
  | "ready"
  | "delivered";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface VitalsEntry {
  id: string;
  at: number;
  bp?: string;
  sugar?: string;
  weight?: number;
  temp?: string;
  pulse?: string;
  note?: string;
  by?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "M" | "F";
  room: string;
  doctor: string;
  weight?: number;
  height?: number;
  bp?: string;
  sugar?: string;
  diseases: string[];
  allergies: string[];
  medications: string[];
  restrictions: string[];
  emergencyContact?: string;
  vitals: VitalsEntry[];
  discharged?: boolean;
  createdAt: number;
}

export interface MealOrder {
  id: string;
  patientId: string;
  mealName: string;
  type: MealType;
  scheduledFor: string; // ISO
  calories: number;
  ingredients: string[];
  status: MealStatus;
  doctorNote?: string;
  rejectionReason?: string;
  rating?: number;
  feedback?: string;
  deliveredAt?: number;
  createdAt: number;
  prescribed?: boolean; // doctor-prescribed (auto-approved)
}

export interface MenuItem {
  id: string;
  name: string;
  type: MealType;
  calories: number;
  ingredients: string[];
  tags: string[]; // e.g., low-sodium, high-protein, diabetic-friendly
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  stock: number;
  reorderAt: number;
}

export interface Notification {
  id: string;
  patientId?: string;
  role: "patient" | "doctor" | "nurse" | "kitchen" | "all";
  message: string;
  createdAt: number;
  read?: boolean;
}

interface State {
  patients: Patient[];
  meals: MealOrder[];
  menu: MenuItem[];
  inventory: InventoryItem[];
  notifications: Notification[];
  currentPatientId: string | null;
  addPatient: (p: Omit<Patient, "id" | "createdAt" | "vitals">) => Patient;
  updatePatient: (id: string, patch: Partial<Patient>) => void;
  dischargePatient: (id: string) => void;
  logVitals: (patientId: string, v: Omit<VitalsEntry, "id" | "at">) => void;
  addMeal: (m: Omit<MealOrder, "id" | "createdAt" | "status">) => MealOrder;
  prescribeMeal: (m: Omit<MealOrder, "id" | "createdAt" | "status">) => MealOrder;
  updateMeal: (id: string, patch: Partial<MealOrder>) => void;
  addMenuItem: (m: Omit<MenuItem, "id">) => void;
  removeMenuItem: (id: string) => void;
  adjustInventory: (id: string, delta: number) => void;
  addInventory: (i: Omit<InventoryItem, "id">) => void;
  notify: (n: Omit<Notification, "id" | "createdAt">) => void;
  markNotificationsRead: (role: Notification["role"]) => void;
  loginPatient: (id: string) => boolean;
  logoutPatient: () => void;
  reset: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const seedPatients: Patient[] = [
  {
    id: "PT-1042",
    name: "Hanna Bekele",
    age: 54,
    gender: "F",
    room: "204-A",
    doctor: "Dr. Alemu",
    weight: 68,
    height: 162,
    bp: "138/88",
    sugar: "162 mg/dL",
    diseases: ["Type 2 Diabetes", "Hypertension"],
    allergies: ["Peanuts"],
    medications: ["Metformin 500mg", "Lisinopril 10mg"],
    restrictions: ["Low sodium", "Low sugar"],
    emergencyContact: "+251 911 223 344",
    vitals: [
      { id: uid(), at: Date.now() - 86400000 * 2, bp: "142/90", sugar: "178 mg/dL", pulse: "82", by: "Nurse Sara" },
      { id: uid(), at: Date.now() - 86400000, bp: "140/89", sugar: "168 mg/dL", pulse: "80", by: "Nurse Sara" },
      { id: uid(), at: Date.now() - 3600000 * 6, bp: "138/88", sugar: "162 mg/dL", pulse: "78", by: "Nurse Sara" },
    ],
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: "PT-1058",
    name: "Yonas Tadesse",
    age: 32,
    gender: "M",
    room: "118-B",
    doctor: "Dr. Alemu",
    weight: 74,
    height: 178,
    bp: "120/78",
    sugar: "92 mg/dL",
    diseases: ["Post-op recovery"],
    allergies: [],
    medications: ["Amoxicillin 500mg"],
    restrictions: ["High protein"],
    emergencyContact: "+251 922 887 766",
    vitals: [
      { id: uid(), at: Date.now() - 86400000, bp: "122/80", sugar: "95 mg/dL", pulse: "72", by: "Nurse Sara" },
      { id: uid(), at: Date.now() - 3600000 * 4, bp: "120/78", sugar: "92 mg/dL", pulse: "70", by: "Nurse Sara" },
    ],
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: "PT-1071",
    name: "Sara Mekonnen",
    age: 67,
    gender: "F",
    room: "302-C",
    doctor: "Dr. Alemu",
    weight: 58,
    height: 158,
    bp: "145/92",
    sugar: "118 mg/dL",
    diseases: ["Chronic Kidney Disease"],
    allergies: ["Shellfish"],
    medications: ["Furosemide 40mg"],
    restrictions: ["Low potassium", "Fluid restricted"],
    emergencyContact: "+251 933 112 099",
    vitals: [
      { id: uid(), at: Date.now() - 86400000 * 2, bp: "150/95", sugar: "122 mg/dL", pulse: "88", by: "Nurse Tigist" },
      { id: uid(), at: Date.now() - 3600000 * 8, bp: "145/92", sugar: "118 mg/dL", pulse: "84", by: "Nurse Tigist" },
    ],
    createdAt: Date.now() - 86400000 * 5,
  },
];

const now = Date.now();
const seedMeals: MealOrder[] = [
  {
    id: uid(),
    patientId: "PT-1042",
    mealName: "Quinoa Tabbouleh with Grilled Chicken",
    type: "lunch",
    scheduledFor: new Date(now + 3600000).toISOString(),
    calories: 420,
    ingredients: ["Quinoa", "Cucumber", "Parsley", "Grilled chicken", "Olive oil"],
    status: "approved",
    doctorNote: "Within sodium budget. Approved.",
    createdAt: now - 7200000,
  },
  {
    id: uid(),
    patientId: "PT-1042",
    mealName: "Steel-cut Oats with Berries",
    type: "breakfast",
    scheduledFor: new Date(now - 14400000).toISOString(),
    calories: 310,
    ingredients: ["Oats", "Blueberries", "Almond milk", "Cinnamon"],
    status: "delivered",
    deliveredAt: now - 13000000,
    rating: 5,
    feedback: "Loved it, very fresh.",
    createdAt: now - 28800000,
  },
  {
    id: uid(),
    patientId: "PT-1058",
    mealName: "Lentil Stew with Injera",
    type: "lunch",
    scheduledFor: new Date(now + 5400000).toISOString(),
    calories: 540,
    ingredients: ["Red lentils", "Berbere", "Onion", "Injera"],
    status: "pending_doctor",
    createdAt: now - 1800000,
  },
  {
    id: uid(),
    patientId: "PT-1071",
    mealName: "Steamed Cod with Rice",
    type: "dinner",
    scheduledFor: new Date(now + 10800000).toISOString(),
    calories: 380,
    ingredients: ["Cod", "Basmati rice", "Zucchini"],
    status: "preparing",
    doctorNote: "Low potassium plate. OK.",
    createdAt: now - 3600000,
  },
];

const seedMenu: MenuItem[] = [
  { id: uid(), name: "Steel-cut Oats with Berries", type: "breakfast", calories: 310, ingredients: ["Oats", "Blueberries", "Almond milk"], tags: ["diabetic-friendly", "heart-healthy"] },
  { id: uid(), name: "Scrambled Egg White & Toast", type: "breakfast", calories: 280, ingredients: ["Egg whites", "Whole-grain bread", "Spinach"], tags: ["low-sodium", "high-protein"] },
  { id: uid(), name: "Grilled Chicken Quinoa Bowl", type: "lunch", calories: 460, ingredients: ["Chicken", "Quinoa", "Cucumber", "Lemon"], tags: ["high-protein", "low-sodium"] },
  { id: uid(), name: "Lentil Vegetable Stew", type: "lunch", calories: 420, ingredients: ["Red lentils", "Carrot", "Onion", "Tomato"], tags: ["vegan", "high-fiber"] },
  { id: uid(), name: "Steamed Cod with Rice", type: "dinner", calories: 380, ingredients: ["Cod", "Basmati rice", "Zucchini"], tags: ["low-potassium", "renal-safe"] },
  { id: uid(), name: "Vegetable Soup", type: "dinner", calories: 240, ingredients: ["Carrot", "Celery", "Tomato", "Herbs"], tags: ["low-sodium", "soft"] },
  { id: uid(), name: "Fruit Bowl", type: "snack", calories: 150, ingredients: ["Apple", "Banana", "Berries"], tags: ["fiber", "vegan"] },
  { id: uid(), name: "Greek Yogurt Parfait", type: "snack", calories: 180, ingredients: ["Yogurt", "Granola", "Honey"], tags: ["high-protein"] },
];

const seedInventory: InventoryItem[] = [
  { id: uid(), name: "Quinoa", unit: "kg", stock: 12, reorderAt: 5 },
  { id: uid(), name: "Chicken breast", unit: "kg", stock: 18, reorderAt: 8 },
  { id: uid(), name: "Cod fillet", unit: "kg", stock: 4, reorderAt: 5 },
  { id: uid(), name: "Red lentils", unit: "kg", stock: 22, reorderAt: 10 },
  { id: uid(), name: "Injera", unit: "pcs", stock: 60, reorderAt: 30 },
  { id: uid(), name: "Basmati rice", unit: "kg", stock: 30, reorderAt: 10 },
  { id: uid(), name: "Olive oil", unit: "L", stock: 6, reorderAt: 3 },
  { id: uid(), name: "Berries (mixed)", unit: "kg", stock: 2.5, reorderAt: 3 },
];

const seedNotifications: Notification[] = [
  {
    id: uid(),
    patientId: "PT-1042",
    role: "patient",
    message: "Your lunch is approved and being prepared.",
    createdAt: now - 1800000,
  },
];

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      patients: seedPatients,
      meals: seedMeals,
      menu: seedMenu,
      inventory: seedInventory,
      notifications: seedNotifications,
      currentPatientId: null,

      addPatient: (p) => {
        const patient: Patient = {
          ...p,
          vitals: [],
          id: `PT-${1000 + Math.floor(Math.random() * 9000)}`,
          createdAt: Date.now(),
        };
        set((s) => ({ patients: [patient, ...s.patients] }));
        return patient;
      },
      updatePatient: (id, patch) =>
        set((s) => ({
          patients: s.patients.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      dischargePatient: (id) => {
        set((s) => ({
          patients: s.patients.map((p) => (p.id === id ? { ...p, discharged: true } : p)),
        }));
        get().notify({ role: "all", message: `Patient ${id} discharged.` });
      },
      logVitals: (patientId, v) => {
        const entry: VitalsEntry = { ...v, id: uid(), at: Date.now() };
        set((s) => ({
          patients: s.patients.map((p) =>
            p.id === patientId
              ? {
                  ...p,
                  vitals: [entry, ...(p.vitals ?? [])].slice(0, 30),
                  bp: v.bp ?? p.bp,
                  sugar: v.sugar ?? p.sugar,
                  weight: v.weight ?? p.weight,
                }
              : p,
          ),
        }));
        // Alert doctor if values look critical
        const sysPart = v.bp?.split("/")[0];
        const sys = sysPart ? parseInt(sysPart, 10) : NaN;
        const sugarVal = v.sugar ? parseInt(v.sugar, 10) : NaN;
        if ((!Number.isNaN(sys) && sys >= 160) || (!Number.isNaN(sugarVal) && sugarVal >= 200)) {
          get().notify({
            patientId,
            role: "doctor",
            message: `Critical vitals for ${patientId}: BP ${v.bp ?? "—"}, Sugar ${v.sugar ?? "—"}`,
          });
        }
      },

      addMeal: (m) => {
        const meal: MealOrder = {
          ...m,
          id: uid(),
          status: "pending_doctor",
          createdAt: Date.now(),
        };
        set((s) => ({ meals: [meal, ...s.meals] }));
        get().notify({
          role: "doctor",
          message: `New meal request for ${
            get().patients.find((p) => p.id === m.patientId)?.name ?? m.patientId
          }`,
        });
        return meal;
      },
      prescribeMeal: (m) => {
        const meal: MealOrder = {
          ...m,
          id: uid(),
          status: "approved",
          prescribed: true,
          createdAt: Date.now(),
        };
        set((s) => ({ meals: [meal, ...s.meals] }));
        get().notify({ role: "kitchen", message: `Prescribed meal: ${m.mealName}` });
        get().notify({
          patientId: m.patientId,
          role: "patient",
          message: `Doctor prescribed ${m.mealName} for your ${m.type}.`,
        });
        return meal;
      },
      updateMeal: (id, patch) =>
        set((s) => ({
          meals: s.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),

      addMenuItem: (m) =>
        set((s) => ({ menu: [{ ...m, id: uid() }, ...s.menu] })),
      removeMenuItem: (id) =>
        set((s) => ({ menu: s.menu.filter((m) => m.id !== id) })),

      adjustInventory: (id, delta) =>
        set((s) => ({
          inventory: s.inventory.map((i) =>
            i.id === id ? { ...i, stock: Math.max(0, +(i.stock + delta).toFixed(2)) } : i,
          ),
        })),
      addInventory: (i) =>
        set((s) => ({ inventory: [{ ...i, id: uid() }, ...s.inventory] })),

      notify: (n) =>
        set((s) => ({
          notifications: [
            { ...n, id: uid(), createdAt: Date.now() },
            ...s.notifications,
          ].slice(0, 80),
        })),
      markNotificationsRead: (role) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.role === role ? { ...n, read: true } : n,
          ),
        })),

      loginPatient: (id) => {
        const exists = get().patients.some(
          (p) => p.id.toLowerCase() === id.toLowerCase(),
        );
        if (exists) {
          set({ currentPatientId: get().patients.find((p) => p.id.toLowerCase() === id.toLowerCase())!.id });
          return true;
        }
        return false;
      },
      logoutPatient: () => set({ currentPatientId: null }),

      reset: () =>
        set({
          patients: seedPatients,
          meals: seedMeals,
          menu: seedMenu,
          inventory: seedInventory,
          notifications: seedNotifications,
          currentPatientId: null,
        }),
    }),
    { name: "tenameal-store", version: 2 },
  ),
);

export const statusLabel: Record<MealStatus, string> = {
  pending_doctor: "Pending doctor",
  approved: "Approved",
  rejected: "Rejected",
  preparing: "Preparing",
  ready: "Ready",
  delivered: "Delivered",
};
