import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  cycleContaining,
  listCycles,
  nextCycle,
  parseISODate,
  previousCycle,
  summarizeCycle,
  toISODate,
} from "@/lib/cycle";
import { categoriesForCycle } from "@/lib/ledger";
import { formatCents } from "@/lib/money";
import { currentCycleStartIso, useBudgetStore } from "@/store/budget-store";
import { CategoryRows } from "./category-rows";
import { CycleHeader } from "./cycle-header";
import { ExpenseList } from "./expense-list";
import { HistoryPanel } from "./history-panel";
import { LogSpend } from "./log-spend";
import { RemainingPie } from "./remaining-pie";
import { SettingsPanel } from "./settings-panel";
import { Button } from "./ui/button";

export function AppHome() {
  const [logOpen, setLogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [presetCategoryId, setPresetCategoryId] = useState<string | null>(null);

  const cycleStartDay = useBudgetStore((s) => s.cycleStartDay);
  const categories = useBudgetStore((s) => s.categories);
  const expenses = useBudgetStore((s) => s.expenses);
  const viewingStartIso = useBudgetStore((s) => s.viewingStartIso);
  const setViewingStartIso = useBudgetStore((s) => s.setViewingStartIso);
  const setCycleStartDay = useBudgetStore((s) => s.setCycleStartDay);
  const addCategory = useBudgetStore((s) => s.addCategory);
  const updateCategory = useBudgetStore((s) => s.updateCategory);
  const removeCategory = useBudgetStore((s) => s.removeCategory);
  const addExpense = useBudgetStore((s) => s.addExpense);
  const removeExpense = useBudgetStore((s) => s.removeExpense);
  const loadSample = useBudgetStore((s) => s.loadSample);
  const clearExpenses = useBudgetStore((s) => s.clearExpenses);

  const cycleSnapshots = useBudgetStore((s) => s.cycleSnapshots);

  useEffect(() => {
    void Promise.resolve(useBudgetStore.persist.rehydrate()).then(() => {
      useBudgetStore.getState().ensureCurrentCycle();
    });
  }, []);

  const now = useMemo(() => new Date(), [expenses.length, cycleStartDay]);
  const current = useMemo(
    () => cycleContaining(now, cycleStartDay),
    [now, cycleStartDay],
  );
  const viewing = useMemo(() => {
    if (viewingStartIso) {
      return cycleContaining(parseISODate(viewingStartIso), cycleStartDay);
    }
    return current;
  }, [viewingStartIso, cycleStartDay, current]);

  const viewingCategories = useMemo(
    () => categoriesForCycle(viewing, cycleSnapshots, categories),
    [viewing, cycleSnapshots, categories],
  );
  const summary = useMemo(
    () => summarizeCycle(viewing, viewingCategories, expenses, now, cycleStartDay),
    [viewing, viewingCategories, expenses, now, cycleStartDay],
  );
  const cycles = useMemo(
    () => listCycles(expenses, cycleStartDay, now),
    [expenses, cycleStartDay, now],
  );

  const oldest = cycles[cycles.length - 1];
  const canGoBack = Boolean(oldest) && toISODate(viewing.start) !== toISODate(oldest.start);
  const canGoForward = toISODate(viewing.start) !== toISODate(current.start);

  function openLog(categoryId?: string) {
    setPresetCategoryId(categoryId ?? null);
    setLogOpen(true);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-28">
      <CycleHeader
        cycle={viewing}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onPrev={() => {
          if (!canGoBack) return;
          setViewingStartIso(toISODate(previousCycle(viewing, cycleStartDay).start));
        }}
        onNext={() => {
          const next = nextCycle(viewing, cycleStartDay);
          if (next.start.getTime() >= current.start.getTime()) {
            setViewingStartIso(null);
            return;
          }
          setViewingStartIso(toISODate(next.start));
        }}
        onHistory={() => setHistoryOpen(true)}
        onSettings={() => setSettingsOpen(true)}
      />

      <div className="mt-4">
        <RemainingPie summary={summary} />
      </div>

      <section className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-fg">Remaining</h2>
          <p className="text-xs text-muted">Tap to log</p>
        </div>
        <CategoryRows rows={summary.categories} onPick={(id) => openLog(id)} />
      </section>

      <section className="mt-8">
        <h2 className="mb-1 text-sm font-medium text-fg">This cycle</h2>
        <ExpenseList
          expenses={summary.expenses}
          categories={viewingCategories}
          onRemove={removeExpense}
        />
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-4 pb-safe">
        <div className="pointer-events-auto">
          <Button size="xl" className="w-full shadow-fab" onClick={() => openLog()}>
            <Plus className="size-5" />
            Log spend
          </Button>
        </div>
      </div>

      <LogSpend
        open={logOpen}
        onOpenChange={setLogOpen}
        categories={viewingCategories}
        cycle={viewing}
        isCurrent={summary.isCurrent}
        presetCategoryId={presetCategoryId}
        onLog={(input) => {
          addExpense(input);
          const category = viewingCategories.find((item) => item.id === input.categoryId);
          toast.success(
            `Logged ${formatCents(input.amountCents)}${category ? ` · ${category.name}` : ""}`,
          );
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(12);
          }
        }}
      />

      <SettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        cycleStartDay={cycleStartDay}
        categories={categories}
        onCycleStartDay={setCycleStartDay}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategory}
        onRemoveCategory={removeCategory}
        onLoadSample={loadSample}
        onClearExpenses={clearExpenses}
      />

      <HistoryPanel
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        cycles={cycles}
        categories={categories}
        snapshots={cycleSnapshots}
        expenses={expenses}
        startDay={cycleStartDay}
        viewingStartIso={viewingStartIso ?? currentCycleStartIso(cycleStartDay, now)}
        onSelect={(iso) => {
          if (iso === currentCycleStartIso(cycleStartDay, now)) {
            setViewingStartIso(null);
            return;
          }
          setViewingStartIso(iso);
        }}
      />
    </div>
  );
}
