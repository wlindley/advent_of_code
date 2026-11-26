import { describe, expect, it } from 'vitest';
import { CalibrationEquation, parseCalibrationInput } from '../../shared';
import { solvePart2, solver } from './index';

function dfsOracle(
  operands: readonly bigint[],
  target: bigint,
  idx: number,
  acc: bigint,
): boolean {
  if (acc > target) return false;
  if (idx === operands.length) return acc === target;
  const right = operands[idx]!;
  return (
    dfsOracle(operands, target, idx + 1, acc + right) ||
    dfsOracle(operands, target, idx + 1, acc * right) ||
    dfsOracle(operands, target, idx + 1, BigInt(`${acc}${right}`))
  );
}

function forwardOracle(eq: CalibrationEquation): boolean {
  return dfsOracle(eq.operands, eq.target, 1, eq.operands[0]!);
}

function oracleSum(equations: readonly CalibrationEquation[]): bigint {
  let total = 0n;
  for (const eq of equations) {
    if (forwardOracle(eq)) total += eq.target;
  }
  return total;
}

function nextLcg(state: number): number {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

function applyOracleOp(acc: bigint, right: bigint, opCode: number): bigint {
  if (opCode === 0) return acc + right;
  if (opCode === 1) return acc * right;
  return BigInt(`${acc}${right}`);
}

const EXAMPLE = [
  '190: 10 19',
  '3267: 81 40 27',
  '83: 17 5',
  '156: 15 6',
  '7290: 6 8 6 15',
  '161011: 16 10 13',
  '192: 17 8 14',
  '21037: 9 7 18 13',
  '292: 11 6 16 20',
].join('\n');

describe('Part 2 reverse DFS vs independent string-concat forward oracle', () => {
  it('agrees on official example (11387n), power-of-10, suffix traps, and >2^64 BigInt', () => {
    const exampleEqs = solver.parse(EXAMPLE);
    expect(solvePart2(exampleEqs)).toBe(11387n);
    expect(oracleSum(exampleEqs)).toBe(11387n);

    const edgeCases: readonly CalibrationEquation[] = [
      ...exampleEqs,
      ...parseCalibrationInput('9: 9\n9: 8\n105: 10 5\n105: 1 5\n1000: 1 100\n1010: 10 10'),
      new CalibrationEquation(15n, [2n, 15n]),
      new CalibrationEquation(10n, [10n, 10n]),
      new CalibrationEquation(1722n, [17n, 8n, 14n]),
      new CalibrationEquation(1844674407370955161699n, [18446744073709551616n, 99n]),
      new CalibrationEquation(1844674407370955161700n, [18446744073709551616n, 99n]),
    ];

    for (const eq of edgeCases) {
      expect(solvePart2([eq])).toBe(forwardOracle(eq) ? eq.target : 0n);
    }
    expect(solvePart2(edgeCases)).toBe(oracleSum(edgeCases));
  });

  it('agrees across 260 seeded PRNG equations (k=1..7, traps, powers of 10, near-misses)', () => {
    const pow10Pool = [1n, 9n, 10n, 99n, 100n, 999n, 1000n] as const;
    const batch: CalibrationEquation[] = [];
    let rng = 202412072;

    for (let i = 0; i < 260; i += 1) {
      rng = nextLcg(rng);
      const len = 1 + (rng % 7);
      const operands: bigint[] = [];
      for (let j = 0; j < len; j += 1) {
        rng = nextLcg(rng);
        const val = i % 5 === 0 ? pow10Pool[rng % pow10Pool.length]! : BigInt(1 + (rng % 30));
        operands.push(val);
      }
      let acc = operands[0]!;
      for (let j = 1; j < len; j += 1) {
        rng = nextLcg(rng);
        acc = applyOracleOp(acc, operands[j]!, rng % 3);
      }
      rng = nextLcg(rng);
      const mode = rng % 4;
      const target =
        mode === 0
          ? acc
          : mode === 1
            ? acc + BigInt(1 + (rng % 7))
            : mode === 2 && acc > 2n
              ? acc - 1n
              : BigInt(`${acc}0`);
      batch.push(new CalibrationEquation(target, operands));
    }

    for (const eq of batch) {
      expect(solvePart2([eq])).toBe(forwardOracle(eq) ? eq.target : 0n);
    }
    expect(solvePart2(batch)).toBe(oracleSum(batch));
  });
});
