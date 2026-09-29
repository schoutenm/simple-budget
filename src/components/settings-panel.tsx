import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { CAT_BG } from "@/lib/colors";
import { centsToDollarInput, dollarsToCents, formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "./ui/drawer";
import { Input } from "./ui/input";

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function ColorDots({
  value,
  onChange,
}: {
  value: number;
  onChange: (id: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CAT_BG.map((cls, index) => {
        const id = index + 1;
        return (
          <button
            key={cls}
            type="button"
            aria-label={`Color ${id}`}
            onClick={() => onChange(id)}
            className={cn(
              "size-7 rounded-full",
              cls,
              value === id ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : "",
            )}
          />
        );
      })}
    </div>
  );
}

function CategoryEditor({
  category,
  onSave,
  onRemove,
}: {
  category: Category;
  onSave: (patch: {
    name: string;
    budgetCents: number;
    colorId: number;
    carryForward: boolean;
  }) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [budget, setBudget] = useState(centsToDollarInput(category.budgetCents));
  const [colorId, setColorId] = useState(category.colorId);
  const [carryForward, setCarryForward] = useState(category.carryForward);
  const [confirmRemove, setConfirmRemove] = useState(false);

  function save(next?: Partial<{ name: string; budgetCents: number; colorId: number; carryForward: boolean }>) {
    onSave({
      name: next?.name ?? name,
      budgetCents: next?.budgetCents ?? dollarsToCents(budget),
      colorId: next?.colorId ?? colorId,
      carryForward: next?.carryForward ?? carryForward,
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-raised p-3">
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => save({ name })}
        aria-label="Category name"
      />
      <label className="text-xs font-medium text-muted">
        Cycle budget
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            $
          </span>
          <Input
            inputMode="decimal"
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            onBlur={() => save({ budgetCents: dollarsToCents(budget) })}
            className="pl-7"
          />
        </div>
      </label>
      <ColorDots
        value={colorId}
        onChange={(id) => {
          setColorId(id);
          save({ colorId: id });
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-fg">Carry leftover</p>
          <p className="text-xs text-muted">Unused funds become next cycle’s surplus.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={carryForward}
          onClick={() => {
            const next = !carryForward;
            setCarryForward(next);
            save({ carryForward: next });
          }}
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-(--motion-quick) ease-(--ease-out)",
            carryForward ? "bg-accent" : "bg-bg ring-1 ring-border-strong",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-6 rounded-full transition-transform duration-(--motion-quick) ease-(--ease-out)",
              carryForward ? "translate-x-5 bg-accent-fg" : "translate-x-0 bg-muted",
            )}
          />
        </button>
      </div>
      {confirmRemove ? (
        <Button variant="danger" onClick={onRemove}>
          Remove {category.name}?
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmRemove(true)}
          className="inline-flex h-11 items-center justify-center gap-2 text-sm text-subtle hover:text-danger"
        >
          <Trash2 className="size-4" />
          Remove category
        </button>
      )}
    </div>
  );
}

export function SettingsPanel({
  open,
  onOpenChange,
  cycleStartDay,
  categories,
  onCycleStartDay,
  onAddCategory,
  onUpdateCategory,
  onRemoveCategory,
  onLoadSample,
  onClearExpenses,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycleStartDay: number;
  categories: Category[];
  onCycleStartDay: (day: number) => void;
  onAddCategory: (input: { name: string; budgetCents: number; colorId?: number }) => void;
  onUpdateCategory: (
    id: string,
    patch: Partial<Pick<Category, "name" | "budgetCents" | "colorId" | "carryForward">>,
  ) => void;
  onRemoveCategory: (id: string) => void;
  onLoadSample: () => void;
  onClearExpenses: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [newBudget, setNewBudget] = useState("50");
  const total = categories.reduce((sum, category) => sum + category.budgetCents, 0);

  function addCategory() {
    const name = newName.trim();
    if (!name) return;
    onAddCategory({ name, budgetCents: dollarsToCents(newBudget) });
    setNewName("");
    setNewBudget("50");
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-safe pt-4">
          <div>
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>
              Category edits apply from this cycle forward. Closed months keep the
              categories and budgets they had.
            </DrawerDescription>
          </div>

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-fg">Budget month</h3>
            <div className="flex items-center justify-between rounded-lg bg-raised px-3 py-3">
              <p className="text-sm text-muted">Refills on day</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="muted"
                  size="icon"
                  className="size-9"
                  onClick={() => onCycleStartDay(cycleStartDay - 1)}
                  aria-label="Earlier refill day"
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-8 text-center text-base font-medium tabular-nums">
                  {cycleStartDay}
                </span>
                <Button
                  variant="muted"
                  size="icon"
                  className="size-9"
                  onClick={() => onCycleStartDay(cycleStartDay + 1)}
                  aria-label="Later refill day"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted">
              New budget starts on the {ordinal(cycleStartDay)} of each month.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-medium text-fg">Categories</h3>
              <p className="text-xs text-muted tabular-nums">
                {formatCents(total)} / cycle
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {categories.map((category) => (
                <CategoryEditor
                  key={category.id}
                  category={category}
                  onSave={(patch) => onUpdateCategory(category.id, patch)}
                  onRemove={() => onRemoveCategory(category.id)}
                />
              ))}
            </div>
            <div className="flex flex-col gap-2 rounded-lg bg-surface p-3 ring-1 ring-border">
              <p className="text-sm font-medium">Add category</p>
              <Input
                placeholder="Name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />
              <Input
                inputMode="decimal"
                placeholder="Budget"
                value={newBudget}
                onChange={(event) => setNewBudget(event.target.value)}
              />
              <Button
                variant="muted"
                onClick={addCategory}
                disabled={!newName.trim()}
              >
                Add
              </Button>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-fg">On your phone</h3>
            <p className="text-sm text-muted">
              In Safari on iPhone: Share, then Add to Home Screen. Remain opens like an app, with your
              numbers stored on this device.
            </p>
          </section>

          <section className="flex flex-col gap-2 pb-4">
            <h3 className="text-sm font-medium text-fg">Data</h3>
            <p className="text-sm text-muted">
              Everything stays on this device. No account, no bank link.
            </p>
            <Button variant="muted" onClick={onLoadSample}>
              Load sample month
            </Button>
            <Button variant="danger" onClick={onClearExpenses}>
              Clear spends
            </Button>
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
