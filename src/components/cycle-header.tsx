import { ChevronLeft, ChevronRight, History, Settings } from "lucide-react";
import { formatCycleRange } from "@/lib/cycle";
import type { Cycle } from "@/lib/types";
import { Button } from "./ui/button";

export function CycleHeader({
  cycle,
  canGoForward,
  canGoBack,
  onPrev,
  onNext,
  onHistory,
  onSettings,
}: {
  cycle: Cycle;
  canGoForward: boolean;
  canGoBack: boolean;
  onPrev: () => void;
  onNext: () => void;
  onHistory: () => void;
  onSettings: () => void;
}) {
  return (
    <header className="flex items-center gap-1 pt-safe">
      <Button
        variant="ghost"
        size="icon"
        onClick={onHistory}
        aria-label="Past cycles"
        className="shrink-0"
      >
        <History className="size-5" />
      </Button>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrev}
          disabled={!canGoBack}
          aria-label="Previous cycle"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <p className="min-w-0 truncate text-center text-sm font-medium text-fg">
          {formatCycleRange(cycle)}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          disabled={!canGoForward}
          aria-label="Next cycle"
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onSettings}
        aria-label="Settings"
        className="shrink-0"
      >
        <Settings className="size-5" />
      </Button>
    </header>
  );
}
