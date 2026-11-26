import { describe, expect, it } from 'vitest';
import { GridPoint, MotionPlan } from './motionPlan';
import {
  DEFAULT_DENSE_CELL_LIMIT,
  DEFAULT_MAX_TRACE_STEPS,
  RopeTraceFrame,
  countVisitedTailCells,
  traceRopeBridge,
} from './simulation';

const SMALL_EXAMPLE = ['R 4', 'U 4', 'L 3', 'D 1', 'R 4', 'D 1', 'L 5', 'R 2'].join('\n');
const LARGE_EXAMPLE = ['R 5', 'U 8', 'L 8', 'D 3', 'R 17', 'D 10', 'L 25', 'U 20'].join('\n');

describe('countVisitedTailCells', () => {
  it('matches official examples for K=1, K=2, and K=10', () => {
    const small = MotionPlan.parse(SMALL_EXAMPLE);
    expect(countVisitedTailCells(small, 1)).toBe(21);
    expect(countVisitedTailCells(small, 2)).toBe(13);
    expect(countVisitedTailCells(small, 10)).toBe(1);

    const large = MotionPlan.parse(LARGE_EXAMPLE);
    expect(countVisitedTailCells(large, 10)).toBe(36);
  });

  it('handles cardinal pulls, diagonal pulls, and backtracking revisits', () => {
    const backtrack = MotionPlan.parse('R 4\nL 4');
    expect(countVisitedTailCells(backtrack, 2)).toBe(4);

    const diagPull = MotionPlan.parse('R 1\nU 2\nD 2\nL 2\nD 2');
    expect(countVisitedTailCells(diagPull, 2)).toBe(3);
  });

  it('switches to sparse tracker when bounds area exceeds DEFAULT_DENSE_CELL_LIMIT', () => {
    const sparsePlan = MotionPlan.parse('R 5000\nU 5000\nD 2');
    expect(sparsePlan.computeBounds().area).toBeGreaterThan(DEFAULT_DENSE_CELL_LIMIT);
    expect(countVisitedTailCells(sparsePlan, 2)).toBe(9999);
  });

  it('rejects invalid knot counts', () => {
    const plan = MotionPlan.parse('R 1');
    expect(() => countVisitedTailCells(plan, 0)).toThrow(RangeError);
    expect(() => countVisitedTailCells(plan, -3)).toThrow(RangeError);
    expect(() => countVisitedTailCells(plan, 2.5)).toThrow(RangeError);
  });
});

describe('traceRopeBridge', () => {
  it('emits complete unsampled frames for small inputs', () => {
    const plan = MotionPlan.parse(SMALL_EXAMPLE);
    const frames = traceRopeBridge(plan, 2);
    expect(frames).toHaveLength(plan.totalSteps + 1);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(400);

    const first = frames[0]!;
    expect(Object.isFrozen(first)).toBe(true);
    expect(first.stepIndex).toBe(0);
    expect(first.commandIndex).toBe(-1);
    expect(first.head.equals(GridPoint.ORIGIN)).toBe(true);
    expect(first.tail.equals(GridPoint.ORIGIN)).toBe(true);
    expect(first.knotCount).toBe(2);
    expect(first.isComplete).toBe(false);
    expect(first.newlyVisitedCount).toBe(1);

    const last = frames[frames.length - 1]!;
    expect(last.stepIndex).toBe(plan.totalSteps);
    expect(last.commandIndex).toBe(plan.commandCount - 1);
    expect(last.isComplete).toBe(true);

    const totalNew = frames.reduce((acc, f) => acc + f.newlyVisitedCount, 0);
    expect(totalNew).toBe(13);
  });

  it('preserves unique tail visit totals under sampled, maxSteps=1, and maxSteps=2 traces', () => {
    const plan = MotionPlan.parse(SMALL_EXAMPLE);

    const sampled = traceRopeBridge(plan, 2, { maxSteps: 5 });
    expect(sampled).toHaveLength(5);
    expect(sampled[0]!.stepIndex).toBe(0);
    expect(sampled[4]!.isComplete).toBe(true);
    expect(sampled.reduce((acc, f) => acc + f.newlyVisitedCount, 0)).toBe(13);

    const two = traceRopeBridge(plan, 2, { maxSteps: 2 });
    expect(two.map((f) => f.stepIndex)).toEqual([0, plan.totalSteps]);
    expect(two.reduce((acc, f) => acc + f.newlyVisitedCount, 0)).toBe(13);

    const single = traceRopeBridge(plan, 2, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.stepIndex).toBe(plan.totalSteps);
    expect(single[0]!.isComplete).toBe(true);
    expect(single[0]!.newlyVisitedCount).toBe(13);
  });

  it('rejects invalid knotCount and maxSteps options', () => {
    const plan = MotionPlan.parse('R 2');
    expect(() => traceRopeBridge(plan, 0)).toThrow(RangeError);
    expect(() => traceRopeBridge(plan, 2, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceRopeBridge(plan, 2, { maxSteps: -1 })).toThrow(RangeError);
    expect(() => traceRopeBridge(plan, 2, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});

describe('RopeTraceFrame', () => {
  it('enforces invariant guards on constructor inputs', () => {
    const knots = [GridPoint.ORIGIN];
    expect(() => new RopeTraceFrame(-1, 2, 0, knots, [])).toThrow(RangeError);
    expect(() => new RopeTraceFrame(0, -1, 0, knots, [])).toThrow(RangeError);
    expect(() => new RopeTraceFrame(3, 2, 0, knots, [])).toThrow(RangeError);
    expect(() => new RopeTraceFrame(0, 2, -2, knots, [])).toThrow(RangeError);
    expect(() => new RopeTraceFrame(0, 2, 0, [], [])).toThrow(RangeError);
    expect(() => new RopeTraceFrame(1.5, 2, 0, knots, [])).toThrow(RangeError);
  });
});
