import { Delete } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { catBg } from "@/lib/colors";
import { isDateInCycle, toISODate } from "@/lib/cycle";
import { dollarsToCents, formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Category, Cycle } from "@/lib/types";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "./ui/drawer";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"] as const;

function applyKey(current: string, key: string): string {
  if (key === "back") return current.slice(0, -1);
  if (key === ".") {
    if (current.includes(".")) return current;
    return current.length === 0 ? "0." : `${current}.`;
  }
  if (current === "0" && key !== ".") return key;
  const next = `${current}${key}`;
  const [whole, frac] = next.split(".");
  if ((whole?.replace(/^0+/, "").length ?? 0) > 6) return current;
  if (frac && frac.length > 2) return current;
  return next;
}

export function LogSpend({
  open,
  onOpenChange,
  categories,
  cycle,
  isCurrent,
  presetCategoryId,
  onLog,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  cycle: Cycle;
  isCurrent: boolean;
  presetCategoryId: string | null;
  onLog: (input: { amountCents: number; categoryId: string; date: string }) => void;
}) {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(() => toISODate(new Date()));

  useEffect(() => {
    if (!open) return;
    const today = toISODate(new Date());
    const nextDate =
      isCurrent && isDateInCycle(today, cycle)
        ? today
        : toISODate(isCurrent ? new Date() : cycle.end);
    setAmount("");
    setCategoryId(presetCategoryId ?? categories[0]?.id ?? null);
    setDate(nextDate);
  }, [open, presetCategoryId, isCurrent, cycle, categories]);

  const cents = useMemo(() => dollarsToCents(amount || "0"), [amount]);
  const canLog = cents > 0 && Boolean(categoryId);

  function submit(nextCategoryId = categoryId) {
    if (cents <= 0 || !nextCategoryId) return;
    onLog({ amountCents: cents, categoryId: nextCategoryId, date });
    onOpenChange(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-safe pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DrawerTitle>Log a spend</DrawerTitle>
              <DrawerDescription>Amount and category. That’s it.</DrawerDescription>
            </div>
            <label className="text-right text-xs text-muted">
              Date
              <input
                type="date"
                value={date}
                min={toISODate(cycle.start)}
                max={toISODate(cycle.end)}
                onChange={(event) => setDate(event.target.value)}
                className="mt-1 block rounded-sm bg-raised px-2 py-1 text-sm text-fg outline-none ring-1 ring-border"
              />
            </label>
          </div>

          <p className="font-display text-hero text-center tabular-nums tracking-tight text-fg">
            {amount ? formatCents(cents) : "$0"}
          </p>

          <div className="grid grid-cols-3 gap-2">
            {KEYS.map((key) => (
              <Button
                key={key}
                type="button"
                variant="key"
                size="key"
                aria-label={key === "back" ? "Delete" : key}
                onClick={() => setAmount((value) => applyKey(value, key))}
              >
                {key === "back" ? <Delete className="size-5" /> : key}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => {
              const selected = category.id === categoryId;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(category.id);
                    if (cents > 0) submit(category.id);
                  }}
                  className={cn(
                    "flex min-h-12 items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-[transform,background-color] duration-(--motion-quick) ease-(--ease-out) active:scale-[0.96]",
                    selected ? "bg-raised ring-1 ring-border-strong" : "bg-raised/60",
                  )}
                >
                  <span className={cn("size-2.5 shrink-0 rounded-full", catBg(category.colorId))} />
                  <span className="truncate">{category.name}</span>
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            size="xl"
            className="w-full"
            disabled={!canLog}
            onClick={() => submit()}
          >
            Log spend
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
