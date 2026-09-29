import {
  cycleContaining,
  isDateInCycle,
  listDataCycles,
  nextCycle,
  parseISODate,
  toISODate,
} from "./cycle";
import type {
  Category,
  Cycle,
  CycleCategory,
  CycleSnapshot,
  Expense,
} from "./types";

export function normalizeCategory(
  raw: Partial<Category> & { id: string },
): Category {
  return {
    id: raw.id,
    name: (raw.name ?? "Category").trim() || "Category",
    budgetCents: Math.max(0, Math.round(raw.budgetCents ?? 0)),
    colorId: raw.colorId ?? 1,
    carryForward: Boolean(raw.carryForward),
  };
}

export function toCycleCategory(
  category: Category,
  surplusCents = 0,
): CycleCategory {
  return {
    ...category,
    surplusCents: Math.max(0, Math.round(surplusCents)),
  };
}

export function availableCents(category: CycleCategory): number {
  return category.budgetCents + category.surplusCents;
}

export function spentInCycle(expenses: Expense[], cycle: Cycle): Map<string, number> {
  const spent = new Map<string, number>();
  for (const expense of expenses) {
    if (!isDateInCycle(expense.date, cycle)) continue;
    spent.set(expense.categoryId, (spent.get(expense.categoryId) ?? 0) + expense.amountCents);
  }
  return spent;
}

export function categoriesForCycle(
  cycle: Cycle,
  snapshots: Record<string, CycleSnapshot>,
  live: Category[],
): CycleCategory[] {
  const snap = snapshots[toISODate(cycle.start)];
  if (snap) return snap.categories;
  return live.map((category) => toCycleCategory(category, 0));
}

export function freezeLiveIntoSnapshot(
  snapshots: Record<string, CycleSnapshot>,
  live: Category[],
  startIso: string,
): Record<string, CycleSnapshot> {
  const prev = snapshots[startIso];
  return {
    ...snapshots,
    [startIso]: {
      startIso,
      categories: live.map((category) =>
        toCycleCategory(
          category,
          prev?.categories.find((item) => item.id === category.id)?.surplusCents ?? 0,
        ),
      ),
    },
  };
}

function nextSurplus(
  live: Category,
  previous: CycleCategory | undefined,
  spentCents: number,
): number {
  const budget = previous?.budgetCents ?? live.budgetCents;
  const surplus = previous?.surplusCents ?? 0;
  const remaining = budget + surplus - spentCents;
  return live.carryForward && remaining > 0 ? remaining : 0;
}

export function seedSnapshots(input: {
  live: Category[];
  expenses: Expense[];
  startDay: number;
  now: Date;
}): { snapshots: Record<string, CycleSnapshot>; liveHeadIso: string } {
  const chronological = listDataCycles(input.expenses, input.startDay, input.now);
  const snapshots: Record<string, CycleSnapshot> = {};
  let previous: CycleSnapshot | undefined;
  for (const cycle of chronological) {
    const iso = toISODate(cycle.start);
    let categories: CycleCategory[];
    if (!previous) {
      categories = input.live.map((category) => toCycleCategory(category, 0));
    } else {
      const prevCycle = cycleContaining(parseISODate(previous.startIso), input.startDay);
      const spent = spentInCycle(input.expenses, prevCycle);
      categories = input.live.map((category) => {
        const prevCat = previous?.categories.find((item) => item.id === category.id);
        return toCycleCategory(category, nextSurplus(category, prevCat, spent.get(category.id) ?? 0));
      });
    }
    const snap = { startIso: iso, categories };
    snapshots[iso] = snap;
    previous = snap;
  }
  const currentIso = toISODate(cycleContaining(input.now, input.startDay).start);
  if (!snapshots[currentIso]) {
    const spent = previous
      ? spentInCycle(
          input.expenses,
          cycleContaining(parseISODate(previous.startIso), input.startDay),
        )
      : new Map<string, number>();
    snapshots[currentIso] = {
      startIso: currentIso,
      categories: input.live.map((category) => {
        const prevCat = previous?.categories.find((item) => item.id === category.id);
        return toCycleCategory(
          category,
          previous ? nextSurplus(category, prevCat, spent.get(category.id) ?? 0) : 0,
        );
      }),
    };
  }
  return { snapshots, liveHeadIso: currentIso };
}

export function rolloverToNow(input: {
  live: Category[];
  expenses: Expense[];
  snapshots: Record<string, CycleSnapshot>;
  liveHeadIso: string | null;
  startDay: number;
  now: Date;
}): { snapshots: Record<string, CycleSnapshot>; liveHeadIso: string } {
  const currentIso = toISODate(cycleContaining(input.now, input.startDay).start);
  if (!input.liveHeadIso || Object.keys(input.snapshots).length === 0) {
    return seedSnapshots(input);
  }

  let snapshots = { ...input.snapshots };
  const headCycle = cycleContaining(parseISODate(input.liveHeadIso), input.startDay);
  const alignedHead = toISODate(headCycle.start);
  if (alignedHead !== input.liveHeadIso) {
    return seedSnapshots(input);
  }

  snapshots = freezeLiveIntoSnapshot(snapshots, input.live, alignedHead);
  if (alignedHead === currentIso) {
    return { snapshots, liveHeadIso: currentIso };
  }

  if (headCycle.start.getTime() > cycleContaining(input.now, input.startDay).start.getTime()) {
    return seedSnapshots(input);
  }

  let cursor = headCycle;
  while (toISODate(cursor.start) !== currentIso) {
    const thisIso = toISODate(cursor.start);
    const thisSnap = snapshots[thisIso] ?? {
      startIso: thisIso,
      categories: input.live.map((category) => toCycleCategory(category, 0)),
    };
    snapshots[thisIso] = thisSnap;
    const next = nextCycle(cursor, input.startDay);
    const nextIso = toISODate(next.start);
    const spent = spentInCycle(input.expenses, cursor);
    snapshots[nextIso] = {
      startIso: nextIso,
      categories: input.live.map((category) => {
        const prevCat = thisSnap.categories.find((item) => item.id === category.id);
        return toCycleCategory(category, nextSurplus(category, prevCat, spent.get(category.id) ?? 0));
      }),
    };
    cursor = next;
  }

  return { snapshots, liveHeadIso: currentIso };
}

export function migratePersisted(raw: Record<string, unknown>, now = new Date()) {
  const startDay = Number(raw.cycleStartDay ?? 26);
  const live = Array.isArray(raw.categories)
    ? (raw.categories as Partial<Category>[]).filter((item) => item && item.id).map((item) =>
        normalizeCategory(item as Partial<Category> & { id: string }),
      )
    : [];
  const expenses = Array.isArray(raw.expenses) ? (raw.expenses as Expense[]) : [];
  const existingSnapshots =
    raw.cycleSnapshots && typeof raw.cycleSnapshots === "object"
      ? (raw.cycleSnapshots as Record<string, CycleSnapshot>)
      : {};

  const needsSeed =
    Object.keys(existingSnapshots).length === 0 || typeof raw.liveHeadIso !== "string";

  const rolled = needsSeed
    ? seedSnapshots({ live, expenses, startDay, now })
    : rolloverToNow({
        live,
        expenses,
        snapshots: existingSnapshots,
        liveHeadIso: String(raw.liveHeadIso),
        startDay,
        now,
      });

  return {
    cycleStartDay: startDay,
    categories: live,
    expenses,
    initialized: raw.initialized !== false,
    cycleSnapshots: rolled.snapshots,
    liveHeadIso: rolled.liveHeadIso,
  };
}
