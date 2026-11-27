import { describe, expect, it } from 'vitest';
import { MAX_APEX_POLICY } from '../../shared';
import { solver } from './index';

describe('2021 Day 17 Part 1 solver', () => {
  it('solves official and boundary Part 1 max-apex examples using MAX_APEX_POLICY', () => {
    expect(solver.policy).toBe(MAX_APEX_POLICY);
    const cases: readonly [string, number][] = [
      ['target area: x=20..30, y=-10..-5', 45],
      ['target area: x=14..14, y=-10..-2', 1],
      ['target area: x=5..5, y=-2..-2', 0],
      ['target area: x=1..1, y=-1..-1', 0],
    ];
    for (const [raw, expected] of cases) {
      const target = solver.parse(raw);
      const answer = solver.solve(target);
      expect(answer).toBe(expected);
      expect(solver.formatAnswer(answer)).toBe(String(expected));
    }
  });

  it('produces bounded sweep and arc trace frames ending at max apex 45', () => {
    const target = solver.parse('target area: x=20..30, y=-10..-5');
    const frames = solver.trace(target, { maxSteps: 10 });
    expect(frames).toHaveLength(10);
    expect(frames[0]!.phase).toBe('sweep');
    expect(frames[9]!.phase).toBe('arc');
    expect(frames[9]!.activeResult).toBe(45);
    expect(frames[9]!.isComplete).toBe(true);
  });
});
