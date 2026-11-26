import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import { evaluateOutcome, isShape, Outcome, type Shape } from './rules';
import type { StrategyRound } from './strategyGuide';

export const DEFAULT_MAX_TRACE_STEPS = 120;

const MATCHUP_OUTCOMES: readonly Outcome[] = Object.freeze(
  Array.from({ length: 9 }, (_, i) => evaluateOutcome(Math.floor(i / 3) as Shape, (i % 3) as Shape)),
);

const MATCHUP_SCORES: readonly number[] = Object.freeze(
  Array.from({ length: 9 }, (_, i) => (i % 3) + 1 + MATCHUP_OUTCOMES[i]! * 3),
);

function requireShape(value: Shape, role: string): Shape {
  if (!isShape(value)) {
    throw new RangeError(`${role} must be a valid Shape (0, 1, or 2), got ${value}`);
  }
  return value;
}

function copyValidatedCounts(counts: readonly number[]): readonly number[] {
  if (counts.length !== 9) {
    throw new RangeError(`MatchupSummary requires exactly 9 counts, got ${counts.length}`);
  }
  const copy: number[] = [];
  for (const count of counts) {
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new RangeError(`Matchup count must be a non-negative safe integer, got ${count}`);
    }
    copy.push(count);
  }
  return Object.freeze(copy);
}

function sumByOutcome(counts: readonly number[], target: Outcome): number {
  let total = 0;
  for (let i = 0; i < 9; i += 1) {
    if (MATCHUP_OUTCOMES[i] === target) total += counts[i]!;
  }
  return total;
}

/** Immutable resolved round pairing a strategy entry with the selected player shape. */
export class ResolvedRound {
  readonly round: StrategyRound;
  readonly playerShape: Shape;

  constructor(round: StrategyRound, playerShape: Shape) {
    this.round = round;
    this.playerShape = requireShape(playerShape, 'playerShape');
    Object.freeze(this);
  }

  get opponentShape(): Shape {
    return this.round.opponentShape;
  }

  get outcome(): Outcome {
    return evaluateOutcome(this.opponentShape, this.playerShape);
  }

  get shapeScore(): number {
    return this.playerShape + 1;
  }

  get outcomeScore(): number {
    return this.outcome * 3;
  }

  get totalScore(): number {
    return this.shapeScore + this.outcomeScore;
  }
}

export interface RoundResolver {
  resolve(round: StrategyRound): ResolvedRound;
}

/** Immutable 3x3 matchup count snapshot with dynamically computed round and score totals. */
export class MatchupSummary {
  readonly counts: readonly number[];

  constructor(counts: readonly number[]) {
    this.counts = copyValidatedCounts(counts);
    Object.freeze(this);
  }

  get totalRounds(): number {
    let total = 0;
    for (const count of this.counts) total += count;
    return total;
  }

  get totalScore(): number {
    let total = 0;
    for (let i = 0; i < 9; i += 1) total += this.counts[i]! * MATCHUP_SCORES[i]!;
    return total;
  }

  get wins(): number {
    return sumByOutcome(this.counts, Outcome.Win);
  }

  get draws(): number {
    return sumByOutcome(this.counts, Outcome.Draw);
  }

  get losses(): number {
    return sumByOutcome(this.counts, Outcome.Loss);
  }

  countOf(opponent: Shape, player: Shape): number {
    const opp = requireShape(opponent, 'opponent');
    const ply = requireShape(player, 'player');
    return this.counts[opp * 3 + ply]!;
  }
}

export interface StrategyTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly roundIndex: number;
  readonly totalRounds: number;
  readonly currentRound: ResolvedRound;
  readonly summary: MatchupSummary;
}

function assertNonEmptyRounds(rounds: readonly StrategyRound[]): void {
  if (rounds.length === 0) {
    throw new RangeError('Strategy guide must contain at least one round');
  }
}

function buildTraceFrame(
  stepIndex: number,
  totalSteps: number,
  roundIndex: number,
  totalRounds: number,
  currentRound: ResolvedRound,
  counts: readonly number[],
): StrategyTraceFrame {
  return Object.freeze({
    stepIndex,
    totalSteps,
    roundIndex,
    totalRounds,
    currentRound,
    summary: new MatchupSummary(counts),
  });
}

/** Totals the score across all rounds using the supplied `RoundResolver`. */
export function scoreStrategyGuide(
  rounds: readonly StrategyRound[],
  resolver: RoundResolver,
): number {
  assertNonEmptyRounds(rounds);
  let total = 0;
  for (const round of rounds) {
    total += resolver.resolve(round).totalScore;
  }
  return total;
}

/** Simulates all rounds and emits up to `maxSteps` frozen cumulative `StrategyTraceFrame` snapshots. */
export function traceStrategyGuide(
  rounds: readonly StrategyRound[],
  resolver: RoundResolver,
  options?: TraceOptions,
): readonly StrategyTraceFrame[] {
  assertNonEmptyRounds(rounds);
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(rounds.length, maxSteps);
  const counts = new Array<number>(9).fill(0);
  const frames: StrategyTraceFrame[] = [];
  let sampleCursor = 0;

  for (let i = 0; i < rounds.length; i += 1) {
    const currentRound = resolver.resolve(rounds[i]!);
    const slot = currentRound.opponentShape * 3 + currentRound.playerShape;
    counts[slot] = counts[slot]! + 1;
    if (sampled[sampleCursor] === i) {
      frames.push(buildTraceFrame(sampleCursor, sampled.length, i, rounds.length, currentRound, counts));
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}
