import { describe, expect, it } from 'vitest';
import { solver } from './index';

/** Independent O(L) Binomial Convolution / Lagrange extrapolation oracle. */
function binomialLagrangeOracle(history: readonly bigint[]): bigint {
  const n = history.length;
  let coeff = 1n;
  let sum = 0n;
  for (let i = 0; i < n; i += 1) {
    const sign = (n - 1 - i) % 2 === 0 ? 1n : -1n;
    sum += sign * coeff * history[i]!;
    coeff = (coeff * BigInt(n - i)) / BigInt(i + 1);
  }
  return sum;
}

/** Independent recursive finite-difference oracle. */
function recursiveDifferenceOracle(row: readonly bigint[]): bigint {
  if (row.every((v) => v === 0n)) return 0n;
  const diffs: bigint[] = [];
  for (let i = 0; i < row.length - 1; i += 1) {
    diffs.push(row[i + 1]! - row[i]!);
  }
  return row[row.length - 1]! + recursiveDifferenceOracle(diffs);
}

/** Deterministic SplitMix32-style PRNG returning values in [0, 2^32). */
function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let z = Math.imul(state ^ (state >>> 15), 1 | state);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return (z ^ (z >>> 14)) >>> 0;
  };
}

function nextSignedBigInt(rng: () => number, scale: bigint): bigint {
  const hi = BigInt(rng());
  const lo = BigInt(rng());
  const combined = (hi << 32n) | lo;
  const magnitude = combined % scale;
  return (rng() & 1) === 0 ? magnitude : -magnitude;
}

function generatePolynomialHistory(
  degree: number,
  length: number,
  rng: () => number,
): readonly bigint[] {
  const coeffs = Array.from({ length: degree + 1 }, () =>
    nextSignedBigInt(rng, 1_000_000_000_000_000_000n),
  );
  const values: bigint[] = [];
  for (let x = 0n; x < BigInt(length); x += 1n) {
    let acc = 0n;
    for (let k = coeffs.length - 1; k >= 0; k -= 1) {
      acc = acc * x + coeffs[k]!;
    }
    values.push(acc);
  }
  return values;
}

describe('Mirage Maintenance Part 1 independent mathematical oracles', () => {
  it('matches both Binomial/Lagrange and Recursive oracles on official & edge cases', () => {
    const cases: readonly (readonly bigint[])[] = [
      [0n, 3n, 6n, 9n, 12n, 15n],
      [1n, 3n, 6n, 10n, 15n, 21n],
      [10n, 13n, 16n, 21n, 30n, 45n],
      [-2n, 0n, 2n],
      [-5n, 5n, 15n],
      [0n, 0n, 0n],
      [-4n, -9n, -16n, -25n, -36n],
    ];
    for (const row of cases) {
      const raw = row.map(String).join(' ');
      const actual = solver.solve(solver.parse(raw));
      expect(actual).toBe(binomialLagrangeOracle(row));
      expect(actual).toBe(recursiveDifferenceOracle(row));
    }
  });

  it('matches both oracles across 100 seeded polynomials of degrees 0..18 up to ±10^18', () => {
    const rng = createSeededRng(20230901);
    for (let trial = 0; trial < 100; trial += 1) {
      const degree = trial % 19;
      const length = degree + 2 + (rng() % 3);
      const history = generatePolynomialHistory(degree, length, rng);
      const raw = history.map(String).join(' ');
      const actual = solver.solve(solver.parse(raw));
      expect(actual).toBe(binomialLagrangeOracle(history));
      expect(actual).toBe(recursiveDifferenceOracle(history));
    }
  });
});
