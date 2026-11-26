import { describe, expect, it } from 'vitest';
import {
  TumblerInventory,
  TumblerSchematic,
  parseSchematics,
} from './schematic';

const OFFICIAL_EXAMPLE = [
  '#####\n.####\n.####\n.####\n.#.#.\n.#...\n.....',
  '#####\n##.##\n.#.##\n...##\n...#.\n...#.\n.....',
  '.....\n#....\n#....\n#...#\n#.#.#\n#.###\n#####',
  '.....\n.....\n#.#..\n###..\n###.#\n###.#\n#####',
  '.....\n.....\n.....\n#....\n#.#..\n#.#.#\n#####',
].join('\n\n');

describe('TumblerSchematic', () => {
  it('exposes dimensions, pin profile, immutability, and fit checks', () => {
    const lock = new TumblerSchematic('L1', 'lock', 7, [0, 5, 3, 4, 3]);
    const keyFit = new TumblerSchematic('K1', 'key', 7, [3, 0, 2, 0, 1]);
    const keyOverlap = new TumblerSchematic('K2', 'key', 7, [5, 0, 2, 1, 3]);

    expect(lock.width).toBe(5);
    expect(lock.maxPinHeight).toBe(5);
    expect(lock.profileLabel).toBe('0,5,3,4,3');
    expect(Object.isFrozen(lock)).toBe(true);
    expect(Object.isFrozen(lock.heights)).toBe(true);
    expect(lock.fitsWith(keyFit)).toBe(true);
    expect(lock.fitsWith(keyOverlap)).toBe(false);
  });

  it('rejects invalid schematic construction and mismatched comparisons', () => {
    expect(() => new TumblerSchematic(' ', 'lock', 7, [0])).toThrow(RangeError);
    expect(() => new TumblerSchematic('L1', 'lock', 1, [0])).toThrow(RangeError);
    expect(() => new TumblerSchematic('L1', 'lock', 3.5, [0])).toThrow(RangeError);
    expect(() => new TumblerSchematic('L1', 'lock', 7, [])).toThrow(RangeError);
    expect(() => new TumblerSchematic('L1', 'lock', 7, [6])).toThrow(RangeError);
    expect(() => new TumblerSchematic('L1', 'lock', 7, [-1])).toThrow(RangeError);
    expect(() => new TumblerSchematic('L1', 'lock', 7, [1.5])).toThrow(RangeError);

    const lock = new TumblerSchematic('L1', 'lock', 7, [0, 1]);
    const lock2 = new TumblerSchematic('L2', 'lock', 7, [0, 1]);
    const keyWide = new TumblerSchematic('K1', 'key', 7, [0, 1, 2]);
    const keyTall = new TumblerSchematic('K2', 'key', 8, [0, 1]);
    expect(() => lock.fitsWith(lock2)).toThrow('same kind');
    expect(() => lock.fitsWith(keyWide)).toThrow(RangeError);
    expect(() => lock.fitsWith(keyTall)).toThrow(RangeError);
  });
});

describe('TumblerInventory', () => {
  it('validates dimensions, kinds, and computes dynamic counts', () => {
    const lock = new TumblerSchematic('L1', 'lock', 7, [1, 2]);
    const key = new TumblerSchematic('K1', 'key', 7, [3, 1]);
    const inv = new TumblerInventory(2, 7, [lock], [key]);

    expect(inv.maxPinHeight).toBe(5);
    expect(inv.totalSchematics).toBe(2);
    expect(inv.totalPairs).toBe(1);
    expect(Object.isFrozen(inv)).toBe(true);

    expect(() => new TumblerInventory(0, 7, [], [])).toThrow(RangeError);
    expect(() => new TumblerInventory(1.5, 7, [], [])).toThrow(RangeError);
    expect(() => new TumblerInventory(2, 1, [], [])).toThrow(RangeError);
    expect(() => new TumblerInventory(2, 2.5, [], [])).toThrow(RangeError);
    expect(() => new TumblerInventory(2, 7, [key], [])).toThrow('Expected lock');
    expect(() => new TumblerInventory(2, 7, [], [lock])).toThrow('Expected key');

    const badWidth = new TumblerSchematic('L2', 'lock', 7, [1]);
    const badHeight = new TumblerSchematic('K2', 'key', 8, [1, 2]);
    expect(() => new TumblerInventory(2, 7, [badWidth], [])).toThrow(RangeError);
    expect(() => new TumblerInventory(2, 7, [], [badHeight])).toThrow(RangeError);
  });
});

describe('parseSchematics', () => {
  it('parses official example, CRLF line endings, and minimal H=2 schematics', () => {
    const inv = parseSchematics(OFFICIAL_EXAMPLE.replace(/\n/g, '\r\n'));
    expect(inv.width).toBe(5);
    expect(inv.height).toBe(7);
    expect(inv.locks.map((l) => [l.id, l.heights])).toEqual([
      ['L1', [0, 5, 3, 4, 3]],
      ['L2', [1, 2, 0, 5, 3]],
    ]);
    expect(inv.keys.map((k) => [k.id, k.heights])).toEqual([
      ['K1', [5, 0, 2, 1, 3]],
      ['K2', [4, 3, 4, 0, 2]],
      ['K3', [3, 0, 2, 0, 1]],
    ]);

    const minH2 = parseSchematics('###\n...\n\n...\n###');
    expect(minH2.maxPinHeight).toBe(0);
    expect(minH2.locks[0]!.heights).toEqual([0, 0, 0]);
    expect(minH2.keys[0]!.heights).toEqual([0, 0, 0]);
    expect(minH2.locks[0]!.fitsWith(minH2.keys[0]!)).toBe(true);
  });

  it('rejects empty, malformed, non-contiguous, and mismatched blocks', () => {
    expect(() => parseSchematics('  \r\n  ')).toThrow(RangeError);
    expect(() => parseSchematics('#####')).toThrow('at least 2 rows');
    expect(() => parseSchematics('###\n..')).toThrow('Invalid row');
    expect(() => parseSchematics('#?#\n...')).toThrow('Invalid row');
    expect(() => parseSchematics('###\n###')).toThrow('opposite edge');
    expect(() => parseSchematics('...\n...')).toThrow('opposite edge');
    expect(() => parseSchematics('###\n.#.\n#.#\n...')).toThrow('Non-contiguous');
    expect(() => parseSchematics('...\n#.#\n.#.\n###')).toThrow('Non-contiguous');
    expect(() => parseSchematics('##\n..\n\n...\n###')).toThrow(RangeError);
    expect(() => parseSchematics('##\n#.\n..\n\n..\n##')).toThrow(RangeError);
  });
});
