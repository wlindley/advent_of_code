import { describe, expect, it } from 'vitest';
import {
  buildFuelLandscape,
  buildSwarmHistogram,
  DEFAULT_HISTOGRAM_BINS,
  DEFAULT_LANDSCAPE_SAMPLES,
  formatSignedCompactBigInt,
  formatSignedGroupedBigInt,
  scaleBigIntRange,
} from './chart';
import { CrabFleet } from './fleet';
import { LINEAR_FUEL_MODEL, TRIANGULAR_FUEL_MODEL } from './fuelModel';

describe('scaleBigIntRange & formatting helpers', () => {
  it('scales arbitrary-precision BigInts into [0, 1] without overflow', () => {
    const min = -(1n << 100n);
    const max = 1n << 100n;
    expect(scaleBigIntRange(min, min, max)).toBe(0);
    expect(scaleBigIntRange(0n, min, max)).toBe(0.5);
    expect(scaleBigIntRange(max, min, max)).toBe(1);
    expect(scaleBigIntRange(5n, 5n, 5n)).toBe(0);
  });

  it('rejects invalid bounds or out-of-range values in scaleBigIntRange', () => {
    expect(() => scaleBigIntRange(1n, 5n, 2n)).toThrow(RangeError);
    expect(() => scaleBigIntRange(0n, 1n, 5n)).toThrow(RangeError);
    expect(() => scaleBigIntRange(6n, 1n, 5n)).toThrow(RangeError);
  });

  it('formats signed grouped and compact BigInts across all magnitude tiers', () => {
    expect(formatSignedGroupedBigInt(0n)).toBe('0');
    expect(formatSignedGroupedBigInt(-1234567n)).toBe('-1,234,567');
    expect(formatSignedCompactBigInt(0n)).toBe('0');
    expect(formatSignedCompactBigInt(-999n)).toBe('-999');
    expect(formatSignedCompactBigInt(1500n)).toBe('1.5K');
    expect(formatSignedCompactBigInt(-2000n)).toBe('-2K');
    expect(formatSignedCompactBigInt(3_500_000n)).toBe('3.5M');
    expect(formatSignedCompactBigInt(4_000_000_000n)).toBe('4B');
    expect(formatSignedCompactBigInt(7_250_000_000_000n)).toBe('7.25T');
    expect(formatSignedCompactBigInt(9_000_000_000_000_000n)).toBe('9Q');
    expect(formatSignedCompactBigInt(-(10n ** 20n))).toBe('-1.00e20');
  });
});

describe('buildSwarmHistogram', () => {
  it('builds exact integer bins when span+1 <= binCount and aggregates wide spans cleanly', () => {
    const example = new CrabFleet([16n, 1n, 2n, 0n, 4n, 2n, 7n, 1n, 2n, 14n]);
    const exact = buildSwarmHistogram(example, DEFAULT_HISTOGRAM_BINS);
    expect(Object.isFrozen(exact)).toBe(true);
    expect(exact.bins).toHaveLength(17);
    expect(exact.bins[2]).toMatchObject({ start: 2n, end: 2n, count: 3, ratio: 1 });
    expect(exact.bins[16]).toMatchObject({ start: 16n, end: 16n, count: 1 });

    const wide = new CrabFleet([-10n, 0n, 19n]);
    const binned = buildSwarmHistogram(wide, 4);
    expect(binned.bins).toHaveLength(4);
    const total = binned.bins.reduce((acc, b) => acc + b.count, 0);
    expect(total).toBe(3);
    expect(binned.bins[0]!.start).toBe(-10n);
    expect(binned.bins[3]!.end).toBe(19n);
  });

  it('rejects non-positive or non-integer binCount', () => {
    const fleet = new CrabFleet([1n, 2n]);
    expect(() => buildSwarmHistogram(fleet, 0)).toThrow(RangeError);
    expect(() => buildSwarmHistogram(fleet, 2.5)).toThrow(RangeError);
  });
});

describe('buildFuelLandscape', () => {
  it('samples all integers on small spans and injects exact optimum on wide spans', () => {
    const single = new CrabFleet([5n]);
    const singleLand = buildFuelLandscape(single, LINEAR_FUEL_MODEL, DEFAULT_LANDSCAPE_SAMPLES);
    expect(singleLand.points).toHaveLength(1);
    expect(singleLand.points[0]).toMatchObject({
      position: 5n,
      fuel: 0n,
      xRatio: 0,
      yRatio: 0,
      isOptimal: true,
    });

    const wide = new CrabFleet([0n, 1n, 2n, 3n, 1000n]);
    const sampled = buildFuelLandscape(wide, TRIANGULAR_FUEL_MODEL, 10);
    expect(sampled.optimalTarget).toBe(201n);
    expect(sampled.points.some((p) => p.position === 201n && p.isOptimal)).toBe(true);
    expect(sampled.minFuel).toBe(wide.fuelAt(201n, TRIANGULAR_FUEL_MODEL));
    const endMax = wide.fuelAt(1000n, TRIANGULAR_FUEL_MODEL);
    expect(sampled.maxFuel).toBe(endMax);

    // Also cover when optimal target already lands on an exact uniform sample point.
    const symmetric = new CrabFleet([0n, 50n, 100n]);
    const symLand = buildFuelLandscape(symmetric, LINEAR_FUEL_MODEL, 11);
    expect(symLand.points).toHaveLength(11);
    expect(symLand.optimalTarget).toBe(50n);
    expect(symLand.minFuel).toBe(100n);
  });

  it('rejects sampleCount < 2 or non-integer sampleCount', () => {
    const fleet = new CrabFleet([0n, 10n]);
    expect(() => buildFuelLandscape(fleet, LINEAR_FUEL_MODEL, 1)).toThrow(RangeError);
    expect(() => buildFuelLandscape(fleet, LINEAR_FUEL_MODEL, 4.5)).toThrow(RangeError);
  });
});
