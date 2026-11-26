import { describe, expect, it } from 'vitest';
import { computeArrangementTable } from './arrangements';
import { AdapterChain } from './chain';
import { JoltHistogram, JoltStep } from './differences';
import {
  ArrangementTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  DifferenceTraceFrame,
  traceArrangements,
  traceDifferences,
} from './trace';

describe('DifferenceTraceFrame & ArrangementTraceFrame', () => {
  it('validates DifferenceTraceFrame invariants and derives getters', () => {
    const step = new JoltStep(2, 1, new JoltHistogram(2, 0, 0));
    const frame = new DifferenceTraceFrame(4, step);
    expect(frame.phase).toBe('differences');
    expect(frame.step).toBe(2);
    expect(frame.activeIndex).toBe(2);
    expect(frame.fromIndex).toBe(1);
    expect(frame.delta).toBe(1);
    expect(frame.histogram).toBe(step.histogram);
    expect(frame.isComplete).toBe(false);
    expect(Object.isFrozen(frame)).toBe(true);

    const last = new DifferenceTraceFrame(2, step);
    expect(last.isComplete).toBe(true);

    expect(() => new DifferenceTraceFrame(1, step)).toThrow(RangeError);
    expect(() => new DifferenceTraceFrame(2.5, step)).toThrow(RangeError);
  });

  it('validates ArrangementTraceFrame invariants and shares table with waysIfComputed', () => {
    const table = computeArrangementTable(new AdapterChain([1, 2]));
    const frame = new ArrangementTraceFrame(1, table);
    expect(frame.phase).toBe('arrangements');
    expect(frame.step).toBe(2);
    expect(frame.totalSteps).toBe(4);
    expect(frame.activeStep).toBe(table.stepAt(1));
    expect(frame.ways).toBe(1n);
    expect(frame.predecessorIndices).toEqual([0]);
    expect(frame.isComplete).toBe(false);
    expect(frame.waysIfComputed(0)).toBe(1n);
    expect(frame.waysIfComputed(1)).toBe(1n);
    expect(frame.waysIfComputed(2)).toBeNull();
    expect(Object.isFrozen(frame)).toBe(true);

    expect(new ArrangementTraceFrame(3, table).isComplete).toBe(true);
    expect(() => frame.waysIfComputed(-1)).toThrow(RangeError);
    expect(() => frame.waysIfComputed(4)).toThrow(RangeError);
    expect(() => new ArrangementTraceFrame(-1, table)).toThrow(RangeError);
    expect(() => new ArrangementTraceFrame(4, table)).toThrow(RangeError);
    expect(() => new ArrangementTraceFrame(1.5, table)).toThrow(RangeError);
  });
});

describe('traceDifferences & traceArrangements', () => {
  it('traces full chains within budget and downsamples preserving endpoints', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(240);
    const small = new AdapterChain([16, 10, 15, 5, 1, 11, 7, 19, 6, 12, 4]);

    const diffFrames = traceDifferences(small, DEFAULT_MAX_TRACE_STEPS);
    expect(diffFrames).toHaveLength(12);
    expect(diffFrames[0]!.step).toBe(1);
    expect(diffFrames[11]!.isComplete).toBe(true);
    expect(diffFrames[11]!.histogram.part1Product).toBe(35n);
    expect(Object.isFrozen(diffFrames)).toBe(true);

    const arrFrames = traceArrangements(small, DEFAULT_MAX_TRACE_STEPS);
    expect(arrFrames).toHaveLength(13);
    expect(arrFrames[0]!.activeIndex).toBe(0);
    expect(arrFrames[12]!.isComplete).toBe(true);
    expect(arrFrames[12]!.ways).toBe(8n);
    expect(arrFrames[0]!.table).toBe(arrFrames[12]!.table);

    const longChain = new AdapterChain(Array.from({ length: 300 }, (_, i) => i + 1));
    const sampledDiff = traceDifferences(longChain, 20);
    expect(sampledDiff).toHaveLength(20);
    expect(sampledDiff[0]!.step).toBe(1);
    expect(sampledDiff[19]!.isComplete).toBe(true);

    const sampledArr = traceArrangements(longChain, 20);
    expect(sampledArr).toHaveLength(20);
    expect(sampledArr[0]!.activeIndex).toBe(0);
    expect(sampledArr[19]!.isComplete).toBe(true);
    expect(sampledArr[19]!.ways).toBe(sampledArr[19]!.table.totalArrangements);
  });
});
