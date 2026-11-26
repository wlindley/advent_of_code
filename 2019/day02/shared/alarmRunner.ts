import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../shared/core';
import {
  CORE_OPCODES,
  IntcodeMachine,
  createOpcodeRegistry,
  parseIntcodeProgram,
  type IntcodeProgram,
  type IntcodeStep,
} from '../../shared/intcode';

/** Default trace frame cap to keep browser visualization responsive on large tapes. */
export const DEFAULT_MAX_TRACE_STEPS = 120;

/** Safety execution cap to prevent runaway Intcode programs from hanging. */
export const DEFAULT_MAX_MACHINE_STEPS = 100_000;

/** Official 1202 Program Alarm restoration inputs for Day 2 Part 1. */
export const ALARM_1202_INPUTS: GravityAssistInputs = Object.freeze({ noun: 12n, verb: 2n });

const CORE_REGISTRY = createOpcodeRegistry(CORE_OPCODES);

/** Noun/verb override values written to addresses 1 and 2 before execution. */
export interface GravityAssistInputs {
  readonly noun: bigint;
  readonly verb: bigint;
}

/** Sampled execution frame emitted for Day 2 interactive visualization. */
export interface AlarmTraceFrame {
  readonly step: IntcodeStep;
  readonly totalSteps: number;
  readonly memory: readonly bigint[];
}

/** Returns a patched IntcodeProgram with noun at address 1 and verb at address 2. */
export function patchProgramInputs(
  program: IntcodeProgram,
  inputs: GravityAssistInputs,
): IntcodeProgram {
  return program.withPatches([
    { address: 1n, value: inputs.noun },
    { address: 2n, value: inputs.verb },
  ]);
}

/** Patches noun/verb inputs, runs the program to halt, and returns address 0. */
export function runGravityAssist(
  program: IntcodeProgram,
  inputs: GravityAssistInputs,
): bigint {
  const patched = patchProgramInputs(program, inputs);
  const machine = IntcodeMachine.fromProgram(patched, CORE_REGISTRY);
  machine.run(DEFAULT_MAX_MACHINE_STEPS);
  return machine.readMemory(0n);
}

/** Two-pass probe-then-capture trace that snapshots memory only on sampled steps. */
export function traceGravityAssist(
  program: IntcodeProgram,
  inputs: GravityAssistInputs,
  options?: TraceOptions,
): readonly AlarmTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const patched = patchProgramInputs(program, inputs);
  const totalSteps = IntcodeMachine.fromProgram(patched, CORE_REGISTRY).run(DEFAULT_MAX_MACHINE_STEPS);
  const sampled = sampleTraceIndices(totalSteps, limit);

  const machine = IntcodeMachine.fromProgram(patched, CORE_REGISTRY);
  const frames: AlarmTraceFrame[] = [];
  let cursor = 0;
  for (let i = 0; i < totalSteps; i += 1) {
    const step = machine.step();
    if (sampled[cursor] === i) {
      frames.push(Object.freeze({ step, totalSteps, memory: machine.snapshotMemory() }));
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}

/** Creates a frozen PuzzleSolver bound to fixed Day 2 noun/verb inputs. */
export function createAlarmSolver(
  inputs: GravityAssistInputs,
): Required<PuzzleSolver<IntcodeProgram, bigint, AlarmTraceFrame>> {
  return Object.freeze({
    parse: parseIntcodeProgram,
    solve(program: IntcodeProgram): bigint {
      return runGravityAssist(program, inputs);
    },
    trace(program: IntcodeProgram, options?: TraceOptions): readonly AlarmTraceFrame[] {
      return traceGravityAssist(program, inputs, options);
    },
  });
}
