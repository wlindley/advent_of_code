import { sampleTraceIndices, validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import {
  BufferedIoChannel, COMPLETE_MODES, COMPLETE_OPCODES, IntcodeMachine, SparseIntcodeMemory,
  createModeRegistry, createOpcodeRegistry, parseIntcodeProgram,
  type CompleteParameterMode, type IntcodeProgram,
} from '../../shared/intcode';
import { BoostReport, DEFAULT_MAX_MACHINE_STEPS, DEFAULT_MAX_TRACE_STEPS, type BoostMode, type BoostTraceFrame } from './boostModels';

const COMPLETE_OPCODE_REGISTRY = createOpcodeRegistry(COMPLETE_OPCODES);
const COMPLETE_MODE_REGISTRY = createModeRegistry(COMPLETE_MODES);

interface BoostSession {
  readonly memory: SparseIntcodeMemory;
  readonly machine: IntcodeMachine<CompleteParameterMode>;
}

function createBoostSession(program: IntcodeProgram, mode: BoostMode): BoostSession {
  const memory = new SparseIntcodeMemory(program.cells);
  const machine = new IntcodeMachine<CompleteParameterMode>(memory, COMPLETE_OPCODE_REGISTRY, {
    modes: COMPLETE_MODE_REGISTRY,
    io: new BufferedIoChannel([mode.inputSignal]),
  });
  return { memory, machine };
}

function assertCompletedBoost(machine: IntcodeMachine<CompleteParameterMode>): void {
  if (machine.status !== 'halted') {
    throw new Error(`BOOST program stopped with status "${machine.status}" before halting`);
  }
  if (machine.outputCount === 0) {
    throw new Error('BOOST program halted without emitting any output');
  }
}

function probeBoostSteps(program: IntcodeProgram, mode: BoostMode): number {
  const { machine } = createBoostSession(program, mode);
  const totalSteps = machine.run(DEFAULT_MAX_MACHINE_STEPS);
  assertCompletedBoost(machine);
  return totalSteps;
}

/** Runs a Day 9 BOOST program with mode.inputSignal and returns a frozen BoostReport. */
export function runBoost(program: IntcodeProgram, mode: BoostMode, maxSteps?: number): BoostReport {
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_MACHINE_STEPS);
  const { memory, machine } = createBoostSession(program, mode);
  const stepCount = machine.run(limit);
  assertCompletedBoost(machine);
  return new BoostReport(mode, machine.snapshotOutputs(), stepCount, machine.relativeBase, memory.sparseEntryCount);
}

/** Runs a BOOST program, asserts a single output code (no diagnostic error codes), and returns it. */
export function solveBoost(program: IntcodeProgram, mode: BoostMode): bigint {
  const report = runBoost(program, mode);
  if (report.outputs.length !== 1) {
    throw new Error(`BOOST reported malfunctioning opcodes before final code: [${report.diagnosticOutputs.join(', ')}]`);
  }
  return report.outputs[0]!;
}

/** Two-pass probe-then-capture trace capturing relative base and sparse memory snapshots. */
export function traceBoost(
  program: IntcodeProgram,
  mode: BoostMode,
  options?: TraceOptions,
): readonly BoostTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const totalSteps = probeBoostSteps(program, mode);
  const sampled = sampleTraceIndices(totalSteps, limit);
  const { memory, machine } = createBoostSession(program, mode);
  const frames: BoostTraceFrame[] = [];
  let cursor = 0;
  for (let i = 0; i < totalSteps; i += 1) {
    const relativeBaseBefore = machine.relativeBase;
    const step = machine.step();
    if (sampled[cursor] === i) {
      frames.push(Object.freeze({
        step, totalSteps, relativeBaseBefore, relativeBaseAfter: machine.relativeBase,
        memory: machine.snapshotMemory(), sparseEntries: memory.snapshotSparseEntries(),
        pendingInputs: machine.snapshotInputs(), outputs: machine.snapshotOutputs(),
      }));
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}

/** Frozen PuzzleSolver bound to a Day 9 BOOST operating mode. */
export class BoostSolver implements Required<PuzzleSolver<IntcodeProgram, bigint, BoostTraceFrame>> {
  readonly mode: BoostMode;

  constructor(mode: BoostMode) {
    this.mode = mode;
    Object.freeze(this);
  }

  parse(raw: string): IntcodeProgram {
    return parseIntcodeProgram(raw);
  }

  solve(program: IntcodeProgram): bigint {
    return solveBoost(program, this.mode);
  }

  trace(program: IntcodeProgram, options?: TraceOptions): readonly BoostTraceFrame[] {
    return traceBoost(program, this.mode, options);
  }
}
