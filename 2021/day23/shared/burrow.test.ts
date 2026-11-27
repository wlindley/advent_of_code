import { describe, expect, it } from 'vitest';
import { BurrowMove, BurrowState } from './burrow';
import {
  goalKeyForDepth,
  HALL_COLS,
  HALL_COUNT,
  ROOM_COLS,
  ROOM_COUNT,
  SPECIES,
  speciesToIndex,
  STEP_ENERGY,
} from './constants';

describe('constants & burrow entities', () => {
  it('defines standard amphipod constants and helpers', () => {
    expect(HALL_COUNT).toBe(7);
    expect(ROOM_COUNT).toBe(4);
    expect(SPECIES).toEqual(['A', 'B', 'C', 'D']);
    expect(HALL_COLS).toEqual([0, 1, 3, 5, 7, 9, 10]);
    expect(ROOM_COLS).toEqual([2, 4, 6, 8]);
    expect(STEP_ENERGY).toEqual([1, 10, 100, 1000]);
    expect(speciesToIndex('A')).toBe(0);
    expect(speciesToIndex('D')).toBe(3);
    expect(goalKeyForDepth(2)).toBe('.......AABBCCDD');
  });

  it('computes BurrowMove steps and energy dynamically without stored derived fields', () => {
    const exitMove = new BurrowMove(
      'B',
      { kind: 'room', room: 0, depth: 1 },
      { kind: 'hallway', slot: 2 },
    );
    expect(exitMove.steps).toBe(3);
    expect(exitMove.energy).toBe(30);
    expect(Object.isFrozen(exitMove)).toBe(true);

    const enterMove = new BurrowMove(
      'D',
      { kind: 'hallway', slot: 5 },
      { kind: 'room', room: 3, depth: 0 },
    );
    expect(enterMove.steps).toBe(2);
    expect(enterMove.energy).toBe(2000);
  });

  it('constructs valid BurrowState and computes settledCount and isGoal dynamically', () => {
    const goal = new BurrowState('.......AABBCCDD', 2);
    expect(goal.isGoal).toBe(true);
    expect(goal.settledCount).toBe(8);
    expect(goal.hallwayAt(0)).toBe('.');
    expect(goal.roomAt(1, 0)).toBe('B');
    expect(goal.isSlotSettled(0, 0)).toBe(true);
    expect(Object.isFrozen(goal)).toBe(true);

    const mixed = new BurrowState('.A.....BA.CBCDD', 2);
    expect(mixed.isGoal).toBe(false);
    expect(mixed.isSlotSettled(0, 0)).toBe(false);
    expect(mixed.isSlotSettled(0, 1)).toBe(true);
    expect(mixed.isSlotSettled(3, 0)).toBe(true);
    expect(mixed.settledCount).toBe(4);
  });

  it('rejects invalid BurrowState invariants', () => {
    expect(() => new BurrowState('.......ABCD', 0)).toThrow(RangeError);
    expect(() => new BurrowState('.......ABCD', 1.5)).toThrow(RangeError);
    expect(() => new BurrowState('short', 2)).toThrow(RangeError);
    expect(() => new BurrowState('.......AABBCCDX', 2)).toThrow();
    expect(() => new BurrowState('.......AAABCCDD', 2)).toThrow();
    expect(() => new BurrowState('.A.....A.BBCCDD', 2)).toThrow();
  });
});
