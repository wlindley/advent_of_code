import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { DEFAULT_REDOUBT_SPACE, Robot, TorusSpace } from '../../shared';
import {
  DEFAULT_MAX_TRACE_STEPS,
  DEFAULT_SPARKLINE_BINS,
  EasterEggAnalysis,
  MAX_SCAN_UINT32,
  analyzeEasterEgg,
  buildConvergenceTrace,
  computeCyclePeriod,
  createPart2Solver,
  downsamplePeakSeries,
  findEasterEggSecond,
  solver,
  traceEasterEggConvergence,
} from './index';

describe('day14 part2 analysis & solver', () => {
  it('computes cycle periods for coprime, non-coprime, and 1x1 spaces', () => {
    expect(computeCyclePeriod(DEFAULT_REDOUBT_SPACE)).toBe(10403);
    expect(computeCyclePeriod(new TorusSpace(9, 15))).toBe(45);
    expect(computeCyclePeriod(new TorusSpace(1, 1))).toBe(1);
    expect(MAX_SCAN_UINT32).toBe(0xffff_ffff);
  });

  it('validates EasterEggAnalysis invariants, tie-breaking, and dynamic getters', () => {
    const space = new TorusSpace(5, 5);
    expect(() => new EasterEggAnalysis(space, [])).toThrow(RangeError);

    const raw = [1, 4, 4, 3];
    const analysis = new EasterEggAnalysis(space, raw);
    raw[0] = 99;
    expect(Object.isFrozen(analysis)).toBe(true);
    expect(Object.isFrozen(analysis.adjacencySeries)).toBe(true);
    expect(analysis.period).toBe(4);
    expect(analysis.bestSecond).toBe(1);
    expect(analysis.peakAdjacency).toBe(4);
    expect(analysis.baselineMeanAdjacency).toBe(3);

    const zeros = new EasterEggAnalysis(space, [0, 0, 0]);
    expect(zeros.bestSecond).toBe(0);
    expect(zeros.peakAdjacency).toBe(0);
  });

  it('guards empty swarms and oversized uint32 scan spaces before allocating', () => {
    const small = new TorusSpace(5, 5);
    expect(() => analyzeEasterEgg([], small)).toThrow(RangeError);
    const huge = new TorusSpace(65537, 65539);
    expect(() => analyzeEasterEgg([new Robot(0, 0, 1, 1)], huge)).toThrow(RangeError);
  });

  it('handles 1x1 spaces, stacked robots, non-wrapping edges, and pre-reduction', () => {
    const tiny = new TorusSpace(1, 1);
    const tinyAnalysis = analyzeEasterEgg([new Robot(0, 0, 1, -1)], tiny);
    expect(tinyAnalysis.period).toBe(1);
    expect(tinyAnalysis.bestSecond).toBe(0);
    expect(tinyAnalysis.peakAdjacency).toBe(0);

    const space = new TorusSpace(5, 3);
    const edgeRobots = [
      new Robot(9, 3, 0, 0), // wraps to (4, 0) - right edge
      new Robot(0, 0, 0, 0), // left edge - must NOT wrap-pair with (4, 0)
      new Robot(0, 2, 0, 0), // bottom edge - must NOT wrap-pair with (0, 0)
      new Robot(0, 2, 0, 0), // stacked duplicate at (0, 2)
      new Robot(1, 2, -5, 3), // adjacent to (0, 2) every step
    ];
    const analysis = analyzeEasterEgg(edgeRobots, space);
    expect(analysis.bestSecond).toBe(0);
    expect(analysis.peakAdjacency).toBe(1);
    const reversed = analyzeEasterEgg([...edgeRobots].reverse(), space);
    expect(reversed.adjacencySeries).toEqual(analysis.adjacencySeries);
  });

  it('downsamples sparkline series with validation, empty, 1:1, single-bin, and max-pooling', () => {
    expect(DEFAULT_SPARKLINE_BINS).toBe(160);
    expect(() => downsamplePeakSeries([1, 2], 0)).toThrow(RangeError);
    expect(() => downsamplePeakSeries([1, 2], 1.5)).toThrow(RangeError);
    expect(downsamplePeakSeries([], 10)).toEqual([]);

    const exact = downsamplePeakSeries([3, 5, 2], 5);
    expect(Object.isFrozen(exact)).toBe(true);
    expect(exact).toEqual([
      { startSecond: 0, endSecond: 0, peakSecond: 0, peakScore: 3 },
      { startSecond: 1, endSecond: 1, peakSecond: 1, peakScore: 5 },
      { startSecond: 2, endSecond: 2, peakSecond: 2, peakScore: 2 },
    ]);

    const single = downsamplePeakSeries([1, 4, 4, 2], 1);
    expect(single).toEqual([{ startSecond: 0, endSecond: 3, peakSecond: 1, peakScore: 4 }]);

    const pooled = downsamplePeakSeries([1, 5, 2, 3, 8, 4], 2);
    expect(pooled).toEqual([
      { startSecond: 0, endSecond: 2, peakSecond: 1, peakScore: 5 },
      { startSecond: 3, endSecond: 5, peakSecond: 4, peakScore: 8 },
    ]);
  });

  it('builds bounded convergence traces with all frame labels and maxSteps edge cases', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(40);
    const space = new TorusSpace(7, 5);
    const scores = Array.from({ length: 35 }, (_, t) => (t === 20 ? 10 : t === 5 ? 7 : 1));
    const analysis = new EasterEggAnalysis(space, scores);
    const robots = [new Robot(0, 0, 1, 1), new Robot(1, 0, 1, 1)];

    expect(() => buildConvergenceTrace(robots, analysis, { maxSteps: 0 })).toThrow(RangeError);

    const one = buildConvergenceTrace(robots, analysis, { maxSteps: 1 });
    expect(one.map((f) => [f.second, f.highlight, f.label])).toEqual([
      [20, true, 'Easter egg peak'],
    ]);

    const two = buildConvergenceTrace(robots, analysis, { maxSteps: 2 });
    expect(two.map((f) => [f.second, f.label])).toEqual([
      [0, 'Initial swarm'],
      [20, 'Easter egg peak'],
    ]);

    const full = buildConvergenceTrace(robots, analysis, { maxSteps: 16 });
    expect(full).toHaveLength(16);
    expect(full.some((f) => f.label === 'Initial swarm')).toBe(true);
    expect(full.some((f) => f.label === 'Adjacency precursor')).toBe(true);
    expect(full.some((f) => f.label === 'Approach window')).toBe(true);
    expect(full.at(-1)?.label).toBe('Easter egg peak');
    expect(full.at(-1)?.highlight).toBe(true);

    const zeroPeak = traceEasterEggConvergence(robots, new TorusSpace(3, 3));
    expect(zeroPeak).toHaveLength(1);
    expect(zeroPeak[0]?.second).toBe(0);
    expect(zeroPeak[0]?.label).toBe('Easter egg peak');
  });

  it('executes solver and custom space solver via executeSolver', () => {
    const space = new TorusSpace(7, 5);
    const customSolver = createPart2Solver(space);
    expect(Object.isFrozen(customSolver)).toBe(true);
    const input = 'p=3,2 v=1,1\np=4,2 v=1,1\np=3,3 v=1,1';
    const exec = executeSolver(customSolver, input, { nowMs: () => 10 });
    expect(exec.answer).toBe(0);
    expect(exec.elapsedMs).toBe(0);
    expect(findEasterEggSecond(customSolver.parse(input), space)).toBe(0);

    const defaultInput = 'p=0,0 v=1,1\np=1,0 v=1,1';
    const parsed = solver.parse(defaultInput);
    expect(solver.solve(parsed)).toBe(0);
    const trace = solver.trace?.(parsed, { maxSteps: 1 });
    expect(trace).toHaveLength(1);
    expect(trace?.[0]?.space).toBe(DEFAULT_REDOUBT_SPACE);
  });
});
