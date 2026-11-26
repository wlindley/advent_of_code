/** Initial value of CPU register X before cycle 1. */
export const INITIAL_REGISTER_X = 1;

/** Horizontal pixel resolution of the CRT display. */
export const CRT_WIDTH = 40;

/** Vertical scanline count of the CRT display. */
export const CRT_HEIGHT = 6;

const ADDX_LINE_PATTERN = /^addx (0|-?[1-9]\d*)$/;

/** Single-cycle no-op instruction. */
export type NoopInstruction = { readonly kind: 'noop' };

/** Two-cycle add-to-X instruction. */
export type AddxInstruction = { readonly kind: 'addx'; readonly delta: number };

/** Immutable discriminated union of supported CPU instructions. */
export type CpuInstruction = NoopInstruction | AddxInstruction;

/** Returns the clock cycle duration of an instruction. */
export function instructionCycles(instr: CpuInstruction): 1 | 2 {
  return instr.kind === 'noop' ? 1 : 2;
}

/** Formats an instruction back into canonical assembly text. */
export function formatInstruction(instr: CpuInstruction): string {
  return instr.kind === 'noop' ? 'noop' : `addx ${instr.delta}`;
}

function freezeValidatedInstruction(instr: CpuInstruction, index: number): CpuInstruction {
  if (instr.kind === 'noop') {
    return Object.freeze({ kind: 'noop' });
  }
  if (!Number.isSafeInteger(instr.delta)) {
    throw new RangeError(`Unsafe addx delta at instruction ${index + 1}: ${instr.delta}`);
  }
  return Object.freeze({ kind: 'addx', delta: instr.delta });
}

function parseInstructionLine(line: string, lineNumber: number): CpuInstruction {
  if (line === 'noop') {
    return Object.freeze({ kind: 'noop' });
  }
  const match = ADDX_LINE_PATTERN.exec(line);
  if (!match) {
    throw new Error(`Invalid instruction at line ${lineNumber}: ${JSON.stringify(line)}`);
  }
  const rawDelta = match[1]!;
  const delta = Number(rawDelta);
  if (!Number.isSafeInteger(delta)) {
    throw new RangeError(`Unsafe addx operand at line ${lineNumber}: ${rawDelta}`);
  }
  return Object.freeze({ kind: 'addx', delta });
}

/** Immutable, non-empty sequence of validated CPU instructions. */
export class CpuProgram {
  readonly instructions: readonly CpuInstruction[];

  constructor(instructions: readonly CpuInstruction[]) {
    if (instructions.length === 0) {
      throw new Error('CPU program must contain at least one instruction');
    }
    this.instructions = Object.freeze(instructions.map(freezeValidatedInstruction));
    Object.freeze(this);
  }

  /** Number of instructions in the program. */
  get instructionCount(): number {
    return this.instructions.length;
  }

  /** Total clock cycles required to execute the program. */
  get totalCycles(): number {
    let total = 0;
    for (const instr of this.instructions) {
      total += instructionCycles(instr);
    }
    return total;
  }

  /** Parses raw newline-delimited assembly text into a frozen CpuProgram. */
  static parse(raw: string): CpuProgram {
    const normalized = raw.replace(/\r\n/g, '\n').replace(/^\n+|\n+$/g, '');
    if (normalized.length === 0) {
      throw new Error('CPU program input must not be empty');
    }
    const lines = normalized.split('\n');
    const instructions = lines.map((line, index) => parseInstructionLine(line, index + 1));
    return new CpuProgram(instructions);
  }
}
