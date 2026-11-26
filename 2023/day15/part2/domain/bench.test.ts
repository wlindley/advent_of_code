import { describe, expect, it } from 'vitest';
import {
  assertValidFocalLength,
  assertValidLensLabel,
  LensBoxSnapshot,
  LensEntry,
  OpticalBench,
} from './bench';

describe('assertValidLensLabel', () => {
  it('accepts single and multi-character ASCII letter labels', () => {
    expect(() => assertValidLensLabel('a')).not.toThrow();
    expect(() => assertValidLensLabel('rn')).not.toThrow();
    expect(() => assertValidLensLabel('ABcdZ')).not.toThrow();
  });

  it('rejects empty string', () => {
    expect(() => assertValidLensLabel('')).toThrow(RangeError);
  });

  it('rejects digits in label', () => {
    expect(() => assertValidLensLabel('rn1')).toThrow(RangeError);
  });

  it('rejects punctuation or whitespace in label', () => {
    expect(() => assertValidLensLabel('rn-')).toThrow(RangeError);
    expect(() => assertValidLensLabel('rn ')).toThrow(RangeError);
    expect(() => assertValidLensLabel('rn_a')).toThrow(RangeError);
  });
});

describe('assertValidFocalLength', () => {
  it('accepts boundary integers 1 and 9', () => {
    expect(() => assertValidFocalLength(1)).not.toThrow();
    expect(() => assertValidFocalLength(9)).not.toThrow();
  });

  it('rejects 0 and negative integers', () => {
    expect(() => assertValidFocalLength(0)).toThrow(RangeError);
    expect(() => assertValidFocalLength(-1)).toThrow(RangeError);
  });

  it('rejects values above 9 and non-integers', () => {
    expect(() => assertValidFocalLength(10)).toThrow(RangeError);
    expect(() => assertValidFocalLength(3.5)).toThrow(RangeError);
    expect(() => assertValidFocalLength(Number.NaN)).toThrow(RangeError);
  });
});

describe('LensEntry', () => {
  it('stores frozen label and focalLength', () => {
    const entry = new LensEntry('qp', 3);
    expect(entry.label).toBe('qp');
    expect(entry.focalLength).toBe(3);
    expect(Object.isFrozen(entry)).toBe(true);
  });

  it('validates label and focalLength in constructor', () => {
    expect(() => new LensEntry('', 2)).toThrow(RangeError);
    expect(() => new LensEntry('qp', 0)).toThrow(RangeError);
  });
});

describe('LensBoxSnapshot', () => {
  it('computes focusingPower dynamically at box 0 and box 255 boundaries', () => {
    const box0 = new LensBoxSnapshot(0, [new LensEntry('rn', 1), new LensEntry('cm', 2)]);
    expect(box0.boxIndex).toBe(0);
    expect(box0.focusingPower).toBe(1 * 1 * 1 + 1 * 2 * 2);
    expect(Object.isFrozen(box0)).toBe(true);
    expect(Object.isFrozen(box0.lenses)).toBe(true);

    const box255 = new LensBoxSnapshot(255, [new LensEntry('zz', 9)]);
    expect(box255.focusingPower).toBe(256 * 1 * 9);
  });

  it('supports empty snapshot with zero focusingPower', () => {
    const empty = new LensBoxSnapshot(3, []);
    expect(empty.focusingPower).toBe(0);
  });

  it('rejects out-of-range or non-integer boxIndex', () => {
    expect(() => new LensBoxSnapshot(-1, [])).toThrow(RangeError);
    expect(() => new LensBoxSnapshot(256, [])).toThrow(RangeError);
    expect(() => new LensBoxSnapshot(1.5, [])).toThrow(RangeError);
  });

  it('rejects duplicate lens labels within a box snapshot', () => {
    expect(
      () => new LensBoxSnapshot(0, [new LensEntry('rn', 1), new LensEntry('rn', 4)]),
    ).toThrow(RangeError);
  });
});

