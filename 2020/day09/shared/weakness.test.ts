import { describe, expect, it } from 'vitest';
import { XmasStream } from './stream';
import {
  collectWeaknessSteps,
  ContiguousWeakness,
  findContiguousWeakness,
  iterateWeaknessWindow,
  WeaknessWindowStep,
} from './weakness';

const OFFICIAL_W5 = new XmasStream([
  35n, 20n, 15n, 25n, 47n, 40n, 62n, 55n, 65n, 95n,
  102n, 117n, 150n, 182n, 127n, 219n, 299n, 277n, 309n, 576n,
]);

const MANIFEST_W25 = new XmasStream([
  ...Array.from({ length: 25 }, (_, i) => BigInt(i + 1)),
  45n, 26n, 64n, 66n, 125n, 111n,
]);

function makePrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
}

function bruteForceFindWeakness(values: readonly bigint[], target: bigint): [number, number] | null {
  const prefix: bigint[] = [0n];
  for (let i = 0; i < values.length; i += 1) {
    prefix.push(prefix[i]! + values[i]!);
  }
  for (let start = 0; start < values.length; start += 1) {
    for (let end = start + 1; end < values.length; end += 1) {
      if (prefix[end + 1]! - prefix[start]! === target) {
        return [start, end];
      }
    }
  }
  return null;
}

describe('weakness value objects', () => {
  it('validates and freezes WeaknessWindowStep', () => {
    const empty = new WeaknessWindowStep(2, 2, 0n);
    expect(Object.isFrozen(empty)).toBe(true);
    expect(empty.length).toBe(0);
    expect(empty.isEmpty).toBe(true);

    const active = new WeaknessWindowStep(1, 4, 15n);
    expect(active.length).toBe(3);
    expect(active.isEmpty).toBe(false);

    expect(() => new WeaknessWindowStep(-1, 2, 1n)).toThrow(RangeError);
    expect(() => new WeaknessWindowStep(3, 2, 1n)).toThrow(RangeError);
    expect(() => new WeaknessWindowStep(1.5, 2, 1n)).toThrow(RangeError);
    expect(() => new WeaknessWindowStep(1, 2, -1n)).toThrow(RangeError);
  });

  it('validates and freezes ContiguousWeakness and computes encryptionWeakness', () => {
    const w = new ContiguousWeakness(2, 5, 2, 4);
    expect(Object.isFrozen(w)).toBe(true);
    expect(w.length).toBe(4);
    expect(w.encryptionWeakness(OFFICIAL_W5)).toBe(62n);

    expect(() => new ContiguousWeakness(-1, 2, 0, 1)).toThrow(RangeError);
    expect(() => new ContiguousWeakness(2, 2, 2, 2)).toThrow(RangeError);
    expect(() => new ContiguousWeakness(2, 5, 1, 4)).toThrow(RangeError);
    expect(() => new ContiguousWeakness(2, 5, 2, 6)).toThrow(RangeError);
    expect(() => new ContiguousWeakness(2, 5, 3, 3)).toThrow(RangeError);
    expect(() => new ContiguousWeakness(1.5, 5, 2, 4)).toThrow(RangeError);
  });
});

describe('contiguous weakness solver', () => {
  it('solves official W=5 and manifest W=25 examples', () => {
    const w5 = findContiguousWeakness(OFFICIAL_W5, 127n);
    expect(w5).toEqual(new ContiguousWeakness(2, 5, 2, 4));
    expect(w5.encryptionWeakness(OFFICIAL_W5)).toBe(62n);

    const w25 = findContiguousWeakness(MANIFEST_W25, 125n);
    expect(w25).toEqual(new ContiguousWeakness(7, 16, 7, 16));
    expect(w25.encryptionWeakness(MANIFEST_W25)).toBe(25n);
  });

  it('handles single-element equals, oversized elements emptying window, equal ranges, post-target ranges, and > 2^63', () => {
    const singleSkip = new XmasStream([127n, 60n, 67n]);
    expect(findContiguousWeakness(singleSkip, 127n)).toEqual(new ContiguousWeakness(1, 2, 1, 2));

    const oversized = new XmasStream([10n, 200n, 60n, 67n]);
    const steps = collectWeaknessSteps(oversized, 127n);
    expect(steps.some((s) => s.isEmpty)).toBe(true);
    expect(findContiguousWeakness(oversized, 127n)).toEqual(new ContiguousWeakness(2, 3, 2, 3));

    const eq2 = new XmasStream([5n, 5n]);
    expect(findContiguousWeakness(eq2, 10n)).toEqual(new ContiguousWeakness(0, 1, 0, 1));
    expect(findContiguousWeakness(eq2, 10n).encryptionWeakness(eq2)).toBe(10n);

    const eq3 = new XmasStream([5n, 5n, 5n]);
    expect(findContiguousWeakness(eq3, 15n)).toEqual(new ContiguousWeakness(0, 2, 0, 2));

    const afterTarget = new XmasStream([10n, 20n, 50n, 23n, 27n]);
    expect(findContiguousWeakness(afterTarget, 50n)).toEqual(new ContiguousWeakness(3, 4, 3, 4));

    const big = (1n << 65n) + 7n;
    const bigStream = new XmasStream([1n, big - 3n, 3n]);
    expect(findContiguousWeakness(bigStream, big).encryptionWeakness(bigStream)).toBe(big);
  });

  it('validates target > 0n and throws when no contiguous range sums to target', () => {
    const stream = new XmasStream([10n, 20n]);
    expect(() => [...iterateWeaknessWindow(stream, 0n)]).toThrow(RangeError);
    expect(() => findContiguousWeakness(stream, 50n)).toThrow('No contiguous range');
    expect(collectWeaknessSteps(stream, 50n)).toHaveLength(2);
    expect(() => findContiguousWeakness(new XmasStream([50n, 1n]), 50n)).toThrow('No contiguous range');
  });

  it('matches independent O(N^2) prefix-sum brute-force oracle across 50 seeded cases', () => {
    const nextRand = makePrng(20200902);
    for (let c = 0; c < 50; c += 1) {
      const len = 3 + (nextRand() % 25);
      const values = Array.from({ length: len }, () => BigInt(1 + (nextRand() % 30)));
      const stream = new XmasStream(values);
      const target = BigInt(2 + (nextRand() % 90));
      const expected = bruteForceFindWeakness(values, target);
      if (expected === null) {
        expect(() => findContiguousWeakness(stream, target)).toThrow('No contiguous range');
      } else {
        const found = findContiguousWeakness(stream, target);
        expect([found.startIndex, found.endIndex]).toEqual(expected);
        const slice = values.slice(expected[0], expected[1] + 1);
        const expectedMin = slice.reduce((a, b) => (a < b ? a : b));
        const expectedMax = slice.reduce((a, b) => (a > b ? a : b));
        expect(found.encryptionWeakness(stream)).toBe(expectedMin + expectedMax);
      }
    }
  });
});
