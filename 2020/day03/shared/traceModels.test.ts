import { describe, expect, it } from 'vitest';
import { LandingStep, Slope } from './slope';
import { SlopeProgress, TrajectoryTraceFrame } from './traceModels';

describe('SlopeProgress', () => {
  it('computes openCount dynamically and freezes valid active/idle progress states', () => {
    const slope = new Slope(3, 1);
    const idle = new SlopeProgress(slope, 0, 0, null);
    expect(Object.isFrozen(idle)).toBe(true);
    expect(idle.slope).toBe(slope);
    expect(idle.stepsCompleted).toBe(0);
    expect(idle.treeCount).toBe(0);
    expect(idle.openCount).toBe(0);
    expect(idle.activeLanding).toBeNull();

    const landing = new LandingStep(3, slope, 11, true);
    const active = new SlopeProgress(slope, 3, 2, landing);
    expect(active.stepsCompleted).toBe(3);
    expect(active.treeCount).toBe(2);
    expect(active.openCount).toBe(1);
    expect(active.activeLanding).toBe(landing);
  });

  it('rejects invalid step counts, tree counts, or mismatched active landings', () => {
    const slope = new Slope(3, 1);
    const other = new Slope(1, 2);
    expect(() => new SlopeProgress(slope, -1, 0, null)).toThrow(RangeError);
    expect(() => new SlopeProgress(slope, 1.5, 0, null)).toThrow(RangeError);
    expect(() => new SlopeProgress(slope, 2, -1, null)).toThrow(RangeError);
    expect(() => new SlopeProgress(slope, 2, 3, null)).toThrow(RangeError);
    expect(() => new SlopeProgress(slope, 2, 1.5, null)).toThrow(RangeError);

    const wrongSlopeLanding = new LandingStep(2, other, 11, false);
    expect(() => new SlopeProgress(slope, 2, 0, wrongSlopeLanding)).toThrow(RangeError);

    const wrongStepLanding = new LandingStep(1, slope, 11, true);
    expect(() => new SlopeProgress(slope, 2, 1, wrongStepLanding)).toThrow(RangeError);
  });
});

describe('TrajectoryTraceFrame', () => {
  it('computes treeProduct dynamically across slopes and freezes the frame', () => {
    const s1 = new Slope(1, 1);
    const s2 = new Slope(3, 2);
    const landing1 = new LandingStep(4, s1, 11, true);
    const landing2 = new LandingStep(2, s2, 11, false);
    const source = [
      new SlopeProgress(s1, 4, 3, landing1),
      new SlopeProgress(s2, 2, 2, landing2),
    ];
    const frame = new TrajectoryTraceFrame(4, 11, source);
    source.pop();
    expect(Object.isFrozen(frame)).toBe(true);
    expect(Object.isFrozen(frame.slopes)).toBe(true);
    expect(frame.row).toBe(4);
    expect(frame.totalRows).toBe(11);
    expect(frame.slopes).toHaveLength(2);
    expect(frame.treeProduct).toBe(6n);
  });

  it('rejects out-of-range rows, empty slope lists, and landings on a different row', () => {
    const slope = new Slope(3, 1);
    const idle = new SlopeProgress(slope, 0, 0, null);
    expect(() => new TrajectoryTraceFrame(0, 0, [idle])).toThrow(RangeError);
    expect(() => new TrajectoryTraceFrame(0, 1.5, [idle])).toThrow(RangeError);
    expect(() => new TrajectoryTraceFrame(-1, 5, [idle])).toThrow(RangeError);
    expect(() => new TrajectoryTraceFrame(5, 5, [idle])).toThrow(RangeError);
    expect(() => new TrajectoryTraceFrame(0, 5, [])).toThrow(RangeError);

    const row2Landing = new LandingStep(2, slope, 11, true);
    const row2Progress = new SlopeProgress(slope, 2, 1, row2Landing);
    expect(() => new TrajectoryTraceFrame(1, 5, [row2Progress])).toThrow(RangeError);
  });
});
