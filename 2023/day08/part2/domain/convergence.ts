import type { WastelandNetwork } from '../../shared';
import { Congruence, mergeCongruenceSets } from './crt';
import { GhostCycle, collectGhostStartIds, extractGhostCycle } from './ghostCycle';

export type ConvergenceRegime = 'pre-cycle' | 'aligned-lcm' | 'general-crt';

export interface MergeStepRecord {
  readonly ghost: GhostCycle;
  readonly ghostIndex: number;
  readonly congruences: readonly Congruence[];
  readonly prunedCount: number;
  readonly bestCandidate: Congruence;
  readonly bestStep: bigint;
}

export interface ConvergencePlan {
  readonly regime: ConvergenceRegime;
  readonly cycles: readonly GhostCycle[];
  readonly maxPrefixLength: number;
  readonly minSteadyStep: bigint;
  readonly mergeSteps: readonly MergeStepRecord[];
  readonly answer: bigint;
}

function findPreCycleConvergence(
  cycles: readonly GhostCycle[],
  maxPrefixLength: number,
): ConvergencePlan | undefined {
  const anchor = cycles.reduce((best, c) => (c.prefixLength > best.prefixLength ? c : best));
  for (const hit of anchor.preCycleHits) {
    if (cycles.every((cycle) => cycle.isTargetAt(hit.step))) {
      return Object.freeze({
        regime: 'pre-cycle',
        cycles: Object.freeze([...cycles]),
        maxPrefixLength,
        minSteadyStep: BigInt(Math.max(1, maxPrefixLength)),
        mergeSteps: Object.freeze([]),
        answer: BigInt(hit.step),
      });
    }
  }
  return undefined;
}

function pickBestCandidate(
  congruences: readonly Congruence[],
  minSteadyStep: bigint,
): { readonly bestCandidate: Congruence; readonly bestStep: bigint } {
  let bestCandidate = congruences[0]!;
  let bestStep = bestCandidate.liftAtLeast(minSteadyStep);
  for (let i = 1; i < congruences.length; i += 1) {
    const candidate = congruences[i]!;
    const step = candidate.liftAtLeast(minSteadyStep);
    if (step < bestStep) {
      bestStep = step;
      bestCandidate = candidate;
    }
  }
  return { bestCandidate, bestStep };
}

function foldSteadyStateCrt(
  sorted: readonly GhostCycle[],
  minSteadyStep: bigint,
): readonly MergeStepRecord[] {
  let frontier: readonly Congruence[] = [Congruence.IDENTITY];
  const mergeSteps: MergeStepRecord[] = [];

  for (let i = 0; i < sorted.length; i += 1) {
    const ghost = sorted[i]!;
    if (ghost.cycleHits.length === 0) {
      throw new Error(`Ghost "${ghost.startLabel}" never reaches a **Z node inside its cycle`);
    }
    const outcome = mergeCongruenceSets(frontier, ghost.congruences);
    if (outcome.congruences.length === 0) {
      throw new Error(`Ghost "${ghost.startLabel}" has no compatible convergence congruence`);
    }
    frontier = outcome.congruences;
    const { bestCandidate, bestStep } = pickBestCandidate(frontier, minSteadyStep);
    mergeSteps.push(
      Object.freeze({
        ghost,
        ghostIndex: i,
        congruences: frontier,
        prunedCount: outcome.prunedCount,
        bestCandidate,
        bestStep,
      }),
    );
  }
  return Object.freeze(mergeSteps);
}

/** Decomposes all ghost walks into rho-cycles and computes the minimal simultaneous **Z step. */
export function analyzeGhostConvergence(network: WastelandNetwork): ConvergencePlan {
  const cycles = collectGhostStartIds(network).map((id) => extractGhostCycle(network, id));
  const maxPrefixLength = cycles.reduce((max, c) => Math.max(max, c.prefixLength), 0);

  const preCycle = findPreCycleConvergence(cycles, maxPrefixLength);
  if (preCycle !== undefined) return preCycle;

  const sorted = Object.freeze(
    [...cycles].sort(
      (a, b) =>
        a.cycleHits.length - b.cycleHits.length ||
        a.cycleLength - b.cycleLength ||
        a.startId - b.startId,
    ),
  );
  const minSteadyStep = BigInt(Math.max(1, maxPrefixLength));
  const mergeSteps = foldSteadyStateCrt(sorted, minSteadyStep);
  const regime: ConvergenceRegime = sorted.every((c) => c.isAlignedLcm)
    ? 'aligned-lcm'
    : 'general-crt';

  return Object.freeze({
    regime,
    cycles: sorted,
    maxPrefixLength,
    minSteadyStep,
    mergeSteps,
    answer: mergeSteps[mergeSteps.length - 1]!.bestStep,
  });
}

/** Solves AoC 2023 Day 8 Part 2 by finding the earliest step where all **A ghosts reach **Z. */
export function solveHauntedWastelandPart2(network: WastelandNetwork): bigint {
  return analyzeGhostConvergence(network).answer;
}
