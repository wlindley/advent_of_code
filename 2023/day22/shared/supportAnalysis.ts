import type { SettledStack } from './settleStack';

const EMPTY_CASCADE: readonly number[] = Object.freeze([]);

function assertBrickIndex(index: number, count: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= count) {
    throw new RangeError(`Brick index ${index} out of bounds [0, ${count})`);
  }
}

function buildAdjacency(
  supportedBy: readonly (readonly number[])[],
): {
  readonly supports: readonly (readonly number[])[];
  readonly baseInDegree: Int32Array;
  readonly loadBearing: Uint8Array;
} {
  const n = supportedBy.length;
  const adj: number[][] = [];
  for (let i = 0; i < n; i += 1) adj.push([]);
  const baseInDegree = new Int32Array(n);
  const loadBearing = new Uint8Array(n);
  for (let i = 0; i < n; i += 1) {
    const parents = supportedBy[i]!;
    baseInDegree[i] = parents.length;
    for (let k = 0; k < parents.length; k += 1) {
      adj[parents[k]!]!.push(i);
    }
    if (parents.length === 1) {
      loadBearing[parents[0]!] = 1;
    }
  }
  const frozen: (readonly number[])[] = [];
  for (let i = 0; i < n; i += 1) frozen.push(Object.freeze(adj[i]!));
  return { supports: Object.freeze(frozen), baseInDegree, loadBearing };
}

function runCascadeBfs(
  startIndex: number,
  supports: readonly (readonly number[])[],
  baseInDegree: Int32Array,
  remaining: Int32Array,
): number[] {
  remaining.set(baseInDegree);
  const queue: number[] = [startIndex];
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head]!;
    const children = supports[current]!;
    for (let k = 0; k < children.length; k += 1) {
      const child = children[k]!;
      const nextDegree = remaining[child]! - 1;
      remaining[child] = nextDegree;
      if (nextDegree === 0) queue.push(child);
    }
  }
  return queue;
}

/** Immutable support DAG supporting O(N + E) safety classification and BFS cascades. */
export class SupportGraph {
  private readonly stack: SettledStack;
  private readonly supports: readonly (readonly number[])[];
  private readonly baseInDegree: Int32Array;
  private readonly loadBearing: Uint8Array;

  constructor(stack: SettledStack) {
    const { supports, baseInDegree, loadBearing } = buildAdjacency(stack.supportedBy);
    this.stack = stack;
    this.supports = supports;
    this.baseInDegree = baseInDegree;
    this.loadBearing = loadBearing;
    Object.freeze(this);
  }

  get brickCount(): number {
    return this.stack.length;
  }

  get loadBearingCount(): number {
    let count = 0;
    for (let i = 0; i < this.loadBearing.length; i += 1) {
      count += this.loadBearing[i]!;
    }
    return count;
  }

  get safeCount(): number {
    return this.brickCount - this.loadBearingCount;
  }

  isSafe(index: number): boolean {
    assertBrickIndex(index, this.brickCount);
    return this.loadBearing[index] === 0;
  }

  supportersOf(index: number): readonly number[] {
    assertBrickIndex(index, this.brickCount);
    return this.stack.supportedBy[index]!;
  }

  dependentsOf(index: number): readonly number[] {
    assertBrickIndex(index, this.brickCount);
    return this.supports[index]!;
  }

  cascadeFrom(index: number): readonly number[] {
    assertBrickIndex(index, this.brickCount);
    if (this.loadBearing[index] === 0) return EMPTY_CASCADE;
    const remaining = new Int32Array(this.brickCount);
    return Object.freeze(
      runCascadeBfs(index, this.supports, this.baseInDegree, remaining).slice(1),
    );
  }

  totalChainReactionFalls(): number {
    const remaining = new Int32Array(this.brickCount);
    let total = 0;
    for (let i = 0; i < this.brickCount; i += 1) {
      if (this.loadBearing[i] === 0) continue;
      total += runCascadeBfs(i, this.supports, this.baseInDegree, remaining).length - 1;
    }
    return total;
  }
}
