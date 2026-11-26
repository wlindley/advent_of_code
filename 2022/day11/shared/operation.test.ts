import { describe, expect, it } from 'vitest';
import {
  AddConstantOperation,
  MultiplyConstantOperation,
  SquareOperation,
  parseWorryOperation,
} from './operation';

describe('WorryOperation classes', () => {
  it('applies AddConstantOperation and exposes dynamic expression', () => {
    const op = new AddConstantOperation(6n);
    expect(Object.isFrozen(op)).toBe(true);
    expect(op.operand).toBe(6n);
    expect(op.expression).toBe('old + 6');
    expect(op.apply(79n)).toBe(85n);
    expect(new AddConstantOperation(0n).apply(5n)).toBe(5n);
  });

  it('rejects negative operand in AddConstantOperation', () => {
    expect(() => new AddConstantOperation(-1n)).toThrow(RangeError);
  });

  it('applies MultiplyConstantOperation and exposes dynamic expression', () => {
    const op = new MultiplyConstantOperation(19n);
    expect(Object.isFrozen(op)).toBe(true);
    expect(op.factor).toBe(19n);
    expect(op.expression).toBe('old * 19');
    expect(op.apply(79n)).toBe(1501n);
    expect(new MultiplyConstantOperation(0n).apply(5n)).toBe(0n);
  });

  it('rejects negative factor in MultiplyConstantOperation', () => {
    expect(() => new MultiplyConstantOperation(-2n)).toThrow(RangeError);
  });

  it('applies SquareOperation and exposes expression', () => {
    const op = new SquareOperation();
    expect(Object.isFrozen(op)).toBe(true);
    expect(op.expression).toBe('old * old');
    expect(op.apply(79n)).toBe(6241n);
  });
});

describe('parseWorryOperation', () => {
  it('parses old + k into AddConstantOperation', () => {
    const op = parseWorryOperation('  old + 6  ');
    expect(op).toBeInstanceOf(AddConstantOperation);
    expect(op.expression).toBe('old + 6');
    expect(op.apply(10n)).toBe(16n);
  });

  it('parses old * k into MultiplyConstantOperation', () => {
    const op = parseWorryOperation('old * 19');
    expect(op).toBeInstanceOf(MultiplyConstantOperation);
    expect(op.expression).toBe('old * 19');
    expect(op.apply(3n)).toBe(57n);
  });

  it('parses old * old into SquareOperation', () => {
    const op = parseWorryOperation('old * old');
    expect(op).toBeInstanceOf(SquareOperation);
    expect(op.expression).toBe('old * old');
    expect(op.apply(12n)).toBe(144n);
  });

  it('maps old + old into MultiplyConstantOperation(2n)', () => {
    const op = parseWorryOperation('old + old');
    expect(op).toBeInstanceOf(MultiplyConstantOperation);
    expect(op.expression).toBe('old * 2');
    expect(op.apply(15n)).toBe(30n);
  });

  it('rejects empty operation string', () => {
    expect(() => parseWorryOperation('')).toThrow(Error);
  });

  it('rejects unsupported operator', () => {
    expect(() => parseWorryOperation('old - 3')).toThrow(Error);
  });

  it('rejects negative constant operand', () => {
    expect(() => parseWorryOperation('old + -3')).toThrow(Error);
  });

  it('rejects swapped lhs constant', () => {
    expect(() => parseWorryOperation('5 * old')).toThrow(Error);
  });

  it('rejects non-integer rhs token', () => {
    expect(() => parseWorryOperation('old * foo')).toThrow(Error);
  });
});
