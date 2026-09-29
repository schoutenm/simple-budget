import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { clampStartDay, cycleContaining, toISODate } from "@/lib/cycle";
import {
  freezeLiveIntoSnapshot,
  migratePersisted,
  rolloverToNow,
  seedSnapshots,
} from "@/lib/ledger";
import { nextColorId } from "@/lib/colors";
import { makeSampleExpenses, SAMPLE_CATEGORIES } from "@/lib/sample";
import type { Category, CycleSnapshot, Expense } from "@/lib/types";

const initialStartDay = 26;

function buildInitial() {
  const now = new Date();
  const categories = SAMPLE_CATEGORIES;
  const expenses = makeSampleExpenses(now, initialStartDay);
  const seeded = seedSnapshots({
    live: categories,
    expenses,
    startDay: initialStartDay,
    now,
  });
  return {
    cycleStartDay: initialStartDay,
    categories,
    expenses,
    initialized: true,
    cycleSnapshots: seeded.snapshots,
    liveHeadIso: seeded.liveHeadIso,
  };
}

const initial = buildInitial();

type BudgetState = {
  cycleStartDay: number;
  categories: Category[];
  expenses: Expense[];
  initialized: boolean;
  cycleSnapshots: Record<string, CycleSnapshot>;
  liveHeadIso: string;
  viewingStartIso: string | null;
  setCycleStartDay: (day: number) => void;
  setViewingStartIso: (iso: string | null) => void;
  addCategory: (input: { name: string; budgetCents: number; colorId?: number; carryForward?: boolean }) => void;
  updateCategory: (
    id: string,
    patch: Partial<Pick<Category, "name" | "budgetCents" | "colorId" | "carryForward">>,
  ) => void;
  removeCategory: (id: string) => void;
  addExpense: (input: { amountCents: number; categoryId: string; date: string }) => void;
  removeExpense: (id: string) => void;
  loadSample: () => void;
  clearExpenses: () => void;
  ensureCurrentCycle: () => void;
};

function withCurrentSnapshot(state: Pick<BudgetState, "categories" | "cycleSnapshots" | "liveHeadIso">) {
  return freezeLiveIntoSnapshot(state.cycleSnapshots, state.categories, state.liveHeadIso);
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      ...initial,
      viewingStartIso: null,
      setCycleStartDay: (day) => {
        const cycleStartDay = clampStartDay(day);
        const now = new Date();
        const rolled = rolloverToNow({
          live: get().categories,
          expenses: get().expenses,
          snapshots: get().cycleSnapshots,
          liveHeadIso: get().liveHeadIso,
          startDay: cycleStartDay,
          now,
        });
        set({
          cycleStartDay,
          viewingStartIso: null,
          cycleSnapshots: rolled.snapshots,
          liveHeadIso: rolled.liveHeadIso,
        });
      },
      setViewingStartIso: (iso) => set({ viewingStartIso: iso }),
      addCategory: (input) => {
        const used = get().categories.map((category) => category.colorId);
        const category: Category = {
          id: crypto.randomUUID(),
          name: input.name.trim() || "New category",
          budgetCents: Math.max(0, Math.round(input.budgetCents)),
          colorId: input.colorId ?? nextColorId(used),
          carryForward: Boolean(input.carryForward),
        };
        const categories = [...get().categories, category];
        set({
          categories,
          cycleSnapshots: withCurrentSnapshot({
            categories,
            cycleSnapshots: get().cycleSnapshots,
            liveHeadIso: get().liveHeadIso,
          }),
        });
      },
      updateCategory: (id, patch) => {
        const categories = get().categories.map((category) =>
          category.id === id
            ? {
                ...category,
                ...patch,
                name: patch.name !== undefined ? patch.name.trim() || category.name : category.name,
                budgetCents:
                  patch.budgetCents !== undefined
                    ? Math.max(0, Math.round(patch.budgetCents))
                    : category.budgetCents,
                carryForward:
                  patch.carryForward !== undefined ? Boolean(patch.carryForward) : category.carryForward,
              }
            : category,
        );
        set({
          categories,
          cycleSnapshots: withCurrentSnapshot({
            categories,
            cycleSnapshots: get().cycleSnapshots,
            liveHeadIso: get().liveHeadIso,
          }),
        });
      },
      removeCategory: (id) => {
        const categories = get().categories.filter((category) => category.id !== id);
        set({
          categories,
          cycleSnapshots: withCurrentSnapshot({
            categories,
            cycleSnapshots: get().cycleSnapshots,
            liveHeadIso: get().liveHeadIso,
          }),
        });
      },
      addExpense: (input) => {
        if (input.amountCents <= 0) return;
        const expense: Expense = {
          id: crypto.randomUUID(),
          amountCents: Math.round(input.amountCents),
          categoryId: input.categoryId,
          date: input.date,
        };
        set({ expenses: [expense, ...get().expenses] });
      },
      removeExpense: (id) =>
        set({ expenses: get().expenses.filter((expense) => expense.id !== id) }),
      loadSample: () => {
        const now = new Date();
        const cycleStartDay = get().cycleStartDay;
        const categories = SAMPLE_CATEGORIES;
        const expenses = makeSampleExpenses(now, cycleStartDay);
        const seeded = seedSnapshots({ live: categories, expenses, startDay: cycleStartDay, now });
        set({
          categories,
          expenses,
          initialized: true,
          viewingStartIso: null,
          cycleSnapshots: seeded.snapshots,
          liveHeadIso: seeded.liveHeadIso,
        });
      },
      clearExpenses: () => set({ expenses: [] }),
      ensureCurrentCycle: () => {
        const state = get();
        const rolled = rolloverToNow({
          live: state.categories,
          expenses: state.expenses,
          snapshots: state.cycleSnapshots,
          liveHeadIso: state.liveHeadIso,
          startDay: state.cycleStartDay,
          now: new Date(),
        });
        if (
          rolled.liveHeadIso === state.liveHeadIso &&
          rolled.snapshots === state.cycleSnapshots
        ) {
          return;
        }
        set({
          cycleSnapshots: rolled.snapshots,
          liveHeadIso: rolled.liveHeadIso,
        });
      },
    }),
    {
      name: "remain-budget-v2",
      version: 4,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        cycleStartDay: state.cycleStartDay,
        categories: state.categories,
        expenses: state.expenses,
        initialized: state.initialized,
        cycleSnapshots: state.cycleSnapshots,
        liveHeadIso: state.liveHeadIso,
      }),
      migrate: (persisted, fromVersion) => {
        const migrated = migratePersisted(persisted as Record<string, unknown>);
        if (fromVersion < 4) {
          const seeded = seedSnapshots({
            live: migrated.categories,
            expenses: migrated.expenses,
            startDay: migrated.cycleStartDay,
            now: new Date(),
          });
          return {
            ...migrated,
            cycleSnapshots: seeded.snapshots,
            liveHeadIso: seeded.liveHeadIso,
          };
        }
        return migrated;
      },
      onRehydrateStorage: () => () => {
        useBudgetStore.getState().ensureCurrentCycle();
      },
    },
  ),
);

export function currentCycleStartIso(startDay: number, now = new Date()): string {
  return toISODate(cycleContaining(now, startDay).start);
}
