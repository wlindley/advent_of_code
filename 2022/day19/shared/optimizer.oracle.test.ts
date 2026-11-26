import { describe, expect, it } from 'vitest';
import { Blueprint } from './blueprint';
import { optimizeBlueprint, optimizeBlueprints } from './optimizer';
import { simulatePlan, sumQualityLevels } from './simulator';

function makeBp(id: number, ore: number, clay: number, obsO: number, obsC: number, geoO: number, geoOb: number): Blueprint {
  return new Blueprint({
    id,
    oreRobotOreCost: ore,
    clayRobotOreCost: clay,
    obsidianRobotOreCost: obsO,
    obsidianRobotClayCost: obsC,
    geodeRobotOreCost: geoO,
    geodeRobotObsidianCost: geoOb,
  });
}

const OFFICIAL_BP1 = makeBp(1, 4, 2, 3, 14, 2, 7);
const OFFICIAL_BP2 = makeBp(2, 2, 3, 3, 8, 3, 12);
const EDGE_ALL_ONE = makeBp(10, 1, 1, 1, 1, 1, 1);
const EDGE_CHEAP_ORE = makeBp(11, 1, 4, 4, 6, 4, 5);
const EDGE_ZERO_GEODE = makeBp(12, 5, 5, 5, 20, 5, 20);
const EDGE_GEODE_MAX_ORE = makeBp(13, 2, 2, 2, 4, 6, 3);

function oracleDfs(
  bp: Blueprint, memo: Map<string, number>,
  rem: number, ore: number, clay: number, obs: number,
  oreBots: number, clayBots: number, obsBots: number,
): number {
  if (rem <= 1) return 0;
  const key = `${rem},${ore},${clay},${obs},${oreBots},${clayBots},${obsBots}`;
  const cached = memo.get(key);
  if (cached !== undefined) return cached;

  let best = oracleDfs(bp, memo, rem - 1, ore + oreBots, clay + clayBots, obs + obsBots, oreBots, clayBots, obsBots);
  if (ore >= bp.oreRobotOreCost) {
    best = Math.max(best, oracleDfs(bp, memo, rem - 1, ore - bp.oreRobotOreCost + oreBots, clay + clayBots, obs + obsBots, oreBots + 1, clayBots, obsBots));
  }
  if (ore >= bp.clayRobotOreCost) {
    best = Math.max(best, oracleDfs(bp, memo, rem - 1, ore - bp.clayRobotOreCost + oreBots, clay + clayBots, obs + obsBots, oreBots, clayBots + 1, obsBots));
  }
  if (ore >= bp.obsidianRobotOreCost && clay >= bp.obsidianRobotClayCost) {
    best = Math.max(best, oracleDfs(bp, memo, rem - 1, ore - bp.obsidianRobotOreCost + oreBots, clay - bp.obsidianRobotClayCost + clayBots, obs + obsBots, oreBots, clayBots, obsBots + 1));
  }
  if (ore >= bp.geodeRobotOreCost && obs >= bp.geodeRobotObsidianCost) {
    best = Math.max(best, rem - 1 + oracleDfs(bp, memo, rem - 1, ore - bp.geodeRobotOreCost + oreBots, clay + clayBots, obs - bp.geodeRobotObsidianCost + obsBots, oreBots, clayBots, obsBots));
  }
  memo.set(key, best);
  return best;
}

/** Independent unpruned minute-by-minute memoized brute-force DFS oracle. */
function bruteForceOracle(bp: Blueprint, timeLimit: number): number {
  return oracleDfs(bp, new Map<string, number>(), timeLimit, 0, 0, 0, 1, 0, 0);
}

describe('optimizer oracle & official cases', () => {
  it('matches unpruned brute-force oracle across official BP1 & BP2 for T = 1..14', () => {
    for (const bp of [OFFICIAL_BP1, OFFICIAL_BP2]) {
      for (let t = 1; t <= 14; t += 1) {
        const result = optimizeBlueprint(bp, t);
        const expected = bruteForceOracle(bp, t);
        expect(result.maxGeodes).toBe(expected);
        expect(simulatePlan(bp, result.plan, t)[t]!.resources.geode).toBe(expected);
      }
    }
  });

  it('matches unpruned brute-force oracle across synthetic edge blueprints', () => {
    for (const [bp, maxT] of [[EDGE_ALL_ONE, 9], [EDGE_CHEAP_ORE, 12], [EDGE_ZERO_GEODE, 12], [EDGE_GEODE_MAX_ORE, 12]] as const) {
      for (let t = 1; t <= maxT; t += 1) {
        const result = optimizeBlueprint(bp, t);
        const expected = bruteForceOracle(bp, t);
        expect(result.maxGeodes).toBe(expected);
        expect(simulatePlan(bp, result.plan, t)[t]!.resources.geode).toBe(expected);
      }
    }
  });

  it('solves official Part 1 (T=24: 9, 12, quality sum 33) and verifies plans', () => {
    const results = optimizeBlueprints([OFFICIAL_BP1, OFFICIAL_BP2], 24);
    expect(results[0]!.maxGeodes).toBe(9);
    expect(results[1]!.maxGeodes).toBe(12);
    expect(sumQualityLevels(results)).toBe(33);
    expect(simulatePlan(OFFICIAL_BP1, results[0]!.plan, 24)[24]!.resources.geode).toBe(9);
    expect(simulatePlan(OFFICIAL_BP2, results[1]!.plan, 24)[24]!.resources.geode).toBe(12);
  });

  it('solves official Part 2 horizon (T=32: 56, 62) and verifies plans', () => {
    const r1 = optimizeBlueprint(OFFICIAL_BP1, 32);
    const r2 = optimizeBlueprint(OFFICIAL_BP2, 32);
    expect(r1.maxGeodes).toBe(56);
    expect(r2.maxGeodes).toBe(62);
    expect(simulatePlan(OFFICIAL_BP1, r1.plan, 32)[32]!.resources.geode).toBe(56);
    expect(simulatePlan(OFFICIAL_BP2, r2.plan, 32)[32]!.resources.geode).toBe(62);
  });
});
