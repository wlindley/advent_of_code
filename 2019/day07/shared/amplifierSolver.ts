import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../shared/core';
import { parseIntcodeProgram, type IntcodeProgram } from '../../shared/intcode';
import {
  AmplifierSearchResult,
  DEFAULT_MAX_STEPS_PER_AMP,
  DEFAULT_MAX_TRACE_FRAMES,
  LEADERBOARD_SIZE,
  compareLeaderboardEntries,
  type AmplifierCircuitMode,
  type AmplifierTraceFrame,
  type CircuitRunResult,
  type LeaderboardEntry,
} from './circuitModels';
import { generatePermutations } from './permutations';

function insertLeaderboardEntry(board: LeaderboardEntry[], entry: LeaderboardEntry): void {
  board.push(entry);
  board.sort(compareLeaderboardEntries);
  if (board.length > LEADERBOARD_SIZE) {
    board.length = LEADERBOARD_SIZE;
  }
}

function makeTraceFrame(
  permutationIndex: number,
  totalPermutations: number,
  run: CircuitRunResult,
  bestEntry: LeaderboardEntry,
  isNewBest: boolean,
  leaderboard: readonly LeaderboardEntry[],
  minSignal: bigint,
): AmplifierTraceFrame {
  return Object.freeze({
    permutationIndex,
    totalPermutations,
    run,
    bestEntry,
    isNewBest,
    topEntries: Object.freeze([...leaderboard]),
    minSignal,
    maxSignal: bestEntry.run.thrusterSignal,
  });
}

function buildTraceFrames(
  runs: readonly CircuitRunResult[],
  sampled: ReadonlySet<number>,
): readonly AmplifierTraceFrame[] {
  const leaderboard: LeaderboardEntry[] = [];
  const frames: AmplifierTraceFrame[] = [];
  let bestEntry: LeaderboardEntry = Object.freeze({ permutationIndex: 0, run: runs[0]! });
  let minSignal = bestEntry.run.thrusterSignal;

  for (let i = 0; i < runs.length; i += 1) {
    const run = runs[i]!;
    const signal = run.thrusterSignal;
    const entry: LeaderboardEntry = Object.freeze({ permutationIndex: i, run });
    const isNewBest = i === 0 || signal > bestEntry.run.thrusterSignal;
    if (isNewBest) bestEntry = entry;
    if (signal < minSignal) minSignal = signal;
    insertLeaderboardEntry(leaderboard, entry);
    if (sampled.has(i)) {
      frames.push(makeTraceFrame(i, runs.length, run, bestEntry, isNewBest, leaderboard, minSignal));
    }
  }
  return Object.freeze(frames);
}

/** Pure solver searching all phase permutations for a parameterized AmplifierCircuitMode. */
export class AmplifierCircuitSolver
  implements Required<PuzzleSolver<IntcodeProgram, bigint, AmplifierTraceFrame>>
{
  readonly mode: AmplifierCircuitMode;
  readonly maxStepsPerAmp: number;

  constructor(mode: AmplifierCircuitMode, maxStepsPerAmp?: number) {
    this.mode = mode;
    this.maxStepsPerAmp = validateMaxSteps(maxStepsPerAmp, DEFAULT_MAX_STEPS_PER_AMP);
  }

  parse(raw: string): IntcodeProgram {
    return parseIntcodeProgram(raw);
  }

  evaluate(program: IntcodeProgram, phases: readonly bigint[]): CircuitRunResult {
    return this.mode.evaluate(program, phases, this.maxStepsPerAmp);
  }

  search(program: IntcodeProgram): AmplifierSearchResult {
    const permutations = generatePermutations(this.mode.phaseSettings);
    const runs: CircuitRunResult[] = [];
    for (const phases of permutations) {
      runs.push(this.evaluate(program, phases));
    }
    return new AmplifierSearchResult(runs);
  }

  solve(program: IntcodeProgram): bigint {
    return this.search(program).bestRun.thrusterSignal;
  }

  trace(program: IntcodeProgram, options?: TraceOptions): readonly AmplifierTraceFrame[] {
    const runs = this.search(program).runs;
    const maxFrames = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_FRAMES);
    const sampled = new Set(sampleTraceIndices(runs.length, maxFrames));
    return buildTraceFrames(runs, sampled);
  }
}
