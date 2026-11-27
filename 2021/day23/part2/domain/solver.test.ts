import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { applyMoveToKey, type RoomPair } from '../../shared';
import { solver, UNFOLDED_BURROW_POLICY, UnfoldedBurrowPolicy } from './index';

const OFFICIAL_EXAMPLE = [
  '#############',
  '#...........#',
  '###B#C#B#D###',
  '  #A#D#C#A#',
  '  #########',
].join('\n');

const SORTED_DEPTH2_DIAGRAM = {
  rooms: [
    ['A', 'A'],
    ['B', 'B'],
    ['C', 'C'],
    ['D', 'D'],
  ] as readonly RoomPair[],
};

describe('2021 Day 23 Part 2 solver & UnfoldedBurrowPolicy', () => {
  it('exposes immutable unfolded policy metadata', () => {
    const instance = new UnfoldedBurrowPolicy();
    expect(instance.id).toBe('unfolded');
    expect(instance.label).toBe('Unfolded (depth 4)');
    expect(instance.roomDepth).toBe(4);
    expect(Object.isFrozen(UNFOLDED_BURROW_POLICY)).toBe(true);
    expect(solver.policy).toBe(UNFOLDED_BURROW_POLICY);
  });

  it('unfolds depth-2 rooms into depth-4 state on the official example', () => {
    const diagram = solver.parse(OFFICIAL_EXAMPLE);
    const state = UNFOLDED_BURROW_POLICY.prepare(diagram);
    expect(state.roomDepth).toBe(4);
    expect(state.key).toBe('.......BDDACCBDBBACDACA');
    expect(state.settledCount).toBe(2);
  });

  it('solves the official Part 2 example to 44169', () => {
    const result = executeSolver(solver, OFFICIAL_EXAMPLE);
    expect(result.answer).toBe(44169);
  });

  it('unfolds and solves an already-sorted depth-2 diagram cleanly', () => {
    const start = UNFOLDED_BURROW_POLICY.prepare(SORTED_DEPTH2_DIAGRAM);
    expect(start.key).toBe('.......ADDABCBBCBACDACD');

    const totalEnergy = solver.solve(SORTED_DEPTH2_DIAGRAM);
    expect(totalEnergy).toBeGreaterThan(0);

    const frames = solver.trace(SORTED_DEPTH2_DIAGRAM);
    const last = frames[frames.length - 1]!;
    expect(last.isGoal).toBe(true);
    expect(last.state.key).toBe('.......AAAABBBBCCCCDDDD');
    expect(last.cumulativeEnergy).toBe(totalEnergy);
  });

  it('produces an admissible, consistent, replay-verified full trace for the official example', () => {
    const diagram = solver.parse(OFFICIAL_EXAMPLE);
    const frames = solver.trace(diagram, { maxSteps: 200 });
    expect(frames.length).toBeGreaterThan(2);
    expect(frames[0]!.stepIndex).toBe(0);
    expect(frames[0]!.lastMove).toBeNull();
    expect(frames[0]!.moveEnergy).toBe(0);

    let replayedKey = frames[0]!.state.key;
    for (let i = 0; i < frames.length; i += 1) {
      const curr = frames[i]!;
      expect(curr.stepIndex).toBe(i);
      expect(curr.heuristicRemaining).toBeLessThanOrEqual(44169 - curr.cumulativeEnergy);
      if (i > 0) {
        const prev = frames[i - 1]!;
        expect(curr.lastMove).not.toBeNull();
        replayedKey = applyMoveToKey(replayedKey, 4, curr.lastMove!);
        expect(curr.state.key).toBe(replayedKey);
        expect(curr.cumulativeEnergy).toBe(prev.cumulativeEnergy + curr.moveEnergy);
        expect(prev.heuristicRemaining).toBeLessThanOrEqual(
          curr.moveEnergy + curr.heuristicRemaining,
        );
      }
    }

    const last = frames[frames.length - 1]!;
    expect(last.isGoal).toBe(true);
    expect(last.cumulativeEnergy).toBe(44169);
    expect(last.settledCount).toBe(16);
    expect(last.totalAmphipods).toBe(16);
  });

  it('bounds trace length while preserving start and goal frames', () => {
    const diagram = solver.parse(OFFICIAL_EXAMPLE);
    const bounded = solver.trace(diagram, { maxSteps: 8 });
    expect(bounded).toHaveLength(8);
    expect(bounded[0]!.stepIndex).toBe(0);
    expect(bounded[7]!.isGoal).toBe(true);
    expect(bounded[7]!.cumulativeEnergy).toBe(44169);
  });

  it('rejects empty room list in prepare', () => {
    expect(() => UNFOLDED_BURROW_POLICY.prepare({ rooms: [] })).toThrow(RangeError);
  });

  it('rejects 5 rooms in prepare', () => {
    const fiveRooms = [...SORTED_DEPTH2_DIAGRAM.rooms, ['A', 'A'] as const];
    expect(() => UNFOLDED_BURROW_POLICY.prepare({ rooms: fiveRooms })).toThrow(RangeError);
  });

  it('rejects unbalanced species in prepare', () => {
    const unbalanced: readonly RoomPair[] = [
      ['A', 'A'],
      ['A', 'A'],
      ['C', 'C'],
      ['D', 'D'],
    ];
    expect(() => UNFOLDED_BURROW_POLICY.prepare({ rooms: unbalanced })).toThrow();
  });

  it('rejects empty raw input in parse', () => {
    expect(() => solver.parse('')).toThrow();
  });

  it('rejects malformed raw input in parse', () => {
    expect(() => solver.parse('invalid')).toThrow();
  });

  it('rejects non-positive maxSteps in trace', () => {
    const diagram = solver.parse(OFFICIAL_EXAMPLE);
    expect(() => solver.trace(diagram, { maxSteps: 0 })).toThrow(RangeError);
  });
});
