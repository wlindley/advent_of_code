import { describe, expect, it } from 'vitest';
import { PartRating } from './partRating';
import { ConditionalRule, Workflow } from './workflow';

describe('ConditionalRule and Workflow', () => {
  it('evaluates strict < and > thresholds and formats rules', () => {
    const ltRule = new ConditionalRule('a', '<', 2006, 'qkq');
    const gtRule = new ConditionalRule('m', '>', 2090, 'A');
    expect(Object.isFrozen(ltRule)).toBe(true);
    expect(ltRule.format()).toBe('a<2006:qkq');
    expect(gtRule.format()).toBe('m>2090:A');

    const atBoundary = new PartRating({ x: 1, m: 2090, a: 2006, s: 1 });
    expect(ltRule.matches(atBoundary)).toBe(false);
    expect(gtRule.matches(atBoundary)).toBe(false);

    const matching = new PartRating({ x: 1, m: 2091, a: 2005, s: 1 });
    expect(ltRule.matches(matching)).toBe(true);
    expect(gtRule.matches(matching)).toBe(true);
  });

  it('rejects invalid rule threshold or target', () => {
    expect(() => new ConditionalRule('x', '<', 0, 'A')).toThrow(RangeError);
    expect(() => new ConditionalRule('x', '>', 10, 'Bad!')).toThrow();
  });

  it('evaluates first matching rule or falls back when none match', () => {
    const r1 = new ConditionalRule('x', '<', 1416, 'A');
    const r2 = new ConditionalRule('x', '>', 2662, 'R');
    const wf = new Workflow('px', [r1, r2], 'rfg');
    expect(Object.isFrozen(wf)).toBe(true);
    expect(Object.isFrozen(wf.rules)).toBe(true);
    expect(wf.targets).toEqual(['A', 'R', 'rfg']);

    const pLow = new PartRating({ x: 1415, m: 1, a: 1, s: 1 });
    const pMid = new PartRating({ x: 1416, m: 1, a: 1, s: 1 });
    const pHigh = new PartRating({ x: 2663, m: 1, a: 1, s: 1 });

    expect(wf.matchRule(pLow)).toBe(r1);
    expect(wf.evaluate(pLow)).toBe('A');
    expect(wf.matchRule(pMid)).toBeNull();
    expect(wf.evaluate(pMid)).toBe('rfg');
    expect(wf.matchRule(pHigh)).toBe(r2);
    expect(wf.evaluate(pHigh)).toBe('R');
  });

  it('supports fallback-only workflows with zero rules and validates names', () => {
    const wf = new Workflow('in', [], 'A');
    expect(wf.targets).toEqual(['A']);
    const part = new PartRating({ x: 1, m: 1, a: 1, s: 1 });
    expect(wf.matchRule(part)).toBeNull();
    expect(wf.evaluate(part)).toBe('A');

    expect(() => new Workflow('Bad', [], 'A')).toThrow();
    expect(() => new Workflow('in', [], '123')).toThrow();
  });
});
