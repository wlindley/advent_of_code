import { describe, expect, it } from 'vitest';
import { parseBurrow } from './parser';
import { STANDARD_BURROW_POLICY } from './policy';
import { createAmphipodSolver } from './solver';
import { DEFAULT_MAX_TRACE_STEPS, traceBurrow } from './trace';

const OFFICIAL_EXAMPLE = [
  '#############',
  '#...........#',
  '###B#C#B#D###',
  '  #A#D#C#A#',
  '  #########',
].join('\n');

describe('traceBurrow and AmphipodSolver', () => {
  it('produces full trace frames with dynamic telemetry getters', () => {
    const diagram = parseBurrow(OFFICIAL_EXAMPLE);
    const frames = traceBurrow(diagram, STANDARD_BURROW_POLICY);
    expect(frames.length).toBeLessThanOrEqual(DEFAULT_MAX_TRACE_STEPS);

    const first = frames[0]!;
    expect(first.stepIndex).toBe(0);
    expect(first.lastMove).toBeNull();
    expect(first.moveEnergy).toBe(0);
    expect(first.cumulativeEnergy).toBe(0);
    expect(first.totalAmphipods).toBe(8);
    expect(first.isGoal).toBe(false);
    expect(first.heuristicRemaining).toBeGreaterThan(0);
    expect(Object.isFrozen(first)).toBe(true);

    const last = frames[frames.length - 1]!;
    expect(last.stepIndex).toBe(last.totalMoves);
    expect(last.lastMove).not.toBeNull();
    expect(last.moveEnergy).toBe(last.lastMove!.energy);
    expect(last.cumulativeEnergy).toBe(12521);
    expect(last.settledCount).toBe(8);
    expect(last.isGoal).toBe(true);
    expect(last.heuristicRemaining).toBe(0);
  });

  it('samples frames cleanly when maxSteps is smaller than move count', () => {
    const solver = createAmphipodSolver(STANDARD_BURROW_POLICY);
    const diagram = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(diagram)).toBe(12521);

    const sampled = solver.trace(diagram, { maxSteps: 4 });
    expect(sampled).toHaveLength(4);
    expect(sampled[0]!.stepIndex).toBe(0);
    expect(sampled[3]!.isGoal).toBe(true);
    expect(sampled[3]!.cumulativeEnergy).toBe(12521);
  });
});
