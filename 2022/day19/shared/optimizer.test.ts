import { describe, expect, it } from 'vitest';
import { Blueprint } from './blueprint';
import { BlueprintOptimizer, optimizeBlueprint, optimizeBlueprints } from './optimizer';
import { simulatePlan } from './simulator';

const BP1 = new Blueprint({
  id: 1,
  oreRobotOreCost: 4,
  clayRobotOreCost: 2,
  obsidianRobotOreCost: 3,
  obsidianRobotClayCost: 14,
  geodeRobotOreCost: 2,
  geodeRobotObsidianCost: 7,
});

const ALL_ONE_BP = new Blueprint({
  id: 9,
  oreRobotOreCost: 1,
  clayRobotOreCost: 1,
  obsidianRobotOreCost: 1,
  obsidianRobotClayCost: 1,
  geodeRobotOreCost: 1,
  geodeRobotObsidianCost: 1,
});

describe('optimizer', () => {
  it('returns 0 geodes and empty plan for timeLimit = 1', () => {
    const res = optimizeBlueprint(BP1, 1);
    expect(res.maxGeodes).toBe(0);
    expect(res.plan).toEqual([]);
    expect(res.nodesVisited).toBe(1);
    expect(simulatePlan(BP1, res.plan, 1)[1]!.resources.geode).toBe(0);
  });

  it('handles building a geode robot on the penultimate minute (remAfter === 1)', () => {
    // At T=7 on ALL_ONE_BP: min 2 clay, min 4 obs, min 6 geode (remAfter = 1, yields 1 geode).
    const res = optimizeBlueprint(ALL_ONE_BP, 7);
    const snapshots = simulatePlan(ALL_ONE_BP, res.plan, 7);
    expect(snapshots[7]!.resources.geode).toBe(res.maxGeodes);
    expect(res.maxGeodes).toBe(1);
    expect(res.plan[res.plan.length - 1]).toEqual({ minute: 6, robot: 'geode' });
  });

  it('optimizes multiple blueprints in order and freezes result array', () => {
    const results = optimizeBlueprints([BP1, ALL_ONE_BP], 6);
    expect(Object.isFrozen(results)).toBe(true);
    expect(results).toHaveLength(2);
    expect(results[0]!.blueprint.id).toBe(1);
    expect(results[1]!.blueprint.id).toBe(9);
  });

  it('rejects invalid timeLimit in BlueprintOptimizer', () => {
    expect(() => new BlueprintOptimizer(BP1, 0)).toThrow(RangeError);
    expect(() => new BlueprintOptimizer(BP1, -3)).toThrow(RangeError);
    expect(() => new BlueprintOptimizer(BP1, 2.5)).toThrow(RangeError);
  });
});
