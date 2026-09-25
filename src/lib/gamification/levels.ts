export function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

export function levelFromXp(totalXp: number): number {
  let level = 1;
  let accumulated = 0;
  while (true) {
    const needed = xpForLevel(level);
    if (accumulated + needed > totalXp) break;
    accumulated += needed;
    level++;
  }
  return level;
}

export function levelProgress(totalXp: number): {
  level: number;
  current: number;
  required: number;
  percent: number;
} {
  const level = levelFromXp(totalXp);
  const base = totalXpForLevel(level);
  const required = xpForLevel(level);
  const current = totalXp - base;
  const percent = required > 0 ? Math.min(100, (current / required) * 100) : 0;
  return { level, current, required, percent };
}
