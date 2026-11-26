import { describe, expect, it } from 'vitest';
import {
  MANHATTAN_METRIC,
  SIGNAL_DELAY_METRIC,
  WireCrossing,
  WireSegment,
  absBigInt,
  maxBigInt,
  minBigInt,
} from './index';

describe('bigint helpers', () => {
  it('computes abs, min, and max for negative, zero, positive, and equal values', () => {
    expect(absBigInt(-42n)).toBe(42n);
    expect(absBigInt(0n)).toBe(0n);
    expect(absBigInt(42n)).toBe(42n);
    expect(minBigInt(3n, 7n)).toBe(3n);
    expect(minBigInt(7n, 3n)).toBe(3n);
    expect(minBigInt(5n, 5n)).toBe(5n);
    expect(maxBigInt(3n, 7n)).toBe(7n);
    expect(maxBigInt(7n, 3n)).toBe(7n);
    expect(maxBigInt(5n, 5n)).toBe(5n);
  });
});

describe('WireSegment', () => {
  it('derives orientation, end, endSteps, fixedCoord, span, and stepsTo for R/L/U/D', () => {
    const right = new WireSegment(0, { x: 1n, y: 2n }, 'R', 5n, 0n);
    expect(right.orientation).toBe('H');
    expect(right.end).toEqual({ x: 6n, y: 2n });
    expect(right.endSteps).toBe(5n);
    expect(right.fixedCoord).toBe(2n);
    expect(right.span.start).toBe(1n);
    expect(right.span.end).toBe(6n);
    expect(right.stepsTo({ x: 4n, y: 2n })).toBe(3n);

    const left = new WireSegment(1, { x: 6n, y: 2n }, 'L', 9n, 5n);
    expect(left.orientation).toBe('H');
    expect(left.end).toEqual({ x: -3n, y: 2n });
    expect(left.span.start).toBe(-3n);
    expect(left.span.end).toBe(6n);
    expect(left.stepsTo({ x: 1n, y: 2n })).toBe(10n);

    const up = new WireSegment(2, { x: -3n, y: 2n }, 'U', 4n, 14n);
    expect(up.orientation).toBe('V');
    expect(up.end).toEqual({ x: -3n, y: 6n });
    expect(up.fixedCoord).toBe(-3n);
    expect(up.span.start).toBe(2n);
    expect(up.span.end).toBe(6n);
    expect(up.stepsTo({ x: -3n, y: 5n })).toBe(17n);

    const down = new WireSegment(3, { x: -3n, y: 6n }, 'D', 8n, 18n);
    expect(down.orientation).toBe('V');
    expect(down.end).toEqual({ x: -3n, y: -2n });
    expect(down.span.start).toBe(-2n);
    expect(down.span.end).toBe(6n);
    expect(down.stepsTo({ x: -3n, y: 0n })).toBe(24n);
  });

  it('freezes instance and start point', () => {
    const start = { x: 0n, y: 0n };
    const seg = new WireSegment(0, start, 'R', 1n, 0n);
    expect(Object.isFrozen(seg)).toBe(true);
    expect(Object.isFrozen(seg.start)).toBe(true);
  });

  it('rejects invalid index, length, or startSteps', () => {
    const origin = { x: 0n, y: 0n };
    expect(() => new WireSegment(-1, origin, 'R', 1n, 0n)).toThrow(RangeError);
    expect(() => new WireSegment(1.5, origin, 'R', 1n, 0n)).toThrow(RangeError);
    expect(() => new WireSegment(0, origin, 'R', 0n, 0n)).toThrow(RangeError);
    expect(() => new WireSegment(0, origin, 'R', -2n, 0n)).toThrow(RangeError);
    expect(() => new WireSegment(0, origin, 'R', 1n, -1n)).toThrow(RangeError);
  });
});

describe('WireCrossing and metrics', () => {
  it('computes manhattanDistance, signalDelay, and metric scores dynamically', () => {
    const crossing = new WireCrossing({ x: -3n, y: 4n }, 15n, 20n, 2);
    expect(Object.isFrozen(crossing)).toBe(true);
    expect(Object.isFrozen(crossing.point)).toBe(true);
    expect(crossing.manhattanDistance).toBe(7n);
    expect(crossing.signalDelay).toBe(35n);
    expect(MANHATTAN_METRIC.name).toBe('Manhattan distance');
    expect(MANHATTAN_METRIC.score(crossing)).toBe(7n);
    expect(SIGNAL_DELAY_METRIC.name).toBe('Signal delay');
    expect(SIGNAL_DELAY_METRIC.score(crossing)).toBe(35n);
  });

  it('rejects invalid step counts or discoveryStep', () => {
    const pt = { x: 1n, y: 1n };
    expect(() => new WireCrossing(pt, 0n, 1n, 0)).toThrow(RangeError);
    expect(() => new WireCrossing(pt, 1n, 0n, 0)).toThrow(RangeError);
    expect(() => new WireCrossing(pt, 1n, 1n, -1)).toThrow(RangeError);
    expect(() => new WireCrossing(pt, 1n, 1n, 0.5)).toThrow(RangeError);
  });
});
