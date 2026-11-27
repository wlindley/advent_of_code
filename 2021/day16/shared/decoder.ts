import type { BitCursor, HexBitstream } from './bitstream';
import {
  BitSpan,
  LITERAL_TYPE_ID,
  LiteralPacket,
  OperatorPacket,
  type LengthTypeId,
  type OperatorTypeId,
  type Packet,
  type PacketTypeId,
  type PacketVersion,
} from './packet';

/** Immutable result of decoding a complete BITS hexadecimal transmission. */
export class DecodedTransmission {
  readonly stream: HexBitstream;
  readonly root: Packet;

  constructor(stream: HexBitstream, root: Packet) {
    this.stream = stream;
    this.root = root;
    Object.freeze(this);
  }

  get bitsConsumed(): number {
    return this.root.span.endBit;
  }

  get trailingZeroBits(): number {
    return this.stream.bitLength - this.root.span.endBit;
  }
}

function decodeLiteral(cursor: BitCursor, version: PacketVersion, startBit: number): LiteralPacket {
  let value = 0n;
  while (true) {
    const group = cursor.readUint(5);
    value = (value << 4n) | BigInt(group & 0x0f);
    if ((group & 0x10) === 0) break;
  }
  return new LiteralPacket(version, value, new BitSpan(startBit, cursor.position));
}

function decodeLengthBitChildren(cursor: BitCursor): readonly Packet[] {
  const subBitLength = cursor.readUint(15);
  if (subBitLength === 0) {
    throw new SyntaxError('Operator sub-packet bit length must be positive');
  }
  if (subBitLength > cursor.remainingBits) {
    throw new SyntaxError(
      `Operator sub-packet bit length ${subBitLength} exceeds remaining ${cursor.remainingBits} bits`,
    );
  }
  const targetEndBit = cursor.position + subBitLength;
  const children: Packet[] = [];
  while (cursor.position < targetEndBit) {
    children.push(decodeNextPacket(cursor));
  }
  if (cursor.position > targetEndBit) {
    throw new SyntaxError(
      `Operator sub-packets overran bit length: expected ${targetEndBit}, got ${cursor.position}`,
    );
  }
  return children;
}

function decodePacketCountChildren(cursor: BitCursor): readonly Packet[] {
  const subPacketCount = cursor.readUint(11);
  if (subPacketCount === 0) {
    throw new SyntaxError('Operator sub-packet count must be positive');
  }
  const children: Packet[] = [];
  for (let i = 0; i < subPacketCount; i += 1) {
    children.push(decodeNextPacket(cursor));
  }
  return children;
}

function decodeOperator(
  cursor: BitCursor,
  version: PacketVersion,
  typeId: OperatorTypeId,
  startBit: number,
): OperatorPacket {
  const lengthTypeId = cursor.readUint(1) as LengthTypeId;
  const children =
    lengthTypeId === 0
      ? decodeLengthBitChildren(cursor)
      : decodePacketCountChildren(cursor);
  return new OperatorPacket(version, typeId, lengthTypeId, children, new BitSpan(startBit, cursor.position));
}

/** Recursively decodes the next BITS packet starting at the cursor's current bit offset. */
export function decodeNextPacket(cursor: BitCursor): Packet {
  const startBit = cursor.position;
  const version = cursor.readUint(3) as PacketVersion;
  const typeId = cursor.readUint(3) as PacketTypeId;
  if (typeId === LITERAL_TYPE_ID) {
    return decodeLiteral(cursor, version, startBit);
  }
  return decodeOperator(cursor, version, typeId, startBit);
}

/** Decodes a HexBitstream into a DecodedTransmission, verifying zero-only trailing padding. */
export function decodeTransmission(stream: HexBitstream): DecodedTransmission {
  const cursor = stream.createCursor();
  const root = decodeNextPacket(cursor);
  for (let bit = cursor.position; bit < stream.bitLength; bit += 1) {
    if (stream.bitAt(bit) !== 0) {
      throw new SyntaxError(`Non-zero trailing padding bit at offset ${bit}`);
    }
  }
  return new DecodedTransmission(stream, root);
}
