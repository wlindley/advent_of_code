import type { IntcodeProgram, MachineStatus } from '../../shared/intcode';

export const AMPLIFIER_LABELS: readonly string[] = Object.freeze(['A', 'B', 'C', 'D', 'E']);
export const INITIAL_THRUSTER_INPUT = 0n;
export const DEFAULT_MAX_STEPS_PER_AMP = 100_000;
export const DEFAULT_MAX_TRACE_FRAMES = 120;
export const LEADERBOARD_SIZE = 5;

export type CircuitModeId = 'series' | 'feedback';

function assertIntegerMin(value: number, min: number, label: string): void {
  if (!Number.isInteger(value) || value < min) {
    throw new RangeError(`${label} must be an integer >= ${min}, got ${value}`);
  }
}

export function compareLeaderboardEntries(a: LeaderboardEntry, b: LeaderboardEntry): number {
  if (b.run.thrusterSignal !== a.run.thrusterSignal) {
    return b.run.thrusterSignal > a.run.thrusterSignal ? 1 : -1;
  }
  return a.permutationIndex - b.permutationIndex;
}

/** Immutable execution telemetry for a single amplifier stage A..E. */
export class StageTelemetry {
  readonly label: string;
  readonly phase: bigint;
  readonly receivedSignals: readonly bigint[];
  readonly emittedSignals: readonly bigint[];
  readonly stepCount: number;
  readonly status: MachineStatus;

  constructor(
    label: string,
    phase: bigint,
    receivedSignals: readonly bigint[],
    emittedSignals: readonly bigint[],
    stepCount: number,
    status: MachineStatus,
  ) {
    assertIntegerMin(stepCount, 0, 'stepCount');
    this.label = label;
    this.phase = phase;
    this.receivedSignals = Object.freeze([...receivedSignals]);
    this.emittedSignals = Object.freeze([...emittedSignals]);
    this.stepCount = stepCount;
    this.status = status;
    Object.freeze(this);
  }

  get lastEmittedSignal(): bigint | null {
    const n = this.emittedSignals.length;
    return n === 0 ? null : this.emittedSignals[n - 1]!;
  }
}

/** Immutable evaluation outcome for one 5-stage phase permutation. */
export class CircuitRunResult {
  readonly phases: readonly bigint[];
  readonly stages: readonly StageTelemetry[];
  readonly rounds: number;

  constructor(phases: readonly bigint[], stages: readonly StageTelemetry[], rounds: number) {
    if (phases.length !== AMPLIFIER_LABELS.length) throw new RangeError(`Expected ${AMPLIFIER_LABELS.length} phases, got ${phases.length}`);
    if (stages.length !== AMPLIFIER_LABELS.length) throw new RangeError(`Expected ${AMPLIFIER_LABELS.length} stages, got ${stages.length}`);
    if (stages[AMPLIFIER_LABELS.length - 1]!.emittedSignals.length < 1) throw new Error('Final amplifier stage E produced no thruster signal');
    assertIntegerMin(rounds, 1, 'rounds');
    this.phases = Object.freeze([...phases]);
    this.stages = Object.freeze([...stages]);
    this.rounds = rounds;
    Object.freeze(this);
  }

  get thrusterSignal(): bigint {
    return this.stages[AMPLIFIER_LABELS.length - 1]!.lastEmittedSignal!;
  }

  get totalSteps(): number {
    let total = 0;
    for (const stage of this.stages) total += stage.stepCount;
    return total;
  }
}

export interface LeaderboardEntry {
  readonly permutationIndex: number;
  readonly run: CircuitRunResult;
}

/** Immutable search summary across all phase permutations for an amplifier circuit. */
export class AmplifierSearchResult {
  readonly runs: readonly CircuitRunResult[];

  constructor(runs: readonly CircuitRunResult[]) {
    if (runs.length < 1) throw new RangeError('AmplifierSearchResult requires at least one run');
    this.runs = Object.freeze([...runs]);
    Object.freeze(this);
  }

  get bestRun(): CircuitRunResult {
    let best = this.runs[0]!;
    for (let i = 1; i < this.runs.length; i += 1) {
      const candidate = this.runs[i]!;
      if (candidate.thrusterSignal > best.thrusterSignal) best = candidate;
    }
    return best;
  }

  topRuns(limit: number): readonly LeaderboardEntry[] {
    assertIntegerMin(limit, 1, 'limit');
    const entries: LeaderboardEntry[] = [];
    for (let i = 0; i < this.runs.length; i += 1) {
      entries.push(Object.freeze({ permutationIndex: i, run: this.runs[i]! }));
    }
    entries.sort(compareLeaderboardEntries);
    return Object.freeze(entries.slice(0, limit));
  }
}

export interface AmplifierTraceFrame {
  readonly permutationIndex: number;
  readonly totalPermutations: number;
  readonly run: CircuitRunResult;
  readonly bestEntry: LeaderboardEntry;
  readonly isNewBest: boolean;
  readonly topEntries: readonly LeaderboardEntry[];
  readonly minSignal: bigint;
  readonly maxSignal: bigint;
}

export interface AmplifierCircuitMode {
  readonly id: CircuitModeId;
  readonly name: string;
  readonly phaseSettings: readonly bigint[];
  readonly hasFeedbackLoop: boolean;
  evaluate(program: IntcodeProgram, phases: readonly bigint[], maxStepsPerAmp: number): CircuitRunResult;
}
