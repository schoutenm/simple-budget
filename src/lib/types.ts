export type Category = {
  id: string;
  name: string;
  budgetCents: number;
  colorId: number;
  carryForward: boolean;
};

export type CycleCategory = Category & {
  surplusCents: number;
};

export type CycleSnapshot = {
  startIso: string;
  categories: CycleCategory[];
};

export type Expense = {
  id: string;
  amountCents: number;
  categoryId: string;
  date: string;
};

export type Cycle = {
  start: Date;
  end: Date;
};

export type CategorySummary = {
  category: CycleCategory;
  spentCents: number;
  remainingCents: number;
  availableCents: number;
};

export type CycleSummary = {
  cycle: Cycle;
  totalBudgetCents: number;
  totalSurplusCents: number;
  totalAvailableCents: number;
  totalSpentCents: number;
  totalRemainingCents: number;
  categories: CategorySummary[];
  expenses: Expense[];
  daysLeft: number;
  daysTotal: number;
  isCurrent: boolean;
};

export const CAT_COLOR_COUNT = 8;
