import { describe, expect, it } from 'vitest';
import { parseAplentyInput, parseWorkflowSystem } from './parser';
import { RatingBox } from './ratingBox';
import { buildBoxSplitTrace, buildPartRoutingTrace, DEFAULT_MAX_TRACE_STEPS } from './trace';

const EXAMPLE_INPUT = [
  'in{s<1351:px,qqz}',
  'px{a<2006:A,R}',
  'qqz{m>1000:A,R}',
  '',
  '{x=10,m=20,a=100,s=500}',
  '{x=10,m=2000,a=3000,s=2000}',
  '{x=10,m=20,a=3000,s=500}',
].join('\n');

describe('Day 19 trace builders', () => {
  it('builds part-routing trace frames with running sum and sampling', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    const parsed = parseAplentyInput(EXAMPLE_INPUT);
    const full = buildPartRoutingTrace(parsed);
    expect(full).toHaveLength(6);
    expect(full[0]?.mode).toBe('part-routing');
    expect(full[0]?.path).toEqual(['in']);
    expect(full[1]?.outcome).toBe('A');
    expect(full[1]?.path).toEqual(['in', 'px', 'A']);
    expect(full[1]?.runningAcceptedSum).toBe(630);
    expect(full[5]?.outcome).toBe('R');
    expect(full[5]?.runningAcceptedSum).toBe(7640);

    const sampled = buildPartRoutingTrace(parsed, { maxSteps: 3 });
    expect(sampled).toHaveLength(3);
    expect(sampled[0]?.stepIndex).toBe(0);
    expect(sampled[2]?.stepIndex).toBe(5);
    expect(sampled[2]?.totalRawSteps).toBe(6);

    expect(() => buildPartRoutingTrace(parsed, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('builds box-split trace frames covering splits, short-circuits, fallbacks, and terminals', () => {
    const system = parseWorkflowSystem([
      'in{x<10:left,R}',
      'left{x<1:R,x<100:A,R}',
    ].join('\n'));
    const frames = buildBoxSplitTrace(system, RatingBox.uniform(1n, 20n));
    expect(frames.some((f) => f.mode === 'box-split' && f.outcome === 'A')).toBe(true);
    expect(frames.some((f) => f.outcome === 'R')).toBe(true);
    const last = frames[frames.length - 1]!;
    expect(last.runningAcceptedCombinations).toBe(9n * 20n * 20n * 20n);

    const sampled = buildBoxSplitTrace(system, RatingBox.uniform(1n, 20n), { maxSteps: 2 });
    expect(sampled).toHaveLength(2);
    expect(sampled[0]?.stepIndex).toBe(0);
    expect(sampled[1]?.stepIndex).toBe(frames.length - 1);
  });
});
