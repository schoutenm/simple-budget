import { catBg } from "@/lib/colors";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CategorySummary } from "@/lib/types";

export function CategoryRows({
  rows,
  onPick,
}: {
  rows: CategorySummary[];
  onPick?: (categoryId: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-muted">
        Add a category in Settings to start a budget.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => {
        const available = row.availableCents;
        const remaining = row.remainingCents;
        const over = remaining < 0;
        const used =
          available <= 0 ? (row.spentCents > 0 ? 1 : 0) : Math.min(1, row.spentCents / available);
        const leftRatio = Math.max(0, 1 - used);
        const surplus = row.category.surplusCents;

        return (
          <li key={row.category.id}>
            <button
              type="button"
              onClick={() => onPick?.(row.category.id)}
              className="flex w-full items-center gap-3 rounded-lg bg-surface px-3 py-3 text-left transition-transform duration-(--motion-quick) ease-(--ease-out) active:scale-[0.98]"
            >
              <span
                className={cn("size-2.5 shrink-0 rounded-full", catBg(row.category.colorId))}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-fg">
                      {row.category.name}
                    </span>
                    {surplus > 0 ? (
                      <span className="text-xs text-muted tabular-nums">
                        {formatCents(surplus)} carried
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-sm tabular-nums",
                      over ? "text-danger" : "text-fg",
                    )}
                  >
                    {formatCents(remaining)}
                  </span>
                </span>
                <span className="mt-2 block h-1 overflow-hidden rounded-full bg-raised">
                  <span
                    className={cn(
                      "block h-full rounded-full transition-[width] duration-(--motion-fast) ease-(--ease-smooth-out)",
                      over ? "bg-danger" : catBg(row.category.colorId),
                    )}
                    style={{ width: `${over ? 100 : leftRatio * 100}%` }}
                  />
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
