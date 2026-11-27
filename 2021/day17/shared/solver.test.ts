import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { MAX_APEX_POLICY, VALID_VELOCITY_COUNT_POLICY } from './policy';
import { TrickShotSolver } from './solver';

describe('2021 Day 17 TrickShotSolver', () => {
  const exampleRaw = 'target area: x=20..30, y=-10..-5';

  it('parses, analyzes, solves, traces, and formats Part 1 and Part 2 policies', () => {
    const part1 = new TrickShotSolver(MAX_APEX_POLICY);
    const part2 = new TrickShotSolver(VALID_VELOCITY_COUNT_POLICY);

    expect(Object.isFrozen(part1)).toBe(true);
    expect(part1.policy).toBe(MAX_APEX_POLICY);
    expect(part2.policy).toBe(VALID_VELOCITY_COUNT_POLICY);

    const p1Exec = executeSolver(part1, exampleRaw);
    expect(p1Exec.answer).toBe(45);
    expect(part1.formatAnswer(p1Exec.answer)).toBe('45');

    const p2Exec = executeSolver(part2, exampleRaw);
    expect(p2Exec.answer).toBe(112);
    expect(part2.formatAnswer(p2Exec.answer)).toBe('112');

    const target = part1.parse(exampleRaw);
    const frames = part1.trace(target, { maxSteps: 10 });
    expect(frames).toHaveLength(10);
    expect(frames[9]!.isComplete).toBe(true);
    expect(frames[9]!.activeResult).toBe(45);
  });
});
