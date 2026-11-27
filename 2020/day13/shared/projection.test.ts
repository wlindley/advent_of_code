import { describe, expect, it } from 'vitest';
import { parseBusSchedule } from './model';
import { CONSECUTIVE_ALIGNMENT_POLICY, EARLIEST_BUS_POLICY } from './policies';
import {
  computeMaxWait,
  computeModulusLogRatio,
  computePart1Bars,
  computePart2Rows,
  computeWaitBarRatio,
  RATIO_SCALE,
} from './projection';

describe('computeMaxWait & computeWaitBarRatio', () => {
  it('computes max wait and BigInt-safe wait ratios', () => {
    expect(RATIO_SCALE).toBe(1_000_000n);
    const example = parseBusSchedule('939\n7,13,x,x,59,x,31,19');
    expect(computeMaxWait(example)).toBe(22n);

    const zeroSchedule = parseBusSchedule('0\n7,13');
    expect(computeMaxWait(zeroSchedule)).toBe(0n);

    expect(computeWaitBarRatio(0n, 0n)).toBe(0);
    expect(computeWaitBarRatio(0n, 22n)).toBe(0);
    expect(computeWaitBarRatio(22n, 22n)).toBe(1);
    expect(computeWaitBarRatio(5n, 20n)).toBe(0.25);

    const big = 2n ** 1200n;
    expect(computeWaitBarRatio(big, big * 2n)).toBe(0.5);
  });

  it('rejects negative waits or wait exceeding maxWait', () => {
    expect(() => computeWaitBarRatio(-1n, 10n)).toThrow(RangeError);
    expect(() => computeWaitBarRatio(0n, -1n)).toThrow(RangeError);
    expect(() => computeWaitBarRatio(11n, 10n)).toThrow(RangeError);
  });
});

describe('computeModulusLogRatio', () => {
  it('computes log2 modulus ratios including unit finalModulus and huge BigInts', () => {
    expect(computeModulusLogRatio(1n, 1n)).toBe(1);
    expect(computeModulusLogRatio(1n, 8n)).toBe(0);
    expect(computeModulusLogRatio(4n, 16n)).toBeCloseTo(0.5, 10);
    expect(computeModulusLogRatio(16n, 16n)).toBe(1);

    const hugeA = 1n << 1200n;
    const hugeB = 1n << 2400n;
    expect(computeModulusLogRatio(hugeA, hugeB)).toBeCloseTo(0.5, 10);
  });

  it('rejects non-positive moduli or modulus exceeding finalModulus', () => {
    expect(() => computeModulusLogRatio(0n, 10n)).toThrow(RangeError);
    expect(() => computeModulusLogRatio(1n, 0n)).toThrow(RangeError);
    expect(() => computeModulusLogRatio(11n, 10n)).toThrow(RangeError);
  });
});

describe('computePart1Bars & computePart2Rows', () => {
  it('projects Part 1 bars with evaluation, current, and best flags', () => {
    const schedule = parseBusSchedule('939\n7,13,x,x,59,x,31,19');
    const frames = EARLIEST_BUS_POLICY.trace(schedule, 10);
    const frame3 = frames[2]!;
    const bars = computePart1Bars(frame3);

    expect(Object.isFrozen(bars)).toBe(true);
    expect(bars).toHaveLength(5);
    expect(bars.map((b) => [b.bus.id, b.wait, b.departure, b.isEvaluated, b.isCurrent, b.isBest])).toEqual([
      [7n, 6n, 945n, true, false, false],
      [13n, 10n, 949n, true, false, false],
      [59n, 5n, 944n, true, true, true],
      [31n, 22n, 961n, false, false, false],
      [19n, 11n, 950n, false, false, false],
    ]);
    expect(bars[3]!.ratio).toBe(1);
  });

  it('projects Part 2 rows and returns empty list when given no frames', () => {
    expect(computePart2Rows([])).toEqual([]);

    const schedule = parseBusSchedule('939\n7,13,x,x,59,x,31,19');
    const frames = CONSECUTIVE_ALIGNMENT_POLICY.trace(schedule, 10);
    const rows = computePart2Rows(frames);
    expect(Object.isFrozen(rows)).toBe(true);
    expect(rows).toHaveLength(5);
    expect(rows[0]!).toMatchObject({
      step: 1,
      timestamp: 0n,
      modulus: 7n,
      previousModulus: 1n,
      modulusBits: 3,
      lockedCount: 1,
    });
    expect(rows[4]!.logRatio).toBe(1);
    expect(rows[4]!.timestamp).toBe(1068781n);
    expect(rows[4]!.bus.id).toBe(19n);
  });
});
