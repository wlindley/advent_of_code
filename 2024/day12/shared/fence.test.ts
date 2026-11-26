import { describe, expect, it } from 'vitest';
import {
  createGardenGroupsSolver,
  DEFAULT_MAX_TRACE_STEPS,
  evaluateTotalFenceCost,
  GardenTraceFrame,
  parseGardenMap,
  type RegionFenceMetric,
  traceGardenGroups,
} from './index';

const AREA_SQUARED_METRIC: RegionFenceMetric = {
  id: 'double-area',
  label: 'Double Area',
  unit: 'cells',
  measure: (_map, _partition, region) => region.area * 2,
};

describe('GardenTraceFrame', () => {
  it('freezes instance and computes derived regionPrice', () => {
    const frame = new GardenTraceFrame({
      regionOrder: 1,
      totalRegions: 3,
      regionId: 1,
      plant: 'B',
      area: 4,
      metricValue: 10,
      runningTotal: 52,
    });

    expect(Object.isFrozen(frame)).toBe(true);
    expect(frame.regionOrder).toBe(1);
    expect(frame.totalRegions).toBe(3);
    expect(frame.regionId).toBe(1);
    expect(frame.plant).toBe('B');
    expect(frame.area).toBe(4);
    expect(frame.metricValue).toBe(10);
    expect(frame.runningTotal).toBe(52);
    expect(frame.regionPrice).toBe(40);
  });
});

describe('evaluateTotalFenceCost and traceGardenGroups', () => {
  it('sums region area * metric across all regions', () => {
    const map = parseGardenMap('AAB\nAAC');
    // Regions: A(area 4 -> 4*8=32), B(area 1 -> 1*2=2), C(area 1 -> 1*2=2) => 36
    expect(evaluateTotalFenceCost(map, AREA_SQUARED_METRIC)).toBe(36);
  });

  it('produces unsampled frozen frames by default and respects maxSteps sampling', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(80);
    const map = parseGardenMap('AB\nCD');

    const full = traceGardenGroups(map, AREA_SQUARED_METRIC);
    expect(Object.isFrozen(full)).toBe(true);
    expect(full.map((f) => [f.regionOrder, f.plant, f.regionPrice, f.runningTotal])).toEqual([
      [0, 'A', 2, 2],
      [1, 'B', 2, 4],
      [2, 'C', 2, 6],
      [3, 'D', 2, 8],
    ]);

    const sampledTwo = traceGardenGroups(map, AREA_SQUARED_METRIC, { maxSteps: 2 });
    expect(sampledTwo.map((f) => [f.regionOrder, f.runningTotal])).toEqual([
      [0, 2],
      [3, 8],
    ]);

    const sampledOne = traceGardenGroups(map, AREA_SQUARED_METRIC, { maxSteps: 1 });
    expect(sampledOne.map((f) => [f.regionOrder, f.runningTotal])).toEqual([[3, 8]]);
  });

  it('throws RangeError for invalid maxSteps', () => {
    const map = parseGardenMap('AB');
    expect(() => traceGardenGroups(map, AREA_SQUARED_METRIC, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceGardenGroups(map, AREA_SQUARED_METRIC, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => traceGardenGroups(map, AREA_SQUARED_METRIC, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});

describe('createGardenGroupsSolver', () => {
  it('returns a frozen PuzzleSolver delegating parse, solve, and trace', () => {
    const solver = createGardenGroupsSolver(AREA_SQUARED_METRIC);
    expect(Object.isFrozen(solver)).toBe(true);
    const map = solver.parse('AA\nBC');
    expect(solver.solve(map)).toBe(12);
    expect(solver.trace?.(map)).toHaveLength(3);
    expect(solver.trace?.(map, { maxSteps: 1 })).toHaveLength(1);
  });
});
