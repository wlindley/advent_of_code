import { describe, expect, it } from 'vitest';
import { solver } from './solver';

const ORACLE_ORDER = 'J23456789TQKA';
const NON_JOKERS = '23456789TQKA';
const TYPE_CACHE = new Map<string, number>();

interface OracleEntry {
  readonly cards: string;
  readonly bid: bigint;
  readonly idx: number;
  readonly type: number;
}

function classifyNoJokers(chars: readonly string[]): number {
  const tally = new Map<string, number>();
  for (const ch of chars) tally.set(ch, (tally.get(ch) ?? 0) + 1);
  const sig = Array.from(tally.values()).sort((a, b) => b - a).join(',');
  if (sig === '5') return 6;
  if (sig === '4,1') return 5;
  if (sig === '3,2') return 4;
  if (sig === '3,1,1') return 3;
  if (sig === '2,2,1') return 2;
  if (sig === '2,1,1,1') return 1;
  return 0;
}

function searchBestSubstitution(chars: string[], pos: number): number {
  if (pos === 5) return classifyNoJokers(chars);
  if (chars[pos] !== 'J') return searchBestSubstitution(chars, pos + 1);
  let best = 0;
  for (const sub of NON_JOKERS) {
    chars[pos] = sub;
    const candidate = searchBestSubstitution(chars, pos + 1);
    if (candidate > best) best = candidate;
  }
  chars[pos] = 'J';
  return best;
}

function oracleClassify(hand: string): number {
  const cached = TYPE_CACHE.get(hand);
  if (cached !== undefined) return cached;
  const best = searchBestSubstitution(hand.split(''), 0);
  TYPE_CACHE.set(hand, best);
  return best;
}

function compareOracle(a: OracleEntry, b: OracleEntry): number {
  if (a.type !== b.type) return a.type - b.type;
  for (let i = 0; i < 5; i += 1) {
    const diff = ORACLE_ORDER.indexOf(a.cards[i]!) - ORACLE_ORDER.indexOf(b.cards[i]!);
    if (diff !== 0) return diff;
  }
  return a.idx - b.idx;
}

function oracleSolve(raw: string): bigint {
  const lines = raw.trim().split(/\r?\n/);
  const entries: OracleEntry[] = lines.map((line, idx) => {
    const [cards, bidRaw] = line.trim().split(/\s+/);
    return { cards: cards!, bid: BigInt(bidRaw!), idx, type: oracleClassify(cards!) };
  });
  entries.sort(compareOracle);
  return entries.reduce((sum, entry, i) => sum + entry.bid * BigInt(i + 1), 0n);
}

function nextUint(rng: { state: number }): number {
  rng.state = (Math.imul(rng.state, 1664525) + 1013904223) >>> 0;
  return rng.state;
}

function buildRandomDeal(rng: { state: number }, count: number, jokerWeight: number): string {
  const lines: string[] = [];
  for (let i = 0; i < count; i += 1) {
    let hand = '';
    for (let c = 0; c < 5; c += 1) {
      const pick = nextUint(rng) % 100 < jokerWeight
        ? 'J'
        : NON_JOKERS[nextUint(rng) % NON_JOKERS.length]!;
      hand += pick;
    }
    lines.push(`${hand} ${nextUint(rng) % 1000}`);
  }
  return lines.join('\n');
}

describe('2023 Day 7 Part 2 differential oracle', () => {
  it('agrees on official example, all 19 patterns, and boundary deals', () => {
    const deals = [
      '32T3K 765\nT55J5 684\nKK677 28\nKTJJT 220\nQQQJA 483',
      'AAAAA 1\nAA8AA 2\n23332 3\nTTT98 4\nKK677 5\n32T3K 6\n23456 7\n' +
        'AAAAJ 8\nAAA2J 9\n2233J 10\n2234J 11\n2345J 12\nAAAJJ 13\n' +
        'QJJQ2 14\n234JJ 15\nAAJJJ 16\n23JJJ 17\n2JJJJ 18\nJJJJJ 19',
      'AAAAK 7\nJJJJJ 11\nJJJJ2 13\n22222 17\nJKKK2 19\nQQQQ2 23',
      'JJJJJ 100\nJJJJJ 0\n23456 4611686018427387904',
    ];
    for (const raw of deals) {
      expect(solver.solve(solver.parse(raw))).toBe(oracleSolve(raw));
    }
  });

  it('cross-checks direct full-12-card substitution on 2233J, QJJQ2, and 23JJJ', () => {
    expect(searchBestSubstitution('2233J'.split(''), 0)).toBe(4);
    expect(searchBestSubstitution('QJJQ2'.split(''), 0)).toBe(5);
    expect(searchBestSubstitution('23JJJ'.split(''), 0)).toBe(5);
  });

  it('agrees across 50 seeded general deals and 20 joker-heavy deals', () => {
    const rng = { state: 0x20230702 };
    for (let i = 0; i < 50; i += 1) {
      const count = 1 + (nextUint(rng) % 200);
      const raw = buildRandomDeal(rng, count, 8);
      expect(solver.solve(solver.parse(raw))).toBe(oracleSolve(raw));
    }
    for (let i = 0; i < 20; i += 1) {
      const count = 5 + (nextUint(rng) % 40);
      const raw = buildRandomDeal(rng, count, 45);
      expect(solver.solve(solver.parse(raw))).toBe(oracleSolve(raw));
    }
  });
});
