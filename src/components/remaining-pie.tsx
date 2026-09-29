import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { catHex, SPENT_HEX } from "@/lib/colors";
import { formatCents } from "@/lib/money";
import { formatRefillDate } from "@/lib/cycle";
import type { CycleSummary } from "@/lib/types";

type Slice = {
  id: string;
  name: string;
  value: number;
  color: string;
};

function pieSlices(summary: CycleSummary): Slice[] {
  const remaining = summary.categories
    .filter((row) => row.remainingCents > 0)
    .map((row) => ({
      id: row.category.id,
      name: row.category.name,
      value: row.remainingCents,
      color: catHex(row.category.colorId),
    }));

  const spentCap = Math.min(
    Math.max(summary.totalSpentCents, 0),
    Math.max(summary.totalAvailableCents, 0),
  );

  if (spentCap > 0) {
    remaining.push({
      id: "spent",
      name: "Spent",
      value: spentCap,
      color: SPENT_HEX,
    });
  }

  if (remaining.length === 0) {
    return [
      {
        id: "empty",
        name: "No budget",
        value: 1,
        color: SPENT_HEX,
      },
    ];
  }

  return remaining;
}

export function RemainingPie({ summary }: { summary: CycleSummary }) {
  const slices = pieSlices(summary);
  const overspent = summary.totalRemainingCents < 0;
  const remainingLabel = overspent ? "over" : "left";

  return (
    <section className="relative mx-auto w-full max-w-sm">
      <div className="relative mx-auto aspect-square w-full max-w-72">
        <div className="pointer-events-none absolute inset-8 rounded-full ring-8 ring-raised" />
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="92%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={1.2}
              stroke="var(--color-bg)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell key={slice.id} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                formatCents(Number(value) || 0),
                String(name),
              ]}
              contentStyle={{
                background: "var(--color-raised)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                color: "var(--color-fg)",
                fontSize: "0.8125rem",
              }}
              itemStyle={{ color: "var(--color-fg)" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            {remainingLabel}
          </p>
          <p
            className={`font-display text-display leading-none tracking-tight tabular-nums ${
              overspent ? "text-danger" : "text-fg"
            }`}
          >
            {formatCents(summary.totalRemainingCents)}
          </p>
          <p className="mt-2 text-sm text-muted tabular-nums">
            of {formatCents(summary.totalAvailableCents)}
          </p>
        </div>
      </div>
      {summary.totalSurplusCents > 0 ? (
        <p className="mt-3 text-center text-sm text-muted">
          {formatCents(summary.totalSurplusCents)} carried from last cycle
        </p>
      ) : null}
      <p className={`text-center text-sm text-muted ${summary.totalSurplusCents > 0 ? "mt-1" : "mt-3"}`}>
        {summary.isCurrent
          ? summary.daysLeft === 0
            ? `Refills ${formatRefillDate(summary.cycle)}`
            : `${summary.daysLeft} day${summary.daysLeft === 1 ? "" : "s"} left · refills ${formatRefillDate(summary.cycle)}`
          : "Closed cycle"}
      </p>
    </section>
  );
}
