import { describe, expect, it } from 'vitest';
import { parseSensorReadings, SensorReading } from '../../shared';
import {
  buildDistressTrace,
  DEFAULT_MAX_TRACE_STEPS,
  DistressTraceFrame,
} from './index';

const EXAMPLE_INPUT = [
  'Sensor at x=2, y=18: closest beacon is at x=-2, y=15',
  'Sensor at x=9, y=16: closest beacon is at x=10, y=16',
  'Sensor at x=13, y=2: closest beacon is at x=15, y=3',
  'Sensor at x=12, y=14: closest beacon is at x=10, y=16',
  'Sensor at x=10, y=20: closest beacon is at x=10, y=16',
  'Sensor at x=14, y=17: closest beacon is at x=10, y=16',
  'Sensor at x=8, y=7: closest beacon is at x=2, y=10',
  'Sensor at x=2, y=0: closest beacon is at x=2, y=10',
  'Sensor at x=0, y=11: closest beacon is at x=2, y=10',
  'Sensor at x=20, y=14: closest beacon is at x=25, y=17',
  'Sensor at x=17, y=20: closest beacon is at x=21, y=22',
  'Sensor at x=16, y=7: closest beacon is at x=15, y=3',
  'Sensor at x=14, y=3: closest beacon is at x=15, y=3',
  'Sensor at x=20, y=1: closest beacon is at x=15, y=3',
].join('\n');

describe('DistressTraceFrame invariants & guards', () => {
  it('computes dynamic getters and freezes state and revealedCandidates', () => {
    const pts = [{ x: 1, y: 2 }];
    const initial = new DistressTraceFrame(0, 3, [], null, null);
    expect(initial.activeCandidate).toBeNull();
    expect(initial.tuningFrequency).toBeNull();
    expect(initial.isComplete).toBe(false);
    expect(Object.isFrozen(initial)).toBe(true);

    const mid = new DistressTraceFrame(1, 3, pts, 0, { x: 1, y: 2 });
    pts.push({ x: 9, y: 9 });
    expect(mid.revealedCandidates).toEqual([{ x: 1, y: 2 }]);
    expect(mid.activeCandidate).toEqual({ x: 1, y: 2 });
    expect(mid.tuningFrequency).toBe(4_000_002n);
    expect(mid.isComplete).toBe(false);
    expect(Object.isFrozen(mid.revealedCandidates)).toBe(true);

    const done = new DistressTraceFrame(3, 3, [{ x: 1, y: 2 }, { x: 3, y: 4 }], null, { x: 3, y: 4 });
    expect(done.isComplete).toBe(true);
    expect(done.activeCandidate).toEqual({ x: 3, y: 4 });
  });

  it('rejects every invalid constructor argument independently', () => {
    expect(() => new DistressTraceFrame(0, 0, [], null, null)).toThrow(RangeError);
    expect(() => new DistressTraceFrame(0, -1, [], null, null)).toThrow(RangeError);
    expect(() => new DistressTraceFrame(0, 1.5, [], null, null)).toThrow(RangeError);
    expect(() => new DistressTraceFrame(-1, 2, [], null, null)).toThrow(RangeError);
    expect(() => new DistressTraceFrame(1.5, 2, [], null, null)).toThrow(RangeError);
    expect(() => new DistressTraceFrame(3, 2, [], null, null)).toThrow(RangeError);
    expect(() => new DistressTraceFrame(0, 2, [{ x: 0, y: 0 }], null, null)).toThrow(RangeError);
    expect(() => new DistressTraceFrame(0, 2, [], 0, null)).toThrow(RangeError);
    expect(() => new DistressTraceFrame(1, 2, [{ x: 0, y: 0 }], -1, null)).toThrow(RangeError);
    expect(() => new DistressTraceFrame(1, 2, [{ x: 0, y: 0 }], 1.5, null)).toThrow(RangeError);
  });
});

describe('buildDistressTrace', () => {
  it('builds bounded default trace on example input with covering sensors and final distress hit', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    const readings = parseSensorReadings(EXAMPLE_INPUT);
    const frames = buildDistressTrace(readings, 20);
    expect(frames.length).toBeLessThanOrEqual(DEFAULT_MAX_TRACE_STEPS);
    expect(frames[0]!.checkedCount).toBe(0);
    expect(frames[0]!.revealedCandidates.length).toBe(0);
    expect(frames[0]!.coveringSensorIndex).toBeNull();
    expect(frames.some((f) => f.coveringSensorIndex !== null && f.activeCandidate !== null)).toBe(true);
    const last = frames[frames.length - 1]!;
    expect(last.isComplete).toBe(true);
    expect(last.distressPoint).toEqual({ x: 14, y: 11 });
    expect(last.tuningFrequency).toBe(56_000_011n);
  });

  it('hits uncovered candidate checkpoint directly when trace is unsampled', () => {
    const readings = [new SensorReading(0, 0, 0, 7)];
    const frames = buildDistressTrace(readings, 4);
    expect(frames.length).toBe(frames[0]!.totalCandidates + 1);
    const distressHit = frames.find((f) => f.checkedCount > 0 && f.coveringSensorIndex === null);
    expect(distressHit?.activeCandidate).toEqual({ x: 4, y: 4 });
    expect(distressHit?.distressPoint).toEqual({ x: 4, y: 4 });
  });

  it('supports maxSteps = 1 and maxSteps < totalCandidates, and rejects invalid maxSteps', () => {
    const readings = [new SensorReading(0, 0, 0, 7)];
    const single = buildDistressTrace(readings, 4, { maxSteps: 1 });
    expect(single.length).toBe(1);
    expect(single[0]!.isComplete).toBe(true);
    expect(single[0]!.revealedCandidates.length).toBe(1);
    expect(single[0]!.distressPoint).toEqual({ x: 4, y: 4 });

    const exampleReadings = parseSensorReadings(EXAMPLE_INPUT);
    const capped = buildDistressTrace(exampleReadings, 20, { maxSteps: 5 });
    expect(capped.length).toBe(5);
    expect(capped[4]!.revealedCandidates.length).toBe(4);
    expect(capped[4]!.distressPoint).toEqual({ x: 14, y: 11 });

    expect(() => buildDistressTrace(readings, 4, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => buildDistressTrace(readings, 4, { maxSteps: 2.5 })).toThrow(RangeError);
  });
});
