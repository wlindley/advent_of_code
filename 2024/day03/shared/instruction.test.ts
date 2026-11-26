import { describe, expect, it } from 'vitest';
import {
  ControlInstruction,
  MAX_OPERAND,
  MAX_OPERAND_DIGITS,
  MIN_OPERAND,
  MulInstruction,
} from './instruction';

describe('instruction constants', () => {
  it('exposes operand bounds 0..999 and 3-digit limit', () => {
    expect(MIN_OPERAND).toBe(0);
    expect(MAX_OPERAND).toBe(999);
    expect(MAX_OPERAND_DIGITS).toBe(3);
  });
});

describe('MulInstruction', () => {
  it('freezes fields, normalizes -0, and computes product dynamically', () => {
    const zeroMul = new MulInstruction(-0, 999, -0, 8);
    expect(Object.isFrozen(zeroMul)).toBe(true);
    expect(zeroMul.kind).toBe('mul');
    expect(Object.is(zeroMul.x, 0)).toBe(true);
    expect(zeroMul.y).toBe(999);
    expect(Object.is(zeroMul.start, 0)).toBe(true);
    expect(zeroMul.end).toBe(8);
    expect(zeroMul.product).toBe(0);

    const maxMul = new MulInstruction(999, 999, 10, 22);
    expect(maxMul.product).toBe(998_001);

    const negZeroY = new MulInstruction(7, -0, 0, 8);
    expect(Object.is(negZeroY.y, 0)).toBe(true);
    expect(Object.is(negZeroY.product, 0)).toBe(true);
  });

  it('rejects invalid operands and spans with RangeError', () => {
    expect(() => new MulInstruction(-1, 5, 0, 8)).toThrow(RangeError);
    expect(() => new MulInstruction(1000, 5, 0, 10)).toThrow(RangeError);
    expect(() => new MulInstruction(5, -1, 0, 8)).toThrow(RangeError);
    expect(() => new MulInstruction(5, 1000, 0, 10)).toThrow(RangeError);
    expect(() => new MulInstruction(1.5, 2, 0, 8)).toThrow(RangeError);
    expect(() => new MulInstruction(Number.NaN, 2, 0, 8)).toThrow(RangeError);
    expect(() => new MulInstruction(2, 3, -1, 8)).toThrow(RangeError);
    expect(() => new MulInstruction(2, 3, 5, 5)).toThrow(RangeError);
    expect(() => new MulInstruction(2, 3, 6, 5)).toThrow(RangeError);
    expect(() => new MulInstruction(2, 3, 0.5, 5)).toThrow(RangeError);
    expect(() => new MulInstruction(2, 3, 0, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe('ControlInstruction', () => {
  it('freezes do/dont instructions and normalizes -0 start', () => {
    const enable = new ControlInstruction('do', -0, 4);
    expect(Object.isFrozen(enable)).toBe(true);
    expect(enable.kind).toBe('do');
    expect(Object.is(enable.start, 0)).toBe(true);
    expect(enable.end).toBe(4);

    const disable = new ControlInstruction('dont', 12, 19);
    expect(disable.kind).toBe('dont');
    expect(disable.start).toBe(12);
    expect(disable.end).toBe(19);
  });

  it('rejects invalid spans with RangeError', () => {
    expect(() => new ControlInstruction('do', -1, 3)).toThrow(RangeError);
    expect(() => new ControlInstruction('dont', 4, 4)).toThrow(RangeError);
    expect(() => new ControlInstruction('do', 5, 3)).toThrow(RangeError);
    expect(() => new ControlInstruction('do', 1.5, 4)).toThrow(RangeError);
  });
});
