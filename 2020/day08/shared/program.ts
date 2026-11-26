import { parseBootInstruction, type BootInstruction } from './instruction';

const OUTER_BLANK_LINES_PATTERN = /^(?:[ \t]*\r?\n)+|(?:\r?\n[ \t]*)+$/g;

/** Immutable validated boot-code program containing at least one instruction. */
export class BootProgram {
  readonly instructions: readonly BootInstruction[];

  constructor(instructions: readonly BootInstruction[]) {
    if (instructions.length === 0) {
      throw new Error('BootProgram must contain at least one instruction');
    }
    this.instructions = Object.freeze([...instructions]);
    Object.freeze(this);
  }

  get length(): number {
    return this.instructions.length;
  }

  at(pc: number): BootInstruction {
    if (!Number.isInteger(pc) || pc < 0 || pc >= this.instructions.length) {
      throw new RangeError(`Program counter out of bounds: ${pc}`);
    }
    return this.instructions[pc]!;
  }

  withToggledAt(index: number): BootProgram {
    const replacement = this.at(index).toggled();
    if (!replacement) {
      throw new Error(`Instruction at index ${index} (${this.at(index).opcode}) is not toggleable`);
    }
    const next = [...this.instructions];
    next[index] = replacement;
    return new BootProgram(next);
  }
}

/** Parses raw boot code by trimming outer blank lines and rejecting internal blank lines. */
export function parseBootProgram(raw: string): BootProgram {
  const trimmed = raw.replace(OUTER_BLANK_LINES_PATTERN, '');
  if (trimmed.trim() === '') {
    throw new Error('Boot program input cannot be empty');
  }
  const instructions = trimmed.split(/\r?\n/).map(parseBootInstruction);
  return new BootProgram(instructions);
}
