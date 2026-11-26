import { describe, expect, it } from 'vitest';
import { parseBootInstruction } from './instruction';
import { BootProgram, parseBootProgram } from './program';

describe('BootProgram & parseBootProgram', () => {
  it('constructs a frozen BootProgram with defensive copy and validates bounds', () => {
    const source = [parseBootInstruction('nop +0'), parseBootInstruction('acc +1')];
    const program = new BootProgram(source);
    source.push(parseBootInstruction('jmp -1'));

    expect(Object.isFrozen(program)).toBe(true);
    expect(Object.isFrozen(program.instructions)).toBe(true);
    expect(program.length).toBe(2);
    expect(program.at(0).formatted).toBe('nop +0');
    expect(program.at(1).formatted).toBe('acc +1');

    for (const badPc of [-1, 2, 0.5, Number.NaN]) {
      expect(() => program.at(badPc)).toThrow(RangeError);
    }
  });

  it('rejects empty instruction lists', () => {
    expect(() => new BootProgram([])).toThrow(/at least one instruction/i);
  });

  it('toggles jmp <-> nop at a valid index into a new frozen BootProgram', () => {
    const program = parseBootProgram('nop +0\nacc +1\njmp +4');
    const toggled0 = program.withToggledAt(0);
    expect(Object.isFrozen(toggled0)).toBe(true);
    expect(toggled0.at(0).formatted).toBe('jmp +0');
    expect(program.at(0).formatted).toBe('nop +0');

    const toggled2 = toggled0.withToggledAt(2);
    expect(toggled2.at(2).formatted).toBe('nop +4');

    expect(() => program.withToggledAt(1)).toThrow(/not toggleable/i);
    expect(() => program.withToggledAt(-1)).toThrow(RangeError);
    expect(() => program.withToggledAt(3)).toThrow(RangeError);
  });

  it('parses CRLF/LF inputs with outer blank lines and rejects empty or internal blank lines', () => {
    const parsed = parseBootProgram('\r\n  \r\nnop +0\r\nacc +1\r\n\t\r\n');
    expect(parsed.length).toBe(2);
    expect(parsed.at(0).formatted).toBe('nop +0');
    expect(parsed.at(1).formatted).toBe('acc +1');

    for (const bad of ['', '   ', '\n  \n', 'nop +0\n\nacc +1', 'nop +0\n  \nacc +1']) {
      expect(() => parseBootProgram(bad)).toThrow();
    }
  });
});
