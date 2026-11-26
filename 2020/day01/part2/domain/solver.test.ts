import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { solver } from './index';

const EXAMPLE_INPUT = '1721\n979\n366\n299\n675\n1456';
const TARGET_SUM = 2020;

class SeededRng {
  #state: number;

  constructor(seed: number) {
    this.#state = seed >>> 0;
  }

  nextInt(bound: number): number {
    this.#state = (Math.imul(1664525, this.#state) + 1013904223) >>> 0;
    return this.#state % bound;
  }
}

function bruteForceThreeSumProducts(values: readonly number[], target: number): Set<number> {
  const products = new Set<number>();
  for (let i = 0; i < values.length; i += 1) {
    for (let j = i + 1; j < values.length; j += 1) {
      for (let m = j + 1; m < values.length; m += 1) {
        if (values[i]! + values[j]! + values[m]! === target) {
          products.add(values[i]! * values[j]! * values[m]!);
        }
      }
    }
  }
  return products;
}

function buildRandomTrialValues(rng: SeededRng, plantMatch: boolean): number[] {
  const values: number[] = [];
  const count = 8 + rng.nextInt(5);
  for (let i = 0; i < count; i += 1) {
    values.push(rng.nextInt(2500));
  }
  if (plantMatch) {
    const a = rng.nextInt(1011);
    const b = rng.nextInt(TARGET_SUM - a + 1);
    values.push(a, b, TARGET_SUM - a - b);
  }
  return values;
}

describe('2020 day01 part2 solver', () => {
  it('parses and solves the official example to 241861950', () => {
    const report = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(report)).toBe(241861950);
  });

  it('returns 0 when a valid triple includes zero', () => {
    expect(solver.solve(solver.parse('0\n0\n2020\n500'))).toBe(0);
    expect(solver.solve(solver.parse('0\n1010\n1010\n5'))).toBe(0);
  });

  it('rejects duplicate-entry traps and solves valid repeated-value triples', () => {
    expect(() => solver.solve(solver.parse('0\n1010\n500'))).toThrow(RangeError);
    expect(() => solver.solve(solver.parse('505\n1010\n1'))).toThrow(RangeError);
    expect(solver.solve(solver.parse('673\n673\n674'))).toBe(305274146);
  });

  it('throws RangeError when fewer than 3 entries or no triple sums to 2020', () => {
    expect(() => solver.solve(solver.parse('1010\n1010'))).toThrow(RangeError);
    expect(() => solver.solve(solver.parse('2020'))).toThrow(RangeError);
    expect(() => solver.solve(solver.parse('100\n200\n300\n400'))).toThrow(RangeError);
  });

  it('rejects empty, negative, non-numeric, and unsafe integer inputs', () => {
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('  \n\t ')).toThrow(RangeError);
    expect(() => solver.parse('-10\n1015\n1015')).toThrow(SyntaxError);
    expect(() => solver.parse('100\nabc\n1920')).toThrow(SyntaxError);
    expect(() => solver.parse('9007199254740993\n1\n2')).toThrow(RangeError);
  });

  it('matches brute-force three-sum oracle across 30 seeded PRNG fixtures', () => {
    const rng = new SeededRng(20200102);
    let matches = 0;
    let misses = 0;
    for (let trial = 0; trial < 30; trial += 1) {
      const values = buildRandomTrialValues(rng, trial % 2 === 0);
      const expected = bruteForceThreeSumProducts(values, TARGET_SUM);
      const report = solver.parse(values.join('\n'));
      if (expected.size > 0) {
        matches += 1;
        expect(expected.has(solver.solve(report))).toBe(true);
      } else {
        misses += 1;
        expect(() => solver.solve(report)).toThrow(RangeError);
      }
    }
    expect(matches).toBeGreaterThan(0);
    expect(misses).toBeGreaterThan(0);
  });

  it('produces uncapped and maxSteps-capped traces and rejects maxSteps=0', () => {
    const report = solver.parse(EXAMPLE_INPUT);
    const full = solver.trace!(report);
    const lastFull = full.at(-1)!;
    expect(lastFull.verdict).toBe('match');
    expect(lastFull.anchorPositions).toHaveLength(1);
    expect(lastFull.selectedEntries).toHaveLength(3);
    expect(lastFull.product).toBe(241861950);

    const capped = solver.trace!(report, { maxSteps: 2 });
    expect(capped).toHaveLength(2);
    expect(capped.at(-1)!.verdict).toBe('match');
    expect(() => solver.trace!(report, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('integrates with executeSolver using a hand-written Clock stub', () => {
    const times = [10, 27.5];
    let index = 0;
    const stubClock: Clock = {
      nowMs() {
        const value = times[index]!;
        index += 1;
        return value;
      },
    };
    const result = executeSolver(solver, EXAMPLE_INPUT, stubClock);
    expect(result).toEqual({
      answer: 241861950,
      runtime: 'main-thread',
      elapsedMs: 17.5,
    });
  });
});
