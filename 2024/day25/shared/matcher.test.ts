import { describe, expect, it } from 'vitest';
import { TumblerSchematic, parseSchematics } from './schematic';
import {
  PairFitEvaluation,
  countFittingPairs,
  evaluatePairFit,
} from './matcher';

const EXAMPLE = [
  '#####\n.####\n.####\n.####\n.#.#.\n.#...\n.....',
  '#####\n##.##\n.#.##\n...##\n...#.\n...#.\n.....',
  '.....\n#....\n#....\n#...#\n#.#.#\n#.###\n#####',
  '.....\n.....\n#.#..\n###..\n###.#\n###.#\n#####',
  '.....\n.....\n.....\n#....\n#.#..\n#.#.#\n#####',
].join('\n\n');

describe('PairFitEvaluation', () => {
  it('computes column sums, clearances, collisions, and fit status dynamically', () => {
    const lock = new TumblerSchematic('L1', 'lock', 7, [0, 5, 3, 4, 3]);
    const keyBad = new TumblerSchematic('K1', 'key', 7, [5, 0, 2, 1, 3]);
    const keyGood = new TumblerSchematic('K3', 'key', 7, [3, 0, 2, 0, 1]);

    const badEval = new PairFitEvaluation(lock, keyBad, 0, 0);
    expect(Object.isFrozen(badEval)).toBe(true);
    expect(badEval.maxPinHeight).toBe(5);
    expect(badEval.columnSums).toEqual([5, 5, 5, 5, 6]);
    expect(badEval.columnClearances).toEqual([0, 0, 0, 0, -1]);
    expect(badEval.collidingColumns).toEqual([4]);
    expect(badEval.fits).toBe(false);

    const goodEval = new PairFitEvaluation(lock, keyGood, 0, 2);
    expect(goodEval.columnSums).toEqual([3, 5, 5, 4, 4]);
    expect(goodEval.columnClearances).toEqual([2, 0, 0, 1, 1]);
    expect(goodEval.collidingColumns).toEqual([]);
    expect(goodEval.fits).toBe(true);
  });

  it('rejects invalid kinds, dimension mismatches, and negative or non-integer indices', () => {
    const lock = new TumblerSchematic('L1', 'lock', 7, [0, 1]);
    const key = new TumblerSchematic('K1', 'key', 7, [0, 1]);
    const keyWide = new TumblerSchematic('K2', 'key', 7, [0, 1, 2]);
    const keyTall = new TumblerSchematic('K3', 'key', 8, [0, 1]);

    expect(() => new PairFitEvaluation(key, key, 0, 0)).toThrow('Expected lock');
    expect(() => new PairFitEvaluation(lock, lock, 0, 0)).toThrow('Expected key');
    expect(() => new PairFitEvaluation(lock, keyWide, 0, 0)).toThrow(RangeError);
    expect(() => new PairFitEvaluation(lock, keyTall, 0, 0)).toThrow(RangeError);
    expect(() => new PairFitEvaluation(lock, key, -1, 0)).toThrow(RangeError);
    expect(() => new PairFitEvaluation(lock, key, 0.5, 0)).toThrow(RangeError);
    expect(() => new PairFitEvaluation(lock, key, 0, -1)).toThrow(RangeError);
    expect(() => new PairFitEvaluation(lock, key, 0, 1.5)).toThrow(RangeError);
  });
});

describe('evaluatePairFit & countFittingPairs', () => {
  it('evaluates valid pairs, rejects out-of-bounds indices, and counts example fits', () => {
    const inv = parseSchematics(EXAMPLE);
    expect(countFittingPairs(inv)).toBe(3);

    const eval02 = evaluatePairFit(inv, 0, 2);
    expect(eval02.fits).toBe(true);
    expect(eval02.lock.id).toBe('L1');
    expect(eval02.key.id).toBe('K3');

    expect(() => evaluatePairFit(inv, -1, 0)).toThrow(RangeError);
    expect(() => evaluatePairFit(inv, 2, 0)).toThrow(RangeError);
    expect(() => evaluatePairFit(inv, 0.5, 0)).toThrow(RangeError);
    expect(() => evaluatePairFit(inv, 0, -1)).toThrow(RangeError);
    expect(() => evaluatePairFit(inv, 0, 3)).toThrow(RangeError);
    expect(() => evaluatePairFit(inv, 0, 0.5)).toThrow(RangeError);
  });
});
