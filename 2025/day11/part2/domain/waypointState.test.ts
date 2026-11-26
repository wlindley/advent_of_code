import { describe, expect, it } from 'vitest';
import {
  bigintLog2,
  MASK_BOTH,
  MASK_DAC,
  MASK_FFT,
  MASK_NEITHER,
  WaypointCounts,
  waypointMaskFor,
  type WaypointMask,
} from './waypointState';

describe('WaypointCounts & waypoint helpers', () => {
  it('freezes instances, exposes ZERO, and computes total dynamically', () => {
    expect(Object.isFrozen(WaypointCounts.ZERO)).toBe(true);
    expect([WaypointCounts.ZERO.neither, WaypointCounts.ZERO.dacOnly, WaypointCounts.ZERO.fftOnly, WaypointCounts.ZERO.both, WaypointCounts.ZERO.total]).toEqual([0n, 0n, 0n, 0n, 0n]);

    const c = new WaypointCounts(2n, 3n, 5n, 7n);
    expect(Object.isFrozen(c)).toBe(true);
    expect(c.total).toBe(17n);
  });

  it('rejects negative counts in each constructor position', () => {
    expect(() => new WaypointCounts(-1n, 0n, 0n, 0n)).toThrow(RangeError);
    expect(() => new WaypointCounts(0n, -1n, 0n, 0n)).toThrow(RangeError);
    expect(() => new WaypointCounts(0n, 0n, -1n, 0n)).toThrow(RangeError);
    expect(() => new WaypointCounts(0n, 0n, 0n, -1n)).toThrow(RangeError);
  });

  it('builds unit counts for all 4 masks', () => {
    const cases: readonly [WaypointMask, readonly bigint[]][] = [
      [MASK_NEITHER, [1n, 0n, 0n, 0n]],
      [MASK_DAC, [0n, 1n, 0n, 0n]],
      [MASK_FFT, [0n, 0n, 1n, 0n]],
      [MASK_BOTH, [0n, 0n, 0n, 1n]],
    ];
    for (const [mask, expected] of cases) {
      const u = WaypointCounts.unit(mask);
      expect([u.neither, u.dacOnly, u.fftOnly, u.both]).toEqual(expected);
    }
  });

  it('accumulates incoming counts with bitwise-OR waypoint promotion for all 4 enterMasks', () => {
    const base = new WaypointCounts(1n, 2n, 3n, 4n);
    const inc = new WaypointCounts(10n, 20n, 30n, 40n);

    const m0 = base.accumulate(inc, MASK_NEITHER);
    expect([m0.neither, m0.dacOnly, m0.fftOnly, m0.both]).toEqual([11n, 22n, 33n, 44n]);

    const m1 = base.accumulate(inc, MASK_DAC);
    expect([m1.neither, m1.dacOnly, m1.fftOnly, m1.both]).toEqual([1n, 32n, 3n, 74n]);

    const m2 = base.accumulate(inc, MASK_FFT);
    expect([m2.neither, m2.dacOnly, m2.fftOnly, m2.both]).toEqual([1n, 2n, 43n, 64n]);

    const m3 = base.accumulate(inc, MASK_BOTH);
    expect([m3.neither, m3.dacOnly, m3.fftOnly, m3.both]).toEqual([1n, 2n, 3n, 104n]);
  });

  it('computes waypointMaskFor including coincident dac and fft', () => {
    expect(waypointMaskFor('aaa', 'dac', 'fft')).toBe(MASK_NEITHER);
    expect(waypointMaskFor('dac', 'dac', 'fft')).toBe(MASK_DAC);
    expect(waypointMaskFor('fft', 'dac', 'fft')).toBe(MASK_FFT);
    expect(waypointMaskFor('hub', 'hub', 'hub')).toBe(MASK_BOTH);
  });

  it('computes bigintLog2 across small, 53-bit boundary, and huge values, rejecting non-positive', () => {
    expect(bigintLog2(1n)).toBe(0);
    expect(bigintLog2(2n)).toBe(1);
    expect(bigintLog2(3n)).toBeCloseTo(Math.log2(3), 12);
    expect(bigintLog2((1n << 53n) - 1n)).toBeCloseTo(53, 10);
    expect(bigintLog2(1n << 53n)).toBe(53);
    expect(bigintLog2(1n << 1200n)).toBe(1200);
    expect(bigintLog2(3n << 1200n)).toBeCloseTo(1200 + Math.log2(3), 10);
    expect(() => bigintLog2(0n)).toThrow(RangeError);
    expect(() => bigintLog2(-5n)).toThrow(RangeError);
  });
});
