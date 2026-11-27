import {
  computeXStepIntervals,
  computeYStepIntervals,
  LaunchVelocity,
  type XStepInterval,
  type YStepInterval,
} from './ballistics';
import type { TargetArea } from './target';

/** Immutable interval-indexed ballistic solution space for a target area. */
export class TrickShotAnalysis {
  readonly #xLoPrefix: Int32Array;
  readonly #xHiPrefix: Int32Array;

  constructor(
    readonly target: TargetArea,
    readonly xIntervals: readonly XStepInterval[],
    readonly yIntervals: readonly YStepInterval[],
    xLoPrefix: Int32Array,
    xHiPrefix: Int32Array,
  ) {
    this.#xLoPrefix = xLoPrefix;
    this.#xHiPrefix = xHiPrefix;
    Object.freeze(this);
  }

  /** Counts horizontal velocities whose active step window overlaps yInterval in O(1). */
  countMatchingVx(yInterval: YStepInterval): number {
    if (yInterval.lastStep > this.target.maxStep) {
      throw new RangeError(
        `yInterval.lastStep (${yInterval.lastStep}) exceeds target.maxStep (${this.target.maxStep})`,
      );
    }
    return this.#xLoPrefix[yInterval.lastStep]! - this.#xHiPrefix[yInterval.firstStep - 1]!;
  }

  /** Lists all horizontal velocities whose active step window overlaps yInterval. */
  matchingVxValues(yInterval: YStepInterval): readonly number[] {
    const matches: number[] = [];
    for (const xInterval of this.xIntervals) {
      if (xInterval.overlaps(yInterval)) {
        matches.push(xInterval.vx);
      }
    }
    return Object.freeze(matches);
  }

  /** Highest-vy interval that overlaps at least one valid horizontal velocity. */
  get bestVyInterval(): YStepInterval {
    let best = this.yIntervals[0]!;
    for (let i = 1; i < this.yIntervals.length; i += 1) {
      const candidate = this.yIntervals[i]!;
      if (this.countMatchingVx(candidate) > 0) {
        best = candidate;
      }
    }
    return best;
  }

  /** Representative launch velocity achieving the maximum apex height. */
  get bestVelocity(): LaunchVelocity {
    const bestY = this.bestVyInterval;
    return new LaunchVelocity(this.matchingVxValues(bestY)[0]!, bestY.vy);
  }

  /** Highest y-coordinate reached by any valid trajectory hitting the target. */
  get maxApexY(): number {
    return this.bestVyInterval.apexY;
  }

  /** Total count of distinct valid (vx, vy) launch velocities hitting the target. */
  get validVelocityCount(): number {
    let total = 0;
    for (const yInterval of this.yIntervals) {
      total += this.countMatchingVx(yInterval);
    }
    return total;
  }
}

/** Builds step-window intervals and prefix-sum lookup tables for target analysis. */
export function analyzeTargetArea(target: TargetArea): TrickShotAnalysis {
  const xIntervals = computeXStepIntervals(target);
  const yIntervals = computeYStepIntervals(target);
  const xLoPrefix = new Int32Array(target.maxStep + 1);
  const xHiPrefix = new Int32Array(target.maxStep + 1);
  for (const xInterval of xIntervals) {
    xLoPrefix[xInterval.firstStep] = xLoPrefix[xInterval.firstStep]! + 1;
    xHiPrefix[xInterval.lastStep] = xHiPrefix[xInterval.lastStep]! + 1;
  }
  for (let step = 1; step <= target.maxStep; step += 1) {
    xLoPrefix[step] = xLoPrefix[step]! + xLoPrefix[step - 1]!;
    xHiPrefix[step] = xHiPrefix[step]! + xHiPrefix[step - 1]!;
  }
  return new TrickShotAnalysis(target, xIntervals, yIntervals, xLoPrefix, xHiPrefix);
}
