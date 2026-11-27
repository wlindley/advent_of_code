import { describe, expect, it } from 'vitest';
import { type BusSchedule } from '../../shared';
import { solver } from './solver';

const SMALL_PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61] as const;

function progressiveSieveOracle(schedule: BusSchedule): bigint {
  let t = 0n;
  let step = 1n;
  for (const bus of schedule.buses) {
    while ((t + bus.offset) % bus.id !== 0n) {
      t += step;
    }
    step *= bus.id;
  }
  return t;
}

class LcgRng {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0; }
  next(): number {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state;
  }
}

function buildRandomPrimeSchedule(rng: LcgRng): BusSchedule {
  const pool = [...SMALL_PRIMES];
  const busCount = 3 + (rng.next() % 3);
  const tokens: string[] = [];
  const leadX = rng.next() % 3;
  for (let i = 0; i < leadX; i += 1) tokens.push('x');
  for (let b = 0; b < busCount; b += 1) {
    const [prime] = pool.splice(rng.next() % pool.length, 1);
    tokens.push(String(prime!));
    if (b + 1 < busCount && rng.next() % 2 === 0) tokens.push('x');
  }
  return solver.parse(`${rng.next() % 1000}\n${tokens.join(',')}`);
}

describe('2020 Day 13 Part 2 solver', () => {
  it('solves all six official AoC Part 2 examples', () => {
    const examples: readonly [string, bigint][] = [
      ['939\n7,13,x,x,59,x,31,19', 1068781n],
      ['0\n17,x,13,19', 3417n],
      ['0\n67,7,59,61', 754018n],
      ['0\n67,x,7,59,61', 779210n],
      ['0\n67,7,x,59,61', 1261476n],
      ['0\n1789,37,47,1889', 1202161486n],
    ];
    for (const [raw, expected] of examples) {
      expect(solver.solve(solver.parse(raw))).toBe(expected);
    }
  });

  it('ignores earliest timestamp line and handles single bus and leading x offsets', () => {
    expect(solver.solve(solver.parse('0\n7,13,x,x,59,x,31,19'))).toBe(1068781n);
    expect(solver.solve(solver.parse('999999999999999\n7,13,x,x,59,x,31,19'))).toBe(1068781n);
    expect(solver.solve(solver.parse('0\n13'))).toBe(0n);
    expect(solver.solve(solver.parse('0\n1'))).toBe(0n);
    expect(solver.solve(solver.parse('0\nx,x,13'))).toBe(11n);
    expect(solver.solve(solver.parse('0\nx,x,x,x,x,3'))).toBe(1n);
    expect(solver.solve(solver.parse('0\nx,x,x,3'))).toBe(0n);
  });

  it('handles compatible and incompatible non-coprime moduli and invalid raw inputs', () => {
    expect(solver.solve(solver.parse('0\n4,x,6'))).toBe(4n);
    expect(solver.solve(solver.parse('0\n5,x,x,x,x,5'))).toBe(0n);

    for (const bad of ['0\n4,6', '0\n5,5']) {
      const schedule = solver.parse(bad);
      expect(() => solver.solve(schedule)).toThrow(RangeError);
      expect(() => solver.trace(schedule)).toThrow(RangeError);
    }

    for (const invalid of ['939', 'abc\n7,13', '0\nx,x', '0\n0,7']) {
      expect(() => solver.parse(invalid)).toThrow();
    }
  });

  it('solves > 2^64 BigInt prime schedules accurately', () => {
    const schedule = solver.parse(
      '0\n18446744073709551629,x,18446744073709551653,x,x,18446744073709551667',
    );
    const answer = solver.solve(schedule);
    expect(answer > 2n ** 64n).toBe(true);
    for (const bus of schedule.buses) {
      expect(bus.departsWithOffsetAt(answer)).toBe(true);
    }
  });

  it('traces incremental CRT locking and respects maxSteps bounds', () => {
    const schedule = solver.parse('939\n7,13,x,x,59,x,31,19');
    const full = solver.trace(schedule);
    expect(full).toHaveLength(5);
    expect(solver.trace(schedule, {})).toHaveLength(5);
    expect(full[0]!.step).toBe(1);
    expect([full[0]!.previousModulus, full[0]!.modulus, full[0]!.isFinal]).toEqual([1n, 7n, false]);
    const last = full[full.length - 1]!;
    expect([last.step, last.previousModulus, last.modulus, last.isFinal]).toEqual([
      5,
      166439n,
      3162341n,
      true,
    ]);
    expect(last.timestamp).toBe(1068781n);

    const two = solver.trace(schedule, { maxSteps: 2 });
    expect(two.map((f) => [f.step, f.previousModulus, f.timestamp, f.modulus])).toEqual([
      [1, 1n, 0n, 7n],
      [5, 166439n, 1068781n, 3162341n],
    ]);

    const one = solver.trace(schedule, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]!.isFinal).toBe(true);
    expect(one[0]!.timestamp).toBe(1068781n);

    expect(() => solver.trace(schedule, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace(schedule, { maxSteps: -1 })).toThrow(RangeError);
  });

  it('matches progressive LCM sieving differential oracle across 25 seeded schedules', () => {
    const rng = new LcgRng(20201302);
    for (let i = 0; i < 25; i += 1) {
      const schedule = buildRandomPrimeSchedule(rng);
      const actual = solver.solve(schedule);
      expect(actual).toBe(progressiveSieveOracle(schedule));
      for (const bus of schedule.buses) {
        expect(bus.departsWithOffsetAt(actual)).toBe(true);
      }
    }
  });
});
