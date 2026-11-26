import { describe, expect, it } from 'vitest';
import { parseChronospatialInput } from './parse';

describe('parseChronospatialInput', () => {
  it('parses standard 4-line input with blank lines, CRLF, and large BigInt registers', () => {
    const raw = [
      'Register A: 18446744073709551615\r',
      'Register B: 0\r',
      'Register C: 9\r',
      '\r',
      'Program: 0,1,5,4,3,0\r',
      '',
    ].join('\n');

    const program = parseChronospatialInput(raw);
    expect(program.initialRegisters.a).toBe(18446744073709551615n);
    expect(program.initialRegisters.b).toBe(0n);
    expect(program.initialRegisters.c).toBe(9n);
    expect(program.instructions).toEqual([0, 1, 5, 4, 3, 0]);
  });

  it('rejects inputs that do not have exactly 4 non-empty lines', () => {
    expect(() => parseChronospatialInput('Register A: 1\nRegister B: 0\nRegister C: 0')).toThrow();
    expect(() =>
      parseChronospatialInput('Register A: 1\nRegister B: 0\nRegister C: 0\nProgram: 0,1\nextra'),
    ).toThrow();
  });

  it('rejects malformed or out-of-order register lines', () => {
    expect(() =>
      parseChronospatialInput('Register B: 1\nRegister A: 0\nRegister C: 0\nProgram: 0,1'),
    ).toThrow();
    expect(() =>
      parseChronospatialInput('Register A: -5\nRegister B: 0\nRegister C: 0\nProgram: 0,1'),
    ).toThrow();
  });

  it('rejects malformed Program lines and invalid 3-bit tokens', () => {
    expect(() =>
      parseChronospatialInput('Register A: 1\nRegister B: 0\nRegister C: 0\nCode: 0,1'),
    ).toThrow();
    expect(() =>
      parseChronospatialInput('Register A: 1\nRegister B: 0\nRegister C: 0\nProgram: 0,8'),
    ).toThrow();
    expect(() =>
      parseChronospatialInput('Register A: 1\nRegister B: 0\nRegister C: 0\nProgram: 0,,1'),
    ).toThrow();
  });
});
