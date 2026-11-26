import { Rational } from '../../../shared/core';
import { type Hailstone, Vec3 } from './hailstone';
import { RationalLinearSystem } from './linearSolver';

export interface HailstoneCollision {
  readonly hailstoneId: number;
  readonly time: bigint;
}

/** Exact integer 3D rock throw trajectory and verified hailstone collision times. */
export class RockTrajectory {
  readonly position: Vec3;
  readonly velocity: Vec3;
  readonly collisions: readonly HailstoneCollision[];

  constructor(position: Vec3, velocity: Vec3, collisions: readonly HailstoneCollision[]) {
    this.position = position;
    this.velocity = velocity;
    const frozen: HailstoneCollision[] = [];
    for (let i = 0; i < collisions.length; i += 1) {
      frozen.push(Object.freeze({ ...collisions[i]! }));
    }
    this.collisions = Object.freeze(frozen);
    Object.freeze(this);
  }

  get positionSum(): bigint {
    return this.position.x + this.position.y + this.position.z;
  }

  positionAt(time: bigint): Vec3 {
    return new Vec3(
      this.position.x + this.velocity.x * time,
      this.position.y + this.velocity.y * time,
      this.position.z + this.velocity.z * time,
    );
  }
}

function toRationals(values: readonly bigint[]): Rational[] {
  const result: Rational[] = [];
  for (let i = 0; i < values.length; i += 1) {
    result.push(new Rational(values[i]!));
  }
  return result;
}

function addStoneEquations(
  system: RationalLinearSystem,
  anchor: Hailstone,
  anchorCross: Vec3,
  stone: Hailstone,
): void {
  const dp = stone.position.sub(anchor.position);
  const dv = stone.velocity.sub(anchor.velocity);
  const r = stone.position.cross(stone.velocity).sub(anchorCross);
  system.addEquation(toRationals([0n, dv.z, -dv.y, 0n, -dp.z, dp.y]), new Rational(r.x));
  system.addEquation(toRationals([-dv.z, 0n, dv.x, dp.z, 0n, -dp.x]), new Rational(r.y));
  system.addEquation(toRationals([dv.y, -dv.x, 0n, -dp.y, dp.x, 0n]), new Rational(r.z));
}

function extractIntegerSolution(solution: readonly Rational[]): readonly bigint[] {
  const ints: bigint[] = [];
  for (let i = 0; i < solution.length; i += 1) {
    const entry = solution[i]!;
    if (entry.den !== 1n) {
      throw new Error(`Non-integer rock trajectory component at index ${i}: ${entry.toString()}`);
    }
    ints.push(entry.num);
  }
  return ints;
}

function computeCollisionTime(rockPos: Vec3, rockVel: Vec3, stone: Hailstone): bigint {
  const axes: readonly [bigint, bigint][] = [
    [stone.position.x - rockPos.x, rockVel.x - stone.velocity.x],
    [stone.position.y - rockPos.y, rockVel.y - stone.velocity.y],
    [stone.position.z - rockPos.z, rockVel.z - stone.velocity.z],
  ];
  let time: bigint | undefined;
  for (let i = 0; i < axes.length; i += 1) {
    const [dp, dv] = axes[i]!;
    if (dv === 0n) {
      if (dp !== 0n) throw new Error(`No collision with hailstone ${stone.id} on axis ${i}`);
      continue;
    }
    if (dp % dv !== 0n) {
      throw new Error(`Non-integer collision time with hailstone ${stone.id}`);
    }
    const axisT = dp / dv;
    if (axisT < 0n) {
      throw new Error(`Past collision time with hailstone ${stone.id}: ${axisT}`);
    }
    if (time !== undefined && axisT !== time) {
      throw new Error(`Axis collision time mismatch for hailstone ${stone.id}`);
    }
    time = axisT;
  }
  return time ?? 0n;
}

/** Solves the exact integer rock throw that collides with every hailstone in `hailstones`. */
export function solveRockTrajectory(hailstones: readonly Hailstone[]): RockTrajectory {
  if (hailstones.length < 3) {
    throw new RangeError(`At least 3 hailstones are required, got ${hailstones.length}`);
  }
  const anchor = hailstones[0]!;
  const anchorCross = anchor.position.cross(anchor.velocity);
  const system = new RationalLinearSystem(6);
  for (let i = 1; i < hailstones.length && !system.isFullRank; i += 1) {
    addStoneEquations(system, anchor, anchorCross, hailstones[i]!);
  }
  const ints = extractIntegerSolution(system.solve());
  const rockPos = new Vec3(ints[0]!, ints[1]!, ints[2]!);
  const rockVel = new Vec3(ints[3]!, ints[4]!, ints[5]!);
  const collisions: HailstoneCollision[] = [];
  for (let i = 0; i < hailstones.length; i += 1) {
    const stone = hailstones[i]!;
    collisions.push({ hailstoneId: stone.id, time: computeCollisionTime(rockPos, rockVel, stone) });
  }
  return new RockTrajectory(rockPos, rockVel, collisions);
}
