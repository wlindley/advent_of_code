import { describe, expect, it } from 'vitest';
import {
  ChronospatialProgram,
  DEFAULT_MAX_EXECUTION_STEPS,
  DEFAULT_MAX_TRACE_STEPS,
  isThreeBitValue,
  VmRegisters,
  type ThreeBitValue,
} from './types';

describe('isThreeBitValue', () => {
  it('accepts integers 0 through 7', () => {
    for (let n = 0; n <= 7; n += 1) {
      expect(isThreeBitValue(n)).toBe(true);
    }
  });

  it('rejects out-of-range, negative, fractional, and non-finite numbers', () => {
    for (const invalid of [-1, 8, 1.5, NaN, Infinity, -Infinity]) {
      expect(isThreeBitValue(invalid)).toBe(false);
    }
  });
});

describe('VmRegisters', () => {
  it('stores non-negative BigInt registers and returns frozen immutable instances', () => {
    const regs = new VmRegisters(729n, 0n, 9n);
    expect(regs.a).toBe(729n);
    expect(regs.b).toBe(0n);
    expect(regs.c).toBe(9n);
    expect(Object.isFrozen(regs)).toBe(true);
  });

  it('supports large >53-bit BigInt register values', () => {
    const big = (1n << 62n) + 123456789012345n;
    const regs = new VmRegisters(big, 1n, 2n);
    expect(regs.a).toBe(big);
  });

  it('throws RangeError when any register is negative', () => {
    expect(() => new VmRegisters(-1n, 0n, 0n)).toThrow(RangeError);
    expect(() => new VmRegisters(0n, -1n, 0n)).toThrow(RangeError);
    expect(() => new VmRegisters(0n, 0n, -1n)).toThrow(RangeError);
  });

  it('creates updated copies via withA, withB, and withC without mutating original', () => {
    const base = new VmRegisters(10n, 20n, 30n);
    const nextA = base.withA(99n);
    const nextB = base.withB(88n);
    const nextC = base.withC(77n);

    expect(nextA).toEqual(new VmRegisters(99n, 20n, 30n));
    expect(nextB).toEqual(new VmRegisters(10n, 88n, 30n));
    expect(nextC).toEqual(new VmRegisters(10n, 20n, 77n));
    expect(base).toEqual(new VmRegisters(10n, 20n, 30n));
  });
});

describe('ChronospatialProgram', () => {
  it('defensively copies and freezes instructions and supports withRegisterA', () => {
    const regs = new VmRegisters(729n, 0n, 0n);
    const raw: ThreeBitValue[] = [0, 1, 5, 4, 3, 0];
    const program = new ChronospatialProgram(regs, raw);
    raw[0] = 7;

    expect(program.instructions).toEqual([0, 1, 5, 4, 3, 0]);
    expect(Object.isFrozen(program)).toBe(true);
    expect(Object.isFrozen(program.instructions)).toBe(true);
    expect(program.initialRegisters).toBe(regs);

    const patched = program.withRegisterA(117440n);
    expect(patched.initialRegisters.a).toBe(117440n);
    expect(patched.instructions).toEqual([0, 1, 5, 4, 3, 0]);
    expect(program.initialRegisters.a).toBe(729n);
  });

  it('rejects empty programs and non-3-bit instruction tokens', () => {
    const regs = new VmRegisters(0n, 0n, 0n);
    expect(() => new ChronospatialProgram(regs, [])).toThrow(RangeError);
    expect(() => new ChronospatialProgram(regs, [0, 8 as ThreeBitValue])).toThrow(RangeError);
    expect(() => new ChronospatialProgram(regs, [-1 as ThreeBitValue, 0])).toThrow(RangeError);
  });

  it('exposes bounded default limits', () => {
    expect(DEFAULT_MAX_EXECUTION_STEPS).toBe(100_000);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(240);
  });
});
