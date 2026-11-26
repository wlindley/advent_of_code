import type { Blueprint } from './blueprint';

/** Loose triangular upper bound assuming one new geode robot every remaining minute. */
export function computeTriangularBound(geodes: number, rem: number): number {
  if (rem <= 1) return geodes;
  return geodes + (rem * (rem - 1)) / 2;
}

/**
 * Tighter 3-tier decoupled relaxation upper bound with free ore:
 * builds a clay robot every minute while checking obsidian and geode
 * affordability independently before each minute's collection.
 */
export function computeRelaxedGeodeBound(
  bp: Blueprint,
  rem: number,
  clay: number,
  obs: number,
  clayBots: number,
  obsBots: number,
  geodes: number,
): number {
  let simClay = clay;
  let simObs = obs;
  let simClayBots = clayBots;
  let simObsBots = obsBots;
  let simGeodes = geodes;

  for (let t = rem; t >= 2; t -= 1) {
    const canGeode = simObs >= bp.geodeRobotObsidianCost;
    const canObs = simClay >= bp.obsidianRobotClayCost;
    simClay += simClayBots;
    simObs += simObsBots;
    if (canGeode) {
      simObs -= bp.geodeRobotObsidianCost;
      simGeodes += t - 1;
    }
    if (canObs) {
      simClay -= bp.obsidianRobotClayCost;
      simObsBots += 1;
    }
    simClayBots += 1;
  }

  return simGeodes;
}
