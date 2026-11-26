import { describe, expect, it } from 'vitest';
import {
  ACC_OPERATION,
  JMP_OPERATION,
  NOP_OPERATION,
  OPERATIONS_BY_OPCODE,
  resolveOperation,
} from './operation';

describe('operation', () => {
  it('computes nextPc and nextAcc for acc, jmp, and nop operations', () => {
    expect(ACC_OPERATION.opcode).toBe('acc');
    expect(ACC_OPERATION.toggledOpcode).toBeNull();
    expect(ACC_OPERATION.nextPc(3, 7)).toBe(4);
    expect(ACC_OPERATION.nextAcc(10n, -3)).toBe(7n);

    expect(JMP_OPERATION.opcode).toBe('jmp');
    expect(JMP_OPERATION.toggledOpcode).toBe('nop');
    expect(JMP_OPERATION.nextPc(3, -2)).toBe(1);
    expect(JMP_OPERATION.nextAcc(10n, 99)).toBe(10n);

    expect(NOP_OPERATION.opcode).toBe('nop');
    expect(NOP_OPERATION.toggledOpcode).toBe('jmp');
    expect(NOP_OPERATION.nextPc(3, 99)).toBe(4);
    expect(NOP_OPERATION.nextAcc(10n, -5)).toBe(10n);
  });

  it('exposes frozen operation singletons and lookup registry', () => {
    expect(Object.isFrozen(ACC_OPERATION)).toBe(true);
    expect(Object.isFrozen(JMP_OPERATION)).toBe(true);
    expect(Object.isFrozen(NOP_OPERATION)).toBe(true);
    expect(Object.isFrozen(OPERATIONS_BY_OPCODE)).toBe(true);
    expect(OPERATIONS_BY_OPCODE.acc).toBe(ACC_OPERATION);
    expect(OPERATIONS_BY_OPCODE.jmp).toBe(JMP_OPERATION);
    expect(OPERATIONS_BY_OPCODE.nop).toBe(NOP_OPERATION);
  });

  it('resolves valid lowercase opcodes', () => {
    expect(resolveOperation('acc')).toBe(ACC_OPERATION);
    expect(resolveOperation('jmp')).toBe(JMP_OPERATION);
    expect(resolveOperation('nop')).toBe(NOP_OPERATION);
  });

  it('rejects unknown, uppercase, and Object.prototype keys safely', () => {
    for (const invalid of ['ACC', 'Jmp', 'halt', '', 'constructor', 'toString', '__proto__']) {
      expect(() => resolveOperation(invalid)).toThrow(/Unknown opcode/);
    }
  });
});
