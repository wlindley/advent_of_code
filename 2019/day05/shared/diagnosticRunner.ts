import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../shared/core';
import {
  BufferedIoChannel,
  IntcodeMachine,
  STANDARD_OPCODES,
  createOpcodeRegistry,
  parseIntcodeProgram,
  type DetailedIntcodeStep,
  type IntcodeProgram,
} from '../../shared/intcode';

/** System ID 1 supplied to the TEST diagnostic program in Day 5 Part 1. */
export const AIR_CONDITIONER_SYSTEM_ID = 1n;

/** System ID 5 supplied to the TEST diagnostic program in Day 5 Part 2. */
export const THERMAL_RADIATOR_SYSTEM_ID = 5n;

/** Default trace frame cap to keep browser visualization responsive. */
export const DEFAULT_MAX_TRACE_STEPS = 160;

/** Safety execution cap to prevent runaway Intcode programs from hanging. */
export const DEFAULT_MAX_MACHINE_STEPS = 100_000;

const STANDARD_REGISTRY = createOpcodeRegistry(STANDARD_OPCODES);

/** Immutable diagnostic execution report with derived test-pass and final-code getters. */
export class DiagnosticReport {
  readonly systemId: bigint;
  readonly outputs: readonly bigint[];
  readonly stepCount: number;

  constructor(systemId: bigint, outputs: readonly bigint[], stepCount: number) {
    if (outputs.length === 0) {
      throw new Error('Diagnostic program halted without emitting any output');
    }
    this.systemId = systemId;
    this.outputs = Object.freeze([...outputs]);
    this.stepCount = stepCount;
    Object.freeze(this);
  }

  get diagnosticCode(): bigint {
    return this.outputs[this.outputs.length - 1]!;
  }

  get testOutputs(): readonly bigint[] {
    return Object.freeze(this.outputs.slice(0, -1));
  }

  get allTestsPassed(): boolean {
    for (let i = 0; i < this.outputs.length - 1; i += 1) {
      if (this.outputs[i] !== 0n) {
        return false;
      }
    }
    return true;
  }
}

/** Sampled execution frame emitted for Day 5 interactive visualization. */
export interface DiagnosticTraceFrame {
  readonly step: DetailedIntcodeStep;
  readonly totalSteps: number;
  readonly memory: readonly bigint[];
  readonly pendingInputs: readonly bigint[];
  readonly outputs: readonly bigint[];
}

function createDiagnosticMachine(program: IntcodeProgram, systemId: bigint): IntcodeMachine {
  return IntcodeMachine.fromProgram(program, STANDARD_REGISTRY, {
    io: new BufferedIoChannel([systemId]),
  });
}

function assertCompletedDiagnostic(machine: IntcodeMachine): void {
  if (machine.status !== 'halted') {
    throw new Error(`Diagnostic program stopped with status "${machine.status}" before halting`);
  }
  if (machine.outputCount === 0) {
    throw new Error('Diagnostic program halted without emitting any output');
  }
}

function probeDiagnosticSteps(program: IntcodeProgram, systemId: bigint): number {
  const probe = createDiagnosticMachine(program, systemId);
  const totalSteps = probe.run(DEFAULT_MAX_MACHINE_STEPS);
  assertCompletedDiagnostic(probe);
  return totalSteps;
}

/** Runs a diagnostic Intcode program with systemId and returns a frozen DiagnosticReport. */
export function runDiagnostic(
  program: IntcodeProgram,
  systemId: bigint,
  maxSteps?: number,
): DiagnosticReport {
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_MACHINE_STEPS);
  const machine = createDiagnosticMachine(program, systemId);
  const stepCount = machine.run(limit);
  assertCompletedDiagnostic(machine);
  return new DiagnosticReport(systemId, machine.snapshotOutputs(), stepCount);
}

/** Runs a diagnostic Intcode program, asserts all prior test outputs are 0, and returns final code. */
export function solveDiagnostic(program: IntcodeProgram, systemId: bigint): bigint {
  const report = runDiagnostic(program, systemId, DEFAULT_MAX_MACHINE_STEPS);
  if (!report.allTestsPassed) {
    throw new Error(`Diagnostic tests failed before final code: [${report.testOutputs.join(', ')}]`);
  }
  return report.diagnosticCode;
}

/** Two-pass probe-then-capture trace that preserves failing intermediate outputs for inspection. */
export function traceDiagnostic(
  program: IntcodeProgram,
  systemId: bigint,
  options?: TraceOptions,
): readonly DiagnosticTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const totalSteps = probeDiagnosticSteps(program, systemId);
  const sampled = sampleTraceIndices(totalSteps, limit);

  const machine = createDiagnosticMachine(program, systemId);
  const frames: DiagnosticTraceFrame[] = [];
  let cursor = 0;
  for (let i = 0; i < totalSteps; i += 1) {
    const step = machine.step();
    if (sampled[cursor] === i) {
      frames.push(
        Object.freeze({
          step,
          totalSteps,
          memory: machine.snapshotMemory(),
          pendingInputs: machine.snapshotInputs(),
          outputs: machine.snapshotOutputs(),
        }),
      );
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}

/** Frozen PuzzleSolver bound to a Day 5 diagnostic system ID. */
export class DiagnosticSolver
  implements Required<PuzzleSolver<IntcodeProgram, bigint, DiagnosticTraceFrame>>
{
  readonly systemId: bigint;

  constructor(systemId: bigint) {
    this.systemId = systemId;
    Object.freeze(this);
  }

  parse(raw: string): IntcodeProgram {
    return parseIntcodeProgram(raw);
  }

  solve(program: IntcodeProgram): bigint {
    return solveDiagnostic(program, this.systemId);
  }

  trace(program: IntcodeProgram, options?: TraceOptions): readonly DiagnosticTraceFrame[] {
    return traceDiagnostic(program, this.systemId, options);
  }
}

/** Creates a frozen PuzzleSolver bound to the given Day 5 diagnostic system ID. */
export function createDiagnosticSolver(systemId: bigint): DiagnosticSolver {
  return new DiagnosticSolver(systemId);
}
