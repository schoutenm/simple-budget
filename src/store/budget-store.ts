import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { clampStartDay, cycleContaining, toISODate } from "@/lib/cycle";
import { makeSampleExpenses, SAMPLE_CATEGORIES } from "@/lib/sample";
import { nextColorId } from "@/lib/colors";
import type { Category, Expense } from "@/lib/types";

const initialStartDay = 26;

type BudgetState = {
  cycleStartDay: number;
  categories: Category[];
  expenses: Expense[];
  initialized: boolean;
  viewingStartIso: string | null;
  setCycleStartDay: (day: number) => void;
  setViewingStartIso: (iso: string | null) => void;
  addCategory: (input: { name: string; budgetCents: number; colorId?: number }) => void;
  updateCategory: (id: string, patch: Partial<Pick<Category, "name" | "budgetCents" | "colorId">>) => void;
  removeCategory: (id: string) => void;
  addExpense: (input: { amountCents: number; categoryId: string; date: string }) => void;
  removeExpense: (id: string) => void;
  loadSample: () => void;
  clearExpenses: () => void;
};

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      cycleStartDay: initialStartDay,
      categories: SAMPLE_CATEGORIES,
      expenses: makeSampleExpenses(new Date(), initialStartDay),
      initialized: true,
      viewingStartIso: null,
      setCycleStartDay: (day) =>
        set({
          cycleStartDay: clampStartDay(day),
          viewingStartIso: null,
        }),
      setViewingStartIso: (iso) => set({ viewingStartIso: iso }),
      addCategory: (input) => {
        const used = get().categories.map((category) => category.colorId);
        const category: Category = {
          id: crypto.randomUUID(),
          name: input.name.trim() || "New category",
          budgetCents: Math.max(0, Math.round(input.budgetCents)),
          colorId: input.colorId ?? nextColorId(used),
        };
        set({ categories: [...get().categories, category] });
      },
      updateCategory: (id, patch) =>
        set({
          categories: get().categories.map((category) =>
            category.id === id
              ? {
                  ...category,
                  ...patch,
                  name: patch.name !== undefined ? patch.name.trim() || category.name : category.name,
                  budgetCents:
                    patch.budgetCents !== undefined
                      ? Math.max(0, Math.round(patch.budgetCents))
                      : category.budgetCents,
                }
              : category,
          ),
        }),
      removeCategory: (id) =>
        set({
          categories: get().categories.filter((category) => category.id !== id),
        }),
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
        const cycleStartDay = get().cycleStartDay;
        set({
          categories: SAMPLE_CATEGORIES,
          expenses: makeSampleExpenses(new Date(), cycleStartDay),
          initialized: true,
          viewingStartIso: null,
        });
      },
      clearExpenses: () => set({ expenses: [] }),
    }),
    {
      name: "remain-budget-v2",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        cycleStartDay: state.cycleStartDay,
        categories: state.categories,
        expenses: state.expenses,
        initialized: state.initialized,
      }),
    },
  ),
);

export function currentCycleStartIso(startDay: number, now = new Date()): string {
  return toISODate(cycleContaining(now, startDay).start);
}
