import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  '2413432311323',
  '3215453535623',
  '3255245654254',
  '3446585845452',
  '4546657867536',
  '1438598798454',
  '4457876987766',
  '3637877979653',
  '4654967986887',
  '4564679986453',
  '1224686865563',
  '2546548887735',
  '4322674655533',
].join('\n');

describe('Day 17 Part 1 solver', () => {
  it('solves the official 13x13 example to 102 via executeSolver with a fake Clock', () => {
    let now = 200;
    const fakeClock: Clock = {
      nowMs: () => {
        now += 7;
        return now;
      },
    };
    const exec = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);
    expect(exec).toEqual({
      answer: 102,
      elapsedMs: 7,
      runtime: 'main-thread',
    });
  });

  it('produces sampled wavefront trace frames ending at 102', () => {
    const map = solver.parse(OFFICIAL_EXAMPLE);
    const frames = solver.trace?.(map, { maxSteps: 8 }) ?? [];
    expect(frames).toHaveLength(8);
    expect(frames[0]!.heatThreshold).toBe(0);
    expect(frames[0]!.settledCount).toBe(1);
    expect(frames[7]!.heatThreshold).toBe(102);
    expect(frames[7]!.isComplete).toBe(true);
    expect(frames[7]!.result.goalHeat).toBe(102);
  });
});
