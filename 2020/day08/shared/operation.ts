/** Supported opcodes in the handheld boot code instruction set. */
export type Opcode = 'acc' | 'jmp' | 'nop';

/** Strategy defining instruction transition semantics and toggle duality. */
export interface InstructionOperation {
  readonly opcode: Opcode;
  readonly toggledOpcode: Opcode | null;
  nextPc(pc: number, argument: number): number;
  nextAcc(accumulator: bigint, argument: number): bigint;
}

export const ACC_OPERATION: InstructionOperation = Object.freeze({
  opcode: 'acc',
  toggledOpcode: null,
  nextPc(pc: number): number {
    return pc + 1;
  },
  nextAcc(accumulator: bigint, argument: number): bigint {
    return accumulator + BigInt(argument);
  },
});

export const JMP_OPERATION: InstructionOperation = Object.freeze({
  opcode: 'jmp',
  toggledOpcode: 'nop',
  nextPc(pc: number, argument: number): number {
    return pc + argument;
  },
  nextAcc(accumulator: bigint): bigint {
    return accumulator;
  },
});

export const NOP_OPERATION: InstructionOperation = Object.freeze({
  opcode: 'nop',
  toggledOpcode: 'jmp',
  nextPc(pc: number): number {
    return pc + 1;
  },
  nextAcc(accumulator: bigint): bigint {
    return accumulator;
  },
});

/** Frozen opcode registry mapping each valid opcode to its operation singleton. */
export const OPERATIONS_BY_OPCODE: Readonly<Record<Opcode, InstructionOperation>> = Object.freeze({
  acc: ACC_OPERATION,
  jmp: JMP_OPERATION,
  nop: NOP_OPERATION,
});

const OPERATION_MAP: ReadonlyMap<string, InstructionOperation> = new Map<string, InstructionOperation>([
  ['acc', ACC_OPERATION],
  ['jmp', JMP_OPERATION],
  ['nop', NOP_OPERATION],
]);

/** Resolves a raw opcode string safely without prototype-property collisions. */
export function resolveOperation(raw: string): InstructionOperation {
  const operation = OPERATION_MAP.get(raw);
  if (!operation) {
    throw new Error(`Unknown opcode: "${raw}"`);
  }
  return operation;
}
