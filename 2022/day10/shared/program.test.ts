import { describe, expect, it } from 'vitest';
import {
  CRT_HEIGHT,
  CRT_WIDTH,
  CpuProgram,
  INITIAL_REGISTER_X,
  formatInstruction,
  instructionCycles,
  type CpuInstruction,
} from './program';

describe('CpuProgram', () => {
  it('exposes standard hardware constants', () => {
    expect(INITIAL_REGISTER_X).toBe(1);
    expect(CRT_WIDTH).toBe(40);
    expect(CRT_HEIGHT).toBe(6);
  });

  it('computes instruction cycle counts and formatted representations', () => {
    const noop: CpuInstruction = { kind: 'noop' };
    const addPos: CpuInstruction = { kind: 'addx', delta: 15 };
    const addZero: CpuInstruction = { kind: 'addx', delta: 0 };
    const addNeg: CpuInstruction = { kind: 'addx', delta: -11 };

    expect(instructionCycles(noop)).toBe(1);
    expect(instructionCycles(addPos)).toBe(2);
    expect(instructionCycles(addZero)).toBe(2);
    expect(instructionCycles(addNeg)).toBe(2);

    expect(formatInstruction(noop)).toBe('noop');
    expect(formatInstruction(addPos)).toBe('addx 15');
    expect(formatInstruction(addZero)).toBe('addx 0');
    expect(formatInstruction(addNeg)).toBe('addx -11');
  });

  it('parses valid programs, strips only outer newlines, and freezes instances', () => {
    const raw = '\r\nnoop\r\naddx 3\r\naddx 0\r\naddx -5\r\n\n';
    const program = CpuProgram.parse(raw);

    expect(program.instructionCount).toBe(4);
    expect(program.totalCycles).toBe(7);
    expect(program.instructions).toEqual([
      { kind: 'noop' },
      { kind: 'addx', delta: 3 },
      { kind: 'addx', delta: 0 },
      { kind: 'addx', delta: -5 },
    ]);
    expect(Object.isFrozen(program)).toBe(true);
    expect(Object.isFrozen(program.instructions)).toBe(true);
    expect(Object.isFrozen(program.instructions[0])).toBe(true);
    expect(Object.isFrozen(program.instructions[1])).toBe(true);
  });

  it('defensively clones input instructions in constructor', () => {
    const source: CpuInstruction[] = [{ kind: 'noop' }, { kind: 'addx', delta: 7 }];
    const program = new CpuProgram(source);
    source.push({ kind: 'noop' });

    expect(program.instructionCount).toBe(2);
    expect(program.totalCycles).toBe(3);
  });

  it('rejects empty inputs and empty constructor arrays', () => {
    expect(() => CpuProgram.parse('')).toThrow(/empty/i);
    expect(() => CpuProgram.parse('\n\r\n')).toThrow(/empty/i);
    expect(() => new CpuProgram([])).toThrow(/at least one instruction/i);
  });

  it('rejects malformed instruction lines and inner blank lines', () => {
    const invalidLines = [
      'noop ',
      ' noop',
      'noop\n\nnoop',
      'addx',
      'addx +3',
      'addx 03',
      'addx -0',
      'addx  3',
      'subx 1',
    ];
    for (const raw of invalidLines) {
      expect(() => CpuProgram.parse(raw), `input: ${JSON.stringify(raw)}`).toThrow(/invalid instruction/i);
    }
  });

  it('rejects unsafe integer operands during parse and construction', () => {
    expect(() => CpuProgram.parse('addx 9007199254740992')).toThrow(RangeError);
    expect(() => CpuProgram.parse('addx -9007199254740992')).toThrow(RangeError);
    expect(() => new CpuProgram([{ kind: 'addx', delta: 1.5 }])).toThrow(RangeError);
    expect(() => new CpuProgram([{ kind: 'addx', delta: Number.MAX_SAFE_INTEGER + 1 }])).toThrow(RangeError);
  });
});
