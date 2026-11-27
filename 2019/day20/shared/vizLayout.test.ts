import { describe, expect, it } from 'vitest';
import { parseDonutMaze } from './maze';
import type { DonutPathStep, DonutTraceFrame } from './solver';
import { computeDepthStats, computeDonutRenderMetrics, formatDonutStatus } from './vizLayout';

const SAMPLE_MAZE = parseDonutMaze(['  A  ', '  A  ', ' #.# ', ' #.# ', '  Z  ', '  Z  '].join('\n'));

const SAMPLE_PATH: readonly DonutPathStep[] = [
  { row: 2, col: 2, depth: 0, warpedVia: null },
  { row: 2, col: 3, depth: 1, warpedVia: 'BC' },
  { row: 3, col: 3, depth: 2, warpedVia: 'DE' },
  { row: 3, col: 2, depth: 0, warpedVia: null },
];

describe('vizLayout', () => {
  it('computes bounded HiDPI canvas metrics and rejects non-positive dimensions', () => {
    const small = computeDonutRenderMetrics(10, 10);
    expect(small.cellSize).toBe(28);
    expect(small.width).toBe(10 * 28 + small.pad * 2);
    expect(small.height).toBe(10 * 28 + small.pad * 2);

    const large = computeDonutRenderMetrics(200, 200);
    expect(large.cellSize).toBe(5);
    expect(Object.isFrozen(large)).toBe(true);

    expect(() => computeDonutRenderMetrics(0, 10)).toThrow(RangeError);
    expect(() => computeDonutRenderMetrics(10, -2)).toThrow(RangeError);
    expect(() => computeDonutRenderMetrics(1.5, 10)).toThrow(RangeError);
  });

  it('computes depth and warp stats up to stepIndex', () => {
    const mid = computeDepthStats(SAMPLE_PATH, 2);
    expect(mid).toEqual({
      currentDepth: 2,
      maxDepth: 2,
      warpCount: 2,
      totalSteps: 3,
      currentStep: 2,
    });
    expect(Object.isFrozen(mid)).toBe(true);
    expect(computeDepthStats(SAMPLE_PATH, 0).warpCount).toBe(0);
    expect(() => computeDepthStats([], 0)).toThrow(RangeError);
    expect(() => computeDepthStats(SAMPLE_PATH, -1)).toThrow(RangeError);
    expect(() => computeDepthStats(SAMPLE_PATH, 4)).toThrow(RangeError);
  });

  it('formats status with optional depth and warp label', () => {
    const f0: DonutTraceFrame = { maze: SAMPLE_MAZE, path: SAMPLE_PATH, stepIndex: 0 };
    const f1: DonutTraceFrame = { maze: SAMPLE_MAZE, path: SAMPLE_PATH, stepIndex: 1 };
    expect(formatDonutStatus(f0, false)).toBe('Step 0 / 3');
    expect(formatDonutStatus(f1, true)).toBe('Step 1 / 3 · Depth 1 · Warped via BC');
  });
});
