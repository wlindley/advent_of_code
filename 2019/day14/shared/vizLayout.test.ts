import { describe, expect, it } from 'vitest';
import { parseReactionNetwork } from './models';
import {
  DagLayout,
  computeBudgetFillRatio,
  computeDagLayout,
  computeLogScalePosition,
  formatCompactBigInt,
} from './vizLayout';

const SAMPLE_NET = parseReactionNetwork([
  '10 ORE => 10 A',
  '1 ORE => 1 B',
  '7 A, 1 B => 1 C',
  '7 A, 1 C => 1 FUEL',
].join('\n'));

describe('day14 shared vizLayout', () => {
  it('computes a layered frozen DagLayout from FUEL down to ORE', () => {
    const layout = computeDagLayout(SAMPLE_NET);
    expect(layout).toBeInstanceOf(DagLayout);
    expect(Object.isFrozen(layout)).toBe(true);
    expect(layout.viewBox).toBe(`0 0 ${layout.width} ${layout.height}`);
    expect(layout.nodes).toHaveLength(5);
    expect(layout.edges).toHaveLength(6);

    const fuel = layout.nodeByChemical.get('FUEL')!;
    const c = layout.nodeByChemical.get('C')!;
    const a = layout.nodeByChemical.get('A')!;
    const ore = layout.nodeByChemical.get('ORE')!;
    expect(fuel.depth).toBe(0);
    expect(c.depth).toBe(1);
    expect(a.depth).toBe(2);
    expect(ore.depth).toBe(3);
    expect(fuel.y).toBeLessThan(c.y);
    expect(c.y).toBeLessThan(ore.y);
  });

  it('computes bounded log-scale positions including huge BigInt values', () => {
    expect(computeLogScalePosition(-5n, 100n)).toBe(0);
    expect(computeLogScalePosition(0n, 100n)).toBe(0);
    expect(computeLogScalePosition(50n, 0n)).toBe(0);
    expect(computeLogScalePosition(100n, 100n)).toBe(1);
    expect(computeLogScalePosition(200n, 100n)).toBe(1);

    const mid = computeLogScalePosition(31n, 1023n);
    expect(mid).toBeCloseTo(0.5, 5);
    const huge = computeLogScalePosition(1n << 1200n, 1n << 2400n);
    expect(huge).toBeCloseTo(0.5, 2);
  });

  it('computes BigInt budget fill ratios across boundary cases', () => {
    expect(computeBudgetFillRatio(-1n, 100n)).toBe(0);
    expect(computeBudgetFillRatio(0n, 100n)).toBe(0);
    expect(computeBudgetFillRatio(50n, 0n)).toBe(0);
    expect(computeBudgetFillRatio(100n, 100n)).toBe(1);
    expect(computeBudgetFillRatio(150n, 100n)).toBe(1);
    expect(computeBudgetFillRatio(250_000_000_000n, 1_000_000_000_000n)).toBe(0.25);
  });

  it('formats BigInts compactly across Q/T/B/M/K and small/negative values', () => {
    expect(formatCompactBigInt(-2500n)).toBe('-2.5K');
    expect(formatCompactBigInt(0n)).toBe('0');
    expect(formatCompactBigInt(999n)).toBe('999');
    expect(formatCompactBigInt(1_000n)).toBe('1K');
    expect(formatCompactBigInt(1_250n)).toBe('1.2K');
    expect(formatCompactBigInt(4_500_000n)).toBe('4.5M');
    expect(formatCompactBigInt(7_000_000_000n)).toBe('7B');
    expect(formatCompactBigInt(1_000_000_000_000n)).toBe('1T');
    expect(formatCompactBigInt(3_200_000_000_000_000n)).toBe('3.2Q');
  });
});
