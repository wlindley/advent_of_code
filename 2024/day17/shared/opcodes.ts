import {
  ChronospatialProgram,
  VmRegisters,
  type DisassembledInstruction,
  type OpcodeMnemonic,
  type OperandMode,
  type ThreeBitValue,
} from './types';

export interface StepOutcome {
  readonly registers: VmRegisters;
  readonly nextIp: number;
  readonly emitted: ThreeBitValue | null;
}

export interface OpcodeSpec {
  readonly mnemonic: OpcodeMnemonic;
  readonly operandMode: OperandMode;
  readonly execute: (operand: ThreeBitValue, registers: VmRegisters, ip: number) => StepOutcome;
}

export const COMBO_RESOLVERS: Readonly<Record<ThreeBitValue, (r: VmRegisters) => bigint>> = Object.freeze({
  0: () => 0n,
  1: () => 1n,
  2: () => 2n,
  3: () => 3n,
  4: (r) => r.a,
  5: (r) => r.b,
  6: (r) => r.c,
  7: () => {
    throw new RangeError('Combo operand 7 is reserved and invalid in valid programs');
  },
});

/** Resolves a 3-bit combo operand against the current VM registers. */
export function resolveCombo(operand: ThreeBitValue, registers: VmRegisters): bigint {
  return COMBO_RESOLVERS[operand](registers);
}

// Guard against BigInt shift overflow when the shift exceeds numerator bit width.
function divPow2(numerator: bigint, shift: bigint): bigint {
  if (numerator === 0n || shift >= BigInt(numerator.toString(2).length)) return 0n;
  return numerator >> shift;
}

function divSpec(
  mnemonic: OpcodeMnemonic,
  assign: (r: VmRegisters, quotient: bigint) => VmRegisters,
): OpcodeSpec {
  return {
    mnemonic,
    operandMode: 'combo',
    execute: (operand, r, ip) => ({
      registers: assign(r, divPow2(r.a, resolveCombo(operand, r))),
      nextIp: ip + 2,
      emitted: null,
    }),
  };
}

export const OPCODE_TABLE: Readonly<Record<ThreeBitValue, OpcodeSpec>> = Object.freeze({
  0: divSpec('adv', (r, q) => r.withA(q)),
  1: {
    mnemonic: 'bxl',
    operandMode: 'literal',
    execute: (op, r, ip) => ({ registers: r.withB(r.b ^ BigInt(op)), nextIp: ip + 2, emitted: null }),
  },
  2: {
    mnemonic: 'bst',
    operandMode: 'combo',
    execute: (op, r, ip) => ({ registers: r.withB(resolveCombo(op, r) & 7n), nextIp: ip + 2, emitted: null }),
  },
  3: {
    mnemonic: 'jnz',
    operandMode: 'literal',
    execute: (op, r, ip) => ({ registers: r, nextIp: r.a === 0n ? ip + 2 : op, emitted: null }),
  },
  4: {
    mnemonic: 'bxc',
    operandMode: 'ignored',
    execute: (_op, r, ip) => ({ registers: r.withB(r.b ^ r.c), nextIp: ip + 2, emitted: null }),
  },
  5: {
    mnemonic: 'out',
    operandMode: 'combo',
    execute: (op, r, ip) => ({
      registers: r,
      nextIp: ip + 2,
      emitted: Number(resolveCombo(op, r) & 7n) as ThreeBitValue,
    }),
  },
  6: divSpec('bdv', (r, q) => r.withB(q)),
  7: divSpec('cdv', (r, q) => r.withC(q)),
});

const COMBO_LABELS: Readonly<Record<ThreeBitValue, string>> = Object.freeze({
  0: '0', 1: '1', 2: '2', 3: '3', 4: 'A', 5: 'B', 6: 'C', 7: 'RESERVED(7)',
});

const OPERAND_FORMATTERS: Readonly<Record<OperandMode, (op: ThreeBitValue) => string>> = Object.freeze({
  combo: (op) => COMBO_LABELS[op],
  literal: (op) => String(op),
  ignored: (op) => `(${op})`,
});

/** Formats an instruction operand according to its addressing mode without throwing on 7. */
export function formatOperand(mode: OperandMode, operand: ThreeBitValue): string {
  return OPERAND_FORMATTERS[mode](operand);
}

/** Disassembles even-aligned (opcode, operand) pairs in `program` without executing. */
export function disassembleProgram(program: ChronospatialProgram): readonly DisassembledInstruction[] {
  const { instructions } = program;
  const result: DisassembledInstruction[] = [];
  for (let ip = 0; ip + 1 < instructions.length; ip += 2) {
    const opcode = instructions[ip]!;
    const operand = instructions[ip + 1]!;
    const spec = OPCODE_TABLE[opcode];
    result.push({
      ip, opcode, operand,
      mnemonic: spec.mnemonic,
      operandMode: spec.operandMode,
      operandLabel: formatOperand(spec.operandMode, operand),
    });
  }
  return Object.freeze(result);
}
