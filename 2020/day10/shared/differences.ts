import type { AdapterChain, JoltDelta } from './chain';

function assertNonNegSafeInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer, got ${value}`);
  }
}

/** Frozen cumulative histogram of consecutive 1-, 2-, and 3-jolt steps. */
export class JoltHistogram {
  readonly diff1: number;
  readonly diff2: number;
  readonly diff3: number;

  constructor(diff1: number, diff2: number, diff3: number) {
    assertNonNegSafeInt(diff1, 'diff1');
    assertNonNegSafeInt(diff2, 'diff2');
    assertNonNegSafeInt(diff3, 'diff3');
    this.diff1 = diff1;
    this.diff2 = diff2;
    this.diff3 = diff3;
    Object.freeze(this);
  }

  get totalSteps(): number {
    return this.diff1 + this.diff2 + this.diff3;
  }

  get part1Product(): bigint {
    return BigInt(this.diff1) * BigInt(this.diff3);
  }

  withDelta(delta: JoltDelta): JoltHistogram {
    return new JoltHistogram(
      this.diff1 + Number(delta === 1),
      this.diff2 + Number(delta === 2),
      this.diff3 + Number(delta === 3),
    );
  }
}

/** Frozen transition snapshot for one consecutive step `(toIndex - 1) -> toIndex`. */
export class JoltStep {
  readonly toIndex: number;
  readonly delta: JoltDelta;
  readonly histogram: JoltHistogram;

  constructor(toIndex: number, delta: JoltDelta, histogram: JoltHistogram) {
    if (!Number.isInteger(toIndex) || toIndex < 1) {
      throw new RangeError(`toIndex must be an integer >= 1, got ${toIndex}`);
    }
    this.toIndex = toIndex;
    this.delta = delta;
    this.histogram = histogram;
    Object.freeze(this);
  }

  get fromIndex(): number {
    return this.toIndex - 1;
  }
}

/** Collects every consecutive transition step across the full adapter chain. */
export function collectJoltSteps(chain: AdapterChain): readonly JoltStep[] {
  const steps: JoltStep[] = [];
  let histogram = new JoltHistogram(0, 0, 0);
  for (let toIndex = 1; toIndex < chain.nodeCount; toIndex += 1) {
    const delta = chain.stepDelta(toIndex);
    histogram = histogram.withDelta(delta);
    steps.push(new JoltStep(toIndex, delta, histogram));
  }
  return Object.freeze(steps);
}

/** Computes the final jolt-difference histogram in O(N) time and O(1) extra space. */
export function countJoltDifferences(chain: AdapterChain): JoltHistogram {
  let histogram = new JoltHistogram(0, 0, 0);
  for (let toIndex = 1; toIndex < chain.nodeCount; toIndex += 1) {
    histogram = histogram.withDelta(chain.stepDelta(toIndex));
  }
  return histogram;
}
