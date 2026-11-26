import { describe, expect, it } from 'vitest';
import { findReflection, MirrorPattern, parseMirrorPatterns } from '../../shared';

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

function countRawVerticalSmudges(rows: readonly string[], axis: number): number {
  const width = rows[0]!.length;
  let smudges = 0;
  for (let offset = 0; axis - 1 - offset >= 0 && axis + offset < width; offset += 1) {
    const left = axis - 1 - offset;
    const right = axis + offset;
    for (let r = 0; r < rows.length; r += 1) {
      if (rows[r]![left] !== rows[r]![right]) smudges += 1;
    }
  }
  return smudges;
}

function countRawHorizontalSmudges(rows: readonly string[], axis: number): number {
  const width = rows[0]!.length;
  let smudges = 0;
  for (let offset = 0; axis - 1 - offset >= 0 && axis + offset < rows.length; offset += 1) {
    const top = axis - 1 - offset;
    const bottom = axis + offset;
    for (let c = 0; c < width; c += 1) {
      if (rows[top]![c] !== rows[bottom]![c]) smudges += 1;
    }
  }
  return smudges;
}

function oracleFindScores(rows: readonly string[], targetSmudges: number): number[] {
  const scores: number[] = [];
  for (let c = 1; c < rows[0]!.length; c += 1) {
    if (countRawVerticalSmudges(rows, c) === targetSmudges) scores.push(c);
  }
  for (let r = 1; r < rows.length; r += 1) {
    if (countRawHorizontalSmudges(rows, r) === targetSmudges) scores.push(r * 100);
  }
  return scores;
}

function nextSeed(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

function buildSymmetricRows(
  height: number,
  width: number,
  vertical: boolean,
  axis: number,
  initialSeed: number,
): { rows: string[]; seed: number } {
  let seed = initialSeed;
  const grid: string[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => {
      seed = nextSeed(seed);
      return ((seed >>> 16) & 1) === 0 ? '.' : '#';
    }),
  );
  if (vertical) {
    for (let r = 0; r < height; r += 1) {
      for (let off = 0; axis - 1 - off >= 0 && axis + off < width; off += 1) {
        grid[r]![axis + off] = grid[r]![axis - 1 - off]!;
      }
    }
  } else {
    for (let off = 0; axis - 1 - off >= 0 && axis + off < height; off += 1) {
      grid[axis + off] = [...grid[axis - 1 - off]!];
    }
  }
  return { rows: grid.map((line) => line.join('')), seed };
}

describe('Point of Incidence differential oracle (raw cell scanner vs bitmask solver)', () => {
  it('matches official examples for 0 and 1 smudges and edge axes', () => {
    const patterns = [
      ...parseMirrorPatterns(OFFICIAL_EXAMPLE),
      new MirrorPattern(['.#..', '.#..']),
      new MirrorPattern(['..#', '..#', '###']),
    ];
    for (const pattern of patterns) {
      for (const smudges of [0, 1]) {
        const expected = oracleFindScores(pattern.rows, smudges);
        if (expected.length === 1) {
          expect(findReflection(pattern, smudges).score).toBe(expected[0]);
        } else {
          expect(() => findReflection(pattern, smudges)).toThrow();
        }
      }
    }
  });

  it('matches on wide 40x70 and 70x40 grids past 64-bit boundaries', () => {
    const wide = buildSymmetricRows(40, 70, false, 19, 1337).rows;
    const tall = buildSymmetricRows(70, 40, true, 17, 4242).rows;

    for (const rows of [wide, tall]) {
      const pattern = new MirrorPattern(rows);
      expect(findReflection(pattern, 0).score).toBe(oracleFindScores(rows, 0)[0]);
    }
  });

  it('agrees across 64 seeded synthetic patterns for 0 and 1 smudges', () => {
    let seed = 20231213;
    let verified = 0;
    for (let trial = 0; trial < 200 && verified < 64; trial += 1) {
      seed = nextSeed(seed);
      const height = 5 + ((seed >>> 16) % 7);
      seed = nextSeed(seed);
      const width = 5 + ((seed >>> 16) % 7);
      const vertical = (trial & 1) === 0;
      const axis = 1 + ((seed >>> 8) % ((vertical ? width : height) - 1));
      const built = buildSymmetricRows(height, width, vertical, axis, seed);
      seed = built.seed;
      const expectedZero = oracleFindScores(built.rows, 0);
      if (expectedZero.length !== 1) continue;

      const pattern = new MirrorPattern(built.rows);
      expect(findReflection(pattern, 0).score).toBe(expectedZero[0]);
      const expectedOne = oracleFindScores(built.rows, 1);
      if (expectedOne.length === 1) {
        expect(findReflection(pattern, 1).score).toBe(expectedOne[0]);
      } else {
        expect(() => findReflection(pattern, 1)).toThrow();
      }
      verified += 1;
    }
    expect(verified).toBe(64);
  });
});
