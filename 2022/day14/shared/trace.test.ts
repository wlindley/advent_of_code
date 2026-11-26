import { describe, expect, it } from 'vitest';
import { CaveBounds, type CaveBoundaryPolicy } from './boundaryPolicy';
import { CavePoint, parseCaveScan, SOURCE_X } from './caveScan';
import { simulateReservoir } from './simulation';
import { buildReservoirTrace, DEFAULT_MAX_TRACE_STEPS, ReservoirTraceFrame } from './trace';

const EXAMPLE_SCAN = '498,4 -> 498,6 -> 496,6\n503,4 -> 502,4 -> 502,9 -> 494,9';

const TEST_ABYSS_POLICY: CaveBoundaryPolicy = {
  label: 'TestAbyss',
  computeBounds(scan) {
    const maxY = scan.maxY + 1;
    const minX = Math.max(SOURCE_X - maxY, Math.min(scan.minX, SOURCE_X) - 1);
    const maxX = Math.min(SOURCE_X + maxY, Math.max(scan.maxX, SOURCE_X) + 1);
    return new CaveBounds(minX, maxX, maxY, null);
  },
  isEscape: (y, bounds) => y >= bounds.maxY,
};

const TEST_FLOOR_POLICY: CaveBoundaryPolicy = {
  label: 'TestFloor',
  computeBounds(scan) {
    const floorY = scan.maxY + 2;
    return new CaveBounds(SOURCE_X - floorY, SOURCE_X + floorY, floorY, floorY);
  },
  isEscape: () => false,
};

describe('ReservoirTraceFrame', () => {
  it('computes isComplete dynamically and validates counts', () => {
    const pouring = new ReservoirTraceFrame(1, 5, new CavePoint(500, 8), 'pouring');
    expect(pouring.isComplete).toBe(false);
    expect(Object.isFrozen(pouring)).toBe(true);
    const escaped = new ReservoirTraceFrame(5, 5, null, 'escaped');
    expect(escaped.isComplete).toBe(true);
    expect(() => new ReservoirTraceFrame(0, -1, null, 'pouring')).toThrow(RangeError);
    expect(() => new ReservoirTraceFrame(6, 5, null, 'pouring')).toThrow(RangeError);
    expect(() => new ReservoirTraceFrame(-1, 5, null, 'pouring')).toThrow(RangeError);
  });
});

describe('buildReservoirTrace', () => {
  it('builds full trace ending with escaped frame for abyss simulation', () => {
    const field = simulateReservoir(parseCaveScan(EXAMPLE_SCAN), TEST_ABYSS_POLICY);
    const frames = buildReservoirTrace(field);
    expect(frames).toHaveLength(26);
    expect(frames[0]).toEqual(new ReservoirTraceFrame(0, 24, null, 'pouring'));
    expect(frames[1]!.activeGrain).toEqual(new CavePoint(500, 8));
    expect(frames[24]).toEqual(new ReservoirTraceFrame(24, 24, new CavePoint(495, 8), 'pouring'));
    expect(frames[25]).toEqual(new ReservoirTraceFrame(24, 24, null, 'escaped'));
    expect(Object.isFrozen(frames)).toBe(true);
  });

  it('builds trace ending with blocked frame for floor simulation and samples when capped', () => {
    const field = simulateReservoir(parseCaveScan(EXAMPLE_SCAN), TEST_FLOOR_POLICY);
    const full = buildReservoirTrace(field);
    expect(full).toHaveLength(94);
    expect(full[93]!.phase).toBe('blocked');
    expect(full[93]!.isComplete).toBe(true);

    const sampled = buildReservoirTrace(field, { maxSteps: 10 });
    expect(sampled).toHaveLength(10);
    expect(sampled[0]!.settledCount).toBe(0);
    expect(sampled[9]!.phase).toBe('blocked');
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(160);
    expect(() => buildReservoirTrace(field, { maxSteps: 0 })).toThrow(RangeError);
  });
});
