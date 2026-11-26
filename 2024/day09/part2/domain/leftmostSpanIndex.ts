import type { FreeSpan } from '../../shared';

function assertIntMin(value: number, min: number, name: string): void {
  if (!Number.isInteger(value) || value < min) {
    throw new RangeError(`${name} must be an integer >= ${min}, got ${value}`);
  }
}

function nextPowerOfTwo(n: number): number {
  let cap = 1;
  while (cap < n) cap *= 2;
  return cap;
}

function validateOrderedDisjointSpans(spans: readonly FreeSpan[]): void {
  for (let i = 1; i < spans.length; i += 1) {
    const prev = spans[i - 1]!;
    const curr = spans[i]!;
    if (curr.start < prev.end) {
      throw new RangeError(`Free spans must be ordered and disjoint (${curr.start} < ${prev.end})`);
    }
  }
}

/** Max-segment-tree index supporting O(log S) leftmost-fit free-span queries and shrinkage. */
export class LeftmostSpanIndex {
  private readonly count: number;
  private readonly capacity: number;
  private readonly starts: Int32Array;
  private readonly lengths: Int32Array;
  private readonly tree: Int32Array;

  constructor(spans: readonly FreeSpan[]) {
    validateOrderedDisjointSpans(spans);
    this.count = spans.length;
    this.capacity = spans.length === 0 ? 0 : nextPowerOfTwo(spans.length);
    this.starts = new Int32Array(this.count);
    this.lengths = new Int32Array(this.count);
    this.tree = new Int32Array(this.capacity * 2);
    this.build(spans);
  }

  get spanCount(): number {
    return this.count;
  }

  get maxFreeLength(): number {
    return this.capacity === 0 ? 0 : this.tree[1]!;
  }

  /** Claims `length` blocks from the leftmost span strictly before `beforeStart`, or `-1`. */
  claimLeftmost(length: number, beforeStart: number): number {
    assertIntMin(length, 1, 'length');
    assertIntMin(beforeStart, 0, 'beforeStart');
    if (this.capacity === 0 || this.tree[1]! < length) return -1;

    const idx = this.findLeftmostIndex(length);
    const start = this.starts[idx]!;
    if (start >= beforeStart) return -1;

    this.consumeAt(idx, length);
    return start;
  }

  private build(spans: readonly FreeSpan[]): void {
    for (let i = 0; i < this.count; i += 1) {
      const span = spans[i]!;
      this.starts[i] = span.start;
      this.lengths[i] = span.length;
      this.tree[this.capacity + i] = span.length;
    }
    for (let node = this.capacity - 1; node >= 1; node -= 1) {
      const left = node * 2;
      this.tree[node] = Math.max(this.tree[left]!, this.tree[left + 1]!);
    }
  }

  private findLeftmostIndex(minLen: number): number {
    let node = 1;
    while (node < this.capacity) {
      const left = node * 2;
      node = this.tree[left]! >= minLen ? left : left + 1;
    }
    return node - this.capacity;
  }

  private consumeAt(idx: number, length: number): void {
    this.starts[idx] = this.starts[idx]! + length;
    const remaining = this.lengths[idx]! - length;
    this.lengths[idx] = remaining;
    let node = this.capacity + idx;
    this.tree[node] = remaining;
    for (node >>= 1; node >= 1; node >>= 1) {
      const left = node * 2;
      this.tree[node] = Math.max(this.tree[left]!, this.tree[left + 1]!);
    }
  }
}
