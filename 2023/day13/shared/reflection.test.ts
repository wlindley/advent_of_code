import { describe, expect, it } from 'vitest';
import { MirrorPattern, parseMirrorPatterns } from './pattern';
import {
  findReflection,
  ReflectionMatch,
  summarizePatterns,
  validateTargetSmudges,
} from './reflection';

const OFFICIAL_EXAMPLE = [
  '#.##..##.',
  '..#.##.#.',
  '##......#',
  '##......#',
  '..#.##.#.',
  '..##..##.',
  '#.#.##.#.',
  '',
  '#...##..#',
  '#....#..#',
  '..##..###',
  '#####.##.',
  '#####.##.',
  '..##..###',
  '#....#..#',
].join('\n');

describe('ReflectionMatch', () => {
  it('validates axis index, deep-freezes mismatches, and computes score and smudgeCount', () => {
    const match = new ReflectionMatch('horizontal', 3, [
      { near: { row: 0, col: 0 }, far: { row: 5, col: 0 } },
    ]);

    expect(Object.isFrozen(match)).toBe(true);
    expect(Object.isFrozen(match.mismatches)).toBe(true);
    expect(Object.isFrozen(match.mismatches[0])).toBe(true);
    expect(Object.isFrozen(match.mismatches[0]!.near)).toBe(true);
    expect(match.score).toBe(300);
    expect(match.smudgeCount).toBe(1);
    expect(() => new ReflectionMatch('vertical', 0, [])).toThrow(RangeError);
    expect(() => new ReflectionMatch('vertical', -2, [])).toThrow(RangeError);
    expect(() => new ReflectionMatch('vertical', 1.5, [])).toThrow(RangeError);
  });

  it('computes mirrored coordinates or null on overhang for vertical and horizontal axes', () => {
    const pattern = parseMirrorPatterns(OFFICIAL_EXAMPLE)[0]!;
    const vert = new ReflectionMatch('vertical', 5, []);
    const vertLeft = new ReflectionMatch('vertical', 2, []);
    const horiz = new ReflectionMatch('horizontal', 4, []);
    const horizTop = new ReflectionMatch('horizontal', 2, []);

    expect(vert.mirrorOf(1, 4, pattern)).toEqual({ row: 1, col: 5 });
    expect(vert.mirrorOf(1, 0, pattern)).toBeNull();
    expect(vertLeft.mirrorOf(1, 4, pattern)).toBeNull();
    expect(horiz.mirrorOf(3, 2, pattern)).toEqual({ row: 4, col: 2 });
    expect(horiz.mirrorOf(0, 2, pattern)).toBeNull();
    expect(horizTop.mirrorOf(4, 2, pattern)).toBeNull();
  });
});

describe('findReflection and summarizePatterns', () => {
  it('solves official examples for 0 and 1 target smudges', () => {
    const patterns = parseMirrorPatterns(OFFICIAL_EXAMPLE);
    const m0 = findReflection(patterns[0]!, 0);
    const m1 = findReflection(patterns[1]!, 0);
    const s0 = findReflection(patterns[0]!, 1);
    const s1 = findReflection(patterns[1]!, 1);

    expect([m0.orientation, m0.index, m0.score, m0.smudgeCount]).toEqual(['vertical', 5, 5, 0]);
    expect([m1.orientation, m1.index, m1.score, m1.smudgeCount]).toEqual(['horizontal', 4, 400, 0]);
    expect(s0.mismatches).toEqual([{ near: { row: 0, col: 0 }, far: { row: 5, col: 0 } }]);
    expect([s0.orientation, s0.index, s0.score]).toEqual(['horizontal', 3, 300]);
    expect([s1.orientation, s1.index, s1.score]).toEqual(['horizontal', 1, 100]);
    expect(summarizePatterns(patterns, 0)).toBe(405);
    expect(summarizePatterns(patterns, 1)).toBe(400);
  });

  it('finds vertical smudge-1, multi-smudge on one pair, and edge-axis 1x2 / 2x1 patterns', () => {
    const vertSmudge = new MirrorPattern(['#..#', '.##.', '#.##']);
    const vMatch = findReflection(vertSmudge, 1);
    expect([vMatch.orientation, vMatch.index]).toEqual(['vertical', 2]);
    expect(vMatch.mismatches).toEqual([{ near: { row: 2, col: 1 }, far: { row: 2, col: 2 } }]);

    const twoSmudgeSamePair = new MirrorPattern(['##.', '...']);
    const multiMatch = findReflection(twoSmudgeSamePair, 2);
    expect([multiMatch.orientation, multiMatch.index, multiMatch.smudgeCount]).toEqual(['horizontal', 1, 2]);
    expect(multiMatch.mismatches).toEqual([
      { near: { row: 0, col: 0 }, far: { row: 1, col: 0 } },
      { near: { row: 0, col: 1 }, far: { row: 1, col: 1 } },
    ]);

    expect(findReflection(new MirrorPattern(['..']), 0).score).toBe(1);
    expect(findReflection(new MirrorPattern(['#', '#']), 0).score).toBe(100);
  });

  it('rejects 1x1, non-reflective, ambiguous patterns, and invalid targetSmudges', () => {
    expect(() => findReflection(new MirrorPattern(['.']), 0)).toThrow(Error);
    expect(() => findReflection(new MirrorPattern(['#.#', '.#.', '..#']), 0)).toThrow(Error);
    expect(() => findReflection(new MirrorPattern(['##', '##']), 0)).toThrow(Error);
    expect(() => findReflection(new MirrorPattern(['....']), 0)).toThrow(Error);
    expect(summarizePatterns([], 0)).toBe(0);
    expect(() => summarizePatterns([], -1)).toThrow(RangeError);
    expect(() => validateTargetSmudges(1.2)).toThrow(RangeError);
  });
});
