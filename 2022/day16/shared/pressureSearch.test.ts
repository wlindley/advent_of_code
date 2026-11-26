import { describe, expect, it } from 'vitest';
import { CompressedValveNetwork, MAX_INT32 } from './compressedNetwork';
import {
  computeBestByMask,
  findOptimalSchedule,
  MaskPressureTable,
  ValveSchedule,
} from './pressureSearch';
import { ValveNetwork } from './valveNetwork';

describe('pressureSearch unit & boundary tests', () => {
  it('computes ValveSchedule derived openedMask and totalPressure dynamically', () => {
    const schedule = new ValveSchedule(30, [
      { valveIndex: 2, valveName: 'DD', flowRate: 20, travelMinutes: 1, openedAtMinute: 2 },
      { valveIndex: 0, valveName: 'BB', flowRate: 13, travelMinutes: 2, openedAtMinute: 5 },
    ]);
    expect(Object.isFrozen(schedule)).toBe(true);
    expect(Object.isFrozen(schedule.steps)).toBe(true);
    expect(schedule.openedMask).toBe((1 << 2) | (1 << 0));
    expect(schedule.totalPressure).toBe(20 * 28 + 13 * 25);
  });

  it('validates MaskPressureTable bounds and returns defensive copyScores', () => {
    const net = new ValveNetwork([
      { name: 'AA', flowRate: 0, tunnels: ['BB'] },
      { name: 'BB', flowRate: 10, tunnels: ['AA'] },
    ]);
    const compressed = CompressedValveNetwork.fromNetwork(net);
    const table = computeBestByMask(compressed, 5);
    expect(table.valveCount).toBe(1);
    expect(table.maskCount).toBe(2);
    expect(table.scoreFor(0)).toBe(0);
    expect(table.scoreFor(1)).toBe(30);
    expect(() => table.scoreFor(-1)).toThrow(RangeError);
    expect(() => table.scoreFor(2)).toThrow(RangeError);
    expect(() => table.scoreFor(0.5)).toThrow(RangeError);
    const copy = table.copyScores();
    copy[1] = 999;
    expect(table.scoreFor(1)).toBe(30);
    expect(MaskPressureTable).toBeDefined();
  });

  it('validates timeLimit, allowedMask, and integer overflow guards', () => {
    const net = new ValveNetwork([
      { name: 'AA', flowRate: 0, tunnels: ['BB'] },
      { name: 'BB', flowRate: 10, tunnels: ['AA'] },
    ]);
    const compressed = CompressedValveNetwork.fromNetwork(net);

    expect(() => computeBestByMask(compressed, -1)).toThrow(RangeError);
    expect(() => computeBestByMask(compressed, 1.5)).toThrow(RangeError);
    expect(() => findOptimalSchedule(compressed, -1)).toThrow(RangeError);
    expect(() => findOptimalSchedule(compressed, 10, -1)).toThrow(RangeError);
    expect(() => findOptimalSchedule(compressed, 10, 2)).toThrow(RangeError);
    expect(() => findOptimalSchedule(compressed, 10, 0.5)).toThrow(RangeError);

    const overflowInt32 = CompressedValveNetwork.fromNetwork(
      new ValveNetwork([
        { name: 'AA', flowRate: 0, tunnels: ['BB'] },
        { name: 'BB', flowRate: MAX_INT32, tunnels: ['AA'] },
      ]),
    );
    expect(() => computeBestByMask(overflowInt32, 4)).toThrow(RangeError);

    const overflowSafe = CompressedValveNetwork.fromNetwork(
      new ValveNetwork([
        { name: 'AA', flowRate: 0, tunnels: ['BB'] },
        { name: 'BB', flowRate: Number.MAX_SAFE_INTEGER, tunnels: ['AA'] },
      ]),
    );
    expect(() => findOptimalSchedule(overflowSafe, 4)).toThrow(RangeError);
  });

  it('handles start node with positive flowRate, excluded from allowedMask, K=0, and directed edges', () => {
    const startPos = CompressedValveNetwork.fromNetwork(
      new ValveNetwork([
        { name: 'AA', flowRate: 15, tunnels: ['BB'] },
        { name: 'BB', flowRate: 10, tunnels: ['AA'] },
      ]),
    );
    const openBoth = findOptimalSchedule(startPos, 5);
    expect(openBoth.totalPressure).toBe(15 * 4 + 10 * 2);
    expect(openBoth.steps[0]!.travelMinutes).toBe(0);

    const excludeAA = findOptimalSchedule(startPos, 5, 1 << 1);
    expect(excludeAA.totalPressure).toBe(10 * 3);
    expect(excludeAA.openedMask).toBe(1 << 1);

    const directed = CompressedValveNetwork.fromNetwork(
      new ValveNetwork([
        { name: 'AA', flowRate: 0, tunnels: ['BB', 'CC'] },
        { name: 'BB', flowRate: 20, tunnels: ['BB'] },
        { name: 'CC', flowRate: 10, tunnels: ['AA'] },
      ]),
    );
    expect(findOptimalSchedule(directed, 6).totalPressure).toBe(20 * 4);
    expect(computeBestByMask(directed, 6).scoreFor(0b11)).toBe(10 * 4 + 20 * 1);

    const zeroPos = CompressedValveNetwork.fromNetwork(
      new ValveNetwork([{ name: 'AA', flowRate: 0, tunnels: ['AA'] }]),
    );
    expect(findOptimalSchedule(zeroPos, 10).totalPressure).toBe(0);
    expect(findOptimalSchedule(startPos, 0).totalPressure).toBe(0);
    expect(findOptimalSchedule(startPos, 1).totalPressure).toBe(0);
    expect(findOptimalSchedule(startPos, 2).totalPressure).toBe(15);
  });
});
