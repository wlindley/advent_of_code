import { describe, expect, it } from 'vitest';
import {
  CIRCUIT_SVG_HEIGHT,
  CIRCUIT_SVG_WIDTH,
  computeCircuitDiagramLayout,
  formatPhaseTuple,
  formatSignalValue,
  normalizeSignalRatio,
} from './vizLayout';

describe('vizLayout', () => {
  it('computes deterministic 860x250 circuit geometry with optional feedback path', () => {
    const series = computeCircuitDiagramLayout(false);
    expect(series.width).toBe(CIRCUIT_SVG_WIDTH);
    expect(series.height).toBe(CIRCUIT_SVG_HEIGHT);
    expect(series.width).toBe(860);
    expect(series.height).toBe(250);
    expect(series.nodes.map((n) => n.label)).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(series.wires).toHaveLength(6);
    expect(series.wires[0]!.fromLabel).toBe('IN');
    expect(series.wires[5]!.toLabel).toBe('OUT');
    expect(series.feedbackPath).toBeNull();
    expect(Object.isFrozen(series)).toBe(true);
    expect(Object.isFrozen(series.nodes)).toBe(true);
    expect(Object.isFrozen(series.wires)).toBe(true);

    const feedback = computeCircuitDiagramLayout(true);
    expect(feedback.feedbackPath).not.toBeNull();
    expect(feedback.feedbackLabelX).toBeGreaterThan(0);
    expect(feedback.feedbackLabelY).toBeGreaterThan(0);
  });

  it('formats phase tuples and BigInt signal values without Number precision loss', () => {
    expect(formatPhaseTuple([4n, 3n, 2n, 1n, 0n])).toBe('4, 3, 2, 1, 0');
    expect(formatSignalValue(0n)).toBe('0');
    expect(formatSignalValue(43210n)).toBe('43,210');
    expect(formatSignalValue(-1234567n)).toBe('-1,234,567');
    expect(formatSignalValue(999999999999999n)).toBe('999,999,999,999,999');
    expect(formatSignalValue(1000000000000000n)).toBe('1.000e+15');
    expect(formatSignalValue(-98765432109876543210n)).toBe('-9.876e+19');
  });

  it('normalizes signal ratios safely across zero-span, in-range, clamped, and invalid bounds', () => {
    expect(normalizeSignalRatio(42n, 42n, 42n)).toBe(1);
    expect(normalizeSignalRatio(50n, 0n, 100n)).toBe(0.5);
    expect(normalizeSignalRatio(-10n, 0n, 100n)).toBe(0);
    expect(normalizeSignalRatio(150n, 0n, 100n)).toBe(1);
    expect(normalizeSignalRatio(10n ** 30n, 0n, 2n * 10n ** 30n)).toBe(0.5);
    expect(() => normalizeSignalRatio(0n, 10n, 5n)).toThrow(RangeError);
  });
});
