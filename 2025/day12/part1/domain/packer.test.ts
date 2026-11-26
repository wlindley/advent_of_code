import { describe, expect, it } from 'vitest';
import { PolyominoShape, TreeRegion, parseTreeFarm, type CellCoord } from '../../shared';
import { evaluateRegion, type PlacedPiece } from './packer';

const cells = (pts: [number, number][]): CellCoord[] => pts.map(([row, col]) => ({ row, col }));
const OFFICIAL_EXAMPLE =
  '0:\n###\n##.\n##.\n\n1:\n###\n##.\n.##\n\n2:\n.##\n###\n##.\n\n3:\n##.\n###\n##.\n\n4:\n###\n#..\n###\n\n5:\n###\n.#.\n###\n\n4x4: 0 0 0 0 2 0\n12x5: 1 0 1 0 2 2\n12x5: 1 0 1 0 3 2';

function verifyWitness(shapes: readonly PolyominoShape[], region: TreeRegion, placements: readonly PlacedPiece[]): void {
  const occupied = new Set<string>(), used = new Array<number>(shapes.length).fill(0);
  for (const p of placements) {
    used[p.shapeIndex] = (used[p.shapeIndex] ?? 0) + 1;
    for (const { row, col } of p.cells) {
      expect(row >= 0 && row < region.height && col >= 0 && col < region.width).toBe(true);
      const key = `${row},${col}`;
      expect(occupied.has(key)).toBe(false);
      occupied.add(key);
    }
    const minR = Math.min(...p.cells.map((c) => c.row)), minC = Math.min(...p.cells.map((c) => c.col));
    const norm = p.cells.map((c) => `${c.row - minR},${c.col - minC}`).sort().join(';');
    expect(shapes[p.shapeIndex]!.orientations.map((o) => o.cells.map((c) => `${c.row},${c.col}`).sort().join(';'))).toContain(norm);
  }
  expect(used).toEqual([...region.counts]);
}

describe('evaluateRegion', () => {
  const farm = parseTreeFarm(OFFICIAL_EXAMPLE);

  it('handles trivial-empty regions with and without witness', () => {
    const r = new TreeRegion(4, 4, [0, 0, 0, 0, 0, 0]);
    expect(evaluateRegion(farm.shapes, r)).toMatchObject({ feasible: true, verdict: 'trivial-empty', placements: null });
    expect(evaluateRegion(farm.shapes, r, { buildWitness: true })).toMatchObject({ verdict: 'trivial-empty', placements: [] });
  });

  it('detects area-impossible and dimension-impossible regions', () => {
    const bar4 = new PolyominoShape(0, cells([[0, 0], [0, 1], [0, 2], [0, 3]]));
    expect(evaluateRegion([bar4], new TreeRegion(2, 1, [1])).verdict).toBe('area-impossible');
    expect(evaluateRegion([bar4], new TreeRegion(3, 3, [1])).verdict).toBe('dimension-impossible');
  });

  it('handles disjoint-tiling for both capA >= capB and capB > capA', () => {
    const l3x2 = new PolyominoShape(0, cells([[0, 0], [1, 0], [1, 1], [1, 2]])), dot = new PolyominoShape(1, cells([[0, 0]]));
    const rA = new TreeRegion(6, 4, [3, 0]), rB = new TreeRegion(5, 6, [4, 0]);
    expect(evaluateRegion([l3x2, dot], rA).placements).toBeNull();
    for (const reg of [rA, rB]) {
      const res = evaluateRegion([l3x2, dot], reg, { buildWitness: true });
      expect(res.verdict).toBe('disjoint-tiling');
      verifyWitness([l3x2, dot], reg, res.placements!);
    }
  });

  it('solves exact-feasible zero-slack, positive-slack, and transposed regions', () => {
    const lTet = new PolyominoShape(0, cells([[0, 0], [1, 0], [2, 0], [2, 1]])), sq = new PolyominoShape(1, cells([[0, 0], [0, 1], [1, 0], [1, 1]]));
    const zeroSlack = new TreeRegion(4, 3, [2, 1]);
    verifyWitness([lTet, sq], zeroSlack, evaluateRegion([lTet, sq], zeroSlack, { buildWitness: true }).placements!);
    for (const reg of [farm.regions[0]!, farm.regions[1]!, new TreeRegion(5, 12, farm.regions[1]!.counts)]) {
      const res = evaluateRegion(farm.shapes, reg, { buildWitness: true });
      expect(res).toMatchObject({ feasible: true, verdict: 'exact-feasible' });
      verifyWitness(farm.shapes, reg, res.placements!);
    }
  });

  it('proves exact-infeasible on official Region 3 and its transpose', () => {
    for (const reg of [farm.regions[2]!, new TreeRegion(5, 12, farm.regions[2]!.counts)]) {
      const res = evaluateRegion(farm.shapes, reg, { buildWitness: true });
      expect(res).toMatchObject({ feasible: false, verdict: 'exact-infeasible', placements: null });
      expect(res.statesExplored).toBeGreaterThan(0);
    }
  });
});
