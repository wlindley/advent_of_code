import { describe, expect, it } from 'vitest';
import { AUTOCOMPLETE_MEDIAN_POLICY, CORRUPTION_SCORE_POLICY } from './policy';
import { SyntaxScoringSolver } from './solver';

describe('SyntaxScoringSolver', () => {
  it('parses, solves, and traces with default and explicit maxSteps', () => {
    const part1 = new SyntaxScoringSolver(CORRUPTION_SCORE_POLICY);
    expect(Object.isFrozen(part1)).toBe(true);
    expect(part1.policy).toBe(CORRUPTION_SCORE_POLICY);

    const lines = part1.parse('([])\n(]\n{>\n((');
    expect(part1.solve(lines)).toBe(25194n);

    const defaultFrames = part1.trace(lines);
    expect(defaultFrames).toHaveLength(4);
    expect(defaultFrames[3]!.runningCorruptionScore).toBe(25194n);

    const emptyOptFrames = part1.trace(lines, {});
    expect(emptyOptFrames).toHaveLength(4);

    const cappedFrames = part1.trace(lines, { maxSteps: 2 });
    expect(cappedFrames).toHaveLength(2);
    expect(cappedFrames[1]!.inspectedCount).toBe(4);
    expect(() => part1.trace(lines, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('supports autocomplete median policy', () => {
    const part2 = new SyntaxScoringSolver(AUTOCOMPLETE_MEDIAN_POLICY);
    const lines = part2.parse('<\n(\n((');
    expect(part2.solve(lines)).toBe(4n);
    const frames = part2.trace(lines);
    expect(frames).toHaveLength(3);
    expect(frames[2]!.runningMedianScore).toBe(4n);
  });
});
