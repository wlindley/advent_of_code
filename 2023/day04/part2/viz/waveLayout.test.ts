import { describe, expect, it } from 'vitest';
import { computeBarRatio, computeVisibleWindow, formatCompactBigInt } from './waveLayout';

describe('waveLayout', () => {
  it('computes log2 and linear bar ratios safely across small and huge BigInts', () => {
    expect(computeBarRatio(0n, 10n, 'log2')).toBe(0);
    expect(computeBarRatio(1n, 0n, 'linear')).toBe(0);
    expect(computeBarRatio(1n, 1n, 'log2')).toBe(1);
    expect(computeBarRatio(1n, 1n, 'linear')).toBe(1);
    expect(computeBarRatio(5n, 10n, 'linear')).toBe(0.5);
    expect(computeBarRatio(1n, 14n, 'log2')).toBeGreaterThan(0.15);
    expect(computeBarRatio(14n, 14n, 'log2')).toBe(1);
    const huge = 1n << 1200n;
    expect(computeBarRatio(huge, huge, 'log2')).toBe(1);
    expect(computeBarRatio(huge >> 1n, huge, 'linear')).toBe(0.5);
  });

  it('formats compact BigInts cleanly past Number.MAX_VALUE', () => {
    expect(formatCompactBigInt(0n)).toBe('0');
    expect(formatCompactBigInt(999n)).toBe('999');
    expect(formatCompactBigInt(1_500n)).toBe('1.5K');
    expect(formatCompactBigInt(2_000_000n)).toBe('2M');
    expect(formatCompactBigInt(3_400_000_000n)).toBe('3.4B');
    expect(formatCompactBigInt(7_000_000_000_000n)).toBe('7T');
    expect(formatCompactBigInt(1n << 70n)).toMatch(/^1\.18e\+21$/);
  });

  it('computes a clamped visible bar window around activeIndex', () => {
    expect(computeVisibleWindow(2, 6, 48)).toEqual({ start: 0, end: 6 });
    expect(computeVisibleWindow(0, 200, 48)).toEqual({ start: 0, end: 48 });
    expect(computeVisibleWindow(100, 200, 48)).toEqual({ start: 76, end: 124 });
    expect(computeVisibleWindow(199, 200, 48)).toEqual({ start: 152, end: 200 });
  });
});
