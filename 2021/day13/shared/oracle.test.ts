import { describe, expect, it } from 'vitest';
import { CANONICAL_GLYPHS } from './bitmapFont';
import { applyFolds } from './folder';
import { ALL_FOLDS_CODE_POLICY, FIRST_FOLD_COUNT_POLICY } from './policy';
import { OrigamiSolver } from './solver';

function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function oracleGridFold(
  dots: readonly { x: number; y: number }[],
  folds: readonly { axis: 'x' | 'y'; value: number }[],
  width: number,
  height: number,
): number {
  let grid = Array.from({ length: height }, () => Array<boolean>(width).fill(false));
  for (const d of dots) grid[d.y]![d.x] = true;
  let w = width;
  let h = height;
  for (const fold of folds) {
    if (fold.axis === 'y') {
      for (let y = fold.value + 1; y < h; y += 1) {
        const dstY = 2 * fold.value - y;
        for (let x = 0; x < w; x += 1) {
          if (grid[y]![x]) grid[dstY]![x] = true;
        }
      }
      h = fold.value;
    } else {
      for (let y = 0; y < h; y += 1) {
        for (let x = fold.value + 1; x < w; x += 1) {
          if (grid[y]![x]) grid[y]![2 * fold.value - x] = true;
        }
      }
      w = fold.value;
    }
  }
  let count = 0;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (grid[y]![x]) count += 1;
    }
  }
  return count;
}

function oracleSetFold(raw: string, foldLimit: number): Set<string> {
  const [dotsSec, foldsSec] = raw.trim().split(/\n\s*\n/) as [string, string];
  let points = new Set(dotsSec.split('\n'));
  const folds = foldsSec.split('\n').slice(0, foldLimit);
  for (const line of folds) {
    const [, axis, valStr] = /^fold along ([xy])=(\d+)$/.exec(line)!;
    const k = Number(valStr);
    const next = new Set<string>();
    for (const key of points) {
      const [xs, ys] = key.split(',');
      const x = Number(xs);
      const y = Number(ys);
      const nx = axis === 'x' && x > k ? 2 * k - x : x;
      const ny = axis === 'y' && y > k ? 2 * k - y : y;
      next.add(`${nx},${ny}`);
    }
    points = next;
  }
  return points;
}

describe('oracle differential tests', () => {
  it('matches independent 2D boolean[][] folding oracle across 10 seeded random sheets', () => {
    const rng = makeRng(20211213);
    const part1 = new OrigamiSolver(FIRST_FOLD_COUNT_POLICY);

    for (let trial = 0; trial < 10; trial += 1) {
      const kX = 12 + Math.floor(rng() * 10);
      const kY = 10 + Math.floor(rng() * 10);
      const width = kX * 2 + 1;
      const height = kY * 2 + 1;
      const axis: 'x' | 'y' = trial % 2 === 0 ? 'x' : 'y';
      const foldVal = axis === 'x' ? kX : kY;

      const dots: { x: number; y: number }[] = [];
      for (let i = 0; i < 60; i += 1) {
        const x = Math.floor(rng() * width);
        const y = Math.floor(rng() * height);
        if ((axis === 'x' && x === foldVal) || (axis === 'y' && y === foldVal)) continue;
        dots.push({ x, y });
      }
      const raw = `${dots.map((d) => `${d.x},${d.y}`).join('\n')}\n\nfold along ${axis}=${foldVal}`;
      const expected = oracleGridFold(dots, [{ axis, value: foldVal }], width, height);
      expect(part1.solve(part1.parse(raw))).toBe(expected);
    }
  });

  it('verifies ~900-dot 12-fold synthetic 8-letter code against Set<string> oracle', () => {
    const rng = makeRng(99887766);
    const targetCode = 'IAZGYBPR';
    const centeredI = CANONICAL_GLYPHS.find((g) => g.letter === 'I' && g.rows[0] === '.###.')!;
    let pts: { x: number; y: number }[] = [];

    for (let idx = 0; idx < targetCode.length; idx += 1) {
      const ch = targetCode[idx]!;
      const template = idx === 0 ? centeredI : CANONICAL_GLYPHS.find((g) => g.letter === ch)!;
      for (let r = 0; r < template.rows.length; r += 1) {
        for (let c = 0; c < template.rows[r]!.length; c += 1) {
          if (template.rows[r]![c] === '#') pts.push({ x: idx * 5 + c, y: r });
        }
      }
    }

    const folds: readonly { axis: 'x' | 'y'; value: number }[] = [
      { axis: 'x', value: 655 }, { axis: 'y', value: 447 }, { axis: 'x', value: 327 },
      { axis: 'y', value: 223 }, { axis: 'x', value: 163 }, { axis: 'y', value: 111 },
      { axis: 'x', value: 81 },  { axis: 'y', value: 55 },  { axis: 'x', value: 40 },
      { axis: 'y', value: 27 },  { axis: 'y', value: 13 },  { axis: 'y', value: 6 },
    ];

    for (let i = folds.length - 1; i >= 0; i -= 1) {
      const f = folds[i]!;
      const next: { x: number; y: number }[] = [];
      for (const p of pts) {
        const mode = rng();
        const mirrored = f.axis === 'x' ? { x: 2 * f.value - p.x, y: p.y } : { x: p.x, y: 2 * f.value - p.y };
        if (mode < 0.4) next.push(p);
        else if (mode < 0.8) next.push(mirrored);
        else next.push(p, mirrored);
      }
      pts = next;
    }

    expect(pts.length).toBeGreaterThan(700);
    expect(pts.length).toBeLessThan(1200);
    const raw = `${pts.map((d) => `${d.x},${d.y}`).join('\n')}\n\n${folds.map((f) => `fold along ${f.axis}=${f.value}`).join('\n')}`;

    const part1 = new OrigamiSolver(FIRST_FOLD_COUNT_POLICY);
    const part2 = new OrigamiSolver(ALL_FOLDS_CODE_POLICY);
    const manual = part1.parse(raw);

    expect(part1.solve(manual)).toBe(oracleSetFold(raw, 1).size);
    expect(part2.solve(manual)).toBe(targetCode);
    expect(applyFolds(manual.initialSheet, manual.folds, folds.length).dotCount).toBe(
      oracleSetFold(raw, folds.length).size,
    );
  });
});
