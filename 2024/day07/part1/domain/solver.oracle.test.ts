import { describe, expect, it } from 'vitest';
import {
  CalibrationEquation,
  PART1_OPERATORS,
  parseCalibrationInput,
  solveEquation,
  type CalibrationOperator,
} from '../../shared';

function forwardPrunedSolve(
  equation: CalibrationEquation,
  operators: readonly CalibrationOperator[],
): readonly CalibrationOperator[] | null {
  const chosen: CalibrationOperator[] = [];
  function dfs(idx: number, acc: bigint): boolean {
    if (acc > equation.target) return false;
    if (idx === equation.operands.length) return acc === equation.target;
    for (const op of operators) {
      chosen.push(op);
      if (dfs(idx + 1, op.apply(acc, equation.operands[idx]!))) return true;
      chosen.pop();
    }
    return false;
  }
  return dfs(1, equation.operands[0]!) ? chosen : null;
}

function makePrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
}

describe('reverse DFS vs independent forward-pruned oracle', () => {
  it('agrees on official example, k=1/k=2, operand-1 traps, and huge bigints', () => {
    const cases: readonly CalibrationEquation[] = [
      ...parseCalibrationInput(
        '190: 10 19\n3267: 81 40 27\n83: 17 5\n156: 15 6\n7290: 6 8 6 15\n161011: 16 10 13\n192: 17 8 14\n21037: 9 7 18 13\n292: 11 6 16 20',
      ),
      new CalibrationEquation(9n, [9n]),
      new CalibrationEquation(9n, [8n]),
      new CalibrationEquation(35n, [5n, 7n]),
      new CalibrationEquation(10n, [10n, 1n]),
      new CalibrationEquation(11n, [10n, 1n]),
      new CalibrationEquation(1n, [1n, 1n, 1n, 1n]),
      new CalibrationEquation(21n, [10n, 1n, 10n]),
      new CalibrationEquation(2305843009213693953n, [1152921504606846976n, 2n, 1n]),
    ];

    for (const eq of cases) {
      const actual = solveEquation(eq, PART1_OPERATORS);
      const expected = forwardPrunedSolve(eq, PART1_OPERATORS);
      expect(actual !== null).toBe(expected !== null);
      if (actual !== null) {
        expect(eq.evaluateSteps(actual).at(-1)).toBe(eq.target);
      }
    }
  });

  it('agrees across 100 seeded PRNG equations', () => {
    const nextRand = makePrng(20241207);
    for (let i = 0; i < 100; i += 1) {
      const len = 1 + (nextRand() % 7);
      const operands = Array.from({ length: len }, () => BigInt(1 + (nextRand() % 25)));
      let acc = operands[0]!;
      for (let j = 1; j < len; j += 1) {
        const op = PART1_OPERATORS[nextRand() % PART1_OPERATORS.length]!;
        acc = op.apply(acc, operands[j]!);
      }
      const perturb = nextRand() % 2 === 0 ? 0n : BigInt(1 + (nextRand() % 5));
      const eq = new CalibrationEquation(acc + perturb, operands);
      const actual = solveEquation(eq, PART1_OPERATORS);
      const expected = forwardPrunedSolve(eq, PART1_OPERATORS);
      expect(actual !== null).toBe(expected !== null);
      if (actual !== null) {
        expect(eq.evaluateSteps(actual).at(-1)).toBe(eq.target);
      }
    }
  });
});
