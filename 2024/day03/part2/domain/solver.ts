import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../../shared/core';
import { parseCorruptedMemory, ParsedMemory, type MemoryInstruction } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 200;

export interface ConditionalMulTraceFrame {
  readonly processedCount: number;
  readonly totalInstructions: number;
  readonly activeInstruction: MemoryInstruction | null;
  readonly enabled: boolean;
  readonly executedMulCount: number;
  readonly skippedMulCount: number;
  readonly runningSum: number;
}

interface ExecutionState {
  readonly enabled: boolean;
  readonly executedMulCount: number;
  readonly skippedMulCount: number;
  readonly runningSum: number;
}

const INITIAL_STATE: ExecutionState = Object.freeze({
  enabled: true,
  executedMulCount: 0,
  skippedMulCount: 0,
  runningSum: 0,
});

function nextGateState(enabled: boolean, inst: MemoryInstruction): boolean {
  if (inst.kind === 'do') return true;
  if (inst.kind === 'dont') return false;
  return enabled;
}

function applyInstruction(state: ExecutionState, inst: MemoryInstruction): ExecutionState {
  const enabled = nextGateState(state.enabled, inst);
  if (inst.kind !== 'mul') {
    return { ...state, enabled };
  }
  return {
    enabled,
    executedMulCount: state.executedMulCount + (enabled ? 1 : 0),
    skippedMulCount: state.skippedMulCount + (enabled ? 0 : 1),
    runningSum: state.runningSum + (enabled ? inst.product : 0),
  };
}

function createTraceFrame(
  processedCount: number,
  totalInstructions: number,
  activeInstruction: MemoryInstruction | null,
  state: ExecutionState,
): ConditionalMulTraceFrame {
  return Object.freeze({
    processedCount,
    totalInstructions,
    activeInstruction,
    enabled: state.enabled,
    executedMulCount: state.executedMulCount,
    skippedMulCount: state.skippedMulCount,
    runningSum: state.runningSum,
  });
}

/** Sums `x * y` across `mul(X,Y)` instructions executed while the `do()`/`don't()` gate is enabled. */
export function sumEnabledMultiplications(memory: ParsedMemory): number {
  let state = INITIAL_STATE;
  const instructions = memory.instructions;
  for (let i = 0; i < instructions.length; i += 1) {
    state = applyInstruction(state, instructions[i]!);
  }
  return state.runningSum;
}

/** Computes the frozen gate state after each instruction, aligned 1:1 with `memory.instructions`. */
export function computeInstructionStates(memory: ParsedMemory): readonly boolean[] {
  const instructions = memory.instructions;
  const states: boolean[] = [];
  let enabled = true;
  for (let i = 0; i < instructions.length; i += 1) {
    enabled = nextGateState(enabled, instructions[i]!);
    states.push(enabled);
  }
  return Object.freeze(states);
}

/** Traces conditional instruction execution sampled uniformly up to `maxSteps` frames. */
export function traceConditionalMultiplications(
  memory: ParsedMemory,
  options?: TraceOptions,
): readonly ConditionalMulTraceFrame[] {
  const instructions = memory.instructions;
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampledCounts = sampleTraceIndices(instructions.length + 1, limit);
  const frames: ConditionalMulTraceFrame[] = [];
  let sampleCursor = 0;
  let state = INITIAL_STATE;

  for (let processedCount = 0; processedCount <= instructions.length; processedCount += 1) {
    const activeInstruction = processedCount > 0 ? instructions[processedCount - 1]! : null;
    if (activeInstruction !== null) state = applyInstruction(state, activeInstruction);
    if (sampledCounts[sampleCursor] === processedCount) {
      frames.push(createTraceFrame(processedCount, instructions.length, activeInstruction, state));
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}

export const solver: PuzzleSolver<ParsedMemory, number, ConditionalMulTraceFrame> = Object.freeze({
  parse: parseCorruptedMemory,
  solve: sumEnabledMultiplications,
  trace: traceConditionalMultiplications,
});
