import type { XmasStream } from './stream';

/** Validates that the XMAS preamble length is an integer >= 2. */
export function validatePreambleLength(preambleLength: number): void {
  if (!Number.isInteger(preambleLength) || preambleLength < 2) {
    throw new RangeError(`Preamble length must be an integer >= 2, got ${preambleLength}`);
  }
}

/** Frozen index pair (leftIndex < rightIndex) inside a preamble window summing to target. */
export class SumPairMatch {
  readonly leftIndex: number;
  readonly rightIndex: number;

  constructor(leftIndex: number, rightIndex: number) {
    if (!Number.isInteger(leftIndex) || !Number.isInteger(rightIndex) || leftIndex < 0 || leftIndex >= rightIndex) {
      throw new RangeError(`Invalid sum pair indices: (${leftIndex}, ${rightIndex})`);
    }
    this.leftIndex = leftIndex;
    this.rightIndex = rightIndex;
    Object.freeze(this);
  }
}

/** Frozen sliding-window check result for a single target index in an XMAS stream. */
export class WindowCheckStep {
  readonly targetIndex: number;
  readonly windowStart: number;
  readonly pairMatch: SumPairMatch | null;

  constructor(targetIndex: number, windowStart: number, pairMatch: SumPairMatch | null) {
    if (!Number.isInteger(windowStart) || !Number.isInteger(targetIndex) || windowStart < 0 || windowStart >= targetIndex) {
      throw new RangeError(`Invalid window bounds: [${windowStart}, ${targetIndex})`);
    }
    if (pairMatch !== null && (pairMatch.leftIndex < windowStart || pairMatch.rightIndex >= targetIndex)) {
      throw new RangeError(`Pair match (${pairMatch.leftIndex}, ${pairMatch.rightIndex}) outside [${windowStart}, ${targetIndex})`);
    }
    this.targetIndex = targetIndex;
    this.windowStart = windowStart;
    this.pairMatch = pairMatch;
    Object.freeze(this);
  }

  get isValid(): boolean {
    return this.pairMatch !== null;
  }

  get windowLength(): number {
    return this.targetIndex - this.windowStart;
  }
}

function findPairInWindow(
  stream: XmasStream,
  lastIndex: Map<bigint, number>,
  windowStart: number,
  targetIndex: number,
  target: bigint,
): SumPairMatch | null {
  for (let p = windowStart; p < targetIndex; p += 1) {
    const first = stream.at(p);
    const complement = target - first;
    // XMAS requires two distinct values (not merely two distinct indices).
    if (complement === first) continue;
    const q = lastIndex.get(complement);
    // Left-to-right scan guarantees no earlier p' < p has a match, so q > p always holds.
    if (q !== undefined) return new SumPairMatch(p, q);
  }
  return null;
}

/** Yields sliding-window validation steps for every element after the preamble. */
export function* iterateWindowChecks(stream: XmasStream, preambleLength: number): IterableIterator<WindowCheckStep> {
  validatePreambleLength(preambleLength);
  if (stream.length <= preambleLength) {
    throw new RangeError(`Stream length (${stream.length}) must exceed preamble length (${preambleLength})`);
  }
  const lastIndex = new Map<bigint, number>();
  for (let i = 0; i < preambleLength; i += 1) {
    lastIndex.set(stream.at(i), i);
  }
  for (let targetIndex = preambleLength; targetIndex < stream.length; targetIndex += 1) {
    const windowStart = targetIndex - preambleLength;
    const target = stream.at(targetIndex);
    const pair = findPairInWindow(stream, lastIndex, windowStart, targetIndex, target);
    yield new WindowCheckStep(targetIndex, windowStart, pair);
    const outVal = stream.at(windowStart);
    if (lastIndex.get(outVal) === windowStart) lastIndex.delete(outVal);
    lastIndex.set(target, targetIndex);
  }
}

/** Finds the first invalid window step or throws if every post-preamble value is valid. */
export function findFirstInvalidStep(stream: XmasStream, preambleLength: number): WindowCheckStep {
  for (const step of iterateWindowChecks(stream, preambleLength)) {
    if (!step.isValid) return step;
  }
  throw new Error('No invalid number found');
}

/** Collects sliding-window steps up to and including the first invalid step (or all steps if valid). */
export function collectPreambleChecks(stream: XmasStream, preambleLength: number): readonly WindowCheckStep[] {
  const steps: WindowCheckStep[] = [];
  for (const step of iterateWindowChecks(stream, preambleLength)) {
    steps.push(step);
    if (!step.isValid) break;
  }
  return Object.freeze(steps);
}
