import { describe, expect, it } from 'vitest';
import {
  CaveSystem,
  classifyCave,
  END_CAVE,
  findRevisitedSmallCave,
  START_CAVE,
} from './cave';

describe('classifyCave', () => {
  it('classifies start, end, big, and small caves', () => {
    expect(classifyCave(START_CAVE)).toBe('start');
    expect(classifyCave(END_CAVE)).toBe('end');
    expect(classifyCave('A')).toBe('big');
    expect(classifyCave('HN')).toBe('big');
    expect(classifyCave('b')).toBe('small');
    expect(classifyCave('dc')).toBe('small');
  });

  it('rejects empty, mixed-case, numeric, or punctuation cave names', () => {
    for (const invalid of ['', 'Ab', 'a1', 'a-b', '__proto__']) {
      expect(() => classifyCave(invalid)).toThrow();
    }
  });
});

describe('findRevisitedSmallCave', () => {
  it('returns null when no small cave is visited twice and ignores start, end, and big caves', () => {
    expect(findRevisitedSmallCave(['start', 'A', 'b', 'A', 'c', 'end'])).toBeNull();
  });

  it('returns the first small cave visited at least twice', () => {
    expect(findRevisitedSmallCave(['start', 'A', 'b', 'A', 'b', 'c', 'c', 'end'])).toBe('b');
  });
});

describe('CaveSystem', () => {
  it('canonicalizes, sorts, and freezes caves, edges, and neighbors', () => {
    const system = new CaveSystem([
      { a: 'end', b: 'A' },
      { a: 'b', b: 'start' },
      { a: 'A', b: 'b' },
    ]);

    expect(system.caves).toEqual(['A', 'b', 'end', 'start']);
    expect(system.edges).toEqual([
      { a: 'A', b: 'b' },
      { a: 'A', b: 'end' },
      { a: 'b', b: 'start' },
    ]);
    expect(system.neighborsOf('A')).toEqual(['b', 'end']);
    expect(system.neighborsOf('b')).toEqual(['A', 'start']);
    expect(Object.isFrozen(system.caves)).toBe(true);
    expect(Object.isFrozen(system.edges)).toBe(true);
    expect(Object.isFrozen(system.neighborsOf('A'))).toBe(true);
  });

  it('sorts multiple canonical edges sharing the same left endpoint', () => {
    const system = new CaveSystem([
      { a: 'a', b: 'end' },
      { a: 'z', b: 'start' },
      { a: 'start', b: 'end' },
      { a: 'a', b: 'start' },
      { a: 'a', b: 'b' },
      { a: 'b', b: 'start' },
    ]);

    expect(system.edges).toEqual([
      { a: 'a', b: 'b' },
      { a: 'a', b: 'end' },
      { a: 'a', b: 'start' },
      { a: 'b', b: 'start' },
      { a: 'end', b: 'start' },
      { a: 'start', b: 'z' },
    ]);
  });

  it('handles JavaScript Object prototype names safely via Map and Set', () => {
    const system = new CaveSystem([
      { a: 'start', b: 'constructor' },
      { a: 'constructor', b: 'end' },
    ]);

    expect(system.neighborsOf('constructor')).toEqual(['end', 'start']);
  });

  it('throws on unknown cave in neighborsOf', () => {
    const system = new CaveSystem([{ a: 'start', b: 'end' }]);
    expect(() => system.neighborsOf('missing')).toThrow(/Unknown cave/);
  });

  it('rejects self-loops, duplicates, big-big edges, invalid names, and missing endpoints', () => {
    expect(() => new CaveSystem([{ a: 'start', b: 'start' }])).toThrow(/Self-loop/);
    expect(
      () =>
        new CaveSystem([
          { a: 'start', b: 'end' },
          { a: 'end', b: 'start' },
        ]),
    ).toThrow(/Duplicate edge/);
    expect(
      () =>
        new CaveSystem([
          { a: 'start', b: 'A' },
          { a: 'A', b: 'B' },
          { a: 'B', b: 'end' },
        ]),
    ).toThrow(/Big-to-big/);
    expect(() => new CaveSystem([{ a: 'start', b: 'bad1' }])).toThrow();
    expect(() => new CaveSystem([{ a: 'start', b: 'a' }])).toThrow(/both "start" and "end"/);
    expect(() => new CaveSystem([{ a: 'a', b: 'end' }])).toThrow(/both "start" and "end"/);
  });
});
