import { describe, expect, it } from 'vitest';
import {
  DIR_DC,
  DIR_DR,
  DIR_LUT,
  priorityOrderForRound,
  STAY_DIR,
  WEDGE_MASKS,
} from './directionLut';

describe('Day 23 directionLut', () => {
  it('defines orthogonal deltas and 3-cell wedge masks for N, S, W, E', () => {
    expect(STAY_DIR).toBe(4);
    expect(Array.from(DIR_DR)).toEqual([-1, 1, 0, 0]);
    expect(Array.from(DIR_DC)).toEqual([0, 0, -1, 1]);
    expect(Array.from(WEDGE_MASKS)).toEqual([7, 112, 193, 28]);
    expect(DIR_LUT.length).toBe(1024);
  });

  it('rotates priority order per 1-indexed round and validates round', () => {
    expect(priorityOrderForRound(1)).toEqual([0, 1, 2, 3]);
    expect(priorityOrderForRound(2)).toEqual([1, 2, 3, 0]);
    expect(priorityOrderForRound(3)).toEqual([2, 3, 0, 1]);
    expect(priorityOrderForRound(4)).toEqual([3, 0, 1, 2]);
    expect(priorityOrderForRound(5)).toEqual([0, 1, 2, 3]);
    expect(() => priorityOrderForRound(0)).toThrow(RangeError);
    expect(() => priorityOrderForRound(-2)).toThrow(RangeError);
    expect(() => priorityOrderForRound(1.5)).toThrow(RangeError);
  });

  it('returns STAY_DIR when isolated (mask 0) or completely surrounded (mask 255)', () => {
    for (let rot = 0; rot < 4; rot += 1) {
      expect(DIR_LUT[(rot << 8) | 0]).toBe(STAY_DIR);
      expect(DIR_LUT[(rot << 8) | 255]).toBe(STAY_DIR);
    }
  });

  it('selects the first open wedge in priority order for any neighbor mask', () => {
    // Only S neighbor occupied (bit 5 = 32): N wedge is open, S wedge blocked.
    expect(DIR_LUT[(0 << 8) | 32]).toBe(0); // Round 1: N
    expect(DIR_LUT[(1 << 8) | 32]).toBe(2); // Round 2: S blocked -> W
    // N (bit 1 = 2) and W (bit 7 = 128) occupied -> round 1 picks S (1), round 3 picks E (3).
    expect(DIR_LUT[(0 << 8) | (2 | 128)]).toBe(1);
    expect(DIR_LUT[(2 << 8) | (2 | 128)]).toBe(3);
  });
});
