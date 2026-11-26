import { describe, expect, it } from 'vitest';
import { DEFAULT_MAX_TRACE_STEPS, solver, solveTreeFarm, traceTreeFarm } from './index';

const OFFICIAL_EXAMPLE =
  '0:\n###\n##.\n##.\n\n1:\n###\n##.\n.##\n\n2:\n.##\n###\n##.\n\n3:\n##.\n###\n##.\n\n4:\n###\n#..\n###\n\n5:\n###\n.#.\n###\n\n4x4: 0 0 0 0 2 0\n12x5: 1 0 1 0 2 2\n12x5: 1 0 1 0 3 2';

const MIXED_VERDICTS_INPUT = [
  '0:\n###\n###\n###',
  '3x3: 0',       // trivial-empty
  '2x2: 1',       // area-impossible
  '2x10: 1',      // dimension-impossible (3x3 does not fit in 2x10)
  '6x3: 2',       // disjoint-tiling
  '4x4: 1',       // disjoint-tiling (1 <= 1)
].join('\n');

describe('Day 12 Part 1 solver & trace', () => {
  it('solves the official example to 2', () => {
    const farm = solver.parse(OFFICIAL_EXAMPLE);
    expect(solveTreeFarm(farm)).toBe(2);
    expect(solver.solve(farm)).toBe(2);
  });

  it('traces all regions with default maxSteps and builds witnesses', () => {
    const farm = solver.parse(OFFICIAL_EXAMPLE);
    const frames = traceTreeFarm(farm);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(frames).toHaveLength(3);
    expect(frames[0]!.evaluation.placements).not.toBeNull();
    expect(frames[2]!).toMatchObject({
      stepIndex: 2, totalSteps: 3, regionIndex: 2, totalRegions: 3,
      feasibleSoFar: 2, infeasibleSoFar: 1, exactSolvedSoFar: 3,
      fastPathFeasibleSoFar: 0, fastPathInfeasibleSoFar: 0, isComplete: true,
    });
  });

  it('samples mixed verdicts accurately when maxSteps < len, maxSteps === 1, and maxSteps >= len', () => {
    const farm = solver.parse(MIXED_VERDICTS_INPUT);

    const fAll = solver.trace!(farm, { maxSteps: 10 });
    expect(fAll).toHaveLength(5);
    expect(fAll[4]!).toMatchObject({
      feasibleSoFar: 3, infeasibleSoFar: 2,
      fastPathFeasibleSoFar: 3, fastPathInfeasibleSoFar: 2, exactSolvedSoFar: 0, isComplete: true,
    });

    const fOne = traceTreeFarm(farm, { maxSteps: 1 });
    expect(fOne).toHaveLength(1);
    expect(fOne[0]!).toMatchObject({ stepIndex: 0, totalSteps: 1, regionIndex: 4, feasibleSoFar: 3, infeasibleSoFar: 2, isComplete: true });

    const fTwo = traceTreeFarm(farm, { maxSteps: 2 });
    expect(fTwo.map((f) => f.regionIndex)).toEqual([0, 4]);
    expect(fTwo[1]!).toMatchObject({ stepIndex: 1, totalSteps: 2, feasibleSoFar: 3, infeasibleSoFar: 2, isComplete: true });
  });

  it('rejects non-positive or non-integer maxSteps', () => {
    const farm = solver.parse(OFFICIAL_EXAMPLE);
    expect(() => traceTreeFarm(farm, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceTreeFarm(farm, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => traceTreeFarm(farm, { maxSteps: 1.5 })).toThrow(RangeError);
    expect(() => traceTreeFarm(farm, { maxSteps: Number.NaN })).toThrow(RangeError);
  });
});
