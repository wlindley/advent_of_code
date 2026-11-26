import type { Blueprint, BuildAction } from './blueprint';
import { BlueprintResult } from './simulator';
import { computeRelaxedGeodeBound, computeTriangularBound } from './upperBound';

function waitTime(have: number, cost: number, rate: number): number {
  return have >= cost ? 0 : Math.ceil((cost - have) / rate);
}

/**
 * Jump-to-next-robot-build DFS branch-and-bound optimizer for a mineral-robot factory.
 * Evaluates geode -> obsidian -> clay -> ore with exact horizon, cap, surplus, and relaxed bounds.
 */
export class BlueprintOptimizer {
  readonly bp: Blueprint;
  readonly timeLimit: number;
  private bestGeodes = 0;
  private bestPlan: BuildAction[] = [];
  private planStack: BuildAction[] = [];
  private nodesVisited = 0;

  constructor(bp: Blueprint, timeLimit: number) {
    if (!Number.isSafeInteger(timeLimit) || timeLimit < 1) {
      throw new RangeError(`timeLimit must be a positive safe integer, got ${timeLimit}`);
    }
    this.bp = bp;
    this.timeLimit = timeLimit;
  }

  solve(): BlueprintResult {
    this.bestGeodes = 0;
    this.bestPlan = [];
    this.planStack = [];
    this.nodesVisited = 0;
    this.dfs(this.timeLimit, 0, 0, 0, 1, 0, 0, 0);
    return new BlueprintResult({
      blueprint: this.bp,
      timeLimit: this.timeLimit,
      plan: this.bestPlan,
      nodesVisited: this.nodesVisited,
    });
  }

  private dfs(
    rem: number, ore: number, clay: number, obs: number,
    oreBots: number, clayBots: number, obsBots: number, geodes: number,
  ): void {
    this.nodesVisited += 1;
    if (computeTriangularBound(geodes, rem) <= this.bestGeodes) return;
    if (computeRelaxedGeodeBound(this.bp, rem, clay, obs, clayBots, obsBots, geodes) <= this.bestGeodes) return;
    this.tryGeode(rem, ore, clay, obs, oreBots, clayBots, obsBots, geodes);
    this.tryObsidian(rem, ore, clay, obs, oreBots, clayBots, obsBots, geodes);
    this.tryClay(rem, ore, clay, obs, oreBots, clayBots, obsBots, geodes);
    this.tryOre(rem, ore, clay, obs, oreBots, clayBots, obsBots, geodes);
  }

  private tryGeode(
    rem: number, ore: number, clay: number, obs: number,
    oreBots: number, clayBots: number, obsBots: number, geodes: number,
  ): void {
    if (obsBots === 0) return;
    const wait = Math.max(
      waitTime(ore, this.bp.geodeRobotOreCost, oreBots),
      waitTime(obs, this.bp.geodeRobotObsidianCost, obsBots),
    );
    const dt = wait + 1;
    const remAfter = rem - dt;
    if (remAfter < 1) return;
    const nextGeodes = geodes + remAfter;
    this.planStack.push({ minute: this.timeLimit - remAfter, robot: 'geode' });
    if (nextGeodes > this.bestGeodes) {
      this.bestGeodes = nextGeodes;
      this.bestPlan = [...this.planStack];
    }
    if (remAfter > 1) {
      this.dfs(
        remAfter, ore + dt * oreBots - this.bp.geodeRobotOreCost, clay + dt * clayBots,
        obs + dt * obsBots - this.bp.geodeRobotObsidianCost, oreBots, clayBots, obsBots, nextGeodes,
      );
    }
    this.planStack.pop();
  }

  private tryObsidian(
    rem: number, ore: number, clay: number, obs: number,
    oreBots: number, clayBots: number, obsBots: number, geodes: number,
  ): void {
    if (clayBots === 0 || obsBots >= this.bp.geodeRobotObsidianCost || rem < 4) return;
    if (obs + (rem - 2) * obsBots >= (rem - 1) * this.bp.geodeRobotObsidianCost) return;
    const wait = Math.max(
      waitTime(ore, this.bp.obsidianRobotOreCost, oreBots),
      waitTime(clay, this.bp.obsidianRobotClayCost, clayBots),
    );
    const dt = wait + 1;
    const remAfter = rem - dt;
    if (remAfter < 3) return;
    this.planStack.push({ minute: this.timeLimit - remAfter, robot: 'obsidian' });
    this.dfs(
      remAfter, ore + dt * oreBots - this.bp.obsidianRobotOreCost,
      clay + dt * clayBots - this.bp.obsidianRobotClayCost, obs + dt * obsBots,
      oreBots, clayBots, obsBots + 1, geodes,
    );
    this.planStack.pop();
  }

  private tryClay(
    rem: number, ore: number, clay: number, obs: number,
    oreBots: number, clayBots: number, obsBots: number, geodes: number,
  ): void {
    if (clayBots >= this.bp.obsidianRobotClayCost || rem < 6) return;
    if (clay + (rem - 4) * clayBots >= (rem - 3) * this.bp.obsidianRobotClayCost) return;
    const dt = waitTime(ore, this.bp.clayRobotOreCost, oreBots) + 1;
    const remAfter = rem - dt;
    if (remAfter < 5) return;
    this.planStack.push({ minute: this.timeLimit - remAfter, robot: 'clay' });
    this.dfs(
      remAfter, ore + dt * oreBots - this.bp.clayRobotOreCost, clay + dt * clayBots,
      obs + dt * obsBots, oreBots, clayBots + 1, obsBots, geodes,
    );
    this.planStack.pop();
  }

  private tryOre(
    rem: number, ore: number, clay: number, obs: number,
    oreBots: number, clayBots: number, obsBots: number, geodes: number,
  ): void {
    if (oreBots >= this.bp.maxOreCost || rem < 4) return;
    if (ore + (rem - 2) * oreBots >= (rem - 1) * this.bp.maxOreCost) return;
    const dt = waitTime(ore, this.bp.oreRobotOreCost, oreBots) + 1;
    const remAfter = rem - dt;
    if (remAfter < 3) return;
    this.planStack.push({ minute: this.timeLimit - remAfter, robot: 'ore' });
    this.dfs(
      remAfter, ore + dt * oreBots - this.bp.oreRobotOreCost, clay + dt * clayBots,
      obs + dt * obsBots, oreBots + 1, clayBots, obsBots, geodes,
    );
    this.planStack.pop();
  }
}

/** Finds the optimal build plan and maximum geodes for one blueprint within `timeLimit`. */
export function optimizeBlueprint(bp: Blueprint, timeLimit: number): BlueprintResult {
  return new BlueprintOptimizer(bp, timeLimit).solve();
}

/** Optimizes each blueprint independently within `timeLimit`. */
export function optimizeBlueprints(
  blueprints: readonly Blueprint[],
  timeLimit: number,
): readonly BlueprintResult[] {
  return Object.freeze(blueprints.map((bp) => optimizeBlueprint(bp, timeLimit)));
}
