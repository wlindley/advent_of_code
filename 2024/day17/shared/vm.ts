import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import { disassembleProgram, formatOperand, OPCODE_TABLE, type StepOutcome } from './opcodes';
import {
  ChronospatialProgram,
  DEFAULT_MAX_EXECUTION_STEPS,
  DEFAULT_MAX_TRACE_STEPS,
  VmRegisters,
  type DisassembledInstruction,
  type ExecutedAction,
  type ThreeBitValue,
  type VmRunResult,
  type VmTraceFrame,
} from './types';

export interface VmRunOptions {
  readonly maxSteps?: number;
}

export type VmTraceOptions = TraceOptions;

/** Formats emitted 3-bit output values as a comma-separated string. */
export function formatOutput(output: readonly ThreeBitValue[]): string {
  return output.join(',');
}

/** Executes `program` until `ip + 1 >= instructions.length`, guarding against infinite loops. */
export function runProgram(program: ChronospatialProgram, options?: VmRunOptions): VmRunResult {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_EXECUTION_STEPS);
  const { instructions } = program;
  const output: ThreeBitValue[] = [];
  let registers = program.initialRegisters;
  let ip = 0;
  let stepsExecuted = 0;

  while (ip + 1 < instructions.length) {
    if (stepsExecuted >= maxSteps) {
      throw new RangeError(`VM execution exceeded maxSteps (${maxSteps}) at ip=${ip}`);
    }
    const outcome = OPCODE_TABLE[instructions[ip]!].execute(instructions[ip + 1]!, registers, ip);
    registers = outcome.registers;
    ip = outcome.nextIp;
    if (outcome.emitted !== null) output.push(outcome.emitted);
    stepsExecuted += 1;
  }

  return Object.freeze({ finalRegisters: registers, finalIp: ip, stepsExecuted, output: Object.freeze(output) });
}

function buildAction(
  step: number,
  ip: number,
  opcode: ThreeBitValue,
  operand: ThreeBitValue,
  outcome: StepOutcome,
): ExecutedAction {
  const spec = OPCODE_TABLE[opcode];
  return Object.freeze({
    step, ip, opcode, operand,
    mnemonic: spec.mnemonic,
    operandMode: spec.operandMode,
    operandLabel: formatOperand(spec.operandMode, operand),
    nextIp: outcome.nextIp,
    jumped: spec.mnemonic === 'jnz' && outcome.nextIp !== ip + 2,
    emitted: outcome.emitted,
  });
}

function makeFrame(
  step: number,
  ip: number,
  registers: VmRegisters,
  prevRegisters: VmRegisters | null,
  output: readonly ThreeBitValue[],
  lastAction: ExecutedAction | null,
  totalSteps: number,
  program: ChronospatialProgram,
  disassembly: readonly DisassembledInstruction[],
): VmTraceFrame {
  return Object.freeze({
    step, ip, registers, prevRegisters,
    output: Object.freeze([...output]),
    lastAction,
    halted: ip + 1 >= program.instructions.length,
    totalSteps, program, disassembly,
  });
}

/** Captures a bounded 2-pass execution trace of `program` preserving initial and halted states. */
export function traceProgram(program: ChronospatialProgram, options?: VmTraceOptions): readonly VmTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const { stepsExecuted } = runProgram(program);
  const sampled = sampleTraceIndices(stepsExecuted + 1, limit);
  const disassembly = disassembleProgram(program);
  const frames: VmTraceFrame[] = [];
  const output: ThreeBitValue[] = [];
  let [registers, prevRegisters, ip, lastAction, cursor] = [
    program.initialRegisters, null as VmRegisters | null, 0, null as ExecutedAction | null, 0,
  ];
  if (sampled[cursor] === 0) {
    frames.push(makeFrame(0, ip, registers, prevRegisters, output, lastAction, stepsExecuted, program, disassembly));
    cursor += 1;
  }
  for (let step = 1; step <= stepsExecuted; step += 1) {
    const [opcode, operand] = [program.instructions[ip]!, program.instructions[ip + 1]!];
    const outcome = OPCODE_TABLE[opcode].execute(operand, registers, ip);
    [prevRegisters, registers] = [registers, outcome.registers];
    lastAction = buildAction(step, ip, opcode, operand, outcome);
    ip = outcome.nextIp;
    if (outcome.emitted !== null) output.push(outcome.emitted);
    if (sampled[cursor] === step) {
      frames.push(makeFrame(step, ip, registers, prevRegisters, output, lastAction, stepsExecuted, program, disassembly));
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}
