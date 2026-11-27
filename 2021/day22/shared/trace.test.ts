import { describe, expect, it } from 'vitest';
import { parseRebootSteps } from './parser';
import { FULL_REACTOR_POLICY, INITIALIZATION_POLICY } from './policy';
import { DEFAULT_MAX_TRACE_STEPS, ReactorTraceFrame, traceReboot } from './trace';

describe('traceReboot', () => {
  it('captures immutable frames with computed getters and zero stored derived state', () => {
    const steps = parseRebootSteps([
      'on x=10..12,y=10..12,z=10..12',
      'on x=11..13,y=11..13,z=11..13',
      'off x=9..11,y=9..11,z=9..11',
      'on x=10..10,y=10..10,z=10..10',
    ].join('\n'));

    const frames = traceReboot(steps, INITIALIZATION_POLICY);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(80);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(4);
    expect(frames.map((f) => f.onCount)).toEqual([27n, 46n, 38n, 39n]);
    expect(frames.map((f) => f.stepIndex)).toEqual([0, 1, 2, 3]);
    expect(frames.every((f) => f.totalSteps === 4)).toBe(true);
    expect(frames.every((f) => !f.skipped)).toBe(true);

    const f0 = frames[0]!;
    expect(f0).toBeInstanceOf(ReactorTraceFrame);
    expect(Object.isFrozen(f0)).toBe(true);
    expect(f0.cuboidCount).toBe(1);
    expect(Object.prototype.hasOwnProperty.call(f0, 'onCount')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(f0, 'cuboidCount')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(f0, 'skipped')).toBe(false);
  });

  it('marks steps outside initialization region as skipped while full policy includes them', () => {
    const steps = parseRebootSteps([
      'on x=0..1,y=0..1,z=0..1',
      'on x=100..101,y=0..1,z=0..1',
    ].join('\n'));

    const initFrames = traceReboot(steps, INITIALIZATION_POLICY);
    expect(initFrames[0]!.skipped).toBe(false);
    expect(initFrames[0]!.clippedCuboid).not.toBeNull();
    expect(initFrames[1]!.skipped).toBe(true);
    expect(initFrames[1]!.clippedCuboid).toBeNull();
    expect(initFrames[1]!.onCount).toBe(8n);

    const fullFrames = traceReboot(steps, FULL_REACTOR_POLICY);
    expect(fullFrames[1]!.skipped).toBe(false);
    expect(fullFrames[1]!.onCount).toBe(16n);
  });

  it('uniformly bounds trace length while preserving endpoints and exact final state', () => {
    const lines = Array.from({ length: 12 }, (_, i) => `on x=${i}..${i},y=0..0,z=0..0`);
    const steps = parseRebootSteps(lines.join('\n'));
    const frames = traceReboot(steps, INITIALIZATION_POLICY, { maxSteps: 4 });

    expect(frames).toHaveLength(4);
    expect(frames[0]!.stepIndex).toBe(0);
    expect(frames[3]!.stepIndex).toBe(11);
    expect(frames[3]!.onCount).toBe(12n);
    expect(frames[3]!.cuboidCount).toBe(12);
  });

  it('rejects invalid maxSteps options', () => {
    const steps = parseRebootSteps('on x=0..0,y=0..0,z=0..0');
    expect(() => traceReboot(steps, INITIALIZATION_POLICY, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceReboot(steps, INITIALIZATION_POLICY, { maxSteps: -3 })).toThrow(RangeError);
    expect(() => traceReboot(steps, INITIALIZATION_POLICY, { maxSteps: 2.5 })).toThrow(RangeError);
  });
});
