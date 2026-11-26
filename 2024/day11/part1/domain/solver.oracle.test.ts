import { describe, expect, it } from 'vitest';
import { countStonesAfterBlinks, parsePebbleLine, PebbleLine } from '../../shared';
import { solver } from './index';

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
    const span = maxInclusive - min + 1;
    return min + (this.nextUint32() % span);
  }

  nextStone(): bigint {
    const mode = this.nextInt(0, 4);
    if (mode === 0) return 0n;
    if (mode === 1) return BigInt(this.nextInt(1, 99));
    if (mode === 2) return BigInt(this.nextInt(100, 99999));
    if (mode === 3) return 10_000_000_000_000_000n + BigInt(this.nextInt(1, 99999));
    return BigInt(this.nextInt(100000, 9999999));
  }
}

function literalBlinkOnce(stones: readonly bigint[]): bigint[] {
  const out: bigint[] = [];
  for (const s of stones) {
    if (s === 0n) {
      out.push(1n);
      continue;
    }
    const text = s.toString(10);
    if (text.length % 2 === 0) {
      const half = text.length / 2;
      out.push(BigInt(text.slice(0, half)), BigInt(text.slice(half)));
    } else {
      out.push(s * 2024n);
    }
  }
  return out;
}

function oracleLiteralExpand(initial: readonly bigint[], blinks: number): bigint[] {
  let current = [...initial];
  for (let i = 0; i < blinks; i += 1) {
    current = literalBlinkOnce(current);
  }
  return current;
}

function oracleMemoSingle(
  stone: bigint,
  remaining: number,
  memo: Map<bigint, bigint>[],
): bigint {
  if (remaining === 0) return 1n;
  const layer = memo[remaining]!;
  const cached = layer.get(stone);
  if (cached !== undefined) return cached;

  let total: bigint;
  if (stone === 0n) {
    total = oracleMemoSingle(1n, remaining - 1, memo);
  } else {
    const text = stone.toString(10);
    if (text.length % 2 === 0) {
      const half = text.length / 2;
      total =
        oracleMemoSingle(BigInt(text.slice(0, half)), remaining - 1, memo) +
        oracleMemoSingle(BigInt(text.slice(half)), remaining - 1, memo);
    } else {
      total = oracleMemoSingle(stone * 2024n, remaining - 1, memo);
    }
  }
  layer.set(stone, total);
  return total;
}

function oracleMemoLine(initial: readonly bigint[], blinks: number): bigint {
  const memo = Array.from({ length: blinks + 1 }, () => new Map<bigint, bigint>());
  let sum = 0n;
  for (const stone of initial) {
    sum += oracleMemoSingle(stone, blinks, memo);
  }
  return sum;
}

function randomLine(rng: LcgRng, len: number): PebbleLine {
  const stones = Array.from({ length: len }, () => rng.nextStone());
  return new PebbleLine(stones);
}

describe('Oracle A: Literal Ordered Array Expansion (B = 0..12)', () => {
  it('matches 0 1 10 99 999 after 1 blink and 125 17 across blinks 0..12', () => {
    const first = parsePebbleLine('0 1 10 99 999');
    expect(countStonesAfterBlinks(first, 1)).toBe(
      BigInt(oracleLiteralExpand(first.stones, 1).length),
    );

    const sample = parsePebbleLine('125 17');
    const frames = solver.trace!(sample);
    for (let b = 0; b <= 6; b += 1) {
      expect(frames[b]!.orderedPreview).toEqual(oracleLiteralExpand(sample.stones, b));
    }
    for (let b = 0; b <= 12; b += 1) {
      const literal = oracleLiteralExpand(sample.stones, b);
      expect(countStonesAfterBlinks(sample, b)).toBe(BigInt(literal.length));
    }
  });

  it('matches literal expansion on seeded random lines across B = 0..10', () => {
    const rng = new LcgRng(20241101);
    for (let trial = 0; trial < 8; trial += 1) {
      const line = randomLine(rng, rng.nextInt(1, 5));
      const blinks = rng.nextInt(0, 10);
      const literal = oracleLiteralExpand(line.stones, blinks);
      expect(countStonesAfterBlinks(line, blinks)).toBe(BigInt(literal.length));
    }
  });
});

describe('Oracle B: Top-Down Memoized Recursive DP (B = 0..75)', () => {
  it('matches 125 17 at B = 25 (55312n) and B = 75, plus edge inputs', () => {
    const sample = parsePebbleLine('125 17');
    expect(solver.solve(sample)).toBe(55312n);
    expect(oracleMemoLine(sample.stones, 25)).toBe(55312n);
    expect(countStonesAfterBlinks(sample, 75)).toBe(oracleMemoLine(sample.stones, 75));

    const edgeCases: readonly (readonly bigint[])[] = [
      [0n],
      [1n],
      [9_007_199_254_740_993n, 12_345_678_901_234_567n],
    ];
    for (const stones of edgeCases) {
      const line = new PebbleLine(stones);
      expect(solver.solve(line)).toBe(oracleMemoLine(stones, 25));
      expect(countStonesAfterBlinks(line, 75)).toBe(oracleMemoLine(stones, 75));
    }
  });

  it('matches top-down DP on seeded random inputs at B = 25 and B = 75', () => {
    const rng = new LcgRng(20241175);
    for (let trial = 0; trial < 10; trial += 1) {
      const line = randomLine(rng, rng.nextInt(1, 8));
      expect(solver.solve(line)).toBe(oracleMemoLine(line.stones, 25));
      expect(countStonesAfterBlinks(line, 75)).toBe(oracleMemoLine(line.stones, 75));
    }
  });
});

describe('Superposition invariant', () => {
  it('satisfies count(A ++ B, k) === count(A, k) + count(B, k)', () => {
    const rng = new LcgRng(99887766);
    for (let trial = 0; trial < 8; trial += 1) {
      const lineA = randomLine(rng, rng.nextInt(1, 5));
      const lineB = randomLine(rng, rng.nextInt(1, 5));
      const combined = new PebbleLine([...lineA.stones, ...lineB.stones]);
      const k = rng.nextInt(0, 30);
      expect(countStonesAfterBlinks(combined, k)).toBe(
        countStonesAfterBlinks(lineA, k) + countStonesAfterBlinks(lineB, k),
      );
    }
  });
});
