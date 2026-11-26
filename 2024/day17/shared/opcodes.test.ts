import { describe, expect, it } from 'vitest';
import { ChronospatialProgram, VmRegisters } from './types';
import {
  COMBO_RESOLVERS,
  disassembleProgram,
  formatOperand,
  OPCODE_TABLE,
  resolveCombo,
} from './opcodes';

describe('resolveCombo and COMBO_RESOLVERS', () => {
  const regs = new VmRegisters(100n, 200n, 300n);

  it('resolves literal operands 0..3 and register operands 4..6', () => {
    expect(resolveCombo(0, regs)).toBe(0n);
    expect(resolveCombo(1, regs)).toBe(1n);
    expect(resolveCombo(2, regs)).toBe(2n);
    expect(resolveCombo(3, regs)).toBe(3n);
    expect(resolveCombo(4, regs)).toBe(100n);
    expect(resolveCombo(5, regs)).toBe(200n);
    expect(resolveCombo(6, regs)).toBe(300n);
    expect(Object.keys(COMBO_RESOLVERS)).toHaveLength(8);
  });

  it('throws RangeError on reserved combo operand 7', () => {
    expect(() => resolveCombo(7, regs)).toThrow(RangeError);
  });
});

describe('OPCODE_TABLE', () => {
  it('implements adv (0), bdv (6), and cdv (7) dividing register A by 2^combo', () => {
    const regs = new VmRegisters(729n, 3n, 1000n);

    expect(OPCODE_TABLE[0].mnemonic).toBe('adv');
    expect(OPCODE_TABLE[0].execute(5, regs, 0)).toEqual({
      registers: new VmRegisters(91n, 3n, 1000n),
      nextIp: 2,
      emitted: null,
    });

    expect(OPCODE_TABLE[6].mnemonic).toBe('bdv');
    expect(OPCODE_TABLE[6].execute(5, regs, 2)).toEqual({
      registers: new VmRegisters(729n, 91n, 1000n),
      nextIp: 4,
      emitted: null,
    });

    expect(OPCODE_TABLE[7].mnemonic).toBe('cdv');
    expect(OPCODE_TABLE[7].execute(5, regs, 4)).toEqual({
      registers: new VmRegisters(729n, 3n, 91n),
      nextIp: 6,
      emitted: null,
    });
  });

  it('returns 0n safely in adv/bdv/cdv when A is 0n or shift >= bitLength(A)', () => {
    expect(OPCODE_TABLE[0].execute(4, new VmRegisters(0n, 5n, 6n), 0).registers.a).toBe(0n);
    expect(
      OPCODE_TABLE[7].execute(6, new VmRegisters(729n, 0n, 1n << 200n), 0).registers.c,
    ).toBe(0n);
    expect(OPCODE_TABLE[6].execute(2, new VmRegisters(3n, 9n, 0n), 0).registers.b).toBe(0n);
  });

  it('implements bxl (1), bst (2), jnz (3), bxc (4), and out (5)', () => {
    const regs = new VmRegisters(10n, 29n, 43690n);

    expect(OPCODE_TABLE[1].execute(7, regs, 0)).toEqual({
      registers: new VmRegisters(10n, 26n, 43690n),
      nextIp: 2,
      emitted: null,
    });

    expect(OPCODE_TABLE[2].execute(6, new VmRegisters(0n, 0n, 9n), 0)).toEqual({
      registers: new VmRegisters(0n, 1n, 9n),
      nextIp: 2,
      emitted: null,
    });

    expect(OPCODE_TABLE[3].execute(7, new VmRegisters(1n, 0n, 0n), 4)).toEqual({
      registers: new VmRegisters(1n, 0n, 0n),
      nextIp: 7,
      emitted: null,
    });
    expect(OPCODE_TABLE[3].execute(7, new VmRegisters(0n, 0n, 0n), 4)).toEqual({
      registers: new VmRegisters(0n, 0n, 0n),
      nextIp: 6,
      emitted: null,
    });

    expect(OPCODE_TABLE[4].execute(7, new VmRegisters(0n, 2024n, 43690n), 0)).toEqual({
      registers: new VmRegisters(0n, 44354n, 43690n),
      nextIp: 2,
      emitted: null,
    });

    expect(OPCODE_TABLE[5].execute(4, new VmRegisters(2024n, 0n, 0n), 2)).toEqual({
      registers: new VmRegisters(2024n, 0n, 0n),
      nextIp: 4,
      emitted: 0,
    });
  });
});

describe('formatOperand and disassembleProgram', () => {
  it('formats combo, literal, and ignored operands including reserved combo 7', () => {
    expect(formatOperand('combo', 4)).toBe('A');
    expect(formatOperand('combo', 7)).toBe('RESERVED(7)');
    expect(formatOperand('literal', 7)).toBe('7');
    expect(formatOperand('ignored', 3)).toBe('(3)');
  });

  it('disassembles paired instructions and skips trailing odd token without throwing', () => {
    const program = new ChronospatialProgram(
      new VmRegisters(729n, 0n, 0n),
      [0, 7, 1, 7, 4, 2, 5, 4, 3],
    );
    expect(disassembleProgram(program)).toEqual([
      { ip: 0, opcode: 0, operand: 7, mnemonic: 'adv', operandMode: 'combo', operandLabel: 'RESERVED(7)' },
      { ip: 2, opcode: 1, operand: 7, mnemonic: 'bxl', operandMode: 'literal', operandLabel: '7' },
      { ip: 4, opcode: 4, operand: 2, mnemonic: 'bxc', operandMode: 'ignored', operandLabel: '(2)' },
      { ip: 6, opcode: 5, operand: 4, mnemonic: 'out', operandMode: 'combo', operandLabel: 'A' },
    ]);
  });
});
