import { describe, expect, it } from 'vitest';
import { solver } from './solver';

const CARDS = '23456789TJQKA';

function oracleClassify(hand: string): number {
  const counts = new Map<string, number>();
  for (const ch of hand) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  const sig = [...counts.values()].sort((a, b) => b - a).join(',');
  switch (sig) {
    case '5':
      return 6;
    case '4,1':
      return 5;
    case '3,2':
      return 4;
    case '3,1,1':
      return 3;
    case '2,2,1':
      return 2;
    case '2,1,1,1':
      return 1;
    default:
      return 0;
  }
}

function oracleCompareHands(a: string, b: string): number {
  const ta = oracleClassify(a);
  const tb = oracleClassify(b);
  if (ta !== tb) return ta - tb;
  for (let i = 0; i < 5; i += 1) {
    const sa = CARDS.indexOf(a[i]!);
    const sb = CARDS.indexOf(b[i]!);
    if (sa !== sb) return sa - sb;
  }
  return 0;
}

function oracleSolve(raw: string): bigint {
  const rows = raw
    .trim()
    .split(/\r?\n/)
    .map((line, index) => {
      const [hand, bid] = line.trim().split(/\s+/);
      return { hand: hand!, bid: BigInt(bid!), index };
    });
  rows.sort((x, y) => {
    const cmp = oracleCompareHands(x.hand, y.hand);
    return cmp !== 0 ? cmp : x.index - y.index;
  });
  return rows.reduce((sum, row, idx) => sum + row.bid * BigInt(idx + 1), 0n);
}

function nextPrng(state: number): number {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

describe('Part 1 independent lexicographic-comparator-sort oracle', () => {
  it('matches the oracle on official example and boundary deals', () => {
    const boundaryDeals = [
      '32T3K 765\nT55J5 684\nKK677 28\nKTJJT 220\nQQQJA 483',
      '23456 0\n23456 0\nAAAAA 0',
      `32T3K ${(1n << 62n).toString()}\n32T3K ${(1n << 63n).toString()}\nAAAAA 999999999999999999999`,
    ];
    for (const raw of boundaryDeals) {
      expect(solver.solve(solver.parse(raw))).toBe(oracleSolve(raw));
    }
  });

  it('matches the oracle across 50 seeded PRNG deals (1..200 hands each)', () => {
    let seed = 20230701;
    for (let dealIdx = 0; dealIdx < 50; dealIdx += 1) {
      seed = nextPrng(seed);
      const handCount = 1 + (seed % 200);
      const lines: string[] = [];
      for (let h = 0; h < handCount; h += 1) {
        let hand = '';
        for (let c = 0; c < 5; c += 1) {
          seed = nextPrng(seed);
          hand += CARDS[seed % CARDS.length]!;
        }
        seed = nextPrng(seed);
        lines.push(`${hand} ${seed % 1000}`);
      }
      const raw = lines.join('\n');
      expect(solver.solve(solver.parse(raw))).toBe(oracleSolve(raw));
    }
  });
});
