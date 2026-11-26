import { describe, expect, it } from 'vitest';
import { BspStep, traceSeatNarrowing } from './bsp';
import { CABIN_CAPACITY, encodeSeatCode } from './seat';

describe('binary space partitioning trace', () => {
  it('traces all 11 narrowing steps for FBFBBFFRLR', () => {
    const steps = traceSeatNarrowing('FBFBBFFRLR');
    expect(Object.isFrozen(steps)).toBe(true);
    expect(steps).toHaveLength(11);
    expect(steps[0]?.stepIndex).toBe(0);
    expect(steps[0]?.symbol).toBeNull();
    expect(steps[0]?.axis).toBeNull();
    expect(steps[0]?.half).toBeNull();
    expect(steps[0]?.candidateSeatCount).toBe(1024);

    expect(steps.map((s) => [s.symbol, s.rowLow, s.rowHigh, s.columnLow, s.columnHigh])).toEqual([
      [null, 0, 127, 0, 7],
      ['F', 0, 63, 0, 7],
      ['B', 32, 63, 0, 7],
      ['F', 32, 47, 0, 7],
      ['B', 40, 47, 0, 7],
      ['B', 44, 47, 0, 7],
      ['F', 44, 45, 0, 7],
      ['F', 44, 44, 0, 7],
      ['R', 44, 44, 4, 7],
      ['L', 44, 44, 4, 5],
      ['R', 44, 44, 5, 5],
    ]);

    expect(steps[1]?.axis).toBe('row');
    expect(steps[1]?.half).toBe('lower');
    expect(steps[8]?.axis).toBe('column');
    expect(steps[8]?.half).toBe('upper');
    expect(steps[10]?.rowCount).toBe(1);
    expect(steps[10]?.columnCount).toBe(1);
    expect(steps[10]?.candidateSeatCount).toBe(1);
  });

  it('matches an exhaustive 1024-seat differential oracle', () => {
    for (let seatId = 0; seatId < CABIN_CAPACITY; seatId += 1) {
      const code = encodeSeatCode(seatId);
      const steps = traceSeatNarrowing(code);
      const finalStep = steps[steps.length - 1];
      expect(steps).toHaveLength(11);
      expect(finalStep?.rowLow).toBe(seatId >> 3);
      expect(finalStep?.rowHigh).toBe(seatId >> 3);
      expect(finalStep?.columnLow).toBe(seatId & 7);
      expect(finalStep?.columnHigh).toBe(seatId & 7);
      expect(finalStep?.candidateSeatCount).toBe(1);
      expect((finalStep?.rowLow ?? -1) * 8 + (finalStep?.columnLow ?? -1)).toBe(seatId);
    }
  });

  it('rejects invalid boarding codes and invalid BspStep invariants', () => {
    expect(() => traceSeatNarrowing('INVALID')).toThrow(SyntaxError);
    expect(() => new BspStep(-1, 0, 127, 0, 7, 'F')).toThrow(RangeError);
    expect(() => new BspStep(11, 0, 127, 0, 7, 'F')).toThrow(RangeError);
    expect(() => new BspStep(1.5, 0, 127, 0, 7, 'F')).toThrow(RangeError);
    expect(() => new BspStep(0, 0, 127, 0, 7, 'F')).toThrow(RangeError);
    expect(() => new BspStep(1, 0, 63, 0, 7, null)).toThrow(RangeError);
    expect(() => new BspStep(0, -1, 127, 0, 7, null)).toThrow(RangeError);
    expect(() => new BspStep(0, 0, 128, 0, 7, null)).toThrow(RangeError);
    expect(() => new BspStep(0, 10, 5, 0, 7, null)).toThrow(RangeError);
    expect(() => new BspStep(0, 0.5, 5, 0, 7, null)).toThrow(RangeError);
    expect(() => new BspStep(0, 0, 5.5, 0, 7, null)).toThrow(RangeError);
    expect(() => new BspStep(0, 0, 127, 0, 8, null)).toThrow(RangeError);
  });
});
