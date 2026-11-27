import { describe, expect, it } from 'vitest';
import { PART1_POLICY } from './cavern';
import { parseRiskGrid } from './parser';
import { findLowestRiskPath } from './pathfinder';
import {
  CavernTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  traceCavernPath,
} from './trace';

describe('traceCavernPath', () => {
  it('traces wavefront then path phases with exact prefix-sum counts and derived getters', () => {
    const result = findLowestRiskPath(parseRiskGrid('19\n11').expand(PART1_POLICY));
    // maxDistance = 9 (10 wavefront thresholds 0..9) + pathLength = 3 -> 13 timeline steps.
    const frames = traceCavernPath(result);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(48);
    expect(frames).toHaveLength(13);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames[0]).toBeInstanceOf(CavernTraceFrame);
    expect(Object.isFrozen(frames[0])).toBe(true);

    expect(frames[0]?.phase).toBe('wavefront');
    expect(frames[0]?.riskThreshold).toBe(0);
    expect(frames[0]?.settledCount).toBe(1);
    expect(frames[0]?.frontierCount).toBe(1);
    expect(frames[0]?.pathRevealCount).toBe(0);
    expect(frames[0]?.revealedPathRisk).toBe(0);
    expect(frames[0]?.goalReached).toBe(false);
    expect(frames[0]?.settledRatio).toBe(0.25);

    expect(frames[2]?.phase).toBe('wavefront');
    expect(frames[2]?.riskThreshold).toBe(2);
    expect(frames[2]?.settledCount).toBe(3);
    expect(frames[2]?.frontierCount).toBe(1);
    expect(frames[2]?.goalReached).toBe(true);

    expect(frames[9]?.phase).toBe('wavefront');
    expect(frames[9]?.riskThreshold).toBe(9);
    expect(frames[9]?.settledCount).toBe(4);
    expect(frames[9]?.frontierCount).toBe(1);

    expect(frames[10]?.phase).toBe('path');
    expect(frames[10]?.pathRevealCount).toBe(1);
    expect(frames[10]?.revealedPathRisk).toBe(0);
    expect(frames[10]?.frontierCount).toBe(0);

    const last = frames[12]!;
    expect(last.phase).toBe('path');
    expect(last.step).toBe(12);
    expect(last.pathRevealCount).toBe(3);
    expect(last.revealedPathRisk).toBe(2);
    expect(last.settledCount).toBe(4);
    expect(last.settledRatio).toBe(1);
    expect(last.goalReached).toBe(true);
  });

  it('bounds frame count by maxSteps while preserving start and end frames', () => {
    const grid = parseRiskGrid([
      '1163751742',
      '1381373672',
      '2136511328',
      '3694931569',
      '7463417111',
      '1319128137',
      '1359912421',
      '3125421639',
      '1293138521',
      '2311944581',
    ].join('\n'));
    const result = findLowestRiskPath(grid.expand(PART1_POLICY));
    // waveTotal = 41, pathLength = 19 -> 60 > 48 default cap
    const capped = traceCavernPath(result);
    expect(capped).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(capped[0]?.step).toBe(0);
    expect(capped[capped.length - 1]?.step).toBe(result.maxDistance + result.pathLength);
    expect(capped[capped.length - 1]?.revealedPathRisk).toBe(40);

    const custom = traceCavernPath(result, { maxSteps: 5 });
    expect(custom).toHaveLength(5);
    expect(custom[0]?.phase).toBe('wavefront');
    expect(custom[4]?.phase).toBe('path');
    expect(custom[4]?.pathRevealCount).toBe(result.pathLength);

    const single = traceCavernPath(result, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]?.phase).toBe('path');
    expect(single[0]?.revealedPathRisk).toBe(40);

    expect(() => traceCavernPath(result, { maxSteps: 0 })).toThrow(RangeError);
  });
});
