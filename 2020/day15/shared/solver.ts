import { sampleTraceIndices, validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { LastSeenTable, playMemoryGame, RecentTurnBuffer, type RecentTurnEntry, type TurnOrigin } from './engine';
import {
  DEFAULT_MAX_TRACE_STEPS,
  DENSE_TRACE_PREFIX,
  MAX_TRACE_TURN,
  parseStartingSequence,
  RECENT_WINDOW_SIZE,
  StartingSequence,
  validateTargetTurn,
} from './model';

export interface MemoryGameTraceFrameInit {
  readonly turn: number;
  readonly targetTurn: number;
  readonly traceHorizon: number;
  readonly spoken: number;
  readonly origin: TurnOrigin;
  readonly considered: number | null;
  readonly previousTurn: number | null;
  readonly distinctCount: number;
  readonly zeroCount: number;
  readonly maxSpoken: number;
  readonly recentTurns: readonly RecentTurnEntry[];
}

function countByOrigin(entries: readonly RecentTurnEntry[], origin: TurnOrigin): number {
  let count = 0;
  for (const entry of entries) if (entry.origin === origin) count += 1;
  return count;
}

/** Immutable snapshot of a single sampled turn in the memory game trace. */
export class MemoryGameTraceFrame {
  readonly turn: number;
  readonly targetTurn: number;
  readonly traceHorizon: number;
  readonly spoken: number;
  readonly origin: TurnOrigin;
  readonly considered: number | null;
  readonly previousTurn: number | null;
  readonly distinctCount: number;
  readonly zeroCount: number;
  readonly maxSpoken: number;
  readonly recentTurns: readonly RecentTurnEntry[];

  constructor(init: MemoryGameTraceFrameInit) {
    this.turn = init.turn;
    this.targetTurn = init.targetTurn;
    this.traceHorizon = init.traceHorizon;
    this.spoken = init.spoken;
    this.origin = init.origin;
    this.considered = init.considered;
    this.previousTurn = init.previousTurn;
    this.distinctCount = init.distinctCount;
    this.zeroCount = init.zeroCount;
    this.maxSpoken = init.maxSpoken;
    this.recentTurns = Object.freeze([...init.recentTurns]);
    Object.freeze(this);
  }

  get isFinal(): boolean { return this.turn === this.traceHorizon; }
  get isHorizonTruncated(): boolean { return this.traceHorizon < this.targetTurn; }
  get age(): number | null { return this.previousTurn === null ? null : this.turn - 1 - this.previousTurn; }
  get seedCount(): number { return countByOrigin(this.recentTurns, 'seed'); }
  get repeatRatio(): number {
    return this.recentTurns.length === 0 ? 0 : countByOrigin(this.recentTurns, 'repeat') / this.recentTurns.length;
  }
}

/** Builds strictly increasing 1-based turn numbers up to `horizon` capped at `maxSteps`. */
export function buildTraceTurns(horizon: number, maxSteps: number): readonly number[] {
  if (!Number.isInteger(horizon) || horizon < 1) {
    throw new RangeError(`horizon must be a positive integer, got ${horizon}`);
  }
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  if (horizon <= limit) return Object.freeze(Array.from({ length: horizon }, (_, idx) => idx + 1));
  if (limit === 1) return Object.freeze([horizon]);
  const denseCount = Math.min(DENSE_TRACE_PREFIX, limit - 1);
  const turns: number[] = Array.from({ length: denseCount }, (_, idx) => idx + 1);
  const tailIndices = sampleTraceIndices(horizon - denseCount, limit - denseCount);
  for (const offset of tailIndices) turns.push(denseCount + 1 + offset);
  return Object.freeze(turns);
}

function resolveTurnStep(
  turn: number,
  seeds: readonly number[],
  prevSpoken: number,
  prevLookup: number,
): Omit<RecentTurnEntry, 'turn'> {
  if (turn <= seeds.length) {
    return { spoken: seeds[turn - 1]!, origin: 'seed', considered: null, previousTurn: null };
  }
  if (prevLookup === 0) {
    return { spoken: 0, origin: 'novel', considered: prevSpoken, previousTurn: null };
  }
  return { spoken: turn - 1 - prevLookup, origin: 'repeat', considered: prevSpoken, previousTurn: prevLookup };
}

function runTraceSimulation(
  seeds: readonly number[],
  targetTurn: number,
  horizon: number,
  selectedTurns: readonly number[],
): readonly MemoryGameTraceFrame[] {
  const table = new LastSeenTable(horizon);
  const recent = new RecentTurnBuffer(RECENT_WINDOW_SIZE);
  const frames: MemoryGameTraceFrame[] = [];
  let [selectIdx, prevSpoken, prevLookup, distinctCount, zeroCount, maxSpoken] = [0, 0, 0, 0, 0, 0];

  for (let turn = 1; turn <= horizon; turn += 1) {
    const step = resolveTurnStep(turn, seeds, prevSpoken, prevLookup);
    prevLookup = table.exchange(step.spoken, turn);
    prevSpoken = step.spoken;
    if (prevLookup === 0) distinctCount += 1;
    if (step.spoken === 0) zeroCount += 1;
    if (step.spoken > maxSpoken) maxSpoken = step.spoken;
    recent.push({ turn, ...step });
    if (turn === selectedTurns[selectIdx]) {
      frames.push(new MemoryGameTraceFrame({
        turn, targetTurn, traceHorizon: horizon, ...step,
        distinctCount, zeroCount, maxSpoken, recentTurns: recent.snapshot(),
      }));
      selectIdx += 1;
    }
  }
  return Object.freeze(frames);
}

/** Parameterized Advent of Code 2020 Day 15 solver supporting Part 1 and Part 2 targets. */
export class MemoryGameSolver
  implements Required<PuzzleSolver<StartingSequence, number, MemoryGameTraceFrame>>
{
  readonly targetTurn: number;

  constructor(targetTurn: number) {
    this.targetTurn = validateTargetTurn(targetTurn);
    Object.freeze(this);
  }

  get traceHorizon(): number { return Math.min(this.targetTurn, MAX_TRACE_TURN); }
  parse(raw: string): StartingSequence { return parseStartingSequence(raw); }
  solve(input: StartingSequence): number { return playMemoryGame(input, this.targetTurn); }

  trace(input: StartingSequence, options?: TraceOptions): readonly MemoryGameTraceFrame[] {
    const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    const horizon = this.traceHorizon;
    return runTraceSimulation(input.values, this.targetTurn, horizon, buildTraceTurns(horizon, limit));
  }
}
