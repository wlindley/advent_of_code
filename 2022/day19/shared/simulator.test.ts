import { describe, expect, it } from 'vitest';
import { Blueprint } from './blueprint';
import {
  BlueprintResult,
  multiplyMaxGeodes,
  simulatePlan,
  sumQualityLevels,
} from './simulator';

const BP1 = new Blueprint({
  id: 1,
  oreRobotOreCost: 4,
  clayRobotOreCost: 2,
  obsidianRobotOreCost: 3,
  obsidianRobotClayCost: 14,
  geodeRobotOreCost: 2,
  geodeRobotObsidianCost: 7,
});

// Official AoC 2022 Day 19 Blueprint 1 optimal 24-minute build plan (produces 9 geodes).
const BP1_PLAN_24 = [
  { minute: 3, robot: 'clay' },
  { minute: 5, robot: 'clay' },
  { minute: 7, robot: 'clay' },
  { minute: 11, robot: 'obsidian' },
  { minute: 12, robot: 'clay' },
  { minute: 15, robot: 'obsidian' },
  { minute: 18, robot: 'geode' },
  { minute: 21, robot: 'geode' },
] as const;

describe('simulator', () => {
  it('replays the official Blueprint 1 24-minute plan to 9 geodes across 25 snapshots', () => {
    const snapshots = simulatePlan(BP1, BP1_PLAN_24, 24);
    expect(Object.isFrozen(snapshots)).toBe(true);
    expect(snapshots).toHaveLength(25);
    expect(snapshots[0]).toEqual({
      minute: 0,
      action: null,
      robots: { ore: 1, clay: 0, obsidian: 0, geode: 0 },
      resources: { ore: 0, clay: 0, obsidian: 0, geode: 0 },
    });
    expect(snapshots[3]!.action).toBe('clay');
    expect(snapshots[3]!.robots.clay).toBe(1);
    expect(snapshots[18]!.action).toBe('geode');
    expect(snapshots[24]!.resources.geode).toBe(9);
  });

  it('replays a plan that also builds an ore robot', () => {
    const snapshots = simulatePlan(BP1, [{ minute: 5, robot: 'ore' }], 6);
    expect(snapshots[5]!.robots.ore).toBe(2);
    expect(snapshots[6]!.resources.ore).toBe(3);
  });

  it('computes dynamic maxGeodes and qualityLevel on frozen BlueprintResult', () => {
    const res1 = new BlueprintResult({
      blueprint: BP1,
      timeLimit: 24,
      plan: BP1_PLAN_24,
      nodesVisited: 120,
    });
    expect(Object.isFrozen(res1)).toBe(true);
    expect(Object.isFrozen(res1.plan)).toBe(true);
    expect(res1.maxGeodes).toBe(9);
    expect(res1.qualityLevel).toBe(9);

    const bp2 = new Blueprint({
      id: 2,
      oreRobotOreCost: 2,
      clayRobotOreCost: 3,
      obsidianRobotOreCost: 3,
      obsidianRobotClayCost: 8,
      geodeRobotOreCost: 3,
      geodeRobotObsidianCost: 12,
    });
    const res2 = new BlueprintResult({
      blueprint: bp2,
      timeLimit: 24,
      plan: [{ minute: 12, robot: 'geode' }],
      nodesVisited: 50,
    });
    expect(res2.maxGeodes).toBe(12);
    expect(res2.qualityLevel).toBe(24);
    expect(sumQualityLevels([res1, res2])).toBe(33);
    expect(multiplyMaxGeodes([res1, res2])).toBe(108);
  });

  it('validates timeLimit, nodesVisited, minute ordering, and resource affordability', () => {
    expect(() => simulatePlan(BP1, [], 0)).toThrow(RangeError);
    expect(() => simulatePlan(BP1, [{ minute: 0, robot: 'clay' }], 5)).toThrow(RangeError);
    expect(() => simulatePlan(BP1, [{ minute: 6, robot: 'clay' }], 5)).toThrow(RangeError);
    expect(
      simulatePlan(BP1, [{ minute: 3, robot: 'clay' }], 5).length,
    ).toBe(6);
    expect(() =>
      simulatePlan(BP1, [
        { minute: 3, robot: 'clay' },
        { minute: 3, robot: 'clay' },
      ], 5),
    ).toThrow(RangeError);
    expect(() => simulatePlan(BP1, [{ minute: 1, robot: 'clay' }], 5)).toThrow(RangeError);
    expect(() => simulatePlan(BP1, [{ minute: 5, robot: 'obsidian' }], 5)).toThrow(RangeError);
    expect(() => simulatePlan(BP1, [{ minute: 5, robot: 'geode' }], 5)).toThrow(RangeError);
    expect(
      () =>
        new BlueprintResult({
          blueprint: BP1,
          timeLimit: 0,
          plan: [],
          nodesVisited: 1,
        }),
    ).toThrow(RangeError);
    expect(
      () =>
        new BlueprintResult({
          blueprint: BP1,
          timeLimit: 10,
          plan: [],
          nodesVisited: -1,
        }),
    ).toThrow(RangeError);
  });
});
