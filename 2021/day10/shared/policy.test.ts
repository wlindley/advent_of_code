import { describe, expect, it } from 'vitest';
import { analyzeSyntax } from './analysis';
import { AUTOCOMPLETE_MEDIAN_POLICY, CORRUPTION_SCORE_POLICY } from './policy';

describe('SyntaxScoringPolicy', () => {
  it('evaluates and traces CORRUPTION_SCORE_POLICY with sampled frames', () => {
    const analysis = analyzeSyntax(['([])', '(]', '{>', '((']);
    expect(Object.isFrozen(CORRUPTION_SCORE_POLICY)).toBe(true);
    expect(CORRUPTION_SCORE_POLICY.id).toBe('corruption-score');
    expect(CORRUPTION_SCORE_POLICY.evaluate(analysis)).toBe(25194n);

    const full = CORRUPTION_SCORE_POLICY.trace(analysis, 10);
    expect(Object.isFrozen(full)).toBe(true);
    expect(full).toHaveLength(4);
    expect(full[3]!.runningCorruptionScore).toBe(25194n);

    const capped = CORRUPTION_SCORE_POLICY.trace(analysis, 2);
    expect(capped).toHaveLength(2);
    expect(capped[0]!.inspectedCount).toBe(1);
    expect(capped[1]!.inspectedCount).toBe(4);
  });

  it('evaluates and traces AUTOCOMPLETE_MEDIAN_POLICY and rejects zero incomplete lines', () => {
    const analysis = analyzeSyntax(['((', '(', '<', '(]']);
    expect(Object.isFrozen(AUTOCOMPLETE_MEDIAN_POLICY)).toBe(true);
    expect(AUTOCOMPLETE_MEDIAN_POLICY.id).toBe('autocomplete-median');
    expect(AUTOCOMPLETE_MEDIAN_POLICY.evaluate(analysis)).toBe(4n);

    const full = AUTOCOMPLETE_MEDIAN_POLICY.trace(analysis, 10);
    expect(Object.isFrozen(full)).toBe(true);
    expect(full).toHaveLength(3);
    expect(full[2]!.runningMedianScore).toBe(4n);

    const capped = AUTOCOMPLETE_MEDIAN_POLICY.trace(analysis, 2);
    expect(capped).toHaveLength(2);
    expect(capped[1]!.inspectedCount).toBe(3);

    const noIncomplete = analyzeSyntax(['([])', '(]']);
    expect(() => AUTOCOMPLETE_MEDIAN_POLICY.evaluate(noIncomplete)).toThrow(RangeError);
    expect(() => AUTOCOMPLETE_MEDIAN_POLICY.trace(noIncomplete, 10)).toThrow(RangeError);
  });
});
