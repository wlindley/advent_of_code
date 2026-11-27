import { describe, expect, it } from 'vitest';
import { ALL_FOLDS_CODE_POLICY, CANONICAL_GLYPHS } from '../../shared';
import { solver } from './index';

const EXAMPLE_INPUT = '0,0\n0,12\n3,0\n16,1\n3,11\n0,2\n15,10\n2,10\n13,2\n0,9\n13,9\n0,4\n3,8\n16,7\n3,5\n11,0\n6,0\n10,0\n9,12\n6,11\n10,2\n6,3\n10,8\n5,7\n10,7\n7,5\n\nfold along y=6\nfold along x=8';
const PART1_5X5_EXAMPLE = '6,10\n0,14\n9,10\n0,3\n10,4\n4,11\n6,0\n6,12\n4,1\n0,13\n10,12\n3,4\n3,0\n8,4\n1,10\n2,14\n8,10\n9,0\n\nfold along y=7\nfold along x=5';

const MULTI_FOLDS = [
  { axis: 'x', value: 163 }, { axis: 'y', value: 55 }, { axis: 'x', value: 81 }, { axis: 'y', value: 27 },
  { axis: 'x', value: 40 }, { axis: 'y', value: 13 }, { axis: 'y', value: 6 },
] as const;

const GLYPH_MAP = new Map<string, string>();
for (const g of CANONICAL_GLYPHS) GLYPH_MAP.set(g.rows.join('\n'), g.letter);

function selectGlyph(letter: string, centeredI: boolean, index: number): readonly string[] {
  for (const g of CANONICAL_GLYPHS) {
    if (g.letter === letter && !(centeredI && index === 0 && letter === 'I' && g.rows[0] !== '.###.')) return g.rows;
  }
  throw new Error(`Missing glyph ${letter}`);
}

function wordToDots(word: string, centeredI: boolean): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < word.length; i += 1) {
    const rows = selectGlyph(word[i]!, centeredI, i);
    for (let r = 0; r < rows.length; r += 1) {
      for (let c = 0; c < rows[r]!.length; c += 1) {
        if (rows[r]![c] === '#') pts.push({ x: i * 5 + c, y: r });
      }
    }
  }
  return pts;
}

function unfoldWord(word: string, folds: readonly { readonly axis: 'x' | 'y'; readonly value: number }[], centeredI = false): string {
  let pts = wordToDots(word, centeredI);
  for (let f = folds.length - 1; f >= 0; f -= 1) {
    const fold = folds[f]!;
    const next: { x: number; y: number }[] = [];
    for (let idx = 0; idx < pts.length; idx += 1) {
      const p = pts[idx]!;
      const mirrored = fold.axis === 'x' ? { x: 2 * fold.value - p.x, y: p.y } : { x: p.x, y: 2 * fold.value - p.y };
      const keep = (idx + f) % 2 === 0;
      next.push(keep ? p : mirrored);
      if ((idx + f) % 7 === 0 && next.length < 300) next.push(keep ? mirrored : p);
    }
    pts = next;
  }
  const lines: string[] = [];
  for (const p of pts) lines.push(`${p.x},${p.y}`);
  for (let i = 0; i < folds.length; i += 1) {
    lines.push(i === 0 ? `\nfold along ${folds[i]!.axis}=${folds[i]!.value}` : `fold along ${folds[i]!.axis}=${folds[i]!.value}`);
  }
  return lines.join('\n');
}

function decodeOracleOrigin(points: ReadonlySet<string>, originX: number, originY: number, maxX: number): string | null {
  let word = '';
  for (let x0 = originX; x0 <= maxX; x0 += 5) {
    const rows: string[] = [];
    for (let dy = 0; dy < 6; dy += 1) {
      let row = '';
      for (let dx = 0; dx < 5; dx += 1) row += points.has(`${x0 + dx},${originY + dy}`) ? '#' : '.';
      rows.push(row);
    }
    const letter = GLYPH_MAP.get(rows.join('\n'));
    if (!letter) return null;
    word += letter;
  }
  return word;
}

function oracleSolvePart2(raw: string): string {
  const [dotsSec, foldsSec] = raw.trim().split(/\n\s*\n/) as [string, string];
  let points = new Set(dotsSec.split('\n'));
  for (const line of foldsSec.split('\n')) {
    const [, axis, v] = /^fold along ([xy])=(\d+)$/.exec(line)!;
    const k = Number(v);
    const next = new Set<string>();
    for (const pt of points) {
      const [xs, ys] = pt.split(',');
      const x = Number(xs), y = Number(ys);
      next.add(`${axis === 'x' && x > k ? 2 * k - x : x},${axis === 'y' && y > k ? 2 * k - y : y}`);
    }
    points = next;
  }
  let minX = Infinity, maxX = -Infinity, minY = Infinity;
  for (const pt of points) {
    const [xs, ys] = pt.split(',');
    const x = Number(xs), y = Number(ys);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
  }
  return decodeOracleOrigin(points, minX, minY, maxX) ?? decodeOracleOrigin(points, minX - 1, minY, maxX) ?? '';
}

describe('2021 Day 13 Part 2 solver', () => {
  it('solves and traces the 26-dot 2-fold HI example in agreement with the oracle', () => {
    expect(solver.policy).toBe(ALL_FOLDS_CODE_POLICY);
    const manual = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(manual)).toBe('HI');
    expect(oracleSolvePart2(EXAMPLE_INPUT)).toBe('HI');

    const trace = solver.trace(manual);
    expect(trace).toHaveLength(3);
    expect(trace[0]?.kind === 'initial' ? trace[0].sheet.dotCount : 0).toBe(26);
    expect(trace[1]?.kind === 'folded' ? [trace[1].outcome.sheet.dotCount, trace[1].outcome.overlapCount] : []).toEqual([25, 1]);
    expect(trace[2]?.kind === 'folded' ? [trace[2].outcome.sheet.dotCount, trace[2].outcome.overlapCount] : []).toEqual([24, 1]);
  });

  it('decodes multi-fold 8-letter codes, centered I fallback, and 5-wide Y against the oracle', () => {
    for (const [word, centeredI] of [['AOCRULES', false], ['ZEBRAFLY', false], ['IA', true], ['YZ', false]] as const) {
      const raw = unfoldWord(word, MULTI_FOLDS, centeredI);
      expect(solver.solve(solver.parse(raw))).toBe(word);
      expect(oracleSolvePart2(raw)).toBe(word);
    }
  });

  it('respects trace maxSteps bounds and rejects non-positive maxSteps', () => {
    const manual = solver.parse(EXAMPLE_INPUT);
    const one = solver.trace(manual, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]?.foldsApplied).toBe(2);
    expect(solver.trace(manual, { maxSteps: 2 }).map((f) => f.foldsApplied)).toEqual([0, 2]);
    expect(() => solver.trace(manual, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('rejects empty input, later-crease collisions, negative reflections, non-6-row sheets, and unknown glyphs', () => {
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.parse('1,2\n\nfold along z=1')).toThrow(Error);
    expect(() => solver.solve(solver.parse('5,0\n\nfold along x=3\nfold along x=1'))).toThrow(RangeError);
    expect(() => solver.solve(solver.parse('5,0\n\nfold along x=2'))).toThrow(RangeError);
    expect(() => solver.solve(solver.parse(PART1_5X5_EXAMPLE))).toThrow(Error);
    expect(() => solver.solve(solver.parse('0,0\n0,5\n\nfold along x=5'))).toThrow(Error);
  });
});
