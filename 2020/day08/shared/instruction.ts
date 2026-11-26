import {
  OPERATIONS_BY_OPCODE,
  resolveOperation,
  type InstructionOperation,
  type Opcode,
} from './operation';

const INSTRUCTION_PATTERN = /^([a-z]+) ([+-]\d+)$/;

/** Immutable boot-code instruction pairing an operation strategy with a signed safe integer argument. */
export class BootInstruction {
  readonly operation: InstructionOperation;
  readonly argument: number;

  constructor(operation: InstructionOperation, argument: number) {
    if (!Number.isSafeInteger(argument)) {
      throw new RangeError(`Instruction argument must be a safe integer, got ${argument}`);
    }
    this.operation = operation;
    // Normalize -0 to +0 branch-free so formatted output and equality are canonical.
    this.argument = argument + 0;
    Object.freeze(this);
  }

  get opcode(): Opcode {
    return this.operation.opcode;
  }

  get isToggleable(): boolean {
    return this.operation.toggledOpcode !== null;
  }

  get signedArgument(): string {
    return this.argument >= 0 ? `+${this.argument}` : `${this.argument}`;
  }

  get formatted(): string {
    return `${this.opcode} ${this.signedArgument}`;
  }

  nextPc(pc: number): number {
    return this.operation.nextPc(pc, this.argument);
  }

  nextAcc(accumulator: bigint): bigint {
    return this.operation.nextAcc(accumulator, this.argument);
  }

  toggled(): BootInstruction | null {
    const toggledOpcode = this.operation.toggledOpcode;
    if (toggledOpcode === null) {
      return null;
    }
    return new BootInstruction(OPERATIONS_BY_OPCODE[toggledOpcode], this.argument);
  }
}

/** Parses one boot-code line strictly matching `<opcode> <+|->digits`. */
export function parseBootInstruction(line: string): BootInstruction {
  const match = INSTRUCTION_PATTERN.exec(line);
  if (!match) {
    throw new Error(`Invalid boot instruction: "${line}"`);
  }
  const operation = resolveOperation(match[1]!);
  const argument = Number(match[2]!);
  return new BootInstruction(operation, argument);
}
