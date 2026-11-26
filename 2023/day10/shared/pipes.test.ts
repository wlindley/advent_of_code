import { describe, expect, it } from 'vitest';
import { DIRS_4 } from '../../../shared/core';
import {
  DIR_BITS,
  DIR_E,
  DIR_N,
  DIR_S,
  DIR_W,
  bitToDirIndex,
  createCoord,
  maskToPipeShape,
  oppositeBit,
  otherPort,
  parsePipeSymbol,
  pipePorts,
  tileMask,
  type DirBit,
  type PipeShape,
} from './pipes';

describe('pipes primitives', () => {
  it('exposes orthogonal direction bitmasks aligned with DIRS_4', () => {
    expect(DIR_BITS).toEqual([DIR_N, DIR_E, DIR_S, DIR_W]);
    expect(Object.isFrozen(DIR_BITS)).toBe(true);
    expect(DIRS_4[bitToDirIndex(DIR_N)]).toEqual([-1, 0]);
    expect(DIRS_4[bitToDirIndex(DIR_E)]).toEqual([0, 1]);
    expect(DIRS_4[bitToDirIndex(DIR_S)]).toEqual([1, 0]);
    expect(DIRS_4[bitToDirIndex(DIR_W)]).toEqual([0, -1]);
  });

  it('creates frozen grid coordinates', () => {
    const coord = createCoord(3, 7);
    expect(coord).toEqual({ row: 3, col: 7 });
    expect(Object.isFrozen(coord)).toBe(true);
  });

  it('parses valid pipe symbols and rejects invalid characters', () => {
    const valid = ['|', '-', 'L', 'J', '7', 'F', '.', 'S'] as const;
    for (const ch of valid) {
      expect(parsePipeSymbol(ch, 1, 2)).toBe(ch);
    }
    expect(() => parsePipeSymbol('X', 2, 4)).toThrow('Invalid pipe symbol "X" at (2, 4)');
    expect(() => parsePipeSymbol('toString', 0, 0)).toThrow('Invalid pipe symbol "toString" at (0, 0)');
  });

  it('computes opposite direction bits symmetrically', () => {
    expect(oppositeBit(DIR_N)).toBe(DIR_S);
    expect(oppositeBit(DIR_S)).toBe(DIR_N);
    expect(oppositeBit(DIR_E)).toBe(DIR_W);
    expect(oppositeBit(DIR_W)).toBe(DIR_E);
  });

  it('maps pipe tiles and shapes to bitmasks and ports', () => {
    expect(tileMask('.')).toBe(0);
    const shapes: readonly PipeShape[] = ['|', '-', 'L', 'J', '7', 'F'];
    for (const shape of shapes) {
      const [a, b] = pipePorts(shape);
      expect(tileMask(shape)).toBe(a | b);
      expect(maskToPipeShape(a | b)).toBe(shape);
      expect(otherPort(shape, a)).toBe(b);
      expect(otherPort(shape, b)).toBe(a);
    }
  });

  it('rejects invalid masks and non-matching incoming ports', () => {
    expect(() => maskToPipeShape(0)).toThrow('Invalid pipe mask: 0');
    expect(() => maskToPipeShape(DIR_N | DIR_E | DIR_S)).toThrow('Invalid pipe mask: 7');
    expect(() => maskToPipeShape(DIR_N | DIR_E | DIR_S | DIR_W)).toThrow('Invalid pipe mask: 15');
    expect(() => otherPort('|', DIR_E)).toThrow('Incoming bit 2 is not a port of "|"');
    expect(() => otherPort('L', DIR_W as DirBit)).toThrow('Incoming bit 8 is not a port of "L"');
  });
});
