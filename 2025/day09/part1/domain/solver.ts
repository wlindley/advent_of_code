import { type PuzzleSolver, type TraceOptions } from '../../../../shared/core';
import { TilePoint, TileRect, parseTilePoints } from '../../shared';
import { extractSwNeFrontiers, searchMonotoneMax, type MonotoneProbe } from './skyline';

export const DEFAULT_MAX_TRACE_STEPS = 120;
export type SkylinePass = 'sw-ne' | 'nw-se';

export interface RectangleMatch {
  readonly rect: TileRect;
  readonly indexA: number;
  readonly indexB: number;
}

export interface LargestRectangleResult {
  readonly match: RectangleMatch;
  readonly swIndices: readonly number[];
  readonly neIndices: readonly number[];
  readonly nwIndices: readonly number[];
  readonly seIndices: readonly number[];
}

export interface SkylineTraceFrame {
  readonly step: number;
  readonly totalSteps: number;
  readonly pass: SkylinePass;
  readonly probeIndex: number;
  readonly matchedIndex: number;
  readonly windowStart: number;
  readonly windowEnd: number;
  readonly candidate: TileRect | null;
  readonly best: TileRect;
  readonly bestIndexA: number;
  readonly bestIndexB: number;
  readonly isNewBest: boolean;
  readonly isComplete: boolean;
}

type ProbeHook = (
  pass: SkylinePass, probe: MonotoneProbe, candidate: TileRect | null,
  best: TileRect, bestA: number, bestB: number, isNewBest: boolean,
) => void;

function runTwoPassSearch(points: readonly TilePoint[], onProbe?: ProbeHook): LargestRectangleResult {
  if (points.length < 2) throw new Error('At least two red tiles are required');
  let bestA = 0, bestB = 1;
  let bestRect = new TileRect(points[0]!, points[1]!);
  let bestArea = bestRect.area;

  const runPass = (pass: SkylinePass, ySign: 1n | -1n) => {
    const frontiers = extractSwNeFrontiers(points.map((p, index) => ({ index, x: p.x, y: ySign * p.y })));
    searchMonotoneMax(frontiers, (probe) => {
      let candidate: TileRect | null = null;
      let isNewBest = false;
      if (probe.probeIndex !== probe.matchedIndex) {
        const lo = Math.min(probe.probeIndex, probe.matchedIndex);
        const hi = Math.max(probe.probeIndex, probe.matchedIndex);
        candidate = new TileRect(points[lo]!, points[hi]!);
        const area = candidate.area;
        if (area > bestArea || (area === bestArea && (lo < bestA || (lo === bestA && hi < bestB)))) {
          bestA = lo; bestB = hi; bestRect = candidate; bestArea = area; isNewBest = true;
        }
      }
      onProbe?.(pass, probe, candidate, bestRect, bestA, bestB, isNewBest);
    });
    return frontiers;
  };

  const pass1 = runPass('sw-ne', 1n), pass2 = runPass('nw-se', -1n);
  return Object.freeze({
    match: Object.freeze({ rect: bestRect, indexA: bestA, indexB: bestB }),
    swIndices: Object.freeze(pass1.sw.map((t) => t.index)),
    neIndices: Object.freeze(pass1.ne.map((t) => t.index)),
    nwIndices: Object.freeze(pass2.sw.map((t) => t.index)),
    seIndices: Object.freeze(pass2.ne.map((t) => t.index)),
  });
}

export const findLargestTileRectangle = (points: readonly TilePoint[]): LargestRectangleResult =>
  runTwoPassSearch(points);

export function traceLargestTileRectangle(
  points: readonly TilePoint[], options?: TraceOptions,
): readonly SkylineTraceFrame[] {
  const maxSteps = options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
  if (!Number.isInteger(maxSteps) || maxSteps < 1) throw new RangeError(`Invalid maxSteps: ${maxSteps}`);
  const raw: Omit<SkylineTraceFrame, 'totalSteps' | 'isComplete'>[] = [];
  runTwoPassSearch(points, (pass, p, candidate, best, bestIndexA, bestIndexB, isNewBest) => {
    raw.push({
      step: raw.length + 1, pass, probeIndex: p.probeIndex, matchedIndex: p.matchedIndex,
      windowStart: p.windowStart, windowEnd: p.windowEnd, candidate, best, bestIndexA, bestIndexB, isNewBest,
    });
  });
  const total = raw.length;
  const indices = total <= maxSteps
    ? raw.map((_, i) => i)
    : maxSteps === 1 ? [total - 1]
      : Array.from({ length: maxSteps }, (_, k) => Math.round((k * (total - 1)) / (maxSteps - 1)));
  return Object.freeze(indices.map((i) => Object.freeze({ ...raw[i]!, totalSteps: total, isComplete: i === total - 1 })));
}

export const solver: PuzzleSolver<readonly TilePoint[], bigint, SkylineTraceFrame> = {
  parse: parseTilePoints,
  solve: (points) => findLargestTileRectangle(points).match.rect.area,
  trace: traceLargestTileRectangle,
};
