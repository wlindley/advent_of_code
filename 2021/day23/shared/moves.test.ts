import { describe, expect, it } from 'vitest';
import {
  applyMoveToKey,
  cleanEntryDepth,
  findForcedHomeMove,
  findUnsettledTopDepth,
  generateRoomExitMoves,
  generateSuccessors,
} from './moves';

describe('burrow moves', () => {
  it('computes cleanEntryDepth for empty, partial, dirty, and full rooms', () => {
    expect(cleanEntryDepth('..AB.....BBCCDD', 0, 2)).toBe(1);
    expect(cleanEntryDepth('.A......ABBCCDD', 0, 2)).toBe(0);
    expect(cleanEntryDepth('.A......BBBCCDD', 0, 2)).toBe(-1);
    expect(cleanEntryDepth('.......AABBCCDD', 0, 2)).toBe(-1);
  });

  it('finds unsettled top depth including settled-species blocking foreign below', () => {
    expect(findUnsettledTopDepth('.......AABBCCDD', 0, 2)).toBe(-1);
    expect(findUnsettledTopDepth('..AB.....BBCCDD', 0, 2)).toBe(-1);
    expect(findUnsettledTopDepth('.......ABBBCCDD', 0, 2)).toBe(0);
    expect(findUnsettledTopDepth('.A......BBBCCDD', 0, 2)).toBe(1);
  });

  it('prioritizes forced home moves from hallway (left & right)', () => {
    const fromLeft = findForcedHomeMove('.A......ABBCCDD', 2);
    expect(fromLeft?.nextKey).toBe('.......AABBCCDD');
    expect(fromLeft?.move.energy).toBe(2);

    const openRight = findForcedHomeMove('.....A..ABBCCDD', 2);
    expect(openRight?.nextKey).toBe('.......AABBCCDD');
    expect(openRight?.move.from).toEqual({ kind: 'hallway', slot: 5 });

    expect(findForcedHomeMove('D..B....ABACC.D', 2)).toBeNull();
  });

  it('performs clean room-to-room forced moves in both directions', () => {
    // Room 2 top 'A' moves to room 0 depth 0; room 0 is '.A', room 1 is 'BB', room 2 is 'AC', room 3 is 'DD'
    const leftMove = findForcedHomeMove('........ABBACDD', 2);
    expect(leftMove?.nextKey).toBe('.......AABB.CDD');
    expect(leftMove?.move.from).toEqual({ kind: 'room', room: 2, depth: 0 });
    expect(leftMove?.move.to).toEqual({ kind: 'room', room: 0, depth: 0 });

    // Room 0 top 'D' moves to room 3 depth 0; room 0 is 'DA', room 1 is 'BB', room 2 is 'CC', room 3 is '.D'
    const rightMove = findForcedHomeMove('.......DABBCC.D', 2);
    expect(rightMove?.nextKey).toBe('........ABBCCDD');
    expect(rightMove?.move.from).toEqual({ kind: 'room', room: 0, depth: 0 });
    expect(rightMove?.move.to).toEqual({ kind: 'room', room: 3, depth: 0 });

    // Room-to-room blocked by hallway amphipod at slot 3 ('A' cannot enter dirty room 0 'DA')
    expect(findForcedHomeMove('...A...DABBCC.D', 2)).toBeNull();
  });

  it('generates room exit moves scanning left and right until blocked, and delegates in generateSuccessors', () => {
    const startKey = '.......BACDBCDA';
    const exits = generateRoomExitMoves(startKey, 2);
    expect(exits).toHaveLength(28);
    expect(generateSuccessors(startKey, 2)).toHaveLength(28);

    // Blocked hallway limits exit moves
    const blockedKey = '..A.C..B.B.DCDA';
    const limited = generateRoomExitMoves(blockedKey, 2);
    expect(limited.length).toBeGreaterThan(0);
    expect(limited.length).toBeLessThan(28);

    // Forced move overrides room exits in generateSuccessors
    const forcedSuccessors = generateSuccessors('........ABBACDD', 2);
    expect(forcedSuccessors).toHaveLength(1);
    expect(applyMoveToKey('........ABBACDD', 2, forcedSuccessors[0]!.move)).toBe('.......AABB.CDD');
  });
});
