export type ThreeBitValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type OpcodeMnemonic = 'adv' | 'bxl' | 'bst' | 'jnz' | 'bxc' | 'out' | 'bdv' | 'cdv';
export type OperandMode = 'combo' | 'literal' | 'ignored';

export const DEFAULT_MAX_EXECUTION_STEPS = 100_000;
export const DEFAULT_MAX_TRACE_STEPS = 240;

/** Returns true when `n` is an integer in `[0, 7]`. */
export function isThreeBitValue(n: number): n is ThreeBitValue {
  return Number.isInteger(n) && n >= 0 && n <= 7;
}

/** Immutable triple of non-negative BigInt registers A, B, C. */
export class VmRegisters {
  readonly a: bigint;
  readonly b: bigint;
  readonly c: bigint;

  constructor(a: bigint, b: bigint, c: bigint) {
    if (a < 0n || b < 0n || c < 0n) {
      throw new RangeError(`VM registers must be non-negative, got (${a}, ${b}, ${c})`);
    }
    this.a = a;
    this.b = b;
    this.c = c;
    Object.freeze(this);
  }

  withA(a: bigint): VmRegisters { return new VmRegisters(a, this.b, this.c); }
  withB(b: bigint): VmRegisters { return new VmRegisters(this.a, b, this.c); }
  withC(c: bigint): VmRegisters { return new VmRegisters(this.a, this.b, c); }
}

/** Validated, immutable 3-bit program and initial register state. */
export class ChronospatialProgram {
  readonly initialRegisters: VmRegisters;
  readonly instructions: readonly ThreeBitValue[];

  constructor(initialRegisters: VmRegisters, instructions: readonly ThreeBitValue[]) {
    if (instructions.length < 1) {
      throw new RangeError('Program must contain at least one 3-bit instruction token');
    }
    const copy: ThreeBitValue[] = [];
    for (const token of instructions) {
      if (!isThreeBitValue(token)) {
        throw new RangeError(`Instruction token must be a 3-bit integer (0..7), got ${token}`);
      }
      copy.push(token);
    }
    this.initialRegisters = initialRegisters;
    this.instructions = Object.freeze(copy);
    Object.freeze(this);
  }

  withRegisterA(a: bigint): ChronospatialProgram {
    return new ChronospatialProgram(this.initialRegisters.withA(a), this.instructions);
  }
}

export interface DisassembledInstruction {
  readonly ip: number;
  readonly opcode: ThreeBitValue;
  readonly operand: ThreeBitValue;
  readonly mnemonic: OpcodeMnemonic;
  readonly operandMode: OperandMode;
  readonly operandLabel: string;
}

export interface ExecutedAction {
  readonly step: number;
  readonly ip: number;
  readonly opcode: ThreeBitValue;
  readonly operand: ThreeBitValue;
  readonly mnemonic: OpcodeMnemonic;
  readonly operandMode: OperandMode;
  readonly operandLabel: string;
  readonly nextIp: number;
  readonly jumped: boolean;
  readonly emitted: ThreeBitValue | null;
}

export interface VmRunResult {
  readonly finalRegisters: VmRegisters;
  readonly finalIp: number;
  readonly stepsExecuted: number;
  readonly output: readonly ThreeBitValue[];
}

export interface VmTraceFrame {
  readonly step: number;
  readonly ip: number;
  readonly registers: VmRegisters;
  readonly prevRegisters: VmRegisters | null;
  readonly output: readonly ThreeBitValue[];
  readonly lastAction: ExecutedAction | null;
  readonly halted: boolean;
  readonly totalSteps: number;
  readonly program: ChronospatialProgram;
  readonly disassembly: readonly DisassembledInstruction[];
}
