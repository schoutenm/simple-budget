export const CAT_HEX = [
  "#e08a68",
  "#7faf88",
  "#7f97b8",
  "#c4a06a",
  "#8aa090",
  "#c4846c",
  "#6a9aa0",
  "#b89a82",
] as const;

export const CAT_BG = [
  "bg-cat-1",
  "bg-cat-2",
  "bg-cat-3",
  "bg-cat-4",
  "bg-cat-5",
  "bg-cat-6",
  "bg-cat-7",
  "bg-cat-8",
] as const;

export const SPENT_HEX = "#2a2a28";

export function catBg(colorId: number): string {
  const index = ((colorId - 1) % CAT_BG.length + CAT_BG.length) % CAT_BG.length;
  return CAT_BG[index];
}

export function catHex(colorId: number): string {
  const index = ((colorId - 1) % CAT_HEX.length + CAT_HEX.length) % CAT_HEX.length;
  return CAT_HEX[index];
}

export function nextColorId(used: number[]): number {
  for (let id = 1; id <= 8; id += 1) {
    if (!used.includes(id)) return id;
  }
  return (used.length % 8) + 1;
}
