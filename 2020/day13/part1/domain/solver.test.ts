import { describe, expect, it } from 'vitest';
import { type BusSchedule } from '../../shared';
import { solver } from './solver';

function forwardScanOracle(schedule: BusSchedule): bigint {
  let t = schedule.earliestTimestamp;
  while (true) {
    for (const bus of schedule.buses) {
      if (t % bus.id === 0n) {
        return bus.id * (t - schedule.earliestTimestamp);
      }
    }
    t += 1n;
  }
}

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
}

describe('2020 Day 13 Part 1 solver', () => {
  it('solves the official Part 1 example to 295n', () => {
    const schedule = solver.parse('939\n7,13,x,x,59,x,31,19');
    expect(solver.solve(schedule)).toBe(295n);
  });

  it('handles zero wait, t0 = 0, single bus, tie-breaking, and > 2^63 BigInts', () => {
    expect(solver.solve(solver.parse('944\n7,59,13'))).toBe(0n);
    expect(solver.solve(solver.parse('0\n17,13'))).toBe(0n);
    expect(solver.solve(solver.parse('100\n41'))).toBe(943n);

    // Wait(10) at t0=95 is 5 -> 50; Wait(15) at t0=95 is 10 -> 150; tie: bus 7 & bus 14 both wait 5 at t0=2
    const tied = solver.parse('2\n7,14,19');
    expect(solver.solve(tied)).toBe(35n);
    const tiedFrames = solver.trace(tied);
    expect(tiedFrames[tiedFrames.length - 1]!.bestBus.id).toBe(7n);

    const bigSchedule = solver.parse(`${1n << 65n}\n1000003,x,1000033`);
    expect(solver.solve(bigSchedule)).toBe(forwardScanOracle(bigSchedule));
  });

  it('produces bounded traces with omitted, explicit, and invalid maxSteps', () => {
    const schedule = solver.parse('939\n7,13,x,x,59,x,31,19');
    expect(solver.trace(schedule)).toHaveLength(5);
    expect(solver.trace(schedule, {})).toHaveLength(5);

    const two = solver.trace(schedule, { maxSteps: 2 });
    expect(two.map((f) => [f.step, f.product])).toEqual([
      [1, 42n],
      [5, 295n],
    ]);

    const one = solver.trace(schedule, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]!.isFinal).toBe(true);
    expect(one[0]!.product).toBe(295n);

    expect(() => solver.trace(schedule, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace(schedule, { maxSteps: -1 })).toThrow(RangeError);
  });

  it('matches forward-timestamp-scan differential oracle across 30 seeded schedules', () => {
    const nextRand = createRng(20201301);
    for (let caseIdx = 0; caseIdx < 30; caseIdx += 1) {
      const t0 = nextRand() % 500;
      const slotCount = 2 + (nextRand() % 10);
      const tokens: string[] = [];
      for (let s = 0; s < slotCount; s += 1) {
        tokens.push(nextRand() % 4 === 0 ? 'x' : String(2 + (nextRand() % 40)));
      }
      if (!tokens.some((tok) => tok !== 'x')) tokens[0] = '7';
      const schedule = solver.parse(`${t0}\n${tokens.join(',')}`);
      expect(solver.solve(schedule)).toBe(forwardScanOracle(schedule));
    }
  });
});
