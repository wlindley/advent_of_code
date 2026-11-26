import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { parseTreeFarm, type TreeFarm, type TreeRegion } from '../../shared';
import { evaluateRegion, type RegionEvaluation } from './packer';

export const DEFAULT_MAX_TRACE_STEPS = 120;

export interface FarmTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly regionIndex: number;
  readonly totalRegions: number;
  readonly region: TreeRegion;
  readonly evaluation: RegionEvaluation;
  readonly feasibleSoFar: number;
  readonly infeasibleSoFar: number;
  readonly fastPathFeasibleSoFar: number;
  readonly fastPathInfeasibleSoFar: number;
  readonly exactSolvedSoFar: number;
  readonly isComplete: boolean;
}

/** Counts how many under-tree regions can pack their required polyomino presents. */
export function solveTreeFarm(farm: TreeFarm): number {
  let feasible = 0;
  for (const region of farm.regions) {
    if (evaluateRegion(farm.shapes, region, { buildWitness: false }).feasible) feasible++;
  }
  return feasible;
}

function selectSampledRegions(total: number, maxSteps: number): Set<number> {
  const sampled = new Set<number>();
  if (total <= maxSteps) {
    for (let i = 0; i < total; i++) sampled.add(i);
  } else if (maxSteps === 1) {
    sampled.add(total - 1);
  } else {
    for (let i = 0; i < maxSteps; i++) {
      sampled.add(Math.floor((i * (total - 1)) / (maxSteps - 1)));
    }
  }
  return sampled;
}

/** Evaluates all regions while recording bounded sampled trace frames with witnesses. */
export function traceTreeFarm(farm: TreeFarm, options?: TraceOptions): readonly FarmTraceFrame[] {
  const maxSteps = options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
  if (!Number.isSafeInteger(maxSteps) || maxSteps < 1) {
    throw new RangeError(`maxSteps must be an integer >= 1, got ${maxSteps}`);
  }
  const totalRegions = farm.regions.length;
  const sampled = selectSampledRegions(totalRegions, maxSteps);
  const totalSteps = sampled.size;
  const frames: FarmTraceFrame[] = [];

  let feasibleSoFar = 0;
  let infeasibleSoFar = 0;
  let fastPathFeasibleSoFar = 0;
  let fastPathInfeasibleSoFar = 0;
  let exactSolvedSoFar = 0;

  farm.regions.forEach((region, regionIndex) => {
    const isSampled = sampled.has(regionIndex);
    const evaluation = evaluateRegion(farm.shapes, region, { buildWitness: isSampled });
    if (evaluation.feasible) feasibleSoFar++;
    else infeasibleSoFar++;

    if (evaluation.verdict === 'trivial-empty' || evaluation.verdict === 'disjoint-tiling') fastPathFeasibleSoFar++;
    else if (evaluation.verdict === 'area-impossible' || evaluation.verdict === 'dimension-impossible') fastPathInfeasibleSoFar++;
    else exactSolvedSoFar++;

    if (isSampled) {
      frames.push({
        stepIndex: frames.length,
        totalSteps,
        regionIndex,
        totalRegions,
        region,
        evaluation,
        feasibleSoFar,
        infeasibleSoFar,
        fastPathFeasibleSoFar,
        fastPathInfeasibleSoFar,
        exactSolvedSoFar,
        isComplete: regionIndex === totalRegions - 1,
      });
    }
  });

  return frames;
}

export const solver: PuzzleSolver<TreeFarm, number, FarmTraceFrame> = {
  parse: parseTreeFarm,
  solve: solveTreeFarm,
  trace: traceTreeFarm,
};
