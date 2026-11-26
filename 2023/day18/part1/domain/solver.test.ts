import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  'R 6 (#70c710)',
  'D 5 (#0dc571)',
  'L 2 (#5713f0)',
  'D 2 (#d2c081)',
  'R 2 (#59c680)',
  'D 2 (#411b91)',
  'L 5 (#8ceee2)',
  'U 2 (#caa173)',
  'L 1 (#1b58a2)',
  'U 2 (#caa171)',
  'R 2 (#7807d2)',
  'U 3 (#a77fa3)',
  'L 2 (#015232)',
  'U 2 (#7a21e3)',
].join('\n');

describe('Day 18 Part 1 solver', () => {
  it('solves the official 14-step example to 62n via executeSolver with a fake Clock', () => {
    let now = 100;
    const fakeClock: Clock = { nowMs: () => (now += 9) };
    const exec = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);
    expect(exec).toEqual({
      answer: 62n,
      elapsedMs: 9,
      runtime: 'main-thread',
    });
  });

  it('produces sampled trace frames ending at complete polygon', () => {
    const polygon = solver.parse(OFFICIAL_EXAMPLE);
    const frames = solver.trace?.(polygon, { maxSteps: 5 }) ?? [];
    expect(frames).toHaveLength(5);
    expect(frames[0]!.completedEdges).toBe(1);
    expect(frames[4]!.completedEdges).toBe(14);
    expect(frames[4]!.isComplete).toBe(true);
    expect(frames[4]!.cumulativeBoundary).toBe(38n);
    expect(frames[4]!.cumulativeSignedDoubleArea).toBe(84n);
  });
});
