import {
  countInfiniteReachable,
  type GardenMap,
  MAX_INFINITE_BFS_CELLS,
  QuadraticProgression,
} from '../../shared';

export const PART2_STEPS = 26_501_365n;

export interface QuadraticSample {
  readonly k: bigint;
  readonly steps: bigint;
  readonly plots: bigint;
}

export type InfiniteSolveReport =
  | { readonly mode: 'direct'; readonly steps: bigint; readonly answer: bigint }
  | {
      readonly mode: 'quadratic';
      readonly steps: bigint;
      readonly period: bigint;
      readonly remainder: bigint;
      readonly quotient: bigint;
      readonly samples: readonly [
        QuadraticSample,
        QuadraticSample,
        QuadraticSample,
        QuadraticSample,
      ];
      readonly progression: QuadraticProgression;
      readonly answer: bigint;
    };

function bigintTileRadius(steps: bigint, start: number, span: number): bigint {
  const margin = BigInt(Math.min(start, span - 1 - start));
  const period = BigInt(span);
  return steps <= margin ? 0n : (steps - margin + period - 1n) / period;
}

function fitsDirectInfiniteBfs(map: GardenMap, steps: bigint): boolean {
  const rx = bigintTileRadius(steps, map.startCol, map.width);
  const ry = bigintTileRadius(steps, map.startRow, map.height);
  const totalW = (2n * rx + 1n) * BigInt(map.width);
  const totalH = (2n * ry + 1n) * BigInt(map.height);
  return totalW * totalH <= BigInt(MAX_INFINITE_BFS_CELLS);
}

function samplePoint(map: GardenMap, k: bigint, step: bigint): QuadraticSample {
  return Object.freeze({
    k,
    steps: step,
    plots: BigInt(countInfiniteReachable(map, Number(step))),
  });
}

function extrapolateQuadratic(map: GardenMap, steps: bigint): InfiniteSolveReport {
  const period = BigInt(map.width);
  const remainder = steps % period;
  const quotient = steps / period;
  const s0 = samplePoint(map, 0n, remainder);
  const s1 = samplePoint(map, 1n, remainder + period);
  const s2 = samplePoint(map, 2n, remainder + 2n * period);
  const s3 = samplePoint(map, 3n, remainder + 3n * period);
  const progression = new QuadraticProgression(s0.plots, s1.plots, s2.plots);
  if (!progression.matchesSample(3n, s3.plots)) {
    throw new Error(
      `Infinite plot counts did not stabilize to a quadratic at k=3 (step ${s3.steps}): expected ${progression.evaluate(3n)}, got ${s3.plots}`,
    );
  }
  const samples = Object.freeze([s0, s1, s2, s3]) as readonly [
    QuadraticSample,
    QuadraticSample,
    QuadraticSample,
    QuadraticSample,
  ];
  return Object.freeze({
    mode: 'quadratic',
    steps,
    period,
    remainder,
    quotient,
    samples,
    progression,
    answer: progression.evaluate(quotient),
  });
}

/** Solves infinite-grid reachable plots for `steps`, extrapolating quadratically when periodic-ready. */
export function solveInfiniteGarden(map: GardenMap, steps: bigint): InfiniteSolveReport {
  if (steps < 0n) {
    throw new RangeError(`steps must be non-negative, got ${steps}`);
  }
  if (steps === 0n) {
    return Object.freeze({ mode: 'direct', steps, answer: 1n });
  }
  if (map.isQuadraticPeriodicReady() && steps >= BigInt(3 * map.width)) {
    return extrapolateQuadratic(map, steps);
  }
  if (!fitsDirectInfiniteBfs(map, steps)) {
    throw new Error(
      `Cannot solve ${steps} steps: grid (${map.width}x${map.height}) is not quadratic-periodic-ready and exceeds direct BFS limit`,
    );
  }
  return Object.freeze({
    mode: 'direct',
    steps,
    answer: BigInt(countInfiniteReachable(map, Number(steps))),
  });
}

/** Returns only the exact infinite-grid plot count reachable in `steps`. */
export function countInfinitePlotsForSteps(map: GardenMap, steps: bigint): bigint {
  return solveInfiniteGarden(map, steps).answer;
}
