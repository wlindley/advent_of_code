import { describe, expect, it } from 'vitest';
import { parsePebbleLine, PebbleLine } from '../../shared';
import { PART2_BLINKS, solver } from './index';

class LcgRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  nextUint32(): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return this.state;
  }

  nextInt(min: number, maxInclusive: number): number {
    return min + (this.nextUint32() % (maxInclusive - min + 1));
  }

  nextSevenDigitStone(): bigint {
    return BigInt(this.nextInt(1_000_000, 9_999_999));
  }
}

function countDigits(stone: bigint): number {
  let digits = 0;
  let value = stone;
  while (value > 0n) {
    digits += 1;
    value /= 10n;
  }
  return digits;
}

function arithmeticBlink(stone: bigint): readonly bigint[] {
  if (stone === 0n) return [1n];
  const digits = countDigits(stone);
  if (digits % 2 === 0) {
    const divisor = 10n ** BigInt(digits / 2);
    return [stone / divisor, stone % divisor];
  }
  return [stone * 2024n];
}

function makeMemo(blinks: number): Map<bigint, bigint>[] {
  const memo: Map<bigint, bigint>[] = [];
  for (let i = 0; i <= blinks; i += 1) {
    memo.push(new Map<bigint, bigint>());
  }
  return memo;
}

function oracleTopDownSingle(
  stone: bigint,
  remaining: number,
  memo: Map<bigint, bigint>[],
): bigint {
  if (remaining === 0) return 1n;
  const layer = memo[remaining]!;
  const cached = layer.get(stone);
  if (cached !== undefined) return cached;

  let total = 0n;
  for (const nextStone of arithmeticBlink(stone)) {
    total += oracleTopDownSingle(nextStone, remaining - 1, memo);
  }
  layer.set(stone, total);
  return total;
}

function oracleTopDownLine(stones: readonly bigint[], blinks: number): bigint {
  const memo = makeMemo(blinks);
  let sum = 0n;
  for (const stone of stones) {
    sum += oracleTopDownSingle(stone, blinks, memo);
  }
  return sum;
}

function arithmeticHistogram(
  stones: readonly bigint[],
  blinks: number,
): Map<bigint, bigint> {
  let current = new Map<bigint, bigint>();
  for (const stone of stones) {
    current.set(stone, (current.get(stone) ?? 0n) + 1n);
  }
  for (let b = 0; b < blinks; b += 1) {
    const next = new Map<bigint, bigint>();
    for (const [stone, count] of current) {
      for (const out of arithmeticBlink(stone)) {
        next.set(out, (next.get(out) ?? 0n) + count);
      }
    }
    current = next;
  }
  return current;
}

function oracleSemigroupSplit(
  stones: readonly bigint[],
  firstBlinks: number,
  secondBlinks: number,
): bigint {
  const hist = arithmeticHistogram(stones, firstBlinks);
  const memo = makeMemo(secondBlinks);
  let total = 0n;
  for (const [stone, count] of hist) {
    total += count * oracleTopDownSingle(stone, secondBlinks, memo);
  }
  return total;
}

function randomSevenDigitLine(rng: LcgRng, len: number): PebbleLine {
  const stones: bigint[] = [];
  for (let i = 0; i < len; i += 1) {
    stones.push(rng.nextSevenDigitStone());
  }
  return new PebbleLine(stones);
}

describe('Oracle 1: Pure-Arithmetic Top-Down Memoized DP (75 blinks)', () => {
  it('matches solver on 125 17, edge values, duplicates, and > MAX_SAFE_INTEGER', () => {
    expect(PART2_BLINKS).toBe(75);
    expect(solver.solve(parsePebbleLine('125 17'))).toBe(65601038650482n);

    const deterministicCases = [
      '125 17',
      '0',
      '1000',
      '100000',
      '0 0 17 17 125',
      '9007199254740993 12345678901234567',
    ];
    for (const raw of deterministicCases) {
      const line = parsePebbleLine(raw);
      expect(solver.solve(line)).toBe(oracleTopDownLine(line.stones, 75));
    }
  });

  it('matches solver on seeded multi-stone 7-digit synthetic lines', () => {
    const rng = new LcgRng(20241175);
    for (let trial = 0; trial < 8; trial += 1) {
      const line = randomSevenDigitLine(rng, rng.nextInt(2, 8));
      expect(solver.solve(line)).toBe(oracleTopDownLine(line.stones, 75));
    }
  });
});

describe('Oracle 2: Chapman-Kolmogorov Semigroup Split (37 + 38 = 75)', () => {
  it('satisfies solve(line) === sum hist(line, 37) * topDown(v, 38)', () => {
    for (const raw of ['125 17', '0 1000']) {
      const line = parsePebbleLine(raw);
      expect(solver.solve(line)).toBe(oracleSemigroupSplit(line.stones, 37, 38));
    }

    const rng = new LcgRng(753738);
    for (let trial = 0; trial < 6; trial += 1) {
      const line = randomSevenDigitLine(rng, rng.nextInt(2, 6));
      expect(solver.solve(line)).toBe(oracleSemigroupSplit(line.stones, 37, 38));
    }
  });
});
