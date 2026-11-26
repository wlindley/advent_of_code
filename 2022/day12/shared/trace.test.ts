import { describe, expect, it } from 'vitest';
import {
  buildHillClimbTrace,
  computeReverseBfs,
  createHillClimbingSolver,
  DEFAULT_MAX_TRACE_STEPS,
  HillClimbTraceFrame,
  parseHeightMap,
  type StartCondition,
} from './index';

const OFFICIAL_EXAMPLE = [
  'Sabqponm',
  'abcryxxl',
  'accszExk',
  'acctuvwj',
  'abdefghi',
].join('\n');

const START_S: StartCondition = {
  label: 'Fixed start (S)',
  matches: (map, idx) => idx === map.startIndex,
};

describe('buildHillClimbTrace', () => {
  it('traces all wavefront distances when maxDistance + 1 <= DEFAULT_MAX_TRACE_STEPS', () => {
    const map = parseHeightMap(OFFICIAL_EXAMPLE);
    const field = computeReverseBfs(map);
    const frames = buildHillClimbTrace(map, field, START_S);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(field.maxReachableDistance + 1);
    expect(frames[0]!.distance).toBe(0);
    expect(frames[0]!.frontierCount).toBe(1);
    expect(frames[0]!.reachedCount).toBe(1);
    expect(frames[0]!.winningStartReached).toBe(false);
    expect(frames[0]!.isComplete).toBe(false);
    expect(Object.isFrozen(frames[0])).toBe(true);

    const winFrame = frames[31]!;
    expect(winFrame.winningStartIndex).toBe(map.startIndex);
    expect(winFrame.winningDistance).toBe(31);
    expect(winFrame.winningStartReached).toBe(true);
    const last = frames[frames.length - 1]!;
    expect(last.distance).toBe(field.maxReachableDistance);
    expect(last.reachedCount).toBe(field.reachableCount);
    expect(last.isComplete).toBe(true);
  });

  it('samples frames with endpoint preservation for maxSteps 5 and 1', () => {
    const map = parseHeightMap(OFFICIAL_EXAMPLE);
    const field = computeReverseBfs(map);
    const five = buildHillClimbTrace(map, field, START_S, { maxSteps: 5 });
    expect(five).toHaveLength(5);
    expect(five[0]!.distance).toBe(0);
    expect(five[4]!.distance).toBe(field.maxReachableDistance);
    expect(five[4]!.isComplete).toBe(true);

    const one = buildHillClimbTrace(map, field, START_S, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]!.distance).toBe(field.maxReachableDistance);
    expect(one[0]!.isComplete).toBe(true);
  });

  it('produces trace without throwing when start is unreachable', () => {
    const map = parseHeightMap('SE');
    const field = computeReverseBfs(map);
    const frames = buildHillClimbTrace(map, field, START_S);
    expect(frames).toHaveLength(1);
    expect(frames[0]!.winningStartIndex).toBeNull();
    expect(frames[0]!.winningDistance).toBeNull();
    expect(frames[0]!.winningStartReached).toBe(false);
    expect(frames[0]!.isComplete).toBe(true);
  });

  it('rejects invalid maxSteps options', () => {
    const map = parseHeightMap(OFFICIAL_EXAMPLE);
    const field = computeReverseBfs(map);
    expect(() => buildHillClimbTrace(map, field, START_S, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => buildHillClimbTrace(map, field, START_S, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => buildHillClimbTrace(map, field, START_S, { maxSteps: 2.5 })).toThrow(RangeError);
  });
});

describe('HillClimbTraceFrame validation', () => {
  it('validates bounds and paired nullability of winningDistance and winningStartIndex', () => {
    expect(() => new HillClimbTraceFrame(0, -1, 1, 1, null, null)).toThrow(RangeError);
    expect(() => new HillClimbTraceFrame(0, 1.5, 1, 1, null, null)).toThrow(RangeError);
    expect(() => new HillClimbTraceFrame(-1, 5, 1, 1, null, null)).toThrow(RangeError);
    expect(() => new HillClimbTraceFrame(6, 5, 1, 1, null, null)).toThrow(RangeError);
    expect(() => new HillClimbTraceFrame(1.5, 5, 1, 1, null, null)).toThrow(RangeError);
    expect(() => new HillClimbTraceFrame(0, 5, -1, 1, null, null)).toThrow(RangeError);
    expect(() => new HillClimbTraceFrame(0, 5, 1.5, 1, null, null)).toThrow(RangeError);
    expect(() => new HillClimbTraceFrame(0, 5, 1, 0, null, null)).toThrow(RangeError);
    expect(() => new HillClimbTraceFrame(0, 5, 1, 1.5, null, null)).toThrow(RangeError);
    expect(() => new HillClimbTraceFrame(0, 5, 1, 1, 3, null)).toThrow(/paired/i);
    expect(() => new HillClimbTraceFrame(0, 5, 1, 1, null, 0)).toThrow(/paired/i);
    expect(() => new HillClimbTraceFrame(0, 5, 1, 1, -1, 0)).toThrow(RangeError);
    expect(() => new HillClimbTraceFrame(0, 5, 1, 1, 6, 0)).toThrow(RangeError);
    expect(() => new HillClimbTraceFrame(0, 5, 1, 1, 2.5, 0)).toThrow(RangeError);
    expect(() => new HillClimbTraceFrame(0, 5, 1, 1, 3, -1)).toThrow(RangeError);
    expect(() => new HillClimbTraceFrame(0, 5, 1, 1, 3, 1.5)).toThrow(RangeError);
  });
});

describe('createHillClimbingSolver', () => {
  it('creates a frozen solver that solves, traces, and throws on unreachable starts', () => {
    const solver = createHillClimbingSolver(START_S);
    expect(Object.isFrozen(solver)).toBe(true);
    const map = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(map)).toBe(31);
    expect(solver.trace!(map, { maxSteps: 4 })).toHaveLength(4);
    expect(() => solver.solve(solver.parse('SE'))).toThrow(/No reachable start/);
  });
});
