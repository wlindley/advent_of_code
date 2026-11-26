import { describe, expect, it } from 'vitest';
import {
  BasinFloodFrame,
  DEFAULT_MAX_TRACE_STEPS,
  LARGEST_BASINS_PRODUCT_POLICY,
  LOW_POINT_RISK_POLICY,
  LargestBasinsProductPolicy,
  LowPointScanFrame,
  SmokeBasinSolver,
} from './index';

const OFFICIAL_EXAMPLE = ['2199943210', '3987894921', '9856789892', '8767896789', '9899965678'].join('\n');

describe('SmokeBasinSolver, policies, and trace frames', () => {
  it('solves official 5x10 example under both Part 1 and Part 2 policies', () => {
    const p1 = new SmokeBasinSolver(LOW_POINT_RISK_POLICY);
    const p2 = new SmokeBasinSolver(LARGEST_BASINS_PRODUCT_POLICY);
    expect(Object.isFrozen(p1)).toBe(true);
    expect(Object.isFrozen(LOW_POINT_RISK_POLICY)).toBe(true);
    expect(Object.isFrozen(LARGEST_BASINS_PRODUCT_POLICY)).toBe(true);

    const map = p1.parse(OFFICIAL_EXAMPLE);
    expect(p1.solve(map)).toBe(15);
    expect(p2.solve(map)).toBe(1134);
  });

  it('builds valid LowPointScanFrame traces for official, all-9, and sampled inputs', () => {
    const solver = new SmokeBasinSolver(LOW_POINT_RISK_POLICY);
    const map = solver.parse(OFFICIAL_EXAMPLE);
    const fullFrames = solver.trace(map);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(80);
    expect(fullFrames).toHaveLength(4);
    expect(fullFrames[0]).toBeInstanceOf(LowPointScanFrame);
    const last = fullFrames[fullFrames.length - 1] as LowPointScanFrame;
    expect(last.kind).toBe('low-point-risk');
    expect(last.activeLowPoint?.height).toBe(5);
    expect(last.runningTotal).toBe(15);

    const sampled1 = solver.trace(map, { maxSteps: 1 });
    expect(sampled1).toHaveLength(1);
    expect((sampled1[0] as LowPointScanFrame).runningTotal).toBe(15);

    const sampled2 = solver.trace(map, { maxSteps: 2 });
    expect(sampled2).toHaveLength(2);
    expect((sampled2[1] as LowPointScanFrame).runningTotal).toBe(15);

    const allNineFrames = solver.trace(solver.parse('99\n99'));
    expect(allNineFrames).toHaveLength(1);
    const summary = allNineFrames[0] as LowPointScanFrame;
    expect(summary.revealedLowPointCount).toBe(0);
    expect(summary.activeLowPoint).toBeNull();
    expect(summary.runningTotal).toBe(0);
  });

  it('builds valid BasinFloodFrame traces for official, depth-0, and custom topCount inputs', () => {
    const solver = new SmokeBasinSolver(LARGEST_BASINS_PRODUCT_POLICY);
    const map = solver.parse(OFFICIAL_EXAMPLE);
    const frames = solver.trace(map);
    expect(frames.length).toBeGreaterThan(1);
    expect(frames[0]).toBeInstanceOf(BasinFloodFrame);
    const first = frames[0] as BasinFloodFrame;
    expect(first.waveDepth).toBe(0);
    expect(first.revealedCellCount).toBe(4);
    const last = frames[frames.length - 1] as BasinFloodFrame;
    expect(last.kind).toBe('largest-basins-product');
    expect(last.runningTotal).toBe(1134);
    expect(last.topBasins.map((b) => b.revealedSize)).toEqual([14, 9, 9]);

    const sampled1 = solver.trace(map, { maxSteps: 1 });
    expect(sampled1).toHaveLength(1);
    expect((sampled1[0] as BasinFloodFrame).runningTotal).toBe(1134);

    const sampled2 = solver.trace(map, { maxSteps: 2 });
    expect(sampled2).toHaveLength(2);
    expect((sampled2[1] as BasinFloodFrame).runningTotal).toBe(1134);

    const depthZero = solver.parse('09090');
    const depthZeroFrames = solver.trace(depthZero, { maxSteps: 80 });
    expect(depthZeroFrames).toHaveLength(1);
    expect((depthZeroFrames[0] as BasinFloodFrame).runningTotal).toBe(1);

    const top1 = new SmokeBasinSolver(new LargestBasinsProductPolicy(1));
    expect(top1.solve(map)).toBe(14);
    const top1Frames = top1.trace(map, { maxSteps: 80 });
    expect((top1Frames[top1Frames.length - 1] as BasinFloodFrame).runningTotal).toBe(14);
  });

  it('validates topCount, basin count sufficiency, and maxSteps bounds', () => {
    expect(() => new LargestBasinsProductPolicy(0)).toThrow(RangeError);
    expect(() => new LargestBasinsProductPolicy(-2)).toThrow(RangeError);
    expect(() => new LargestBasinsProductPolicy(1.5)).toThrow(RangeError);

    const p2 = new SmokeBasinSolver(LARGEST_BASINS_PRODUCT_POLICY);
    const twoBasins = p2.parse('090');
    expect(() => p2.solve(twoBasins)).toThrow(RangeError);
    expect(() => p2.trace(twoBasins)).toThrow(RangeError);

    const p1 = new SmokeBasinSolver(LOW_POINT_RISK_POLICY);
    const map = p1.parse(OFFICIAL_EXAMPLE);
    expect(() => p1.trace(map, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => p2.trace(map, { maxSteps: -1 })).toThrow(RangeError);
    expect(() => p1.trace(p1.parse('9'), { maxSteps: 0 })).toThrow(RangeError);
  });
});
