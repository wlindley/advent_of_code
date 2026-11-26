import { describe, expect, it } from 'vitest';
import { parseCustomsBatch } from './declaration';
import { ALL_YES_POLICY, ANY_YES_POLICY, GroupConsensusResult } from './policy';
import { CustomsTraceFrame, DEFAULT_MAX_TRACE_STEPS, traceCustomsBatch } from './trace';

describe('2020 day06 trace generation', () => {
  it('constructs frozen CustomsTraceFrame with derived masks and validation', () => {
    const batch = parseCustomsBatch('ab\nac');
    const group = batch.groups[0]!;
    const consensus = ANY_YES_POLICY.evaluate(group);
    const frame = new CustomsTraceFrame(0, 1, group, consensus, 3);

    expect(Object.isFrozen(frame)).toBe(true);
    expect(frame.groupNumber).toBe(1);
    expect(frame.anyYesMask).toBe(0b111);
    expect(frame.allYesMask).toBe(0b001);
    expect(frame.partialOnlyMask).toBe(0b110);

    expect(() => new CustomsTraceFrame(0, 0, group, consensus, 3)).toThrow(RangeError);
    expect(() => new CustomsTraceFrame(0, 1.5, group, consensus, 3)).toThrow(RangeError);
    expect(() => new CustomsTraceFrame(-1, 1, group, consensus, 3)).toThrow(RangeError);
    expect(() => new CustomsTraceFrame(1, 1, group, consensus, 3)).toThrow(RangeError);
    expect(() => new CustomsTraceFrame(0.5, 2, group, consensus, 3)).toThrow(RangeError);
    expect(() => new CustomsTraceFrame(0, 1, group, new GroupConsensusResult('any-yes', 0b111), 2)).toThrow(RangeError);
    expect(() => new CustomsTraceFrame(0, 1, group, consensus, 3.5)).toThrow(RangeError);
  });

  it('traces all groups when batch fits within default or explicit maxSteps', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(80);
    const batch = parseCustomsBatch('abc\n\na\nb\nc\n\nab\nac\n\na\na\na\na\n\nb');
    const frames = traceCustomsBatch(batch, ANY_YES_POLICY);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(5);
    expect(frames.map((f) => f.groupNumber)).toEqual([1, 2, 3, 4, 5]);
    expect(frames.map((f) => f.runningSum)).toEqual([3, 6, 9, 10, 11]);
  });

  it('samples frames within maxSteps while preserving final runningSum and endpoints', () => {
    const raw = Array.from({ length: 10 }, (_, i) => String.fromCharCode(97 + i)).join('\n\n');
    const batch = parseCustomsBatch(raw);
    const sampled = traceCustomsBatch(batch, ALL_YES_POLICY, 4);

    expect(sampled).toHaveLength(4);
    expect(sampled[0]?.groupIndex).toBe(0);
    expect(sampled[0]?.runningSum).toBe(1);
    expect(sampled[3]?.groupIndex).toBe(9);
    expect(sampled[3]?.runningSum).toBe(10);

    const single = traceCustomsBatch(batch, ANY_YES_POLICY, 1);
    expect(single).toHaveLength(1);
    expect(single[0]?.groupIndex).toBe(9);
    expect(single[0]?.runningSum).toBe(10);

    expect(() => traceCustomsBatch(batch, ANY_YES_POLICY, 0)).toThrow(RangeError);
  });
});
