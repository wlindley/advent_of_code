import type { TargetArea } from './target';

export interface StepWindow {
  readonly firstStep: number;
  readonly lastStep: number;
}

/** Computes the peak height reached by a probe launched with initial y-velocity vy. */
export function computeApexY(vy: number): number {
  return vy > 0 ? (vy * (vy + 1)) / 2 : 0;
}

function windowsOverlap(a: StepWindow, b: StepWindow): boolean {
  return a.firstStep <= b.lastStep && b.firstStep <= a.lastStep;
}

/** Validated immutable initial probe launch velocity (vx, vy). */
export class LaunchVelocity {
  constructor(readonly vx: number, readonly vy: number) {
    if (!Number.isInteger(vx) || vx < 0) {
      throw new RangeError(`vx must be a non-negative integer, got ${vx}`);
    }
    if (!Number.isSafeInteger(vy)) {
      throw new RangeError(`vy must be a safe integer, got ${vy}`);
    }
    Object.freeze(this);
  }

  get apexY(): number {
    return computeApexY(this.vy);
  }
}

/** Immutable single-step trajectory state sample. */
export class ProbePoint {
  constructor(
    readonly step: number,
    readonly x: number,
    readonly y: number,
    readonly vx: number,
    readonly vy: number,
    readonly inTarget: boolean,
  ) {
    Object.freeze(this);
  }
}

/** Closed step window during which a horizontal velocity vx resides in [xMin, xMax]. */
export class XStepInterval implements StepWindow {
  constructor(
    readonly vx: number,
    readonly firstStep: number,
    readonly lastStep: number,
    readonly stallsInTarget: boolean,
  ) {
    Object.freeze(this);
  }

  overlaps(other: StepWindow): boolean {
    return windowsOverlap(this, other);
  }
}

/** Closed step window during which a vertical velocity vy resides in [yMin, yMax]. */
export class YStepInterval implements StepWindow {
  constructor(
    readonly vy: number,
    readonly firstStep: number,
    readonly lastStep: number,
  ) {
    Object.freeze(this);
  }

  get apexY(): number {
    return computeApexY(this.vy);
  }

  overlaps(other: StepWindow): boolean {
    return windowsOverlap(this, other);
  }
}

/** Computes the active step window for horizontal launch velocity vx, or null if it misses. */
export function computeXStepInterval(vx: number, target: TargetArea): XStepInterval | null {
  const maxStep = target.maxStep;
  let step = 0;
  let x = 0;
  let curVx = vx;
  let firstStep = -1;
  let lastStep = -1;
  while (step < maxStep && curVx > 0 && x + curVx <= target.xMax) {
    step += 1;
    x += curVx;
    curVx -= 1;
    if (x >= target.xMin) {
      if (firstStep === -1) firstStep = step;
      lastStep = step;
    }
  }
  if (firstStep === -1) return null;
  // Only stalling at curVx === 0 holds x inside the target up through maxStep.
  const stallsInTarget = curVx === 0;
  return new XStepInterval(vx, firstStep, stallsInTarget ? maxStep : lastStep, stallsInTarget);
}

/** Computes the active step window for vertical launch velocity vy, or null if it misses. */
export function computeYStepInterval(vy: number, target: TargetArea): YStepInterval | null {
  // For vy >= 0, skip the symmetric upward arc directly to y = 0 at step 2*vy + 1.
  let step = vy >= 0 ? 2 * vy + 1 : 0;
  let y = 0;
  let curVy = vy >= 0 ? -vy - 1 : vy;
  let firstStep = -1;
  let lastStep = -1;
  while (y + curVy >= target.yMin) {
    step += 1;
    y += curVy;
    curVy -= 1;
    if (y <= target.yMax) {
      if (firstStep === -1) firstStep = step;
      lastStep = step;
    }
  }
  return firstStep === -1 ? null : new YStepInterval(vy, firstStep, lastStep);
}

/** Collects all horizontal velocities whose step window intersects the target x-bounds. */
export function computeXStepIntervals(target: TargetArea): readonly XStepInterval[] {
  const intervals: XStepInterval[] = [];
  for (let vx = target.minFeasibleVx; vx <= target.xMax; vx += 1) {
    const interval = computeXStepInterval(vx, target);
    if (interval !== null) intervals.push(interval);
  }
  return Object.freeze(intervals);
}

/** Collects all vertical velocities whose step window intersects the target y-bounds. */
export function computeYStepIntervals(target: TargetArea): readonly YStepInterval[] {
  const intervals: YStepInterval[] = [];
  for (let vy = target.yMin; vy <= target.maxFeasibleVy; vy += 1) {
    const interval = computeYStepInterval(vy, target);
    if (interval !== null) intervals.push(interval);
  }
  return Object.freeze(intervals);
}

/** Simulates the discrete 2D trajectory from (0, 0) until passing the target bounds. */
export function simulateTrajectory(
  velocity: LaunchVelocity,
  target: TargetArea,
): readonly ProbePoint[] {
  let step = 0;
  let x = 0;
  let y = 0;
  let vx = velocity.vx;
  let vy = velocity.vy;
  const points: ProbePoint[] = [new ProbePoint(step, x, y, vx, vy, target.contains(x, y))];
  while (x <= target.xMax && y >= target.yMin) {
    step += 1;
    x += vx;
    y += vy;
    vx = Math.max(0, vx - 1);
    vy -= 1;
    points.push(new ProbePoint(step, x, y, vx, vy, target.contains(x, y)));
  }
  return Object.freeze(points);
}
