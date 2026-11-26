import { describe, expect, it } from 'vitest';
import { solver } from './index';

/** Independent O(L) Backward Binomial / Lagrange extrapolation oracle. */
function backwardBinomialOracle(history: readonly bigint[]): bigint {
  const n = history.length;
  let coeff = BigInt(n);
  let sum = 0n;
  for (let k = 0; k < n; k += 1) {
    const sign = k % 2 === 0 ? 1n : -1n;
    sum += sign * coeff * history[k]!;
    coeff = (coeff * BigInt(n - k - 1)) / BigInt(k + 2);
  }
  return sum;
}

/** Independent Reversed-Sequence Forward Difference Reduction oracle. */
function reversedForwardDifferenceOracle(history: readonly bigint[]): bigint {
  let row = [...history].reverse();
  let sum = 0n;
  while (row.some((value) => value !== 0n)) {
    sum += row[row.length - 1]!;
    const next: bigint[] = [];
    for (let i = 0; i < row.length - 1; i += 1) {
      next.push(row[i + 1]! - row[i]!);
    }
    row = next;
  }
  return sum;
}

/** Deterministic SplitMix32-style PRNG returning values in [0, 2^32). */
class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  nextUint32(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let z = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return (z ^ (z >>> 14)) >>> 0;
  }

  nextSignedBigInt(scale: bigint): bigint {
    const hi = BigInt(this.nextUint32());
    const lo = BigInt(this.nextUint32());
    const magnitude = ((hi << 32n) | lo) % scale;
    return (this.nextUint32() & 1) === 0 ? magnitude : -magnitude;
  }
}

function generatePolynomialHistory(
  degree: number,
  length: number,
  rng: SeededRng,
): readonly bigint[] {
  const coeffs = Array.from({ length: degree + 1 }, () =>
    rng.nextSignedBigInt(1_000_000_000_000_000_000n),
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

describe('Mirage Maintenance Part 2 independent mathematical oracles', () => {
  it('matches both Backward Binomial and Reversed-Difference oracles on official & edge cases', () => {
    const cases: readonly (readonly bigint[])[] = [
      [0n, 3n, 6n, 9n, 12n, 15n],
      [1n, 3n, 6n, 10n, 15n, 21n],
      [10n, 13n, 16n, 21n, 30n, 45n],
      [-2n, 0n, 2n],
      [7n, 7n, 7n],
      [0n, 0n, 0n],
      [-4n, -9n, -16n, -25n, -36n],
    ];
    for (const row of cases) {
      const raw = row.map(String).join(' ');
      const actual = solver.solve(solver.parse(raw));
      expect(actual).toBe(backwardBinomialOracle(row));
      expect(actual).toBe(reversedForwardDifferenceOracle(row));
    }
  });

  it('matches both oracles across 100 seeded polynomials of degrees 0..18 up to ±10^18', () => {
    const rng = new SeededRng(20230902);
    for (let trial = 0; trial < 100; trial += 1) {
      const degree = trial % 19;
      const length = degree + 2 + (rng.nextUint32() % 3);
      const history = generatePolynomialHistory(degree, length, rng);
      const raw = history.map(String).join(' ');
      const actual = solver.solve(solver.parse(raw));
      expect(actual).toBe(backwardBinomialOracle(history));
      expect(actual).toBe(reversedForwardDifferenceOracle(history));
    }
  });
});
