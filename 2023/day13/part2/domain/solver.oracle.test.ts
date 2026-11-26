import { describe, expect, it } from 'vitest';
import { findReflection, MirrorPattern, parseMirrorPatterns } from '../../shared';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  '#.##..##.\n..#.##.#.\n##......#\n##......#\n..#.##.#.\n..##..##.\n#.#.##.#.',
  '#...##..#\n#....#..#\n..##..###\n#####.##.\n#####.##.\n..##..###\n#....#..#',
].join('\n\n');

function isExactVerticalAxis(rows: readonly string[], axis: number): boolean {
  const width = rows[0]!.length;
  for (let off = 0; axis - 1 - off >= 0 && axis + off < width; off += 1) {
    for (let r = 0; r < rows.length; r += 1) {
      if (rows[r]![axis - 1 - off] !== rows[r]![axis + off]) return false;
    }
  }
  return true;
}

function isExactHorizontalAxis(rows: readonly string[], axis: number): boolean {
  const width = rows[0]!.length;
  for (let off = 0; axis - 1 - off >= 0 && axis + off < rows.length; off += 1) {
    for (let c = 0; c < width; c += 1) {
      if (rows[axis - 1 - off]![c] !== rows[axis + off]![c]) return false;
    }
  }
  return true;
}

function findExactAxes(rows: readonly string[]): string[] {
  const axes: string[] = [];
  for (let c = 1; c < rows[0]!.length; c += 1) {
    if (isExactVerticalAxis(rows, c)) axes.push(`V:${c}`);
  }
  for (let r = 1; r < rows.length; r += 1) {
    if (isExactHorizontalAxis(rows, r)) axes.push(`H:${r}`);
  }
  return axes;
}

function flipCell(rows: readonly string[], row: number, col: number): string[] {
  const next = [...rows];
  const line = next[row]!;
  next[row] = `${line.slice(0, col)}${line[col] === '#' ? '.' : '#'}${line.slice(col + 1)}`;
  return next;
}

function findOracleSmudgeAxes(rows: readonly string[]): string[] {
  const originalAxes = new Set(findExactAxes(rows));
  const discovered = new Set<string>();
  for (let r = 0; r < rows.length; r += 1) {
    for (let c = 0; c < rows[0]!.length; c += 1) {
      for (const axis of findExactAxes(flipCell(rows, r, c))) {
        if (!originalAxes.has(axis)) discovered.add(axis);
      }
    }
  }
  return [...discovered];
}

function bruteForceSmudgeAxis(rows: readonly string[]): number {
  const axes = findOracleSmudgeAxes(rows);
  if (axes.length !== 1) throw new Error(`Expected 1 smudge axis, got ${axes.length}`);
  const [kind, idxStr] = axes[0]!.split(':');
  return kind === 'H' ? Number(idxStr) * 100 : Number(idxStr);
}

function nextSeed(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

function buildPatternPair(
  h: number, w: number, vx: number, hy: number, flipRow: number, flipCol: number, seed: number,
): { rows: string[]; seed: number } {
  const grid: string[][] = [];
  for (let r = 0; r < h; r += 1) {
    const row: string[] = [];
    for (let c = 0; c < w; c += 1) {
      seed = nextSeed(seed);
      row.push(((seed >>> 16) & 1) === 0 ? '.' : '#');
    }
    grid.push(row);
  }
  for (let off = 0; hy - 1 - off >= 0 && hy + off < h; off += 1) grid[hy + off] = [...grid[hy - 1 - off]!];
  for (let r = 0; r < h; r += 1) {
    for (let off = 0; vx - 1 - off >= 0 && vx + off < w; off += 1) grid[r]![vx + off] = grid[r]![vx - 1 - off]!;
  }
  grid[flipRow]![flipCol] = grid[flipRow]![flipCol] === '#' ? '.' : '#';
  const rows: string[] = [];
  for (let r = 0; r < h; r += 1) rows.push(grid[r]!.join(''));
  return { rows, seed };
}

describe('Point of Incidence Part 2 single-cell-flip oracle', () => {
  it('matches official example (400) and confirms V5 stays valid on Pattern 1', () => {
    const patterns = parseMirrorPatterns(OFFICIAL_EXAMPLE);
    expect(findExactAxes(patterns[0]!.rows)).toEqual(['V:5']);
    expect(findExactAxes(flipCell([...patterns[0]!.rows], 0, 0))).toContain('V:5');
    expect(bruteForceSmudgeAxis(patterns[0]!.rows)).toBe(300);
    expect(bruteForceSmudgeAxis(patterns[1]!.rows)).toBe(100);
    expect(solver.solve(patterns)).toBe(400);
  });

  it('matches edge axes, overhang-preserving repairs, and A0-destroying repairs', () => {
    const cases: readonly (readonly string[])[] = [
      ['...#', '#.#.', '....'],
      ['#...', '.#.#', '....'],
      ['...#', '.#.#', '#..#'],
      ['#..#', '.#.#', '...#'],
      ['##.##', '..#.#'],
      ['#.#.', '#.#.', '..#.'],
    ];
    for (const rows of cases) {
      expect(solver.solve([new MirrorPattern(rows)])).toBe(bruteForceSmudgeAxis(rows));
    }
    expect(() => bruteForceSmudgeAxis(['#..#', '....'])).toThrow(Error);
    expect(() => solver.solve([new MirrorPattern(['#..#', '....'])])).toThrow(Error);
  });

  it('matches on wide 6x66 grid past 53-bit and 64-bit integer limits', () => {
    let seed = 1337;
    let rows: string[] = [];
    for (let i = 0; i < 40; i += 1) {
      const built = buildPatternPair(6, 66, 40, 3, 2, 0, seed);
      seed = built.seed;
      if (findExactAxes(built.rows).length === 1 && findOracleSmudgeAxes(built.rows).length === 1) {
        rows = built.rows;
        break;
      }
    }
    const pattern = new MirrorPattern(rows);
    expect(findReflection(pattern, 0).score).toBe(40);
    expect(solver.solve([pattern])).toBe(bruteForceSmudgeAxis(rows));
  });

  it('agrees across 60 seeded synthetic patterns with unique distinct A0 and A1', () => {
    let seed = 20231213;
    let verified = 0;
    for (let trial = 0; trial < 300 && verified < 60; trial += 1) {
      seed = nextSeed(seed);
      const h = 7 + ((seed >>> 16) % 4);
      seed = nextSeed(seed);
      const w = 7 + ((seed >>> 16) % 4);
      const vx = Math.floor(w / 2) + 1;
      const hy = 1 + ((seed >>> 8) % (h - 1));
      const built = buildPatternPair(h, w, vx, hy, hy - 1, 0, seed);
      seed = built.seed;
      const a0 = findExactAxes(built.rows);
      if (a0.length !== 1 || a0[0] !== `V:${vx}`) continue;
      if (findOracleSmudgeAxes(built.rows).join(',') !== `H:${hy}`) continue;
      expect(solver.solve([new MirrorPattern(built.rows)])).toBe(bruteForceSmudgeAxis(built.rows));
      verified += 1;
    }
    expect(verified).toBe(60);
  });
});
