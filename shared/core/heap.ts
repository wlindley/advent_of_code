/** Binary min-heap priority queue ordered by a caller-supplied comparator. */
export class MinHeap<T> {
  private readonly items: T[] = [];
  private readonly compare: (a: T, b: T) => number;

  constructor(compare: (a: T, b: T) => number) {
    this.compare = compare;
  }

  get size(): number {
    return this.items.length;
  }

  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  peek(): T | undefined {
    return this.items[0];
  }

  push(item: T): void {
    this.items.push(item);
    this.siftUp(this.items.length - 1);
  }

  pop(): T | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0]!;
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  private siftUp(startIdx: number): void {
    let idx = startIdx;
    while (idx > 0) {
      const parent = (idx - 1) >>> 1;
      if (this.compare(this.items[idx]!, this.items[parent]!) >= 0) break;
      this.swap(idx, parent);
      idx = parent;
    }
  }

  private siftDown(startIdx: number): void {
    let idx = startIdx;
    const len = this.items.length;
    while (true) {
      const left = idx * 2 + 1;
      const right = left + 1;
      let best = idx;
      if (left < len && this.compare(this.items[left]!, this.items[best]!) < 0) {
        best = left;
      }
      if (right < len && this.compare(this.items[right]!, this.items[best]!) < 0) {
        best = right;
      }
      if (best === idx) break;
      this.swap(idx, best);
      idx = best;
    }
  }

  private swap(i: number, j: number): void {
    const tmp = this.items[i]!;
    this.items[i] = this.items[j]!;
    this.items[j] = tmp;
  }
}
