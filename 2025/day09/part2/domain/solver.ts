import { type PuzzleSolver, type TraceOptions } from '../../../../shared/core';
import { type TilePoint, TileRect, parseTilePoints } from '../../shared';
import { PolygonTileGrid } from './compressedGrid';

export const DEFAULT_MAX_TRACE_STEPS = 120;

export interface InscribedRectangleMatch {
  readonly rect: TileRect;
  readonly indexA: number;
  readonly indexB: number;
}

export interface LargestInscribedResult {
  readonly match: InscribedRectangleMatch;
  readonly grid: PolygonTileGrid;
  readonly checkedPairs: number;
  readonly rejectedPairs: number;
}

export interface InscribedTraceFrame {
  readonly step: number;
  readonly totalSteps: number;
  readonly candidate: TileRect;
  readonly candidateIndexA: number;
  readonly candidateIndexB: number;
  readonly invalidCells: number;
  readonly best: TileRect;
  readonly bestIndexA: number;
  readonly bestIndexB: number;
  readonly isNewBest: boolean;
  readonly isComplete: boolean;
}

interface RawStep {
  readonly i: number;
  readonly j: number;
  readonly invalid: number;
  readonly bestA: number;
  readonly bestB: number;
  readonly isNewBest: boolean;
}

function searchInscribed(points: readonly TilePoint[], trace?: RawStep[]): LargestInscribedResult {
  const grid = new PolygonTileGrid(points);
  const n = points.length;
  const vx = new Int32Array(n), vy = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    vx[i] = grid.xAxis.indexOfPoint(points[i]!.x);
    vy[i] = grid.yAxis.indexOfPoint(points[i]!.y);
  }
  // Edge (0, 1) is always a valid rectangle with area >= 2n, eliminating null-guard branches.
  let bestA = 0, bestB = 1, bestArea = 0n, checkedPairs = 0, rejectedPairs = 0;
  for (let i = 0; i < n; i++) {
    const pi = points[i]!, vxi = vx[i]!, vyi = vy[i]!;
    for (let j = i + 1; j < n; j++) {
      const pj = points[j]!;
      const dx = pi.x - pj.x, dy = pi.y - pj.y;
      const area = ((dx >= 0n ? dx : -dx) + 1n) * ((dy >= 0n ? dy : -dy) + 1n);
      // Strict `>` prunes non-improving candidates and guarantees canonical (indexA, indexB) tie-breaking.
      if (area <= bestArea) continue;
      const invalid = grid.invalidCellsInBox(vxi, vyi, vx[j]!, vy[j]!);
      checkedPairs++;
      const isNewBest = invalid === 0;
      if (isNewBest) { bestArea = area; bestA = i; bestB = j; } else { rejectedPairs++; }
      if (trace) trace.push({ i, j, invalid, bestA, bestB, isNewBest });
    }
  }
  return Object.freeze({
    match: Object.freeze({ rect: new TileRect(points[bestA]!, points[bestB]!), indexA: bestA, indexB: bestB }),
    grid, checkedPairs, rejectedPairs,
  });
}

export const findLargestInscribedRectangle = (points: readonly TilePoint[]): LargestInscribedResult =>
  searchInscribed(points);

export function traceLargestInscribedRectangle(
  points: readonly TilePoint[], options?: TraceOptions,
): readonly InscribedTraceFrame[] {
  const maxSteps = options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
  if (!Number.isInteger(maxSteps) || maxSteps < 1) throw new RangeError(`Invalid maxSteps: ${maxSteps}`);
  const raw: RawStep[] = [];
  searchInscribed(points, raw);
  const total = raw.length;
  const indices = total <= maxSteps ? raw.map((_, k) => k)
    : maxSteps === 1 ? [total - 1]
      : Array.from({ length: maxSteps }, (_, k) => Math.round((k * (total - 1)) / (maxSteps - 1)));
  return Object.freeze(indices.map((idx) => {
    const r = raw[idx]!;
    return Object.freeze({
      step: idx + 1, totalSteps: total,
      candidate: new TileRect(points[r.i]!, points[r.j]!), candidateIndexA: r.i, candidateIndexB: r.j,
      invalidCells: r.invalid, best: new TileRect(points[r.bestA]!, points[r.bestB]!),
      bestIndexA: r.bestA, bestIndexB: r.bestB, isNewBest: r.isNewBest, isComplete: idx === total - 1,
    });
  }));
}

export const solver: PuzzleSolver<readonly TilePoint[], bigint, InscribedTraceFrame> = {
  parse: parseTilePoints,
  solve: (points) => findLargestInscribedRectangle(points).match.rect.area,
  trace: traceLargestInscribedRectangle,
};
