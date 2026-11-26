import { describe, expect, it } from 'vitest';
import { parseSignalInput } from '../../shared';
import { solvePart2 } from './index';

type OracleVal = number | OracleVal[];

function oracleCompare(a: OracleVal, b: OracleVal): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.sign(a - b);
  }
  if (typeof a === 'number') return oracleCompare([a], b);
  if (typeof b === 'number') return oracleCompare(a, [b]);
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const cmp = oracleCompare(a[i]!, b[i]!);
    if (cmp !== 0) return cmp;
  }
  return Math.sign(a.length - b.length);
}

function oracleDecoderKey(raw: string): number {
  const packets = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as OracleVal);
  const div2: OracleVal = [[2]];
  const div6: OracleVal = [[6]];
  const sorted = [div2, div6, ...packets].sort(oracleCompare);
  return (sorted.indexOf(div2) + 1) * (sorted.indexOf(div6) + 1);
}

function nextSeed(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

function randomPacket(state: { seed: number }, depth: number): string {
  state.seed = nextSeed(state.seed);
  const len = state.seed % 4;
  const items: string[] = [];
  for (let i = 0; i < len; i += 1) {
    state.seed = nextSeed(state.seed);
    if (depth < 3 && (state.seed % 3) === 0) {
      items.push(randomPacket(state, depth + 1));
    } else {
      state.seed = nextSeed(state.seed);
      items.push(String(state.seed % 10));
    }
  }
  return `[${items.join(',')}]`;
}

function buildRandomInput(seed: number, pairCount: number): string {
  const state = { seed };
  const pairs: string[] = [];
  for (let i = 0; i < pairCount; i += 1) {
    pairs.push(`${randomPacket(state, 0)}\n${randomPacket(state, 0)}`);
  }
  return pairs.join('\n\n');
}

describe('2022 Day 13 Part 2 oracle equivalence', () => {
  it('matches independent JSON.parse + full sort on the official example', () => {
    const raw = [
      '[1,1,3,1,1]\n[1,1,5,1,1]',
      '[[1],[2,3,4]]\n[[1],4]',
      '[9]\n[[8,7,6]]',
      '[[4,4],4,4]\n[[4,4],4,4,4]',
      '[7,7,7,7]\n[7,7,7]',
      '[]\n[3]',
      '[[[]]]\n[[]]',
      '[1,[2,[3,[4,[5,6,7]]]],8,9]\n[1,[2,[3,[4,[5,6,0]]]],8,9]',
    ].join('\n\n');
    expect(solvePart2(parseSignalInput(raw))).toBe(oracleDecoderKey(raw));
  });

  it('matches oracle on divider-equivalent ties and near-ties', () => {
    const raw = [
      '[2]\n[[2]]',
      '[[[2]]]\n[[2],0]',
      '[6]\n[[6]]',
      '[[[6]]]\n[[6],0]',
      '[]\n[[]]',
    ].join('\n\n');
    expect(solvePart2(parseSignalInput(raw))).toBe(oracleDecoderKey(raw));
  });

  it('matches oracle across 120 seeded random nested-packet corpora', () => {
    for (let i = 1; i <= 120; i += 1) {
      const raw = buildRandomInput(i * 7919, 1 + (i % 8));
      expect(solvePart2(parseSignalInput(raw))).toBe(oracleDecoderKey(raw));
    }
  });
});
