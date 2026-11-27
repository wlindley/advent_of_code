import { describe, expect, it } from 'vitest';
import { BusEntry, parseBusSchedule } from './model';
import {
  CONSECUTIVE_ALIGNMENT_POLICY,
  CrtLockFrame,
  EARLIEST_BUS_POLICY,
  EarliestBusFrame,
} from './policies';

const EXAMPLE = parseBusSchedule('939\n7,13,x,x,59,x,31,19');

describe('EarliestBusFrame', () => {
  it('derives step, waits, departures, isNewBest, isFinal, and product via getters', () => {
    const bus7 = EXAMPLE.buses[0]!;
    const bus59 = EXAMPLE.buses[2]!;
    const f1 = new EarliestBusFrame(EXAMPLE, 1, bus7);
    expect(Object.isFrozen(f1)).toBe(true);
    expect(f1.step).toBe(1);
    expect(f1.currentBus).toBe(bus7);
    expect(f1.isNewBest).toBe(true);
    expect(f1.isFinal).toBe(false);
    expect(f1.currentWait).toBe(6n);
    expect(f1.currentDeparture).toBe(945n);
    expect(f1.bestWait).toBe(6n);
    expect(f1.bestDeparture).toBe(945n);
    expect(f1.product).toBe(42n);

    const f5 = new EarliestBusFrame(EXAMPLE, 5, bus59);
    expect(f5.isNewBest).toBe(false);
    expect(f5.isFinal).toBe(true);
    expect(f5.currentWait).toBe(11n);
    expect(f5.bestWait).toBe(5n);
    expect(f5.product).toBe(295n);
  });

  it('rejects out-of-range evaluatedCount or bestBus outside evaluated prefix', () => {
    const bus7 = EXAMPLE.buses[0]!;
    const bus13 = EXAMPLE.buses[1]!;
    expect(() => new EarliestBusFrame(EXAMPLE, 0, bus7)).toThrow(RangeError);
    expect(() => new EarliestBusFrame(EXAMPLE, 1.5, bus7)).toThrow(RangeError);
    expect(() => new EarliestBusFrame(EXAMPLE, 6, bus7)).toThrow(RangeError);
    expect(() => new EarliestBusFrame(EXAMPLE, 1, bus13)).toThrow(RangeError);
    expect(() => new EarliestBusFrame(EXAMPLE, 2, new BusEntry(7n, 0n))).toThrow(RangeError);
  });
});

describe('CrtLockFrame', () => {
  it('derives step, currentBus, lockedBuses, isFinal, timestamp, modulus, and modulusBits', () => {
    const cong = { remainder: 77n, modulus: 91n };
    const frame = new CrtLockFrame(EXAMPLE, 2, cong, 7n);
    expect(Object.isFrozen(frame)).toBe(true);
    expect(frame.step).toBe(2);
    expect(frame.currentBus).toBe(EXAMPLE.buses[1]);
    expect(frame.lockedBuses).toEqual(EXAMPLE.buses.slice(0, 2));
    expect(frame.isFinal).toBe(false);
    expect(frame.timestamp).toBe(77n);
    expect(frame.modulus).toBe(91n);
    expect(frame.modulusBits).toBe(7);

    const finalFrame = new CrtLockFrame(EXAMPLE, 5, { remainder: 1068781n, modulus: 3162341n }, 166439n);
    expect(finalFrame.isFinal).toBe(true);
  });

  it('rejects invalid lockedCount, congruence, or previousModulus', () => {
    const valid = { remainder: 0n, modulus: 7n };
    expect(() => new CrtLockFrame(EXAMPLE, 0, valid, 1n)).toThrow(RangeError);
    expect(() => new CrtLockFrame(EXAMPLE, 2.5, valid, 1n)).toThrow(RangeError);
    expect(() => new CrtLockFrame(EXAMPLE, 6, valid, 1n)).toThrow(RangeError);
    expect(() => new CrtLockFrame(EXAMPLE, 1, { remainder: 0n, modulus: 0n }, 1n)).toThrow(RangeError);
    expect(() => new CrtLockFrame(EXAMPLE, 1, { remainder: -1n, modulus: 7n }, 1n)).toThrow(RangeError);
    expect(() => new CrtLockFrame(EXAMPLE, 1, { remainder: 7n, modulus: 7n }, 1n)).toThrow(RangeError);
    expect(() => new CrtLockFrame(EXAMPLE, 1, valid, 0n)).toThrow(RangeError);
  });
});

describe('EARLIEST_BUS_POLICY', () => {
  it('solves and produces bounded traces with exact intermediate bests', () => {
    expect(EARLIEST_BUS_POLICY.id).toBe('earliest-bus');
    expect(EARLIEST_BUS_POLICY.label).toBe('Earliest Bus');
    expect(EARLIEST_BUS_POLICY.solve(EXAMPLE)).toBe(295n);

    const full = EARLIEST_BUS_POLICY.trace(EXAMPLE, 20);
    expect(full.map((f) => [f.step, f.bestBus.id, f.isNewBest, f.isFinal])).toEqual([
      [1, 7n, true, false],
      [2, 7n, false, false],
      [3, 59n, true, false],
      [4, 59n, false, false],
      [5, 59n, false, true],
    ]);

    const two = EARLIEST_BUS_POLICY.trace(EXAMPLE, 2);
    expect(two.map((f) => [f.step, f.product])).toEqual([
      [1, 42n],
      [5, 295n],
    ]);

    const one = EARLIEST_BUS_POLICY.trace(EXAMPLE, 1);
    expect(one).toHaveLength(1);
    expect(one[0]!.step).toBe(5);
    expect(one[0]!.product).toBe(295n);
    expect(() => EARLIEST_BUS_POLICY.trace(EXAMPLE, 0)).toThrow(RangeError);
  });
});

describe('CONSECUTIVE_ALIGNMENT_POLICY', () => {
  it('solves and traces incremental CRT locks with exact previousModulus under sampling', () => {
    expect(CONSECUTIVE_ALIGNMENT_POLICY.id).toBe('consecutive-alignment');
    expect(CONSECUTIVE_ALIGNMENT_POLICY.label).toBe('Consecutive Alignment');
    expect(CONSECUTIVE_ALIGNMENT_POLICY.solve(EXAMPLE)).toBe(1068781n);

    const full = CONSECUTIVE_ALIGNMENT_POLICY.trace(EXAMPLE, 20);
    expect(full.map((f) => [f.step, f.previousModulus, f.modulus, f.isFinal])).toEqual([
      [1, 1n, 7n, false],
      [2, 7n, 91n, false],
      [3, 91n, 5369n, false],
      [4, 5369n, 166439n, false],
      [5, 166439n, 3162341n, true],
    ]);
    expect(full[4]!.timestamp).toBe(1068781n);

    const two = CONSECUTIVE_ALIGNMENT_POLICY.trace(EXAMPLE, 2);
    expect(two.map((f) => [f.step, f.previousModulus, f.timestamp, f.modulus])).toEqual([
      [1, 1n, 0n, 7n],
      [5, 166439n, 1068781n, 3162341n],
    ]);

    const bad = parseBusSchedule('0\n4,6');
    expect(() => CONSECUTIVE_ALIGNMENT_POLICY.solve(bad)).toThrow(RangeError);
    expect(() => CONSECUTIVE_ALIGNMENT_POLICY.trace(bad, 10)).toThrow(RangeError);
  });
});
