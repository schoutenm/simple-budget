export function formatCents(cents: number, opts?: { sign?: "auto" | "never" }): string {
  const signMode = opts?.sign ?? "auto";
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  const body =
    remainder === 0
      ? `$${dollars.toLocaleString("en-US")}`
      : `$${dollars.toLocaleString("en-US")}.${String(remainder).padStart(2, "0")}`;
  if (signMode === "never") return body;
  return negative ? `-${body}` : body;
}

export function dollarsToCents(value: string | number): number {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return 0;
    return Math.round(value * 100);
  }
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const parsed = Number.parseFloat(trimmed.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function centsToDollarInput(cents: number): string {
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  if (remainder === 0) return String(dollars);
  return `${dollars}.${String(remainder).padStart(2, "0")}`;
}
