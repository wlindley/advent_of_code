import { DishPlatform, TILT_DIRECTIONS } from '../../shared';

/** Default target cycle count for AoC 2023 Day 14 Part 2. */
export const DEFAULT_TARGET_CYCLES = 1_000_000_000;

/** Applies one full spin cycle (`north -> west -> south -> east`) to `platform`. */
export function spinOnce(platform: DishPlatform): DishPlatform {
  let current = platform;
  for (const direction of TILT_DIRECTIONS) {
    current = current.tilt(direction);
  }
  return current;
}

function validateTargetCycles(targetCycles: number): void {
  if (!Number.isSafeInteger(targetCycles) || targetCycles < 0) {
    throw new RangeError(`targetCycles must be a non-negative safe integer, got ${targetCycles}`);
  }
}

/** Immutable cycle-detection record storing only observed platform states and cycle entry index. */
export class SpinCycleAnalysis {
  readonly history: readonly DishPlatform[];
  readonly targetCycles: number;
  readonly cycleStart: number | null;

  private constructor(
    history: readonly DishPlatform[],
    targetCycles: number,
    cycleStart: number | null,
  ) {
    this.history = Object.freeze([...history]);
    this.targetCycles = targetCycles;
    this.cycleStart = cycleStart;
    Object.freeze(this);
  }

  /** Cycle number at which the first repeated state occurred, or `null` if none within `targetCycles`. */
  get repeatCycle(): number | null {
    return this.cycleStart === null ? null : this.history.length;
  }

  /** Period length of the detected cycle, or `null` if no cycle closed within `targetCycles`. */
  get cycleLength(): number | null {
    return this.cycleStart === null ? null : this.history.length - this.cycleStart;
  }

  /** Observed history index congruent to `targetCycles` after modular cycle reduction. */
  get equivalentCycle(): number {
    if (this.cycleStart === null) {
      return this.targetCycles;
    }
    const period = this.history.length - this.cycleStart;
    return this.cycleStart + ((this.targetCycles - this.cycleStart) % period);
  }

  /** Platform state after `targetCycles` spin cycles. */
  get finalPlatform(): DishPlatform {
    return this.history[this.equivalentCycle]!;
  }

  /** North-beam load after `targetCycles` spin cycles. */
  get finalLoad(): number {
    return this.finalPlatform.northLoad;
  }

  /** North-beam load series across all distinct observed cycles `0..history.length - 1`. */
  get loadSeries(): readonly number[] {
    return Object.freeze(this.history.map((platform) => platform.northLoad));
  }

  /** Simulates spin cycles until a state repeats or `targetCycles` is reached. */
  static analyze(
    initial: DishPlatform,
    targetCycles: number = DEFAULT_TARGET_CYCLES,
  ): SpinCycleAnalysis {
    validateTargetCycles(targetCycles);
    const seen = new Map<string, number>([[initial.fingerprint(), 0]]);
    const history: DishPlatform[] = [initial];
    let current = initial;
    for (let cycle = 1; cycle <= targetCycles; cycle += 1) {
      current = spinOnce(current);
      const key = current.fingerprint();
      const prior = seen.get(key);
      if (prior !== undefined) {
        return new SpinCycleAnalysis(history, targetCycles, prior);
      }
      seen.set(key, cycle);
      history.push(current);
    }
    return new SpinCycleAnalysis(history, targetCycles, null);
  }
}

/** Alias for `SpinCycleAnalysis.analyze` for functional call sites. */
export const analyzeSpinCycles = SpinCycleAnalysis.analyze;
