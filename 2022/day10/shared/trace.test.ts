import { describe, expect, it } from 'vitest';
import { CpuProgram, CpuTimeline, CycleSnapshot } from './index';
import {
  CrtTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  ProbeReading,
  buildCrtTrace,
  sampleTimelineProbes,
} from './trace';

describe('ProbeReading, CrtTraceFrame & buildCrtTrace', () => {
  it('constructs frozen ProbeReading and guards invariants and overflow', () => {
    const reading = new ProbeReading(20, 21);
    expect(Object.isFrozen(reading)).toBe(true);
    expect(reading.cycle).toBe(20);
    expect(reading.xDuring).toBe(21);
    expect(reading.signalStrength).toBe(420);

    expect(() => new ProbeReading(0, 1)).toThrow(RangeError);
    expect(() => new ProbeReading(1.5, 1)).toThrow(RangeError);
    expect(() => new ProbeReading(1, 1.5)).toThrow(RangeError);

    const overflow = new ProbeReading(2, Number.MAX_SAFE_INTEGER);
    expect(() => overflow.signalStrength).toThrow(RangeError);
  });

  it('constructs frozen CrtTraceFrame and computes getters dynamically', () => {
    const snap20 = new CycleSnapshot(20, 9, 2, 21, 22);
    const probes = [new ProbeReading(20, 21)];
    const frame = new CrtTraceFrame(snap20, 240, probes);
    probes.push(new ProbeReading(60, 19));

    expect(Object.isFrozen(frame)).toBe(true);
    expect(Object.isFrozen(frame.completedProbes)).toBe(true);
    expect(frame.completedProbes).toHaveLength(1);
    expect(frame.cycle).toBe(20);
    expect(frame.isProbeCycle).toBe(true);
    expect(frame.cumulativeSignalStrength).toBe(420);
    expect(frame.isComplete).toBe(false);

    const snap21 = new CycleSnapshot(21, 10, 1, 22, 22);
    const frame21 = new CrtTraceFrame(snap21, 21, [new ProbeReading(20, 21)]);
    expect(frame21.isProbeCycle).toBe(false);
    expect(frame21.isComplete).toBe(true);

    expect(() => new CrtTraceFrame(snap20, 19, [])).toThrow(RangeError);
    expect(() => new CrtTraceFrame(snap20, 0, [])).toThrow(RangeError);

    const overflowFrame = new CrtTraceFrame(snap20, 20, [
      new ProbeReading(1, Number.MAX_SAFE_INTEGER),
      new ProbeReading(1, 1),
    ]);
    expect(() => overflowFrame.cumulativeSignalStrength).toThrow(RangeError);
  });

  it('samples timeline probes within totalCycles and rejects invalid probe cycles', () => {
    const timeline = CpuTimeline.execute(CpuProgram.parse('noop\naddx 3\naddx -5'));
    const probes = sampleTimelineProbes(timeline, [2, 5, 20]);
    expect(probes.map((p) => [p.cycle, p.xDuring, p.signalStrength])).toEqual([
      [2, 1, 2],
      [5, 4, 20],
    ]);
    expect(Object.isFrozen(probes)).toBe(true);

    expect(() => sampleTimelineProbes(timeline, [0])).toThrow(RangeError);
    expect(() => sampleTimelineProbes(timeline, [2.5])).toThrow(RangeError);
    expect(() => sampleTimelineProbes(timeline, [Number.MAX_SAFE_INTEGER + 1])).toThrow(RangeError);
  });

  it('builds full and subsampled traces up to DEFAULT_MAX_TRACE_STEPS', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(240);
    const lines = Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? 'addx 2' : 'noop'));
    const timeline = CpuTimeline.execute(CpuProgram.parse(lines.join('\n')));
    expect(timeline.totalCycles).toBe(30);

    const fullTrace = buildCrtTrace(timeline, [10, 20, 30]);
    expect(Object.isFrozen(fullTrace)).toBe(true);
    expect(fullTrace).toHaveLength(30);
    expect(fullTrace[0]!.cycle).toBe(1);
    expect(fullTrace[0]!.isProbeCycle).toBe(false);
    expect(fullTrace[9]!.cycle).toBe(10);
    expect(fullTrace[9]!.isProbeCycle).toBe(true);
    expect(fullTrace[29]!.isComplete).toBe(true);
    expect(fullTrace[29]!.completedProbes).toHaveLength(3);

    const sampled = buildCrtTrace(timeline, [10, 20, 30], { maxSteps: 6 });
    expect(sampled).toHaveLength(6);
    expect(sampled[0]!.cycle).toBe(1);
    expect(sampled[sampled.length - 1]!.cycle).toBe(30);
    expect(sampled[sampled.length - 1]!.isComplete).toBe(true);
    expect(sampled[sampled.length - 1]!.completedProbes).toHaveLength(3);

    expect(() => buildCrtTrace(timeline, [10], { maxSteps: 0 })).toThrow(RangeError);
  });
});