describe('OpticalBench', () => {
  it('starts empty with zero counts and zero focusingPower', () => {
    const bench = new OpticalBench();
    expect(bench.occupiedBoxCount).toBe(0);
    expect(bench.totalLensCount).toBe(0);
    expect(bench.focusingPower).toBe(0);
    expect(bench.snapshotOccupiedBoxes()).toEqual([]);
  });

  it('inserts into empty and non-empty box and replaces first, middle, and last in place', () => {
    const bench = new OpticalBench();
    // 'ab' -> hash 3, 'pc' -> hash 3, 'ot' -> hash 3
    expect(bench.upsert('pc', 4)).toEqual({ kind: 'inserted', slot: 0 });
    expect(bench.upsert('ot', 9)).toEqual({ kind: 'inserted', slot: 1 });
    expect(bench.upsert('ab', 5)).toEqual({ kind: 'inserted', slot: 2 });
    expect(bench.occupiedBoxCount).toBe(1);
    expect(bench.totalLensCount).toBe(3);

    expect(bench.upsert('pc', 6)).toEqual({ kind: 'replaced', slot: 0, previousFocalLength: 4 });
    expect(bench.upsert('ot', 7)).toEqual({ kind: 'replaced', slot: 1, previousFocalLength: 9 });
    expect(bench.upsert('ab', 5)).toEqual({ kind: 'replaced', slot: 2, previousFocalLength: 5 });

    const [box3] = bench.snapshotOccupiedBoxes();
    expect(box3?.boxIndex).toBe(3);
    expect(box3?.lenses.map((l) => [l.label, l.focalLength])).toEqual([
      ['pc', 6],
      ['ot', 7],
      ['ab', 5],
    ]);
  });

  it('removes first, middle, and last lenses while shifting trailing slots and returning noop when absent', () => {
    const bench = new OpticalBench();
    // remove from empty box
    expect(bench.remove('cm')).toEqual({ kind: 'noop' });

    bench.upsert('pc', 4);
    bench.upsert('ot', 9);
    bench.upsert('ab', 5);
    // remove absent label from non-empty box 3
    expect(bench.remove('zz')).toEqual({ kind: 'noop' });

    // remove middle
    expect(bench.remove('ot')).toEqual({ kind: 'removed', slot: 1, previousFocalLength: 9 });
    // remove first
    expect(bench.remove('pc')).toEqual({ kind: 'removed', slot: 0, previousFocalLength: 4 });
    // re-insert 'pc' goes to back (slot 1 after 'ab')
    expect(bench.upsert('pc', 8)).toEqual({ kind: 'inserted', slot: 1 });
    // remove last
    expect(bench.remove('pc')).toEqual({ kind: 'removed', slot: 1, previousFocalLength: 8 });
    // remove remaining
    expect(bench.remove('ab')).toEqual({ kind: 'removed', slot: 0, previousFocalLength: 5 });

    expect(bench.occupiedBoxCount).toBe(0);
    expect(bench.totalLensCount).toBe(0);
    expect(bench.focusingPower).toBe(0);
    expect(bench.snapshotOccupiedBoxes()).toEqual([]);
  });

  it('returns isolated immutable snapshots unaffected by subsequent bench mutations', () => {
    const bench = new OpticalBench();
    bench.upsert('rn', 1);
    const snap1 = bench.snapshotOccupiedBoxes();
    bench.upsert('cm', 2);
    bench.upsert('rn', 9);

    expect(snap1).toHaveLength(1);
    expect(snap1[0]?.lenses).toHaveLength(1);
    expect(snap1[0]?.lenses[0]?.focalLength).toBe(1);
    expect(bench.focusingPower).toBe(1 * 1 * 9 + 1 * 2 * 2);
  });

  it('rejects invalid labels and focal lengths on bench operations', () => {
    const bench = new OpticalBench();
    expect(() => bench.upsert('12', 3)).toThrow(RangeError);
    expect(() => bench.upsert('rn', 0)).toThrow(RangeError);
    expect(() => bench.remove('rn=')).toThrow(RangeError);
  });
});
