import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { catBg } from "@/lib/colors";
import { parseISODate } from "@/lib/cycle";
import { formatCents } from "@/lib/money";
import type { Category, Expense } from "@/lib/types";

export function ExpenseList({
  expenses,
  categories,
  onRemove,
}: {
  expenses: Expense[];
  categories: Category[];
  onRemove: (id: string) => void;
}) {
  const byId = new Map(categories.map((category) => [category.id, category]));

  if (expenses.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-muted">
        No spends this cycle yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {expenses.map((expense) => {
        const category = byId.get(expense.categoryId);
        return (
          <li key={expense.id} className="flex items-center gap-3 py-3">
            <span
              className={`size-2.5 shrink-0 rounded-full ${category ? catBg(category.colorId) : "bg-muted"}`}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">
                {category?.name ?? "Removed"}
              </p>
              <p className="text-xs text-muted">
                {format(parseISODate(expense.date), "MMM d")}
              </p>
            </div>
            <p className="text-sm tabular-nums text-fg">
              {formatCents(expense.amountCents)}
            </p>
            <button
              type="button"
              onClick={() => onRemove(expense.id)}
              className="relative size-8 text-subtle after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2 hover:text-danger"
              aria-label="Remove spend"
            >
              <Trash2 className="mx-auto size-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
