import type { CellCoord, PolyominoShape, TreeRegion } from '../../shared';

export type RegionVerdict =
  | 'trivial-empty' | 'area-impossible' | 'dimension-impossible'
  | 'disjoint-tiling' | 'exact-feasible' | 'exact-infeasible';

export interface PlacedPiece { readonly shapeIndex: number; readonly cells: readonly CellCoord[]; }
export interface EvaluateRegionOptions { readonly buildWitness?: boolean; }
export interface RegionEvaluation {
  readonly feasible: boolean; readonly verdict: RegionVerdict;
  readonly requiredArea: number; readonly tileCapacity: number;
  readonly placements: readonly PlacedPiece[] | null; readonly statesExplored: number;
}
interface Placement { readonly baseMask: bigint; readonly maxDc: number; readonly rel: readonly CellCoord[]; }

function tileWitness(shapes: readonly PolyominoShape[], region: TreeRegion, tileW: number, tileH: number): PlacedPiece[] {
  const colsPerRow = Math.floor(region.width / tileW);
  const out: PlacedPiece[] = [];
  let idx = 0;
  region.counts.forEach((count, s) => {
    if (count === 0) return;
    const orient = shapes[s]!.orientationFitting(tileW, tileH)!;
    for (let i = 0; i < count; i++, idx++) {
      const r0 = Math.floor(idx / colsPerRow) * tileH, c0 = (idx % colsPerRow) * tileW;
      out.push({ shapeIndex: s, cells: orient.cells.map((c) => ({ row: r0 + c.row, col: c0 + c.col })) });
    }
  });
  return out;
}

/** Evaluates polyomino packing feasibility via fast-path bounds + column-scanline bitboard DFS. */
export function evaluateRegion(
  shapes: readonly PolyominoShape[], region: TreeRegion, options: EvaluateRegionOptions = {},
): RegionEvaluation {
  const buildWitness = options.buildWitness ?? false;
  const totalPieces = region.totalPieces;
  if (totalPieces === 0) {
    return { feasible: true, verdict: 'trivial-empty', requiredArea: 0, tileCapacity: 0, placements: buildWitness ? [] : null, statesExplored: 0 };
  }

  let requiredArea = 0, allFit = true, maxShort = 0, maxLong = 0;
  const activeIds: number[] = [];
  region.counts.forEach((count, s) => {
    if (count === 0) return;
    const sh = shapes[s]!;
    requiredArea += count * sh.area;
    if (!sh.fitsIn(region.width, region.height)) allFit = false;
    maxShort = Math.max(maxShort, sh.shortSide);
    maxLong = Math.max(maxLong, sh.longSide);
    activeIds.push(s);
  });

  const capA = Math.floor(region.width / maxLong) * Math.floor(region.height / maxShort);
  const capB = Math.floor(region.width / maxShort) * Math.floor(region.height / maxLong);
  const tileCapacity = Math.max(capA, capB);
  const res = (feasible: boolean, verdict: RegionVerdict, placements: readonly PlacedPiece[] | null, statesExplored = 0): RegionEvaluation =>
    ({ feasible, verdict, requiredArea, tileCapacity, placements, statesExplored });

  if (requiredArea > region.area) return res(false, 'area-impossible', null);
  if (!allFit) return res(false, 'dimension-impossible', null);
  if (totalPieces <= tileCapacity) {
    const [tileW, tileH] = capA >= capB ? [maxLong, maxShort] : [maxShort, maxLong];
    return res(true, 'disjoint-tiling', buildWitness ? tileWitness(shapes, region, tileW, tileH) : null);
  }

  // Transpose tall grids so rows <= cols keeps the column-scanline bitboard frontier narrow.
  const transposed = region.height > region.width;
  const [rows, cols] = transposed ? [region.width, region.height] : [region.height, region.width];
  activeIds.sort((a, b) => shapes[b]!.area - shapes[a]!.area);
  const remaining = activeIds.map((s) => region.counts[s]!);
  const rowPlacements: Placement[][][] = activeIds.map((s) =>
    Array.from({ length: rows }, (_, row) => shapes[s]!.orientations.flatMap((o) => {
      let baseMask = 0n, maxDc = 0;
      const rel: CellCoord[] = [];
      for (const c of o.cells) {
        const pr = row + (c.row - o.anchorRow);
        if (pr < 0 || pr >= rows) return [];
        if (c.col > maxDc) maxDc = c.col;
        baseMask |= 1n << BigInt(c.col * rows + pr);
        rel.push({ row: pr, col: c.col });
      }
      return [{ baseMask, maxDc, rel }];
    })),
  );

  const deadStates = new Set<string>();
  const witness: PlacedPiece[] = [];
  let statesExplored = 0;

  const dfs = (col: number, row: number, frontier: bigint, left: number, slack: number): boolean => {
    if (left === 0) return true;
    while ((frontier & (1n << BigInt(row))) !== 0n) if (++row === rows) { row = 0; col++; frontier >>= BigInt(rows); }
    const key = row === 0 ? `${col}|${frontier.toString(36)}|${remaining.join(',')}` : '';
    if (row === 0) { if (deadStates.has(key)) return false; statesExplored++; }
    const nextRow = row + 1 === rows ? 0 : row + 1;
    const nextCol = nextRow === 0 ? col + 1 : col;
    const shift = nextRow === 0 ? BigInt(rows) : 0n;

    for (let k = 0; k < activeIds.length; k++) {
      if (remaining[k]! === 0) continue;
      remaining[k] = remaining[k]! - 1;
      for (const p of rowPlacements[k]![row]!) {
        if (col + p.maxDc >= cols || (frontier & p.baseMask) !== 0n) continue;
        if (dfs(nextCol, nextRow, (frontier | p.baseMask) >> shift, left - 1, slack)) {
          if (buildWitness) witness.push({ shapeIndex: activeIds[k]!, cells: p.rel.map((c) => transposed ? { row: col + c.col, col: c.row } : { row: c.row, col: col + c.col }) });
          return true;
        }
      }
      remaining[k] = remaining[k]! + 1;
    }
    if (slack > 0 && dfs(nextCol, nextRow, frontier >> shift, left, slack - 1)) return true;
    if (row === 0) deadStates.add(key);
    return false;
  };

  const feasible = dfs(0, 0, 0n, totalPieces, region.area - requiredArea);
  return res(feasible, feasible ? 'exact-feasible' : 'exact-infeasible', feasible && buildWitness ? witness : null, statesExplored);
}
