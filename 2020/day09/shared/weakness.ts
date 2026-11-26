import type { XmasStream } from './stream';

/** Frozen half-open [windowStart, windowEnd) state during contiguous weakness search. */
export class WeaknessWindowStep {
  readonly windowStart: number;
  readonly windowEnd: number;
  readonly runningSum: bigint;

  constructor(windowStart: number, windowEnd: number, runningSum: bigint) {
    if (!Number.isInteger(windowStart) || !Number.isInteger(windowEnd) || windowStart < 0 || windowStart > windowEnd) {
      throw new RangeError(`Invalid weakness window bounds: [${windowStart}, ${windowEnd})`);
    }
    if (runningSum < 0n) {
      throw new RangeError(`Running sum must be non-negative, got ${runningSum}`);
    }
    this.windowStart = windowStart;
    this.windowEnd = windowEnd;
    this.runningSum = runningSum;
    Object.freeze(this);
  }

  get length(): number {
    return this.windowEnd - this.windowStart;
  }

  get isEmpty(): boolean {
    return this.length === 0;
  }
}

/** Frozen inclusive contiguous range [startIndex, endIndex] and extrema indices summing to target. */
export class ContiguousWeakness {
  readonly startIndex: number;
  readonly endIndex: number;
  readonly minIndex: number;
  readonly maxIndex: number;

  constructor(startIndex: number, endIndex: number, minIndex: number, maxIndex: number) {
    if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex) || startIndex < 0 || startIndex >= endIndex) {
      throw new RangeError(`Invalid contiguous range: [${startIndex}, ${endIndex}]`);
    }
    if (
      minIndex < startIndex || minIndex > endIndex ||
      maxIndex < startIndex || maxIndex > endIndex ||
      minIndex === maxIndex
    ) {
      throw new RangeError(`Invalid extrema indices (${minIndex}, ${maxIndex}) for [${startIndex}, ${endIndex}]`);
    }
    this.startIndex = startIndex;
    this.endIndex = endIndex;
    this.minIndex = minIndex;
    this.maxIndex = maxIndex;
    Object.freeze(this);
  }

  get length(): number {
    return this.endIndex - this.startIndex + 1;
  }

  encryptionWeakness(stream: XmasStream): bigint {
    return stream.at(this.minIndex) + stream.at(this.maxIndex);
  }
}

/** Builds a ContiguousWeakness using strict < for min and >= for max so extrema indices stay distinct. */
export function buildContiguousWeakness(stream: XmasStream, startIndex: number, endIndex: number): ContiguousWeakness {
  let minIndex = startIndex;
  let maxIndex = startIndex;
  let minValue = stream.at(startIndex);
  let maxValue = minValue;
  for (let i = startIndex + 1; i <= endIndex; i += 1) {
    const value = stream.at(i);
    if (value < minValue) {
      minValue = value;
      minIndex = i;
    }
    if (value >= maxValue) {
      maxValue = value;
      maxIndex = i;
    }
  }
  return new ContiguousWeakness(startIndex, endIndex, minIndex, maxIndex);
}

/** Yields two-pointer sliding-window steps searching for a contiguous sum equal to target. */
export function* iterateWeaknessWindow(stream: XmasStream, target: bigint): IterableIterator<WeaknessWindowStep> {
  if (target <= 0n) {
    throw new RangeError(`Weakness target must be positive, got ${target}`);
  }
  let left = 0;
  let sum = 0n;
  for (let right = 0; right < stream.length; right += 1) {
    sum += stream.at(right);
    // Strict positivity (values > 0n, target > 0n) guarantees sum drops to 0n before left exceeds right + 1.
    while (sum > target) {
      sum -= stream.at(left);
      left += 1;
    }
    yield new WeaknessWindowStep(left, right + 1, sum);
  }
}

/** Finds the first contiguous range of length >= 2 summing to target. */
export function findContiguousWeakness(stream: XmasStream, target: bigint): ContiguousWeakness {
  for (const step of iterateWeaknessWindow(stream, target)) {
    if (step.runningSum === target && step.length >= 2) {
      return buildContiguousWeakness(stream, step.windowStart, step.windowEnd - 1);
    }
  }
  throw new Error(`No contiguous range summing to ${target} found`);
}

/** Collects two-pointer weakness window steps up to and including the first length >= 2 match. */
export function collectWeaknessSteps(stream: XmasStream, target: bigint): readonly WeaknessWindowStep[] {
  const steps: WeaknessWindowStep[] = [];
  for (const step of iterateWeaknessWindow(stream, target)) {
    steps.push(step);
    if (step.runningSum === target && step.length >= 2) break;
  }
  return Object.freeze(steps);
}
