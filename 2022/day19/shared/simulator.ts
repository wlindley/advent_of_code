import type { Blueprint, BuildAction, ResourceCounts, RobotType } from './blueprint';

export interface MinuteSnapshot {
  readonly minute: number;
  readonly action: RobotType | null;
  readonly robots: ResourceCounts;
  readonly resources: ResourceCounts;
}

export interface BlueprintResultProps {
  readonly blueprint: Blueprint;
  readonly timeLimit: number;
  readonly plan: readonly BuildAction[];
  readonly nodesVisited: number;
}

function assertPositiveInt(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${label} must be a positive safe integer, got ${value}`);
  }
  return value;
}

/** Immutable optimization result for a single blueprint with dynamically derived metrics. */
export class BlueprintResult {
  readonly blueprint: Blueprint;
  readonly timeLimit: number;
  readonly plan: readonly BuildAction[];
  readonly nodesVisited: number;

  constructor(props: BlueprintResultProps) {
    this.blueprint = props.blueprint;
    this.timeLimit = assertPositiveInt(props.timeLimit, 'timeLimit');
    if (!Number.isSafeInteger(props.nodesVisited) || props.nodesVisited < 0) {
      throw new RangeError(`nodesVisited must be a non-negative safe integer, got ${props.nodesVisited}`);
    }
    this.nodesVisited = props.nodesVisited;
    this.plan = Object.freeze([...props.plan]);
    Object.freeze(this);
  }

  get maxGeodes(): number {
    let total = 0;
    for (const action of this.plan) {
      if (action.robot === 'geode') total += this.timeLimit - action.minute;
    }
    return total;
  }

  get qualityLevel(): number {
    return this.blueprint.id * this.maxGeodes;
  }
}

function robotCost(bp: Blueprint, robot: RobotType): ResourceCounts {
  switch (robot) {
    case 'ore':
      return { ore: bp.oreRobotOreCost, clay: 0, obsidian: 0, geode: 0 };
    case 'clay':
      return { ore: bp.clayRobotOreCost, clay: 0, obsidian: 0, geode: 0 };
    case 'obsidian':
      return { ore: bp.obsidianRobotOreCost, clay: bp.obsidianRobotClayCost, obsidian: 0, geode: 0 };
    case 'geode':
      return { ore: bp.geodeRobotOreCost, clay: 0, obsidian: bp.geodeRobotObsidianCost, geode: 0 };
  }
}

function indexPlan(plan: readonly BuildAction[], timeLimit: number): ReadonlyMap<number, RobotType> {
  const byMinute = new Map<number, RobotType>();
  let prevMinute = 0;
  for (const action of plan) {
    if (!Number.isSafeInteger(action.minute) || action.minute < 1 || action.minute > timeLimit) {
      throw new RangeError(`Build minute ${action.minute} out of range [1, ${timeLimit}]`);
    }
    if (action.minute <= prevMinute) {
      throw new RangeError(`Build minutes must be strictly increasing (${prevMinute} -> ${action.minute})`);
    }
    prevMinute = action.minute;
    byMinute.set(action.minute, action.robot);
  }
  return byMinute;
}

function spendIfAffordable(bp: Blueprint, robot: RobotType, resources: ResourceCounts, minute: number): ResourceCounts {
  const cost = robotCost(bp, robot);
  if (resources.ore < cost.ore || resources.clay < cost.clay || resources.obsidian < cost.obsidian) {
    throw new RangeError(`Insufficient resources for ${robot} robot at minute ${minute}`);
  }
  return {
    ore: resources.ore - cost.ore,
    clay: resources.clay - cost.clay,
    obsidian: resources.obsidian - cost.obsidian,
    geode: resources.geode,
  };
}

function addRobot(robots: ResourceCounts, robot: RobotType): ResourceCounts {
  return Object.freeze({
    ore: robots.ore + (robot === 'ore' ? 1 : 0),
    clay: robots.clay + (robot === 'clay' ? 1 : 0),
    obsidian: robots.obsidian + (robot === 'obsidian' ? 1 : 0),
    geode: robots.geode + (robot === 'geode' ? 1 : 0),
  });
}

/** Simulates a build plan minute-by-minute over [0, timeLimit], validating affordability. */
export function simulatePlan(
  bp: Blueprint,
  plan: readonly BuildAction[],
  timeLimit: number,
): readonly MinuteSnapshot[] {
  const limit = assertPositiveInt(timeLimit, 'timeLimit');
  const actions = indexPlan(plan, limit);
  let robots: ResourceCounts = Object.freeze({ ore: 1, clay: 0, obsidian: 0, geode: 0 });
  let resources: ResourceCounts = Object.freeze({ ore: 0, clay: 0, obsidian: 0, geode: 0 });
  const snapshots: MinuteSnapshot[] = [Object.freeze({ minute: 0, action: null, robots, resources })];
  for (let minute = 1; minute <= limit; minute += 1) {
    const action = actions.get(minute) ?? null;
    const afterSpend = action ? spendIfAffordable(bp, action, resources, minute) : resources;
    resources = Object.freeze({
      ore: afterSpend.ore + robots.ore,
      clay: afterSpend.clay + robots.clay,
      obsidian: afterSpend.obsidian + robots.obsidian,
      geode: afterSpend.geode + robots.geode,
    });
    if (action) robots = addRobot(robots, action);
    snapshots.push(Object.freeze({ minute, action, robots, resources }));
  }
  return Object.freeze(snapshots);
}

/** Part 1 aggregate: sum of quality levels across all blueprints. */
export function sumQualityLevels(results: readonly BlueprintResult[]): number {
  let sum = 0;
  for (const res of results) sum += res.qualityLevel;
  return sum;
}

/** Part 2 aggregate: product of maximum geodes across evaluated blueprints. */
export function multiplyMaxGeodes(results: readonly BlueprintResult[]): number {
  let product = 1;
  for (const res of results) product *= res.maxGeodes;
  return product;
}
