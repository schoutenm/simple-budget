export type Category = {
  id: string;
  name: string;
  budgetCents: number;
  colorId: number;
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
  category: Category;
  spentCents: number;
  remainingCents: number;
};

export type CycleSummary = {
  cycle: Cycle;
  totalBudgetCents: number;
  totalSpentCents: number;
  totalRemainingCents: number;
  categories: CategorySummary[];
  expenses: Expense[];
  daysLeft: number;
  daysTotal: number;
  isCurrent: boolean;
};

export const CAT_COLOR_COUNT = 8;
