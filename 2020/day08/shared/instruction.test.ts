import { describe, expect, it } from 'vitest';
import { BootInstruction, parseBootInstruction } from './instruction';
import { ACC_OPERATION, JMP_OPERATION, NOP_OPERATION } from './operation';

describe('BootInstruction & parseBootInstruction', () => {
  it('constructs frozen instruction, normalizes -0, and derives getters', () => {
    const instr = new BootInstruction(NOP_OPERATION, -0);
    expect(Object.isFrozen(instr)).toBe(true);
    expect(Object.is(instr.argument, 0)).toBe(true);
    expect(instr.opcode).toBe('nop');
    expect(instr.isToggleable).toBe(true);
    expect(instr.signedArgument).toBe('+0');
    expect(instr.formatted).toBe('nop +0');
    expect(instr.nextPc(2)).toBe(3);
    expect(instr.nextAcc(5n)).toBe(5n);
  });

  it('rejects non-safe-integer arguments', () => {
    for (const bad of [1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => new BootInstruction(ACC_OPERATION, bad)).toThrow(/safe integer/i);
    }
  });

  it('toggles jmp <-> nop and returns null for acc', () => {
    const acc = new BootInstruction(ACC_OPERATION, -99);
    expect(acc.isToggleable).toBe(false);
    expect(acc.toggled()).toBeNull();
    expect(acc.signedArgument).toBe('-99');
    expect(acc.formatted).toBe('acc -99');
    expect(acc.nextAcc(100n)).toBe(1n);

    const jmp = new BootInstruction(JMP_OPERATION, -4);
    const nop = jmp.toggled();
    expect(nop).not.toBeNull();
    expect(nop!.opcode).toBe('nop');
    expect(nop!.argument).toBe(-4);
    expect(nop!.toggled()!.opcode).toBe('jmp');
  });

  it('parses valid instruction lines strictly', () => {
    const a = parseBootInstruction('acc +1');
    const j = parseBootInstruction('jmp -4');
    const n = parseBootInstruction('nop -0');
    expect(a.formatted).toBe('acc +1');
    expect(j.formatted).toBe('jmp -4');
    expect(n.formatted).toBe('nop +0');
  });

  it('rejects malformed instruction lines and unsafe integer literals', () => {
    for (const bad of [
      '',
      'acc 1',
      'acc + 1',
      ' acc +1',
      'acc +1 ',
      'ACC +1',
      'halt +0',
      'acc +99999999999999999999',
    ]) {
      expect(() => parseBootInstruction(bad)).toThrow();
    }
  });
});
