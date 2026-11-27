import { describe, expect, it } from 'vitest';
import { parseSnailfishHomework } from './parser';
import { HOMEWORK_SUM_POLICY, MAX_PAIR_MAGNITUDE_POLICY } from './policy';
import { DEFAULT_MAX_TRACE_STEPS, SnailfishTraceFrame, traceSnailfish } from './trace';

describe('traceSnailfish', () => {
  it('traces single-operand homework with a single initial complete frame', () => {
    const hw = parseSnailfishHomework('[1,2]');
    const frames = traceSnailfish(hw, HOMEWORK_SUM_POLICY);
    expect(frames).toHaveLength(1);
    const frame = frames[0]!;
    expect(frame).toBeInstanceOf(SnailfishTraceFrame);
    expect(frame.kind).toBe('initial');
    expect(frame.step).toBe(0);
    expect(frame.rawIndex).toBe(0);
    expect(frame.totalRawSteps).toBe(1);
    expect(frame.operandIndex).toBe(0);
    expect(frame.totalOperands).toBe(1);
    expect(frame.focusIndex).toBe(-1);
    expect(frame.magnitude).toBe(7);
    expect(frame.maxDepth).toBe(1);
    expect(frame.leafCount).toBe(2);
    expect(frame.expression).toBe('[1,2]');
    expect(frame.progressRatio).toBe(1);
    expect(frame.isComplete).toBe(true);
    expect(Object.isFrozen(frame)).toBe(true);
    expect(Object.isFrozen(frames)).toBe(true);
  });

  it('records initial, add, explode, and split frames and bounds long traces via maxSteps', () => {
    const hw = parseSnailfishHomework('[[[[4,3],4],4],[7,[[8,4],9]]]\n[1,1]');
    const full = traceSnailfish(hw, HOMEWORK_SUM_POLICY);
    expect(full.length).toBeGreaterThan(2);
    expect(full.length).toBeLessThanOrEqual(DEFAULT_MAX_TRACE_STEPS);
    expect(full[0]!.kind).toBe('initial');
    expect(full[0]!.isComplete).toBe(false);
    expect(full[0]!.progressRatio).toBe(0);
    expect(full[1]!.kind).toBe('add');
    expect(full.some((f) => f.kind === 'explode')).toBe(true);
    expect(full.some((f) => f.kind === 'split')).toBe(true);
    const last = full[full.length - 1]!;
    expect(last.isComplete).toBe(true);
    expect(last.progressRatio).toBe(1);
    expect(last.expression).toBe('[[[[0,7],4],[[7,8],[6,0]]],[8,1]]');
    expect(last.magnitude).toBe(1384);

    const bounded = traceSnailfish(hw, HOMEWORK_SUM_POLICY, { maxSteps: 4 });
    expect(bounded).toHaveLength(4);
    expect(bounded[0]!.rawIndex).toBe(0);
    expect(bounded[3]!.rawIndex).toBe(full.length - 1);
    expect(bounded[3]!.isComplete).toBe(true);

    const singleCap = traceSnailfish(hw, MAX_PAIR_MAGNITUDE_POLICY, { maxSteps: 1 });
    expect(singleCap).toHaveLength(1);
    expect(singleCap[0]!.isComplete).toBe(true);
    expect(singleCap[0]!.magnitude).toBe(1384);
  });

  it('rejects invalid maxSteps option', () => {
    const hw = parseSnailfishHomework('[1,2]');
    expect(() => traceSnailfish(hw, HOMEWORK_SUM_POLICY, { maxSteps: 0 })).toThrow(RangeError);
  });
});
