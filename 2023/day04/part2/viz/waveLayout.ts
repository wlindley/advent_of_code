import { bigintLog2 } from '../../../../shared/core';

export type ScaleMode = 'log2' | 'linear';

export interface VisibleWindow {
  readonly start: number;
  readonly end: number;
}

const COMPACT_UNITS: readonly (readonly [bigint, string])[] = [
  [1_000_000_000_000n, 'T'],
  [1_000_000_000n, 'B'],
  [1_000_000n, 'M'],
  [1_000n, 'K'],
];

/** Normalizes a BigInt copy count into `[0, 1]` under `'log2'` or `'linear'` scaling. */
export function computeBarRatio(copies: bigint, peakCopies: bigint, mode: ScaleMode): number {
  if (copies <= 0n || peakCopies <= 0n) return 0;
  if (mode === 'linear') {
    return Math.min(1, Number((copies * 10_000n) / peakCopies) / 10_000);
  }
  const num = 1 + bigintLog2(copies);
  const den = 1 + bigintLog2(peakCopies);
  return Math.min(1, num / den);
}

/** Formats arbitrarily large non-negative BigInts into compact display labels. */
export function formatCompactBigInt(value: bigint): string {
  if (value < 1_000n) return value.toString();
  if (value >= 1_000_000_000_000_000n) {
    const digits = value.toString();
    return `${digits[0]}.${digits.slice(1, 3)}e+${digits.length - 1}`;
  }
  for (const [unit, suffix] of COMPACT_UNITS) {
    if (value >= unit) {
      const tenths = (value * 10n) / unit;
      const whole = tenths / 10n;
      const frac = tenths % 10n;
      return frac === 0n ? `${whole}${suffix}` : `${whole}.${frac}${suffix}`;
    }
  }
  return value.toString();
}

/** Returns a half-open `[start, end)` bar slice centered near `activeIndex`. */
export function computeVisibleWindow(
  activeIndex: number,
  totalCards: number,
  maxBars = 48,
): VisibleWindow {
  if (totalCards <= maxBars) return { start: 0, end: totalCards };
  const half = Math.floor(maxBars / 2);
  const start = Math.max(0, Math.min(activeIndex - half, totalCards - maxBars));
  return { start, end: start + maxBars };
}
