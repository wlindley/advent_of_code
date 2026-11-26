/** Non-negative integer node inside a distress signal packet. */
export class PacketInt {
  readonly kind = 'int' as const;
  readonly value: number;

  constructor(value: number) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError(`Packet integer must be a non-negative safe integer, got ${value}`);
    }
    this.value = value;
    Object.freeze(this);
  }

  format(): string {
    return String(this.value);
  }
}

/** Ordered list node containing zero or more nested packet values. */
export class PacketList {
  readonly kind = 'list' as const;
  readonly items: readonly PacketValue[];

  constructor(items: readonly PacketValue[]) {
    this.items = Object.freeze([...items]);
    Object.freeze(this);
  }

  get length(): number {
    return this.items.length;
  }

  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  format(): string {
    return `[${this.items.map((item) => item.format()).join(',')}]`;
  }
}

export type PacketValue = PacketInt | PacketList;

/** Index-free pair of left and right distress signal packets. */
export class PacketPair {
  readonly left: PacketList;
  readonly right: PacketList;

  constructor(left: PacketList, right: PacketList) {
    this.left = left;
    this.right = right;
    Object.freeze(this);
  }
}

/** Validated, immutable collection of distress signal packet pairs. */
export class SignalInput {
  readonly pairs: readonly PacketPair[];

  constructor(pairs: readonly PacketPair[]) {
    if (pairs.length === 0) {
      throw new Error('Signal input must contain at least one packet pair');
    }
    this.pairs = Object.freeze([...pairs]);
    Object.freeze(this);
  }

  get pairCount(): number {
    return this.pairs.length;
  }

  get packets(): readonly PacketList[] {
    return Object.freeze(this.pairs.flatMap((pair) => [pair.left, pair.right]));
  }
}
