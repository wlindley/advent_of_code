/** Binary min-heap keyed by `Float64Array` cost for packed integer graph states. */
export class StateMinHeap {
  private states: Int32Array;
  private costs: Float64Array;
  private count = 0;

  constructor(initialCapacity = 64) {
    if (!Number.isInteger(initialCapacity) || initialCapacity < 1) {
      throw new RangeError(`initialCapacity must be >= 1, got ${initialCapacity}`);
    }
    this.states = new Int32Array(initialCapacity);
    this.costs = new Float64Array(initialCapacity);
  }

  get size(): number {
    return this.count;
  }

  get topCost(): number {
    if (this.count === 0) throw new RangeError('Heap is empty');
    return this.costs[0]!;
  }

  push(state: number, cost: number): void {
    if (this.count === this.states.length) this.grow();
    const idx = this.count;
    this.count = idx + 1;
    this.states[idx] = state;
    this.costs[idx] = cost;
    this.siftUp(idx);
  }

  pop(): number {
    if (this.count === 0) throw new RangeError('Heap is empty');
    const topState = this.states[0]!;
    const last = this.count - 1;
    this.count = last;
    if (last > 0) {
      this.states[0] = this.states[last]!;
      this.costs[0] = this.costs[last]!;
      this.siftDown(0);
    }
    return topState;
  }

  private grow(): void {
    const nextCap = this.states.length * 2;
    const nextStates = new Int32Array(nextCap);
    const nextCosts = new Float64Array(nextCap);
    nextStates.set(this.states);
    nextCosts.set(this.costs);
    this.states = nextStates;
    this.costs = nextCosts;
  }

  private siftUp(idx: number): void {
    let cur = idx;
    const state = this.states[cur]!;
    const cost = this.costs[cur]!;
    while (cur > 0) {
      const parent = (cur - 1) >> 1;
      if (this.costs[parent]! <= cost) break;
      this.states[cur] = this.states[parent]!;
      this.costs[cur] = this.costs[parent]!;
      cur = parent;
    }
    this.states[cur] = state;
    this.costs[cur] = cost;
  }

  private siftDown(idx: number): void {
    let cur = idx;
    const state = this.states[cur]!;
    const cost = this.costs[cur]!;
    const half = this.count >> 1;
    while (cur < half) {
      let child = (cur << 1) + 1;
      const right = child + 1;
      if (right < this.count && this.costs[right]! < this.costs[child]!) {
        child = right;
      }
      if (cost <= this.costs[child]!) break;
      this.states[cur] = this.states[child]!;
      this.costs[cur] = this.costs[child]!;
      cur = child;
    }
    this.states[cur] = state;
    this.costs[cur] = cost;
  }
}
