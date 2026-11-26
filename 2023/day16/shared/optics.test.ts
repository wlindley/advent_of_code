import { describe, expect, it } from 'vitest';
import {
  BEAM_DIRECTIONS,
  createBeamState,
  decodeTileCode,
  DIR_DC,
  DIR_DR,
  DIR_E,
  DIR_LABELS,
  DIR_N,
  DIR_S,
  DIR_W,
  encodeTileChar,
  MASK_TO_DIR,
  OUTGOING_MASKS,
  outgoingMask,
  TILE_BACKSLASH,
  TILE_EMPTY,
  TILE_SLASH,
  TILE_SPLIT_H,
  TILE_SPLIT_V,
} from './optics';

describe('optics constants and tables', () => {
  it('defines canonical cardinal directions, deltas, and mask lookup', () => {
    expect(BEAM_DIRECTIONS).toEqual([DIR_N, DIR_E, DIR_S, DIR_W]);
    expect(DIR_LABELS).toEqual(['N', 'E', 'S', 'W']);
    expect([...DIR_DR]).toEqual([-1, 0, 1, 0]);
    expect([...DIR_DC]).toEqual([0, 1, 0, -1]);
    expect(MASK_TO_DIR[1]).toBe(DIR_N);
    expect(MASK_TO_DIR[2]).toBe(DIR_E);
    expect(MASK_TO_DIR[4]).toBe(DIR_S);
    expect(MASK_TO_DIR[8]).toBe(DIR_W);
    expect(OUTGOING_MASKS).toHaveLength(20);
  });

  it('encodes and decodes all five contraption tile characters', () => {
    const pairs = [
      ['.', TILE_EMPTY],
      ['/', TILE_SLASH],
      ['\\', TILE_BACKSLASH],
      ['|', TILE_SPLIT_V],
      ['-', TILE_SPLIT_H],
    ] as const;

    for (const [ch, code] of pairs) {
      expect(encodeTileChar(ch)).toBe(code);
      expect(decodeTileCode(code)).toBe(ch);
    }
  });

  it('rejects unknown tile characters with RangeError', () => {
    expect(() => encodeTileChar('#')).toThrow(RangeError);
    expect(() => encodeTileChar('')).toThrow(RangeError);
    expect(() => encodeTileChar('..')).toThrow(RangeError);
  });

  it('computes outgoing direction bitmasks for every tile and incoming direction', () => {
    expect(outgoingMask(TILE_EMPTY, DIR_N)).toBe(1);
    expect(outgoingMask(TILE_EMPTY, DIR_E)).toBe(2);
    expect(outgoingMask(TILE_EMPTY, DIR_S)).toBe(4);
    expect(outgoingMask(TILE_EMPTY, DIR_W)).toBe(8);

    expect(outgoingMask(TILE_SLASH, DIR_N)).toBe(2);
    expect(outgoingMask(TILE_SLASH, DIR_E)).toBe(1);
    expect(outgoingMask(TILE_SLASH, DIR_S)).toBe(8);
    expect(outgoingMask(TILE_SLASH, DIR_W)).toBe(4);

    expect(outgoingMask(TILE_BACKSLASH, DIR_N)).toBe(8);
    expect(outgoingMask(TILE_BACKSLASH, DIR_E)).toBe(4);
    expect(outgoingMask(TILE_BACKSLASH, DIR_S)).toBe(2);
    expect(outgoingMask(TILE_BACKSLASH, DIR_W)).toBe(1);

    expect(outgoingMask(TILE_SPLIT_V, DIR_N)).toBe(1);
    expect(outgoingMask(TILE_SPLIT_V, DIR_E)).toBe(5);
    expect(outgoingMask(TILE_SPLIT_V, DIR_S)).toBe(4);
    expect(outgoingMask(TILE_SPLIT_V, DIR_W)).toBe(5);

    expect(outgoingMask(TILE_SPLIT_H, DIR_N)).toBe(10);
    expect(outgoingMask(TILE_SPLIT_H, DIR_E)).toBe(2);
    expect(outgoingMask(TILE_SPLIT_H, DIR_S)).toBe(10);
    expect(outgoingMask(TILE_SPLIT_H, DIR_W)).toBe(8);
  });

  it('creates frozen BeamState values and rejects negative or non-integer coordinates', () => {
    const state = createBeamState(0, 3, DIR_S);
    expect(state).toEqual({ row: 0, col: 3, dir: DIR_S });
    expect(Object.isFrozen(state)).toBe(true);

    expect(() => createBeamState(-1, 0, DIR_E)).toThrow(RangeError);
    expect(() => createBeamState(0, -1, DIR_E)).toThrow(RangeError);
    expect(() => createBeamState(1.5, 0, DIR_E)).toThrow(RangeError);
    expect(() => createBeamState(0, Number.NaN, DIR_E)).toThrow(RangeError);
  });
});
