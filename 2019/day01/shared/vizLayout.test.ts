import { describe, expect, it } from 'vitest';
import { computeGaugeRatio, computeModuleWindow, computeStageSegments } from './vizLayout';

describe('computeGaugeRatio', () => {
  it('handles zero/negative bounds, proportional fractions, and upper clamping', () => {
    expect(computeGaugeRatio(10, 0)).toBe(0);
    expect(computeGaugeRatio(10, -5)).toBe(0);
    expect(computeGaugeRatio(0, 100)).toBe(0);
    expect(computeGaugeRatio(-3, 100)).toBe(0);
    expect(computeGaugeRatio(25, 100)).toBe(0.25);
    expect(computeGaugeRatio(100, 100)).toBe(1);
    expect(computeGaugeRatio(150, 100)).toBe(1);
  });
});

describe('computeModuleWindow', () => {
  it('centers the active index within bounds and handles small/empty totals', () => {
    expect(computeModuleWindow(0, 0, 8)).toEqual({ start: 0, end: 0 });
    expect(Object.isFrozen(computeModuleWindow(4, 2, 8))).toBe(true);
    expect(computeModuleWindow(4, 2, 8)).toEqual({ start: 0, end: 4 });
    expect(computeModuleWindow(20, 0, 8)).toEqual({ start: 0, end: 8 });
    expect(computeModuleWindow(20, 10, 8)).toEqual({ start: 6, end: 14 });
    expect(computeModuleWindow(20, 19, 8)).toEqual({ start: 12, end: 20 });
    expect(computeModuleWindow(20, -3, 8)).toEqual({ start: 0, end: 8 });
    expect(computeModuleWindow(20, 99, 8)).toEqual({ start: 12, end: 20 });
  });

  it('rejects invalid totalCount or maxVisible parameters', () => {
    expect(() => computeModuleWindow(-1, 0, 8)).toThrow(RangeError);
    expect(() => computeModuleWindow(1.5, 0, 8)).toThrow(RangeError);
    expect(() => computeModuleWindow(5, 0, 0)).toThrow(RangeError);
    expect(() => computeModuleWindow(5, 0, 2.5)).toThrow(RangeError);
  });
});

describe('computeStageSegments', () => {
  it('returns empty frozen list for empty stages, non-positive total, or non-positive width', () => {
    expect(computeStageSegments([], 280)).toEqual([]);
    expect(computeStageSegments([0], 280)).toEqual([]);
    expect(computeStageSegments([10, 5], 0)).toEqual([]);
    expect(computeStageSegments([10, 5], -10)).toEqual([]);
  });

  it('computes contiguous proportional stage segments summing to trackWidth', () => {
    const segments = computeStageSegments([300, 100], 200);
    expect(Object.isFrozen(segments)).toBe(true);
    expect(Object.isFrozen(segments[0])).toBe(true);
    expect(segments).toEqual([
      { stageIndex: 0, fuel: 300, x: 0, width: 150 },
      { stageIndex: 1, fuel: 100, x: 150, width: 50 },
    ]);
  });
});
