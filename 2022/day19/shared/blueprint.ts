export type RobotType = 'ore' | 'clay' | 'obsidian' | 'geode';

export interface ResourceCounts {
  readonly ore: number;
  readonly clay: number;
  readonly obsidian: number;
  readonly geode: number;
}

export interface BuildAction {
  readonly minute: number;
  readonly robot: RobotType;
}

export interface BlueprintProps {
  readonly id: number;
  readonly oreRobotOreCost: number;
  readonly clayRobotOreCost: number;
  readonly obsidianRobotOreCost: number;
  readonly obsidianRobotClayCost: number;
  readonly geodeRobotOreCost: number;
  readonly geodeRobotObsidianCost: number;
}

function assertPositiveSafeInt(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${label} must be a positive safe integer, got ${value}`);
  }
  return value;
}

/** Immutable validated mineral-robot blueprint for a single factory. */
export class Blueprint {
  readonly id: number;
  readonly oreRobotOreCost: number;
  readonly clayRobotOreCost: number;
  readonly obsidianRobotOreCost: number;
  readonly obsidianRobotClayCost: number;
  readonly geodeRobotOreCost: number;
  readonly geodeRobotObsidianCost: number;

  constructor(props: BlueprintProps) {
    this.id = assertPositiveSafeInt(props.id, 'id');
    this.oreRobotOreCost = assertPositiveSafeInt(props.oreRobotOreCost, 'oreRobotOreCost');
    this.clayRobotOreCost = assertPositiveSafeInt(props.clayRobotOreCost, 'clayRobotOreCost');
    this.obsidianRobotOreCost = assertPositiveSafeInt(props.obsidianRobotOreCost, 'obsidianRobotOreCost');
    this.obsidianRobotClayCost = assertPositiveSafeInt(props.obsidianRobotClayCost, 'obsidianRobotClayCost');
    this.geodeRobotOreCost = assertPositiveSafeInt(props.geodeRobotOreCost, 'geodeRobotOreCost');
    this.geodeRobotObsidianCost = assertPositiveSafeInt(props.geodeRobotObsidianCost, 'geodeRobotObsidianCost');
    Object.freeze(this);
  }

  /** Highest ore cost across all four robot types (caps useful ore robot production). */
  get maxOreCost(): number {
    return Math.max(
      this.oreRobotOreCost,
      this.clayRobotOreCost,
      this.obsidianRobotOreCost,
      this.geodeRobotOreCost,
    );
  }
}
