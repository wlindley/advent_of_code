import { describe, expect, it } from 'vitest';
import { CupRingSpec, parseCupLabels } from './model';
import { CupRing } from './ring';

function oracleStep(ring: number[], maxCup: number): void {
  const cur = ring[0]!;
  const picked = ring.splice(1, 3);
  let dest = cur > 1 ? cur - 1 : maxCup;
  while (picked.includes(dest)) {
    dest = dest > 1 ? dest - 1 : maxCup;
  }
  const destIdx = ring.indexOf(dest);
  ring.splice(destIdx + 1, 0, ...picked);
  ring.push(ring.shift()!);
}

function buildOracleRing(labels: readonly number[], totalCups: number): number[] {
  const arr = [...labels];
  for (let cup = labels.length + 1; cup <= totalCups; cup += 1) {
    arr.push(cup);
  }
  return arr;
}

function seededPermutation(n: number, seed: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i + 1);
  let s = seed >>> 0;
  for (let i = n - 1; i > 0; i -= 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

describe('2020 Day 23 CupRing', () => {
  it('links cups, expands to totalCups, and inspects clockwise neighbors', () => {
    const spec = parseCupLabels('389125467');
    const ring = new CupRing(spec, 12);
    expect(ring.cupCount).toBe(12);
    expect(ring.currentCup).toBe(3);
    expect(ring.nextOf(7)).toBe(10);
    expect(ring.nextOf(12)).toBe(3);
    expect(ring.clockwiseFrom(1, 0)).toEqual([]);
    expect(ring.clockwiseFrom(1, 5)).toEqual([1, 2, 5, 4, 6]);
    expect(ring.productAfterOne()).toBe(10n);
  });

  it('matches plain-array differential oracle on N=4 (dest === cur), N=5, N=9, and expanded N=25', () => {
    const cases = [
      { labels: [2, 1, 3, 4], totalCups: 4, moves: 20 },
      { labels: [1, 5, 2, 4, 3], totalCups: 5, moves: 30 },
      { labels: [3, 8, 9, 1, 2, 5, 4, 6, 7], totalCups: 9, moves: 100 },
      { labels: [3, 8, 9, 1, 2, 5, 4, 6, 7], totalCups: 25, moves: 100 },
    ];
    for (const c of cases) {
      const ring = new CupRing(new CupRingSpec(c.labels), c.totalCups);
      const oracle = buildOracleRing(c.labels, c.totalCups);
      for (let m = 1; m <= c.moves; m += 1) {
        ring.advance(1);
        oracleStep(oracle, c.totalCups);
        expect(ring.clockwiseFrom(ring.currentCup, c.totalCups)).toEqual(oracle);
      }
    }
  });

  it('matches differential oracle across seeded random permutations over 100 moves', () => {
    for (let seed = 1; seed <= 10; seed += 1) {
      const labels = seededPermutation(9, seed);
      const ring = new CupRing(new CupRingSpec(labels), 9);
      const oracle = buildOracleRing(labels, 9);
      ring.advance(100);
      for (let m = 0; m < 100; m += 1) oracleStep(oracle, 9);
      expect(ring.clockwiseFrom(ring.currentCup, 9)).toEqual(oracle);
    }
  });

  it('solves the official 9-cup 100-move example and wraps destination correctly', () => {
    const ring = new CupRing(parseCupLabels('389125467'), 9);
    const rec = ring.advance(10);
    expect(rec.sourceCup).toBe(5);
    expect(ring.labelsAfterOne()).toBe('92658374');
    ring.advance(90);
    expect(ring.labelsAfterOne()).toBe('67384529');

    const wrapRing = new CupRing(new CupRingSpec([2, 1, 4, 3]), 4);
    const wrapRec = wrapRing.advance(1);
    expect(wrapRec.destination).toBe(2);
    expect(wrapRec.nextCurrent).toBe(1);
  });

  it('validates constructor, nextOf, advance, and clockwiseFrom bounds', () => {
    const ring = new CupRing(parseCupLabels('389125467'), 9);
    expect(() => new CupRing(parseCupLabels('389125467'), 8)).toThrow(RangeError);
    expect(() => new CupRing(parseCupLabels('389125467'), 9.5)).toThrow(RangeError);
    expect(() => ring.nextOf(0)).toThrow(RangeError);
    expect(() => ring.nextOf(10)).toThrow(RangeError);
    expect(() => ring.nextOf(1.5)).toThrow(RangeError);
    expect(() => ring.advance(0)).toThrow(RangeError);
    expect(() => ring.advance(1.5)).toThrow(RangeError);
    expect(() => ring.clockwiseFrom(0, 1)).toThrow(RangeError);
    expect(() => ring.clockwiseFrom(1, -1)).toThrow(RangeError);
    expect(() => ring.clockwiseFrom(1, 10)).toThrow(RangeError);
    expect(() => ring.clockwiseFrom(1, 1.5)).toThrow(RangeError);
  });
});
