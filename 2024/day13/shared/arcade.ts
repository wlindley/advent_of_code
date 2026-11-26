import {
  type PuzzleSolver,
  sampleTraceIndices,
  type TraceOptions,
  validateMaxSteps,
} from '../../../shared/core';
import { type ClawMachine, parseClawMachines } from './machine';
import { solveClawMachine } from './solver';
import type { ClawConfig, MachineOutcome } from './types';

export const DEFAULT_MAX_TRACE_STEPS = 80;

/** Initializer fields for a `ClawTraceFrame`. */
export interface ClawTraceFrameInit {
  readonly machineIndex: number;
  readonly totalMachines: number;
  readonly machine: ClawMachine;
  readonly outcome: MachineOutcome;
  readonly cumulativeWins: number;
  readonly cumulativeTokens: bigint;
}

/** Immutable trace snapshot for evaluating one claw machine in an arcade run. */
export class ClawTraceFrame {
  readonly machineIndex: number;
  readonly totalMachines: number;
  readonly machine: ClawMachine;
  readonly outcome: MachineOutcome;
  readonly cumulativeWins: number;
  readonly cumulativeTokens: bigint;

  constructor(init: ClawTraceFrameInit) {
    this.machineIndex = init.machineIndex;
    this.totalMachines = init.totalMachines;
    this.machine = init.machine;
    this.outcome = init.outcome;
    this.cumulativeWins = init.cumulativeWins;
    this.cumulativeTokens = init.cumulativeTokens;
    Object.freeze(this);
  }

  /** Tokens spent on this machine (`0n` if unwinnable), derived dynamically from `outcome`. */
  get tokens(): bigint {
    return this.outcome.winnable ? this.outcome.solution.tokens : 0n;
  }
}

/** Sums minimum winning tokens across all winnable machines under `config`. */
export function evaluateClawArcade(machines: readonly ClawMachine[], config: ClawConfig): bigint {
  let total = 0n;
  for (const machine of machines) {
    const outcome = solveClawMachine(machine, config);
    if (outcome.winnable) total += outcome.solution.tokens;
  }
  return total;
}

/** Traces machine evaluations uniformly sampled up to `maxSteps` frames. */
export function traceClawArcade(
  machines: readonly ClawMachine[],
  config: ClawConfig,
  options?: TraceOptions,
): readonly ClawTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(machines.length, limit);
  const frames: ClawTraceFrame[] = [];
  let cumulativeWins = 0;
  let cumulativeTokens = 0n;
  let cursor = 0;

  for (let i = 0; i < machines.length; i += 1) {
    const machine = machines[i]!;
    const outcome = solveClawMachine(machine, config);
    if (outcome.winnable) {
      cumulativeWins += 1;
      cumulativeTokens += outcome.solution.tokens;
    }
    if (sampled[cursor] === i) {
      frames.push(
        new ClawTraceFrame({
          machineIndex: i,
          totalMachines: machines.length,
          machine,
          outcome,
          cumulativeWins,
          cumulativeTokens,
        }),
      );
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}

/** Creates a frozen `PuzzleSolver` parameterized by `config` (Part 1 or Part 2). */
export function createClawContraptionSolver(
  config: ClawConfig,
): PuzzleSolver<readonly ClawMachine[], bigint, ClawTraceFrame> {
  return Object.freeze({
    parse: (raw: string): readonly ClawMachine[] => parseClawMachines(raw),
    solve: (machines: readonly ClawMachine[]): bigint => evaluateClawArcade(machines, config),
    trace: (machines: readonly ClawMachine[], options?: TraceOptions): readonly ClawTraceFrame[] =>
      traceClawArcade(machines, config, options),
  });
}
