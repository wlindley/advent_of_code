/** Fixed-capacity circular deck buffer backed by an unfrozen Int32Array. */
export class DeckRingBuffer {
  private readonly buf: Int32Array;
  private readonly cap: number;
  private head = 0;
  private count = 0;

  constructor(capacity: number, initial: readonly number[]) {
    if (!Number.isInteger(capacity) || capacity < 1 || initial.length > capacity) {
      throw new RangeError(`Invalid deck capacity ${capacity} for ${initial.length} cards.`);
    }
    this.cap = capacity;
    this.buf = new Int32Array(capacity);
    for (let i = 0; i < initial.length; i += 1) {
      this.buf[i] = initial[i]!;
    }
    this.count = initial.length;
  }

  get size(): number {
    return this.count;
  }

  get isEmpty(): boolean {
    return this.count === 0;
  }

  draw(): number {
    if (this.count === 0) {
      throw new RangeError('Cannot draw from an empty deck.');
    }
    const card = this.buf[this.head]!;
    this.head = (this.head + 1) % this.cap;
    this.count -= 1;
    return card;
  }

  push(card: number): void {
    if (this.count === this.cap) {
      throw new RangeError('Cannot push to a full deck buffer.');
    }
    const tail = (this.head + this.count) % this.cap;
    this.buf[tail] = card;
    this.count += 1;
  }

  maxCard(): number {
    let max = 0;
    for (let i = 0; i < this.count; i += 1) {
      const card = this.buf[(this.head + i) % this.cap]!;
      if (card > max) max = card;
    }
    return max;
  }

  copyPrefix(count: number, capacity: number): DeckRingBuffer {
    if (!Number.isInteger(count) || count < 0 || count > this.count) {
      throw new RangeError(`Invalid prefix count ${count} for deck size ${this.count}.`);
    }
    if (!Number.isInteger(capacity) || capacity < 1 || capacity < count) {
      throw new RangeError(`Invalid sub-deck capacity ${capacity} for prefix count ${count}.`);
    }
    const copy = new DeckRingBuffer(capacity, []);
    for (let i = 0; i < count; i += 1) {
      copy.buf[i] = this.buf[(this.head + i) % this.cap]!;
    }
    copy.count = count;
    return copy;
  }

  toArray(): readonly number[] {
    const out = new Array<number>(this.count);
    for (let i = 0; i < this.count; i += 1) {
      out[i] = this.buf[(this.head + i) % this.cap]!;
    }
    return Object.freeze(out);
  }

  toCompactString(): string {
    let key = '';
    for (let i = 0; i < this.count; i += 1) {
      key += String.fromCharCode(this.buf[(this.head + i) % this.cap]!);
    }
    return key;
  }
}

/** Encodes both decks into a collision-free hash key for loop detection. */
export function encodeStateKey(d1: DeckRingBuffer, d2: DeckRingBuffer, useCompactKey: boolean): string {
  if (useCompactKey) {
    return `${d1.toCompactString()}\0${d2.toCompactString()}`;
  }
  return `${d1.toArray().join(',')}|${d2.toArray().join(',')}`;
}
