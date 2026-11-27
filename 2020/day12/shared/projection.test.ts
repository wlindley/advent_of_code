import { describe, expect, it } from 'vitest';
import { NavigationInstruction, ShipState, Vec2 } from './model';
import {
  ChartBounds,
  computeChartBounds,
  formatCompassCoords,
  projectPoint,
  projectVectorDirection,
} from './projection';
import { NavigationTraceFrame } from './trace';

describe('2020 Day 12 shared projection', () => {
  it('validates ChartBounds and computes eastSpan, northSpan, and span', () => {
    const wide = new ChartBounds(-5n, 15n, -2n, 8n);
    expect(wide.eastSpan).toBe(20n);
    expect(wide.northSpan).toBe(10n);
    expect(wide.span).toBe(20n);

    const tall = new ChartBounds(0n, 4n, -10n, 20n);
    expect(tall.eastSpan).toBe(4n);
    expect(tall.northSpan).toBe(30n);
    expect(tall.span).toBe(30n);

    expect(() => new ChartBounds(5n, 4n, 0n, 10n)).toThrow(RangeError);
    expect(() => new ChartBounds(0n, 10n, 3n, 2n)).toThrow(RangeError);
  });

  it('computes ChartBounds across frames while always including origin', () => {
    expect(computeChartBounds([])).toEqual(new ChartBounds(0n, 0n, 0n, 0n));

    const inst = new NavigationInstruction('F', 10n);
    const frames = [
      new NavigationTraceFrame(0, 2, null, new ShipState(new Vec2(10n, 5n), new Vec2(1n, 0n))),
      new NavigationTraceFrame(1, 2, inst, new ShipState(new Vec2(20n, 15n), new Vec2(1n, 0n))),
      new NavigationTraceFrame(2, 2, inst, new ShipState(new Vec2(-4n, -8n), new Vec2(1n, 0n))),
    ];
    expect(computeChartBounds(frames)).toEqual(new ChartBounds(-4n, 20n, -8n, 15n));

    const positiveOnly = [
      new NavigationTraceFrame(0, 1, null, new ShipState(new Vec2(5n, 6n), new Vec2(1n, 0n))),
    ];
    expect(computeChartBounds(positiveOnly)).toEqual(new ChartBounds(0n, 5n, 0n, 6n));
  });

  it('projects points with validation, zero-span centering, aspect preservation, and huge BigInts', () => {
    const zeroBounds = new ChartBounds(0n, 0n, 0n, 0n);
    expect(projectPoint(Vec2.ORIGIN, zeroBounds, 100, 10)).toEqual({ x: 50, y: 50 });

    const wideBounds = new ChartBounds(0n, 20n, 0n, 10n);
    expect(projectPoint(new Vec2(0n, 0n), wideBounds, 120, 10)).toEqual({ x: 10, y: 85 });
    expect(projectPoint(new Vec2(20n, 10n), wideBounds, 120, 10)).toEqual({ x: 110, y: 35 });

    const huge = 10n ** 400n;
    const hugeBounds = new ChartBounds(0n, huge, -huge, huge);
    const topRight = projectPoint(new Vec2(huge, huge), hugeBounds, 220, 10);
    expect(topRight.x).toBeCloseTo(160, 5);
    expect(topRight.y).toBeCloseTo(10, 5);

    expect(() => projectPoint(Vec2.ORIGIN, zeroBounds, Number.NaN, 10)).toThrow(RangeError);
    expect(() => projectPoint(Vec2.ORIGIN, zeroBounds, 100, Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => projectPoint(Vec2.ORIGIN, zeroBounds, 100, -1)).toThrow(RangeError);
    expect(() => projectPoint(Vec2.ORIGIN, zeroBounds, 20, 10)).toThrow(RangeError);
  });

  it('projects unit vector directions without -0 and handles zero and huge BigInts', () => {
    expect(projectVectorDirection(Vec2.ORIGIN)).toEqual({ dx: 0, dy: 0 });

    const east = projectVectorDirection(new Vec2(1n, 0n));
    expect(east.dx).toBe(1);
    expect(Object.is(east.dy, 0)).toBe(true);

    const west = projectVectorDirection(new Vec2(-5n, 0n));
    expect(west.dx).toBe(-1);
    expect(Object.is(west.dy, 0)).toBe(true);

    const north = projectVectorDirection(new Vec2(0n, 1n));
    expect(north).toEqual({ dx: 0, dy: -1 });

    const south = projectVectorDirection(new Vec2(0n, -(10n ** 400n)));
    expect(south).toEqual({ dx: 0, dy: 1 });

    const diag = projectVectorDirection(new Vec2(3n * 10n ** 400n, 4n * 10n ** 400n));
    expect(diag.dx).toBeCloseTo(0.6, 5);
    expect(diag.dy).toBeCloseTo(-0.8, 5);
  });

  it('formats compass coordinates cleanly across quadrants', () => {
    expect(formatCompassCoords(Vec2.ORIGIN)).toBe('E0, N0');
    expect(formatCompassCoords(new Vec2(17n, -8n))).toBe('E17, S8');
    expect(formatCompassCoords(new Vec2(-5n, 0n))).toBe('W5, N0');
    expect(formatCompassCoords(new Vec2(-3n, -4n))).toBe('W3, S4');
  });
});
