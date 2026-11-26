import { describe, expect, it } from 'vitest';
import { PolyominoShape, TreeRegion, type CellCoord } from '../../shared';
import { evaluateRegion, type PlacedPiece } from './packer';

const toCells = (rows: string[]): CellCoord[] => {
  const out: CellCoord[] = [];
  rows.forEach((line, row) => [...line].forEach((ch, col) => { if (ch === '#') out.push({ row, col }); }));
  return out;
};

/** Independent piece-first brute-force backtracking oracle (no frontier bitboards or transposition). */
function bruteForceFeasible(shapes: readonly PolyominoShape[], region: TreeRegion): boolean {
  const pieces: number[] = [];
  region.counts.forEach((cnt, s) => { for (let i = 0; i < cnt; i++) pieces.push(s); });
  const grid = new Uint8Array(region.width * region.height);

  const search = (idx: number, minPos: number): boolean => {
    if (idx === pieces.length) return true;
    const shapeIdx = pieces[idx]!;
    const startPos = idx > 0 && pieces[idx - 1] === shapeIdx ? minPos : 0;
    for (const o of shapes[shapeIdx]!.orientations) {
      for (let r0 = 0; r0 + o.height <= region.height; r0++) {
        for (let c0 = 0; c0 + o.width <= region.width; c0++) {
          const pos = r0 * region.width + c0;
          if (pos < startPos) continue;
          if (o.cells.every((c) => grid[(r0 + c.row) * region.width + (c0 + c.col)] === 0)) {
            for (const c of o.cells) grid[(r0 + c.row) * region.width + (c0 + c.col)] = 1;
            if (search(idx + 1, pos + 1)) return true;
            for (const c of o.cells) grid[(r0 + c.row) * region.width + (c0 + c.col)] = 0;
          }
        }
      }
    }
    return false;
  };
  return search(0, 0);
}

function verifyWitness(shapes: readonly PolyominoShape[], region: TreeRegion, placements: readonly PlacedPiece[]): void {
  const seen = new Set<string>(), used = new Array<number>(shapes.length).fill(0);
  for (const p of placements) {
    used[p.shapeIndex] = (used[p.shapeIndex] ?? 0) + 1;
    for (const { row, col } of p.cells) {
      expect(row >= 0 && row < region.height && col >= 0 && col < region.width).toBe(true);
      const k = `${row},${col}`;
      expect(seen.has(k)).toBe(false);
      seen.add(k);
    }
    const minR = Math.min(...p.cells.map((c) => c.row)), minC = Math.min(...p.cells.map((c) => c.col));
    const norm = p.cells.map((c) => `${c.row - minR},${c.col - minC}`).sort().join(';');
    expect(shapes[p.shapeIndex]!.orientations.map((o) => o.cells.map((c) => `${c.row},${c.col}`).sort().join(';'))).toContain(norm);
  }
  expect(used).toEqual([...region.counts]);
}

describe('packer differential oracle', () => {
  // Polyominoes with negative-dr orientations (L, J, T, S, Z, U, P)
  const L = new PolyominoShape(0, toCells(['#.', '#.', '##']));
  const J = new PolyominoShape(1, toCells(['.#', '.#', '##']));
  const T = new PolyominoShape(2, toCells(['###', '.#.']));
  const S = new PolyominoShape(3, toCells(['.##', '##.']));
  const Z = new PolyominoShape(4, toCells(['##.', '.##']));
  const U = new PolyominoShape(5, toCells(['#.#', '###']));
  const P = new PolyominoShape(6, toCells(['##', '##', '#.']));
  const shapes = [L, J, T, S, Z, U, P];

  const cases: readonly [string, number, number, readonly number[]][] = [
    ['3x3 single U + S impossible (area > 9)', 3, 3, [0, 0, 0, 1, 0, 1, 0]],
    ['3x3 S + T tight UNSAT (area 8 <= 9)', 3, 3, [0, 0, 1, 1, 0, 0, 0]],
    ['4x3 L + J + T exact zero-slack SAT', 4, 3, [1, 1, 1, 0, 0, 0, 0]],
    ['3x4 L + J + T transposed zero-slack SAT', 3, 4, [1, 1, 1, 0, 0, 0, 0]],
    ['4x3 3xT UNSAT (checkerboard parity)', 4, 3, [0, 0, 3, 0, 0, 0, 0]],
    ['3x4 3xT transposed UNSAT', 3, 4, [0, 0, 3, 0, 0, 0, 0]],
    ['4x4 4xL zero-slack SAT', 4, 4, [4, 0, 0, 0, 0, 0, 0]],
    ['4x4 2xU + P positive-slack SAT', 4, 4, [0, 0, 0, 0, 0, 2, 1]],
    ['4x4 2xU + S + T UNSAT', 4, 4, [0, 0, 1, 1, 0, 2, 0]],
    ['5x3 3xP zero-slack SAT', 5, 3, [0, 0, 0, 0, 0, 0, 3]],
    ['3x5 3xP transposed zero-slack SAT', 3, 5, [0, 0, 0, 0, 0, 0, 3]],
    ['5x4 4xP zero-slack SAT', 5, 4, [0, 0, 0, 0, 0, 0, 4]],
    ['4x5 4xP transposed zero-slack SAT', 4, 5, [0, 0, 0, 0, 0, 0, 4]],
    ['5x4 S + Z + U + P positive-slack', 5, 4, [0, 0, 0, 1, 1, 1, 1]],
    ['4x5 3xS + 2xZ UNSAT (area 20)', 4, 5, [0, 0, 0, 3, 2, 0, 0]],
    ['4x4 2xS + 2xZ SAT/UNSAT check', 4, 4, [0, 0, 0, 2, 2, 0, 0]],
  ];

  it.each(cases)('%s', (_label, w, h, counts) => {
    const region = new TreeRegion(w, h, counts);
    const expected = bruteForceFeasible(shapes, region);
    const actual = evaluateRegion(shapes, region, { buildWitness: true });
    expect(actual.feasible).toBe(expected);
    if (actual.feasible) verifyWitness(shapes, region, actual.placements!);
    else expect(actual.placements).toBeNull();
  });
});
