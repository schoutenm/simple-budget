import { formatCents } from "@/lib/money";
import { formatCycleRange, summarizeCycle, toISODate } from "@/lib/cycle";
import { cn } from "@/lib/utils";
import type { Category, Cycle, Expense } from "@/lib/types";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "./ui/drawer";

export function HistoryPanel({
  open,
  onOpenChange,
  cycles,
  categories,
  expenses,
  startDay,
  viewingStartIso,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycles: Cycle[];
  categories: Category[];
  expenses: Expense[];
  startDay: number;
  viewingStartIso: string;
  onSelect: (iso: string) => void;
}) {
  const now = new Date();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-safe pt-4">
          <div>
            <DrawerTitle>Past months</DrawerTitle>
            <DrawerDescription>
              Each refill starts a new cycle. Tap one to inspect it.
            </DrawerDescription>
          </div>
          <ul className="flex flex-col gap-2 pb-6">
            {cycles.map((cycle) => {
              const summary = summarizeCycle(cycle, categories, expenses, now, startDay);
              const iso = toISODate(cycle.start);
              const selected = iso === viewingStartIso;
              const used =
                summary.totalBudgetCents <= 0
                  ? 0
                  : Math.min(1, summary.totalSpentCents / summary.totalBudgetCents);
              return (
                <li key={iso}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(iso);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "flex w-full flex-col gap-2 rounded-lg px-3 py-3 text-left transition-transform duration-(--motion-quick) ease-(--ease-out) active:scale-[0.98]",
                      selected ? "bg-raised ring-1 ring-border-strong" : "bg-raised/70",
                    )}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-fg">
                        {formatCycleRange(cycle)}
                        {summary.isCurrent ? (
                          <span className="ml-2 text-xs font-medium text-muted">Now</span>
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "text-sm tabular-nums",
                          summary.totalRemainingCents < 0 ? "text-danger" : "text-fg",
                        )}
                      >
                        {formatCents(summary.totalRemainingCents)} left
                      </span>
                    </span>
                    <span className="block h-1 overflow-hidden rounded-full bg-bg">
                      <span
                        className="block h-full rounded-full bg-accent/80"
                        style={{ width: `${used * 100}%` }}
                      />
                    </span>
                    <span className="text-xs text-muted tabular-nums">
                      spent {formatCents(summary.totalSpentCents)} of{" "}
                      {formatCents(summary.totalBudgetCents)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
