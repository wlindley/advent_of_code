import { describe, expect, it } from 'vitest';
import { IntcodeProgram, parseIntcodeProgram } from './program';

describe('IntcodeProgram', () => {
  it('stores frozen cells, exposes dynamic length, and reads BigInt-indexed cells', () => {
    const program = new IntcodeProgram([1n, 9n, 10n, 3n, 99n]);
    expect(Object.isFrozen(program)).toBe(true);
    expect(Object.isFrozen(program.cells)).toBe(true);
    expect(program.length).toBe(5);
    expect(program.at(0n)).toBe(1n);
    expect(program.at(4n)).toBe(99n);
  });

  it('rejects empty cell arrays and out-of-bounds BigInt reads', () => {
    expect(() => new IntcodeProgram([])).toThrow(RangeError);
    const program = new IntcodeProgram([99n]);
    expect(() => program.at(-1n)).toThrow(RangeError);
    expect(() => program.at(1n)).toThrow(RangeError);
    expect(() => program.at(9007199254740993n)).toThrow(RangeError);
  });

  it('returns a new patched IntcodeProgram without mutating the original', () => {
    const original = new IntcodeProgram([1n, 0n, 0n, 3n, 99n]);
    const patched = original.withPatches([
      { address: 1n, value: 12n },
      { address: 2n, value: 2n },
    ]);
    expect(patched.cells).toEqual([1n, 12n, 2n, 3n, 99n]);
    expect(original.cells).toEqual([1n, 0n, 0n, 3n, 99n]);
  });

  it('rejects out-of-bounds patch addresses', () => {
    const program = new IntcodeProgram([1n, 2n, 99n]);
    expect(() => program.withPatches([{ address: -1n, value: 0n }])).toThrow(RangeError);
    expect(() => program.withPatches([{ address: 3n, value: 0n }])).toThrow(RangeError);
    expect(() => program.withPatches([{ address: 1n << 60n, value: 0n }])).toThrow(RangeError);
  });
});

describe('parseIntcodeProgram', () => {
  it('parses trimmed integers, negatives, and arbitrary-precision BigInts', () => {
    const program = parseIntcodeProgram('  1 , -42 , 9007199254740993 , 99 \n');
    expect(program.cells).toEqual([1n, -42n, 9007199254740993n, 99n]);
  });

  it('rejects empty, malformed, floating-point, or plus-prefixed tokens', () => {
    expect(() => parseIntcodeProgram('')).toThrow(Error);
    expect(() => parseIntcodeProgram('   \n\t  ')).toThrow(Error);
    expect(() => parseIntcodeProgram(',1,2')).toThrow(Error);
    expect(() => parseIntcodeProgram('1,2,')).toThrow(Error);
    expect(() => parseIntcodeProgram('1,,2')).toThrow(Error);
    expect(() => parseIntcodeProgram('1,abc,99')).toThrow(Error);
    expect(() => parseIntcodeProgram('1,2.5,99')).toThrow(Error);
    expect(() => parseIntcodeProgram('1,+2,99')).toThrow(Error);
  });
});
