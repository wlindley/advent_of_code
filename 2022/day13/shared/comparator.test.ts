import { describe, expect, it } from 'vitest';
import { comparePackets, negateOrder, type PacketOrder } from './comparator';
import { parsePacket } from './parser';

type JsonTree = number | JsonTree[];

function oracleCompare(left: JsonTree, right: JsonTree): PacketOrder {
  if (typeof left === 'number' && typeof right === 'number') {
    return left < right ? -1 : left > right ? 1 : 0;
  }
  const l = typeof left === 'number' ? [left] : left;
  const r = typeof right === 'number' ? [right] : right;
  const limit = Math.min(l.length, r.length);
  for (let i = 0; i < limit; i += 1) {
    const cmp = oracleCompare(l[i]!, r[i]!);
    if (cmp !== 0) return cmp;
  }
  return l.length < r.length ? -1 : l.length > r.length ? 1 : 0;
}

function nextSeed(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

function generatePacketText(state: { seed: number }, depth: number): string {
  state.seed = nextSeed(state.seed);
  const len = state.seed % 4;
  const parts: string[] = [];
  for (let i = 0; i < len; i += 1) {
    state.seed = nextSeed(state.seed);
    if (depth < 3 && state.seed % 3 === 0) {
      parts.push(generatePacketText(state, depth + 1));
    } else {
      state.seed = nextSeed(state.seed);
      parts.push(String(state.seed % 12));
    }
  }
  return `[${parts.join(',')}]`;
}

describe('packet comparator', () => {
  it('negates PacketOrder without producing negative zero', () => {
    expect(negateOrder(-1)).toBe(1);
    expect(negateOrder(1)).toBe(-1);
    expect(Object.is(negateOrder(0), 0)).toBe(true);
  });

  it('orders all 8 official example pairs and tricky corner cases', () => {
    const cases: readonly [string, string, PacketOrder][] = [
      ['[1,1,3,1,1]', '[1,1,5,1,1]', -1],
      ['[[1],[2,3,4]]', '[[1],4]', -1],
      ['[9]', '[[8,7,6]]', 1],
      ['[[4,4],4,4]', '[[4,4],4,4,4]', -1],
      ['[7,7,7,7]', '[7,7,7]', 1],
      ['[]', '[3]', -1],
      ['[[[]]]', '[[]]', 1],
      ['[1,[2,[3,[4,[5,6,7]]]],8,9]', '[1,[2,[3,[4,[5,6,0]]]],8,9]', 1],
      ['[]', '[[]]', -1],
      ['[[]]', '[[[]]]', -1],
      ['[10]', '[2]', 1],
      ['[4]', '[[4]]', 0],
      ['[[4]]', '[4]', 0],
      ['[4,5]', '[4]', 1],
      ['[4]', '[4,5]', -1],
    ];
    for (const [l, r, expected] of cases) {
      expect(comparePackets(parsePacket(l), parsePacket(r))).toBe(expected);
    }
  });

  it('matches JSON.parse differential oracle and order axioms on 150 seeded trees', () => {
    const state = { seed: 20221213 };
    const packets = Array.from({ length: 150 }, () => {
      const text = generatePacketText(state, 0);
      return { text, ast: parsePacket(text), json: JSON.parse(text) as JsonTree };
    });

    for (let i = 0; i < packets.length; i += 1) {
      const a = packets[i]!;
      const b = packets[(i + 1) % packets.length]!;
      const c = packets[(i + 7) % packets.length]!;

      expect(comparePackets(a.ast, a.ast)).toBe(0);
      expect(comparePackets(a.ast, b.ast)).toBe(oracleCompare(a.json, b.json));
      expect(comparePackets(b.ast, a.ast)).toBe(negateOrder(comparePackets(a.ast, b.ast)));

      const ab = comparePackets(a.ast, b.ast);
      const bc = comparePackets(b.ast, c.ast);
      const ac = comparePackets(a.ast, c.ast);
      if (ab <= 0 && bc <= 0) expect(ac).toBeLessThanOrEqual(0);
      if (ab >= 0 && bc >= 0) expect(ac).toBeGreaterThanOrEqual(0);
    }
  });
});
