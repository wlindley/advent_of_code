import { describe, expect, it } from 'vitest';
import { CARDINAL_DIR, ForestGrid, ForestSightlines } from '../../shared';
import {
  countVisibleTrees,
  DEFAULT_MAX_TRACE_STEPS,
  solver,
  traceVisibility,
  VisibilitySweepTimeline,
  VisibilityTraceFrame,
} from './index';

const OFFICIAL_EXAMPLE = ['30373', '25512', '65332', '33549', '35390'].join('\n');

describe('2022 Day 8 Part 1 domain & solver', () => {
  it('solves the official 5x5 example to 21', () => {
    const forest = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(forest)).toBe(21);
    expect(countVisibleTrees(forest)).toBe(21);
  });

  it('tracks earliestVisibleRawStep, activeDir, and wavefrontCoord across all 4 sweep phases on 3x3 grids', () => {
    const singleDirCases = [
      { grid: '909\n959\n999', expectedDir: CARDINAL_DIR.UP, expectedStep: 1 },
      { grid: '999\n950\n999', expectedDir: CARDINAL_DIR.RIGHT, expectedStep: 4 },
      { grid: '999\n959\n909', expectedDir: CARDINAL_DIR.DOWN, expectedStep: 7 },
      { grid: '999\n059\n999', expectedDir: CARDINAL_DIR.LEFT, expectedStep: 10 },
    ] as const;

    for (const { grid, expectedDir, expectedStep } of singleDirCases) {
      const forest = ForestGrid.parse(grid);
      const sightlines = ForestSightlines.analyze(forest);
      const timeline = VisibilitySweepTimeline.build(sightlines);
      expect(timeline.totalRawSteps).toBe(12);
      expect(timeline.firstVisibleStepAt(1, 1)).toBe(expectedStep);
      expect(timeline.isRevealedAt(1, 1, expectedStep - 1)).toBe(false);
      expect(timeline.isRevealedAt(1, 1, expectedStep)).toBe(true);

      const frames = traceVisibility(forest);
      expect(frames).toHaveLength(12);
      const activeFrame = frames[expectedStep]!;
      expect(activeFrame.activeDir).toBe(expectedDir);
      expect(activeFrame.wavefrontCoord).toBe(1);
      expect(activeFrame.newlyVisibleCount).toBeGreaterThanOrEqual(1);
      expect(activeFrame.isTreeRevealed(1, 1)).toBe(true);
      expect(frames[expectedStep - 1]!.isTreeRevealed(1, 1)).toBe(false);
    }
  });

  it('produces accurate trace frames on official 5x5 and handles hidden trees', () => {
    const forest = solver.parse(OFFICIAL_EXAMPLE);
    const frames = solver.trace(forest);
    expect(frames).toHaveLength(20); // 2 * (5 + 5)
    expect(Object.isFrozen(frames)).toBe(true);
    expect(Object.isFrozen(frames[0])).toBe(true);

    const first = frames[0]!;
    expect(first.activeDir).toBe(CARDINAL_DIR.UP);
    expect(first.wavefrontCoord).toBe(0);
    expect(first.cumulativeVisibleCount).toBe(5);
    expect(first.newlyVisibleCount).toBe(5);
    expect(first.isComplete).toBe(false);
    expect(first.sightlines.visibleCount).toBe(21);

    const last = frames[frames.length - 1]!;
    expect(last.activeDir).toBe(CARDINAL_DIR.LEFT);
    expect(last.wavefrontCoord).toBe(4);
    expect(last.cumulativeVisibleCount).toBe(21);
    expect(last.totalVisibleCount).toBe(21);
    expect(last.isComplete).toBe(true);
    // Center (2,2) is hidden in official example so never revealed
    expect(last.isTreeRevealed(2, 2)).toBe(false);
  });

  it('supports maxSteps sampling (1, 5, and default 120 cap on 40x40)', () => {
    const forest = solver.parse(OFFICIAL_EXAMPLE);

    const single = traceVisibility(forest, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.rawStep).toBe(19);
    expect(single[0]!.isComplete).toBe(true);
    expect(single[0]!.cumulativeVisibleCount).toBe(21);
    expect(single[0]!.newlyVisibleCount).toBe(0);

    const sampled = traceVisibility(forest, { maxSteps: 5 });
    expect(sampled).toHaveLength(5);
    expect(sampled[0]!.rawStep).toBe(0);
    expect(sampled[4]!.rawStep).toBe(19);

    const bigLines: string[] = [];
    for (let r = 0; r < 40; r += 1) {
      bigLines.push('1234567890'.repeat(4));
    }
    const bigForest = ForestGrid.parse(bigLines.join('\n'));
    const bigFrames = traceVisibility(bigForest);
    expect(bigFrames).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(bigFrames[0]!.totalRawSteps).toBe(160);
    expect(bigFrames[bigFrames.length - 1]!.isComplete).toBe(true);
  });

  it('handles 99x99 scale grids quickly within trace cap', () => {
    const lines: string[] = [];
    for (let r = 0; r < 99; r += 1) {
      let row = '';
      for (let c = 0; c < 99; c += 1) {
        row += String((r * 7 + c * 3) % 10);
      }
      lines.push(row);
    }
    const forest = solver.parse(lines.join('\n'));
    const count = solver.solve(forest);
    const frames = solver.trace(forest);
    expect(frames).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(frames[frames.length - 1]!.cumulativeVisibleCount).toBe(count);
    expect(frames[frames.length - 1]!.totalVisibleCount).toBe(count);
  });

  it('validates maxSteps, timeline coordinates, rawStep bounds, and frame invariants', () => {
    const forest = ForestGrid.parse(OFFICIAL_EXAMPLE);
    expect(() => traceVisibility(forest, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceVisibility(forest, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => traceVisibility(forest, { maxSteps: 1.5 })).toThrow(RangeError);

    const timeline = VisibilitySweepTimeline.build(ForestSightlines.analyze(forest));
    expect(() => timeline.firstVisibleStepAt(-1, 0)).toThrow(RangeError);
    expect(() => timeline.firstVisibleStepAt(0, 5)).toThrow(RangeError);
    expect(() => timeline.cumulativeVisibleAt(-1)).toThrow(RangeError);
    expect(() => timeline.cumulativeVisibleAt(20)).toThrow(RangeError);
    expect(() => timeline.cumulativeVisibleAt(1.5)).toThrow(RangeError);
    expect(() => timeline.isRevealedAt(0, 0, -1)).toThrow(RangeError);
    expect(() => timeline.isRevealedAt(0, 0, 20)).toThrow(RangeError);

    expect(() => new VisibilityTraceFrame(timeline, -1, 0, 1)).toThrow(RangeError);
    expect(() => new VisibilityTraceFrame(timeline, 0, 0, 0)).toThrow(RangeError);
  });
});
