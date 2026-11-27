import { describe, expect, it } from 'vitest';
import { parseHomework } from './parser';
import { EQUAL_PRECEDENCE_POLICY } from './policies';
import { traceHomework } from './trace';

describe('day18 homework tracer', () => {
  it('traces all steps in post-order for multi-op and 0-op expressions', () => {
    const program = parseHomework('1 + 2 * 3\n((42))\n2 * (3 + 4)', EQUAL_PRECEDENCE_POLICY);
    const frames = traceHomework(program, 20);

    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(5);
    expect(frames.every((frame) => Object.isFrozen(frame) && Object.isFrozen(frame.nodeValues))).toBe(true);

    expect(frames[0]).toMatchObject({
      stepIndex: 0,
      totalSteps: 5,
      expressionIndex: 0,
      expressionCount: 3,
      operationLabel: '1 + 2 = 3',
      stepResult: 3n,
      expressionComplete: false,
      cumulativeSum: 0n,
    });
    expect(frames[1]).toMatchObject({
      stepIndex: 1,
      operationLabel: '3 * 3 = 9',
      stepResult: 9n,
      expressionComplete: true,
      cumulativeSum: 9n,
    });
    expect(frames[2]).toMatchObject({
      stepIndex: 2,
      expressionIndex: 1,
      operationLabel: '((42)) = 42',
      stepResult: 42n,
      expressionComplete: true,
      cumulativeSum: 51n,
    });
    expect(frames[4]?.cumulativeSum).toBe(program.evaluateSum());
  });

  it('bounds frames with maxSteps: 1 and maxSteps: 3 (range-skip + inner-skip) while preserving final sum', () => {
    const program = parseHomework(
      '1 + 2 + 3 + 4\n((42))\n5 * 6 + 7 * 8',
      EQUAL_PRECEDENCE_POLICY,
    );

    const single = traceHomework(program, 1);
    expect(single).toHaveLength(1);
    expect(single[0]?.stepIndex).toBe(6);
    expect(single[0]?.expressionComplete).toBe(true);
    expect(single[0]?.cumulativeSum).toBe(program.evaluateSum());

    const sampled = traceHomework(program, 3);
    expect(sampled.map((frame) => frame.stepIndex)).toEqual([0, 3, 6]);
    expect(sampled[1]?.operationLabel).toBe('((42)) = 42');
    expect(sampled[2]?.cumulativeSum).toBe(program.evaluateSum());
  });

  it('rejects invalid maxSteps values via validateMaxSteps', () => {
    const program = parseHomework('1 + 2', EQUAL_PRECEDENCE_POLICY);
    expect(() => traceHomework(program, 0)).toThrowError(RangeError);
    expect(() => traceHomework(program, -1)).toThrowError(RangeError);
    expect(() => traceHomework(program, 1.5)).toThrowError(RangeError);
  });
});
