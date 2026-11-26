/** Maximum allowed joltage increase between consecutive nodes in a chain. */
export const MAX_JOLT_STEP = 3;

/** Valid consecutive joltage step deltas in an adapter chain. */
export type JoltDelta = 1 | 2 | 3;

/** Semantic role of a node within an adapter chain. */
export type ChainNodeKind = 'outlet' | 'adapter' | 'device';

const INT_LINE_RE = /^[+-]?\d+$/;

function buildSortedNodes(ratings: readonly number[]): readonly number[] {
  if (ratings.length === 0) {
    throw new RangeError('Adapter chain requires at least one adapter');
  }
  for (const value of ratings) {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new RangeError(`Adapter rating must be a positive safe integer, got ${value}`);
    }
  }
  const sorted = [...ratings].sort((a, b) => a - b);
  let prev = 0;
  for (const value of sorted) {
    const delta = value - prev;
    if (delta === 0) {
      throw new Error(`Duplicate adapter rating: ${value}`);
    }
    if (delta > MAX_JOLT_STEP) {
      throw new RangeError(`Jolt gap ${delta} exceeds ${MAX_JOLT_STEP} between ${prev} and ${value}`);
    }
    prev = value;
  }
  return Object.freeze([0, ...sorted, prev + MAX_JOLT_STEP]);
}

/** Immutable validated chain `[0, ...sortedAdapters, max + 3]`. */
export class AdapterChain {
  private readonly nodesData: readonly number[];

  constructor(ratings: readonly number[]) {
    this.nodesData = buildSortedNodes(ratings);
    Object.freeze(this);
  }

  get nodeCount(): number {
    return this.nodesData.length;
  }

  get adapterCount(): number {
    return this.nodesData.length - 2;
  }

  get outletJoltage(): number {
    return 0;
  }

  get deviceJoltage(): number {
    return this.nodesData[this.nodesData.length - 1]!;
  }

  get adapters(): readonly number[] {
    return Object.freeze(this.nodesData.slice(1, -1));
  }

  get ratings(): readonly number[] {
    return this.nodesData;
  }

  private assertIndex(index: number, min: number, max: number): void {
    if (!Number.isInteger(index) || index < min || index > max) {
      throw new RangeError(`Node index ${index} out of bounds [${min}, ${max}]`);
    }
  }

  joltageAt(index: number): number {
    this.assertIndex(index, 0, this.nodesData.length - 1);
    return this.nodesData[index]!;
  }

  nodeKind(index: number): ChainNodeKind {
    this.assertIndex(index, 0, this.nodesData.length - 1);
    if (index === 0) return 'outlet';
    if (index === this.nodesData.length - 1) return 'device';
    return 'adapter';
  }

  stepDelta(toIndex: number): JoltDelta {
    this.assertIndex(toIndex, 1, this.nodesData.length - 1);
    return (this.nodesData[toIndex]! - this.nodesData[toIndex - 1]!) as JoltDelta;
  }

  predecessorIndices(toIndex: number): readonly number[] {
    this.assertIndex(toIndex, 0, this.nodesData.length - 1);
    const target = this.nodesData[toIndex]!;
    const start = Math.max(0, toIndex - MAX_JOLT_STEP);
    const predecessors: number[] = [];
    for (let j = start; j < toIndex; j += 1) {
      if (target - this.nodesData[j]! <= MAX_JOLT_STEP) {
        predecessors.push(j);
      }
    }
    return Object.freeze(predecessors);
  }
}

/** Parses newline-delimited integer adapter ratings into a validated `AdapterChain`. */
export function parseAdapterChain(raw: string): AdapterChain {
  const ratings: number[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    if (!INT_LINE_RE.test(trimmed)) {
      throw new SyntaxError(`Invalid integer adapter rating: "${trimmed}"`);
    }
    ratings.push(Number(trimmed));
  }
  return new AdapterChain(ratings);
}
