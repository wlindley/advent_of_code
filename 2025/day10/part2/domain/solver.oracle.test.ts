import { describe, expect, it } from 'vitest';
import { FactoryMachine, parseMachines } from '../../shared';
import { solveMachineJoltage, totalPresses } from './index';

/** Independent parity-halving divide-and-conquer oracle: x = p + 2*x' grouped by L-bit parity mask. */
function parityHalvingOracle(machine: FactoryMachine): number | null {
  const [L, B] = [machine.lightCount, machine.buttonCount];
  const byParity = new Map<number, { count: number; delta: number[] }[]>();
  for (let mask = 0; mask < (1 << B); mask += 1) {
    const delta = new Array<number>(L).fill(0);
    let count = 0;
    for (let b = 0; b < B; b += 1) {
      if ((mask & (1 << b)) === 0) continue;
      count += 1;
      for (const l of machine.buttons[b]!) delta[l] = delta[l]! + 1;
    }
    const pMask = delta.reduce((m, d, l) => m | ((d & 1) << l), 0);
    const list = byParity.get(pMask) ?? [];
    list.push({ count, delta });
    byParity.set(pMask, list);
  }
  const memo = new Map<string, number | null>();
  const solve = (target: readonly number[]): number | null => {
    if (target.every((v) => v === 0)) return 0;
    const key = target.join(',');
    if (memo.has(key)) return memo.get(key)!;
    const pMask = target.reduce((m, v, l) => m | ((v & 1) << l), 0);
    let best: number | null = null;
    for (const { count, delta } of byParity.get(pMask) ?? []) {
      if (delta.some((d, l) => d > target[l]!)) continue;
      const sub = solve(target.map((v, l) => (v - delta[l]!) / 2));
      if (sub !== null) {
        const cand = count + 2 * sub;
        if (best === null || cand < best) best = cand;
      }
    }
    memo.set(key, best);
    return best;
  };
  return solve(machine.joltageRequirements);
}

function verifyAgreement(machine: FactoryMachine): void {
  const expected = parityHalvingOracle(machine);
  if (expected === null) {
    expect(() => solveMachineJoltage(machine)).toThrow(Error);
    return;
  }
  const sol = solveMachineJoltage(machine);
  expect(totalPresses(sol.presses)).toBe(expected);
  const achieved = new Array<number>(machine.lightCount).fill(0);
  sol.presses.forEach((p, b) => {
    expect(Number.isInteger(p) && p >= 0).toBe(true);
    for (const l of machine.buttons[b]!) achieved[l] = achieved[l]! + p;
  });
  expect(achieved).toEqual([...machine.joltageRequirements]);
}

const mk = (buttons: number[][], joltages: number[]) => new FactoryMachine(joltages.map(() => false), buttons, joltages);

describe('Day 10 Part 2 parity-halving oracle agreement', () => {
  it('matches official examples and non-TU (det=2, 3) / nullity 0..3 fixtures', () => {
    const official = parseMachines([
      '[.##.] (3) (1,3) (2) (2,3) (0,2) (0,1) {3,5,4,7}',
      '[...#.] (0,2,3,4) (2,3) (0,4) (0,1,2) (1,2,3,4) {7,5,12,7,2}',
      '[.###.#] (0,1,2,3,4) (0,3,4) (0,1,2,4,5) (1,2) {10,11,11,5,10,5}',
    ].join('\n'));
    const fixtures: FactoryMachine[] = [
      ...official,
      mk([[0, 1], [0, 2], [1, 2]], [4, 4, 4]), // det=2 feasible nullity=0
      mk([[0, 1], [0, 2], [1, 2]], [2, 1, 2]), // det=2 fractional infeasible
      mk([[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]], [3, 3, 3, 3]), // det=3 feasible nullity=0
      mk([[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3], [0]], [5, 4, 4, 4]), // det=3 nullity=1
      mk([[0], [0, 1], [1, 2], [2, 3], [3], [0, 3]], [4, 7, 7, 4]), // nullity=2
      mk([[0], [1], [0, 1], [0, 2], [1, 2], [2], [0, 1, 2]], [6, 7, 8]), // nullity=4 (3 extra)
    ];
    fixtures.forEach(verifyAgreement);
  });

  it('matches across 40 deterministic seeded random machines (solvable and unsolvable)', () => {
    let seed = 0x9e3779b9;
    const nextInt = (bound: number) => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed % bound;
    };
    for (let t = 0; t < 40; t += 1) {
      const [L, B] = [2 + nextInt(5), 2 + nextInt(8)];
      const buttons = Array.from({ length: B }, () => {
        const subset = Array.from({ length: L }, (_, l) => l).filter(() => nextInt(2) === 1);
        return subset.length > 0 ? subset : [nextInt(L)];
      });
      const targets = new Array<number>(L).fill(0);
      if (t % 4 !== 0) {
        for (let b = 0; b < B; b += 1) {
          const p = nextInt(5);
          for (const l of buttons[b]!) targets[l] = targets[l]! + p;
        }
      } else {
        for (let l = 0; l < L; l += 1) targets[l] = nextInt(26);
      }
      verifyAgreement(mk(buttons, targets));
    }
  });
});
