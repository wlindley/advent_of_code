import { lcmBigInt } from '../../../shared/core';
import { AXES, MoonState, MoonSystem, Vec3, type AxisName } from './models';

/** Default upper bound on per-axis simulation steps when searching for a cycle. */
export const DEFAULT_MAX_AXIS_STEPS = 2_000_000;

function comparePeriodResults(a: AxisPeriodResult, b: AxisPeriodResult): number {
  if (a.period < b.period) return -1;
  if (a.period > b.period) return 1;
  return AXES.indexOf(a.axis) - AXES.indexOf(b.axis);
}

function arraysEqual(a: Int32Array, b: Int32Array): boolean {
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** Immutable cycle period measurement for a single spatial axis. */
export class AxisPeriodResult {
  readonly axis: AxisName;
  readonly period: bigint;

  constructor(axis: AxisName, period: bigint) {
    if (period <= 0n) {
      throw new RangeError(`Axis ${axis} period must be positive, got ${period}`);
    }
    this.axis = axis;
    this.period = period;
    Object.freeze(this);
  }
}

/** Immutable per-axis cycle breakdown with dynamically derived global LCM period. */
export class CycleAnalysis {
  readonly x: AxisPeriodResult;
  readonly y: AxisPeriodResult;
  readonly z: AxisPeriodResult;

  constructor(x: AxisPeriodResult, y: AxisPeriodResult, z: AxisPeriodResult) {
    this.x = x;
    this.y = y;
    this.z = z;
    Object.freeze(this);
  }

  get globalPeriod(): bigint {
    return lcmBigInt(lcmBigInt(this.x.period, this.y.period), this.z.period);
  }

  get maxAxisPeriod(): bigint {
    let max = this.x.period;
    if (this.y.period > max) max = this.y.period;
    if (this.z.period > max) max = this.z.period;
    return max;
  }

  sortedByPeriod(): readonly [AxisPeriodResult, AxisPeriodResult, AxisPeriodResult] {
    const ordered = [this.x, this.y, this.z].sort(comparePeriodResults);
    return Object.freeze([ordered[0]!, ordered[1]!, ordered[2]!] as const);
  }
}

/** Advances a single independent 1D axis (gravity then velocity integration) in place. */
export function stepAxisInPlace(pos: Int32Array, vel: Int32Array): void {
  const n = pos.length;
  for (let i = 0; i < n; i += 1) {
    const pi = pos[i]!;
    for (let j = i + 1; j < n; j += 1) {
      const pj = pos[j]!;
      if (pi < pj) {
        vel[i] = vel[i]! + 1;
        vel[j] = vel[j]! - 1;
      } else if (pi > pj) {
        vel[i] = vel[i]! - 1;
        vel[j] = vel[j]! + 1;
      }
    }
  }
  for (let i = 0; i < n; i += 1) {
    pos[i] = pos[i]! + vel[i]!;
  }
}

/** Simulates the 3D moon system for `steps` discrete ticks and returns the resulting MoonSystem. */
export function simulateSteps(system: MoonSystem, steps: number): MoonSystem {
  if (!Number.isSafeInteger(steps) || steps < 0) {
    throw new RangeError(`steps must be a non-negative safe integer, got ${steps}`);
  }
  const px = system.axisInitialPositions('x');
  const vx = system.axisInitialVelocities('x');
  const py = system.axisInitialPositions('y');
  const vy = system.axisInitialVelocities('y');
  const pz = system.axisInitialPositions('z');
  const vz = system.axisInitialVelocities('z');

  for (let s = 0; s < steps; s += 1) {
    stepAxisInPlace(px, vx);
    stepAxisInPlace(py, vy);
    stepAxisInPlace(pz, vz);
  }

  const moons: MoonState[] = [];
  for (let i = 0; i < system.moonCount; i += 1) {
    moons.push(new MoonState(new Vec3(px[i]!, py[i]!, pz[i]!), new Vec3(vx[i]!, vy[i]!, vz[i]!)));
  }
  return new MoonSystem(moons);
}

/** Finds the exact first positive step where a 1D axis returns to `(initPos, initVel)`. */
export function findAxisPeriod(initPos: Int32Array, initVel: Int32Array, maxAxisSteps: number): bigint {
  if (initPos.length === 0 || initPos.length !== initVel.length) {
    throw new RangeError('initPos and initVel must be non-empty arrays of equal length');
  }
  if (!Number.isSafeInteger(maxAxisSteps) || maxAxisSteps < 1) {
    throw new RangeError(`maxAxisSteps must be a positive safe integer, got ${maxAxisSteps}`);
  }
  const pos = new Int32Array(initPos);
  const vel = new Int32Array(initVel);

  for (let step = 1; step <= maxAxisSteps; step += 1) {
    stepAxisInPlace(pos, vel);
    if (arraysEqual(vel, initVel) && arraysEqual(pos, initPos)) {
      return BigInt(step);
    }
  }
  throw new RangeError(`Axis did not repeat within ${maxAxisSteps} steps`);
}

/** Computes exact per-axis repeat periods for X, Y, and Z independently. */
export function analyzeSystemCycles(system: MoonSystem, maxAxisSteps: number): CycleAnalysis {
  const rx = new AxisPeriodResult('x', findAxisPeriod(system.axisInitialPositions('x'), system.axisInitialVelocities('x'), maxAxisSteps));
  const ry = new AxisPeriodResult('y', findAxisPeriod(system.axisInitialPositions('y'), system.axisInitialVelocities('y'), maxAxisSteps));
  const rz = new AxisPeriodResult('z', findAxisPeriod(system.axisInitialPositions('z'), system.axisInitialVelocities('z'), maxAxisSteps));
  return new CycleAnalysis(rx, ry, rz);
}
