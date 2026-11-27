export type PacketVersion = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type OperatorTypeId = 0 | 1 | 2 | 3 | 5 | 6 | 7;
export const LITERAL_TYPE_ID = 4;
export type PacketTypeId = OperatorTypeId | typeof LITERAL_TYPE_ID;
export type LengthTypeId = 0 | 1;
export type Packet = LiteralPacket | OperatorPacket;

/** Half-open bit range `[startBit, endBit)` within a transmission bitstream. */
export class BitSpan {
  readonly startBit: number;
  readonly endBit: number;

  constructor(startBit: number, endBit: number) {
    if (
      !Number.isInteger(startBit) ||
      !Number.isInteger(endBit) ||
      startBit < 0 ||
      endBit <= startBit
    ) {
      throw new RangeError(`Invalid BitSpan [${startBit}, ${endBit})`);
    }
    this.startBit = startBit;
    this.endBit = endBit;
    Object.freeze(this);
  }

  get length(): number {
    return this.endBit - this.startBit;
  }
}

/** Leaf BITS packet encoding an arbitrary-precision non-negative BigInt literal. */
export class LiteralPacket {
  readonly kind = 'literal' as const;
  readonly version: PacketVersion;
  readonly typeId = LITERAL_TYPE_ID;
  readonly value: bigint;
  readonly span: BitSpan;

  constructor(version: PacketVersion, value: bigint, span: BitSpan) {
    if (value < 0n) {
      throw new RangeError(`LiteralPacket value must be non-negative, got ${value}`);
    }
    if (span.length < 11 || (span.length - 6) % 5 !== 0) {
      throw new RangeError(`LiteralPacket span length ${span.length} is not 6 + 5k`);
    }
    this.version = version;
    this.value = value;
    this.span = span;
    Object.freeze(this);
  }

  get groupCount(): number {
    return (this.span.length - 6) / 5;
  }

  get versionSum(): number {
    return this.version;
  }

  get packetCount(): number {
    return 1;
  }

  get maxDepth(): number {
    return 0;
  }
}

/** Composite BITS operator packet owning one or more ordered child packets. */
export class OperatorPacket {
  readonly kind = 'operator' as const;
  readonly version: PacketVersion;
  readonly typeId: OperatorTypeId;
  readonly lengthTypeId: LengthTypeId;
  readonly children: readonly Packet[];
  readonly span: BitSpan;

  constructor(
    version: PacketVersion,
    typeId: OperatorTypeId,
    lengthTypeId: LengthTypeId,
    children: readonly Packet[],
    span: BitSpan,
  ) {
    if (children.length === 0) {
      throw new RangeError('OperatorPacket must contain at least one child packet');
    }
    this.version = version;
    this.typeId = typeId;
    this.lengthTypeId = lengthTypeId;
    this.children = Object.freeze([...children]);
    this.span = span;
    Object.freeze(this);
  }

  get headerBitLength(): number {
    return this.lengthTypeId === 0 ? 22 : 18;
  }

  get versionSum(): number {
    let total: number = this.version;
    for (const child of this.children) {
      total += child.versionSum;
    }
    return total;
  }

  get packetCount(): number {
    let total = 1;
    for (const child of this.children) {
      total += child.packetCount;
    }
    return total;
  }

  get maxDepth(): number {
    let deepest = 0;
    for (const child of this.children) {
      deepest = Math.max(deepest, child.maxDepth);
    }
    return deepest + 1;
  }
}
