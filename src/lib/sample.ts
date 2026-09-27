import { addDays } from "date-fns";
import { cycleContaining, previousCycle, toISODate } from "./cycle";
import type { Category, Expense } from "./types";

export const SAMPLE_CATEGORIES: Category[] = [
  { id: "cat-eat", name: "Eating out", budgetCents: 25000, colorId: 1 },
  { id: "cat-coffee", name: "Coffee", budgetCents: 6000, colorId: 4 },
  { id: "cat-fun", name: "Fun", budgetCents: 18000, colorId: 2 },
  { id: "cat-shop", name: "Shopping", budgetCents: 12000, colorId: 3 },
  { id: "cat-other", name: "Other", budgetCents: 8000, colorId: 5 },
];

const PATTERN: { dayOffset: number; categoryId: string; amountCents: number }[] = [
  { dayOffset: 0, categoryId: "cat-coffee", amountCents: 475 },
  { dayOffset: 1, categoryId: "cat-eat", amountCents: 2240 },
  { dayOffset: 2, categoryId: "cat-coffee", amountCents: 510 },
  { dayOffset: 3, categoryId: "cat-other", amountCents: 1200 },
  { dayOffset: 4, categoryId: "cat-eat", amountCents: 1865 },
  { dayOffset: 5, categoryId: "cat-fun", amountCents: 4500 },
  { dayOffset: 6, categoryId: "cat-eat", amountCents: 3120 },
  { dayOffset: 7, categoryId: "cat-coffee", amountCents: 450 },
  { dayOffset: 8, categoryId: "cat-shop", amountCents: 2800 },
  { dayOffset: 9, categoryId: "cat-coffee", amountCents: 385 },
  { dayOffset: 10, categoryId: "cat-eat", amountCents: 1875 },
  { dayOffset: 12, categoryId: "cat-fun", amountCents: 6200 },
  { dayOffset: 13, categoryId: "cat-eat", amountCents: 2680 },
  { dayOffset: 14, categoryId: "cat-coffee", amountCents: 600 },
  { dayOffset: 15, categoryId: "cat-shop", amountCents: 5499 },
  { dayOffset: 16, categoryId: "cat-other", amountCents: 890 },
  { dayOffset: 18, categoryId: "cat-eat", amountCents: 4100 },
  { dayOffset: 19, categoryId: "cat-coffee", amountCents: 425 },
  { dayOffset: 20, categoryId: "cat-other", amountCents: 1950 },
  { dayOffset: 21, categoryId: "cat-shop", amountCents: 6700 },
  { dayOffset: 22, categoryId: "cat-fun", amountCents: 3800 },
  { dayOffset: 24, categoryId: "cat-eat", amountCents: 2780 },
  { dayOffset: 25, categoryId: "cat-coffee", amountCents: 540 },
];

const CURRENT_DAY0: { categoryId: string; amountCents: number }[] = [
  { categoryId: "cat-eat", amountCents: 6420 },
  { categoryId: "cat-fun", amountCents: 3800 },
  { categoryId: "cat-shop", amountCents: 2890 },
  { categoryId: "cat-coffee", amountCents: 675 },
  { categoryId: "cat-other", amountCents: 1800 },
];

export function makeSampleExpenses(now: Date, startDay: number): Expense[] {
  const current = cycleContaining(now, startDay);
  const cycles = [
    previousCycle(previousCycle(current, startDay), startDay),
    previousCycle(current, startDay),
    current,
  ];
  const expenses: Expense[] = [];

  cycles.forEach((cycle, cycleIndex) => {
    const isCurrent = cycleIndex === 2;
    const bump = cycleIndex === 0 ? 0.92 : 1;
    for (const entry of PATTERN) {
      const date = addDays(cycle.start, entry.dayOffset);
      if (date < cycle.start || date > cycle.end || date > now) continue;
      const amountCents = Math.max(50, Math.round(entry.amountCents * bump));
      expenses.push({
        id: `ex-${cycleIndex}-${entry.categoryId}-${entry.dayOffset}`,
        amountCents,
        categoryId: entry.categoryId,
        date: toISODate(date),
      });
    }
    if (isCurrent && cycle.start <= now) {
      CURRENT_DAY0.forEach((entry, index) => {
        expenses.push({
          id: `ex-now-${entry.categoryId}-${index}`,
          amountCents: entry.amountCents,
          categoryId: entry.categoryId,
          date: toISODate(cycle.start),
        });
      });
    }
  });

  return expenses;
}
