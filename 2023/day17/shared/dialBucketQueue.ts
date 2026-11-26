/** Intrusive O(1) circular Dial's bucket queue backed by flat Int32Array doubly-linked lists. */
export class DialBucketQueue {
  readonly #bucketHead: Int32Array;
  readonly #nodePrev: Int32Array;
  readonly #nodeNext: Int32Array;
  #size = 0;
  #cursor = 0;

  constructor(stateCount: number, bucketCount: number) {
    if (!Number.isInteger(stateCount) || stateCount < 1) {
      throw new RangeError(`stateCount must be a positive integer, got ${stateCount}`);
    }
    if (!Number.isInteger(bucketCount) || bucketCount < 1) {
      throw new RangeError(`bucketCount must be a positive integer, got ${bucketCount}`);
    }
    this.#bucketHead = new Int32Array(bucketCount).fill(-1);
    this.#nodePrev = new Int32Array(stateCount).fill(-1);
    this.#nodeNext = new Int32Array(stateCount).fill(-1);
  }

  get size(): number {
    return this.#size;
  }

  get currentDist(): number {
    return this.#cursor;
  }

  insert(state: number, dist: number): void {
    this.#assertStateAndDist(state, dist);
    this.#insertHead(state, dist % this.#bucketHead.length);
    this.#size += 1;
  }

  decreaseKey(state: number, oldDist: number, newDist: number): void {
    this.#assertStateAndDist(state, newDist);
    if (!Number.isInteger(oldDist) || oldDist <= newDist) {
      throw new RangeError(`decreaseKey requires newDist (${newDist}) < oldDist (${oldDist})`);
    }
    const bucketCount = this.#bucketHead.length;
    this.#unlink(state, oldDist % bucketCount);
    this.#insertHead(state, newDist % bucketCount);
  }

  popMin(): number {
    if (this.#size === 0) return -1;
    const bucketCount = this.#bucketHead.length;
    let bucket = this.#cursor % bucketCount;
    while (this.#bucketHead[bucket]! === -1) {
      this.#cursor += 1;
      bucket = this.#cursor % bucketCount;
    }
    const state = this.#bucketHead[bucket]!;
    this.#unlink(state, bucket);
    this.#size -= 1;
    return state;
  }

  #assertStateAndDist(state: number, dist: number): void {
    if (!Number.isInteger(state) || state < 0 || state >= this.#nodePrev.length) {
      throw new RangeError(`state must be in [0, ${this.#nodePrev.length - 1}], got ${state}`);
    }
    if (!Number.isInteger(dist) || dist < this.#cursor) {
      throw new RangeError(`dist (${dist}) must be an integer >= currentDist (${this.#cursor})`);
    }
  }

  #insertHead(state: number, bucket: number): void {
    const oldHead = this.#bucketHead[bucket]!;
    this.#nodePrev[state] = -1;
    this.#nodeNext[state] = oldHead;
    if (oldHead !== -1) {
      this.#nodePrev[oldHead] = state;
    }
    this.#bucketHead[bucket] = state;
  }

  #unlink(state: number, bucket: number): void {
    const prev = this.#nodePrev[state]!;
    const next = this.#nodeNext[state]!;
    if (prev === -1) {
      this.#bucketHead[bucket] = next;
    } else {
      this.#nodeNext[prev] = next;
    }
    if (next !== -1) {
      this.#nodePrev[next] = prev;
    }
    this.#nodePrev[state] = -1;
    this.#nodeNext[state] = -1;
  }
}
