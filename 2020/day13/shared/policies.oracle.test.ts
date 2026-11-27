import { describe, expect, it } from 'vitest';
import { lcmBigInt } from '../../../shared/core';
import { parseBusSchedule, type BusSchedule } from './model';
import { CONSECUTIVE_ALIGNMENT_POLICY } from './policies';

function progressiveSieveOracle(schedule: BusSchedule): bigint {
  let t = 0n;
  let step = 1n;
  for (const bus of schedule.buses) {
    while (!bus.departsWithOffsetAt(t)) {
      t += step;
    }
    step = lcmBigInt(step, bus.id);
  }
  return t;
}

function bruteForceOracle(schedule: BusSchedule): bigint {
  const period = schedule.buses.reduce((acc, bus) => lcmBigInt(acc, bus.id), 1n);
  for (let t = 0n; t < period; t += 1n) {
    if (schedule.buses.every((bus) => bus.departsWithOffsetAt(t))) {
      return t;
    }
  }
  throw new Error('No solution found within LCM period');
}

describe('CONSECUTIVE_ALIGNMENT_POLICY differential oracles', () => {
  it('matches all 6 official Part 2 examples against progressive sieving and offset departure', () => {
    const cases: readonly [string, bigint][] = [
      ['939\n7,13,x,x,59,x,31,19', 1068781n],
      ['0\n17,x,13,19', 3417n],
      ['0\n67,7,59,61', 754018n],
      ['0\n67,x,7,59,61', 779210n],
      ['0\n67,7,x,59,61', 1261476n],
      ['0\n1789,37,47,1889', 1202161486n],
    ];

    for (const [raw, expected] of cases) {
      const schedule = parseBusSchedule(raw);
      const actual = CONSECUTIVE_ALIGNMENT_POLICY.solve(schedule);
      expect(actual).toBe(expected);
      expect(actual).toBe(progressiveSieveOracle(schedule));
      for (const bus of schedule.buses) {
        expect(bus.departsWithOffsetAt(actual)).toBe(true);
      }
    }
  });

  it('matches brute-force scan on small schedules including compatible non-coprime and leading x', () => {
    const rawCases = [
      '0\nx,4,x,6,x,x,9',
      '15\n6,x,8,x,5',
      '0\nx,x,12,x,10,x,7',
      '0\n4,x,6,x,x,15',
    ];
    for (const raw of rawCases) {
      const schedule = parseBusSchedule(raw);
      const actual = CONSECUTIVE_ALIGNMENT_POLICY.solve(schedule);
      expect(actual).toBe(bruteForceOracle(schedule));
    }
  });

  it('solves huge > 2^64 BigInt prime schedules in under 20 ms', () => {
    const hugeSchedule = parseBusSchedule(
      '0\n18446744073709551629,x,18446744073709551653,x,x,18446744073709551667',
    );
    const start = performance.now();
    const answer = CONSECUTIVE_ALIGNMENT_POLICY.solve(hugeSchedule);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(20);
    expect(answer).toBeGreaterThan(2n ** 64n);
    for (const bus of hugeSchedule.buses) {
      expect(bus.departsWithOffsetAt(answer)).toBe(true);
    }
  });
});
