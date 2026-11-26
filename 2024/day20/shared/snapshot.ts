import {
  type PuzzleSolver,
  type TraceOptions,
  sampleTraceIndices,
  validateMaxSteps,
} from '../../../shared/core';
import { type DistanceField, computeBfsDistances } from './bfs';
import { type CheatSummary, analyzeCheats } from './cheats';
import type { Cheat, CheatConfig, Racetrack } from './model';
import { parseRacetrack } from './parser';

export const DEFAULT_MAX_TRACE_STEPS = 80;

export type RaceConditionPhase = 'baseline' | 'cheating' | 'complete';

/** Immutable visualization frame capturing distance field, cheat summary, and active cheat jump. */
export class RaceConditionSnapshot {
  readonly phase: RaceConditionPhase;
  readonly field: DistanceField;
  readonly config: CheatConfig;
  readonly summary: CheatSummary;
  readonly activeCheat: Cheat | null;
  readonly revealedBucketCount: number;

  constructor(
    phase: RaceConditionPhase,
    field: DistanceField,
    config: CheatConfig,
    summary: CheatSummary,
    activeCheat: Cheat | null,
    revealedBucketCount: number,
  ) {
    this.phase = phase;
    this.field = field;
    this.config = config;
    this.summary = summary;
    this.activeCheat = activeCheat;
    this.revealedBucketCount = revealedBucketCount;
    Object.freeze(this);
  }

  get activeSaving(): number {
    return this.activeCheat === null ? 0 : this.activeCheat.saving;
  }

  get activeDuration(): number {
    return this.activeCheat === null ? 0 : this.activeCheat.duration;
  }

  get revealedCheatCount(): number {
    let total = 0;
    for (let i = 0; i < this.revealedBucketCount; i += 1) {
      total += this.summary.buckets[i]!.count;
    }
    return total;
  }
}

/** Builds a bounded trace of baseline, sampled cheat buckets, and final optimal cheat frames. */
export function buildCheatTrace(
  racetrack: Racetrack,
  config: CheatConfig,
  options?: TraceOptions,
): readonly RaceConditionSnapshot[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const field = computeBfsDistances(racetrack);
  const summary = analyzeCheats(field, config);
  const buckets = summary.buckets;
  const completeFrame = new RaceConditionSnapshot('complete', field, config, summary, summary.bestCheat, buckets.length);
  if (limit === 1) return Object.freeze([completeFrame]);

  const baselineFrame = new RaceConditionSnapshot('baseline', field, config, summary, null, 0);
  if (limit === 2 || buckets.length <= 1) return Object.freeze([baselineFrame, completeFrame]);

  const frames: RaceConditionSnapshot[] = [baselineFrame];
  for (const idx of sampleTraceIndices(buckets.length - 1, limit - 2)) {
    frames.push(new RaceConditionSnapshot('cheating', field, config, summary, buckets[idx]!.witness, idx + 1));
  }
  frames.push(completeFrame);
  return Object.freeze(frames);
}

/** Creates a pure `PuzzleSolver` parameterized by cheat duration and saving thresholds. */
export function createRaceConditionSolver(
  config: CheatConfig,
): PuzzleSolver<Racetrack, number, RaceConditionSnapshot> {
  return Object.freeze({
    parse: (raw: string) => parseRacetrack(raw),
    solve: (racetrack: Racetrack) => analyzeCheats(computeBfsDistances(racetrack), config).totalCount,
    trace: (racetrack: Racetrack, options?: TraceOptions) => buildCheatTrace(racetrack, config, options),
  });
}
