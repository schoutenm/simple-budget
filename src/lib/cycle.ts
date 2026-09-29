import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  startOfDay,
} from "date-fns";
import type {
  CategorySummary,
  Cycle,
  CycleCategory,
  CycleSummary,
  Expense,
} from "./types";

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function clampStartDay(day: number): number {
  if (!Number.isFinite(day)) return 26;
  return Math.min(28, Math.max(1, Math.round(day)));
}

export function cycleContaining(date: Date, startDay: number): Cycle {
  const day = clampStartDay(startDay);
  const start =
    date.getDate() >= day
      ? new Date(date.getFullYear(), date.getMonth(), day)
      : new Date(date.getFullYear(), date.getMonth() - 1, day);
  const nextStart = addMonths(start, 1);
  const end = addDays(nextStart, -1);
  return { start, end };
}

export function previousCycle(cycle: Cycle, startDay: number): Cycle {
  return cycleContaining(addDays(cycle.start, -1), startDay);
}

export function nextCycle(cycle: Cycle, startDay: number): Cycle {
  return cycleContaining(addDays(cycle.end, 1), startDay);
}

export function isSameCycle(a: Cycle, b: Cycle): boolean {
  return a.start.getTime() === b.start.getTime();
}

export function isDateInCycle(iso: string, cycle: Cycle): boolean {
  const date = parseISODate(iso);
  return date >= startOfDay(cycle.start) && date <= startOfDay(cycle.end);
}

export function formatCycleRange(cycle: Cycle): string {
  const sameYear = cycle.start.getFullYear() === cycle.end.getFullYear();
  if (sameYear) {
    return `${format(cycle.start, "MMM d")} – ${format(cycle.end, "MMM d")}`;
  }
  return `${format(cycle.start, "MMM d, yyyy")} – ${format(cycle.end, "MMM d, yyyy")}`;
}

export function formatRefillDate(cycle: Cycle): string {
  return format(addDays(cycle.end, 1), "MMM d");
}

export function daysTotal(cycle: Cycle): number {
  return differenceInCalendarDays(cycle.end, cycle.start) + 1;
}

export function daysLeft(cycle: Cycle, now: Date): number {
  const today = startOfDay(now);
  if (today > cycle.end) return 0;
  if (today < cycle.start) return daysTotal(cycle);
  return differenceInCalendarDays(cycle.end, today);
}

export function listCycles(
  expenses: Expense[],
  startDay: number,
  now: Date,
): Cycle[] {
  const current = cycleContaining(now, startDay);
  let earliest = current.start;
  let floor = current;
  for (let i = 0; i < 5; i += 1) {
    floor = previousCycle(floor, startDay);
  }
  if (floor.start < earliest) earliest = floor.start;
  for (const expense of expenses) {
    const date = parseISODate(expense.date);
    if (date < earliest) earliest = date;
  }
  const cycles: Cycle[] = [];
  let cursor = cycleContaining(earliest, startDay);
  while (cursor.start.getTime() <= current.start.getTime()) {
    cycles.push(cursor);
    cursor = nextCycle(cursor, startDay);
  }
  return cycles.reverse();
}

export function listDataCycles(
  expenses: Expense[],
  startDay: number,
  now: Date,
): Cycle[] {
  const current = cycleContaining(now, startDay);
  let earliest = current.start;
  for (const expense of expenses) {
    const date = parseISODate(expense.date);
    if (date < earliest) earliest = date;
  }
  const cycles: Cycle[] = [];
  let cursor = cycleContaining(earliest, startDay);
  while (cursor.start.getTime() <= current.start.getTime()) {
    cycles.push(cursor);
    cursor = nextCycle(cursor, startDay);
  }
  return cycles;
}

export function summarizeCycle(
  cycle: Cycle,
  categories: CycleCategory[],
  expenses: Expense[],
  now: Date,
  startDay: number,
): CycleSummary {
  const inCycle = expenses
    .filter((expense) => isDateInCycle(expense.date, cycle))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const spentByCategory = new Map<string, number>();
  for (const expense of inCycle) {
    spentByCategory.set(
      expense.categoryId,
      (spentByCategory.get(expense.categoryId) ?? 0) + expense.amountCents,
    );
  }

  const categorySummaries: CategorySummary[] = categories.map((category) => {
    const spentCents = spentByCategory.get(category.id) ?? 0;
    const availableCents = category.budgetCents + category.surplusCents;
    return {
      category,
      spentCents,
      availableCents,
      remainingCents: availableCents - spentCents,
    };
  });

  const totalBudgetCents = categories.reduce(
    (sum, category) => sum + category.budgetCents,
    0,
  );
  const totalSurplusCents = categories.reduce(
    (sum, category) => sum + category.surplusCents,
    0,
  );
  const totalAvailableCents = totalBudgetCents + totalSurplusCents;
  const totalSpentCents = inCycle.reduce(
    (sum, expense) => sum + expense.amountCents,
    0,
  );

  return {
    cycle,
    totalBudgetCents,
    totalSurplusCents,
    totalAvailableCents,
    totalSpentCents,
    totalRemainingCents: totalAvailableCents - totalSpentCents,
    categories: categorySummaries,
    expenses: inCycle,
    daysLeft: daysLeft(cycle, now),
    daysTotal: daysTotal(cycle),
    isCurrent: isSameCycle(cycle, cycleContaining(now, startDay)),
  };
}
