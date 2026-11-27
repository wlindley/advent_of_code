/** Parses a single ASCII hex character into its 4-bit nibble (0..15). */
export function parseHexNibble(ch: string): number {
  const code = ch.charCodeAt(0);
  if (code >= 48 && code <= 57) return code - 48;
  if (code >= 65 && code <= 70) return code - 55;
  if (code >= 97 && code <= 102) return code - 87;
  throw new SyntaxError(`Invalid hexadecimal character '${ch}'`);
}

function formatHexNibble(nibble: number): string {
  return nibble.toString(16).toUpperCase();
}

/** Immutable big-endian bit view over a hexadecimal transmission buffer. */
export class HexBitstream {
  private readonly nibbles: Uint8Array;

  constructor(nibbles: Uint8Array) {
    this.nibbles = new Uint8Array(nibbles);
    Object.freeze(this);
  }

  get hexLength(): number {
    return this.nibbles.length;
  }

  get bitLength(): number {
    return this.nibbles.length * 4;
  }

  get hex(): string {
    return Array.from(this.nibbles, formatHexNibble).join('');
  }

  bitAt(index: number): 0 | 1 {
    if (!Number.isInteger(index) || index < 0 || index >= this.bitLength) {
      throw new RangeError(`Bit index ${index} out of range [0, ${this.bitLength})`);
    }
    const nibble = this.nibbles[index >> 2]!;
    return ((nibble >> (3 - (index & 3))) & 1) as 0 | 1;
  }

  sliceBits(startBit: number, endBit: number): string {
    if (
      !Number.isInteger(startBit) ||
      !Number.isInteger(endBit) ||
      startBit < 0 ||
      endBit < startBit ||
      endBit > this.bitLength
    ) {
      throw new RangeError(`Invalid bit slice [${startBit}, ${endBit}) for length ${this.bitLength}`);
    }
    let out = '';
    for (let i = startBit; i < endBit; i += 1) {
      out += this.bitAt(i);
    }
    return out;
  }

  createCursor(): BitCursor {
    return new BitCursor(this);
  }
}

/** Stateful sequential big-endian unsigned integer reader over a HexBitstream. */
export class BitCursor {
  readonly stream: HexBitstream;
  private offset = 0;

  constructor(stream: HexBitstream) {
    this.stream = stream;
  }

  get position(): number {
    return this.offset;
  }

  get remainingBits(): number {
    return this.stream.bitLength - this.offset;
  }

  readUint(bitCount: number): number {
    if (!Number.isInteger(bitCount) || bitCount < 1 || bitCount > 30) {
      throw new RangeError(`bitCount must be an integer in 1..30, got ${bitCount}`);
    }
    if (bitCount > this.remainingBits) {
      throw new SyntaxError(
        `Unexpected end of bitstream: needed ${bitCount} bits, ${this.remainingBits} remaining`,
      );
    }
    let value = 0;
    for (let i = 0; i < bitCount; i += 1) {
      value = (value << 1) | this.stream.bitAt(this.offset);
      this.offset += 1;
    }
    return value;
  }
}

/** Parses and trims a hexadecimal transmission string into an immutable HexBitstream. */
export function parseHexBitstream(raw: string): HexBitstream {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new SyntaxError('Hexadecimal transmission must not be empty');
  }
  const nibbles = new Uint8Array(trimmed.length);
  for (let i = 0; i < trimmed.length; i += 1) {
    nibbles[i] = parseHexNibble(trimmed[i]!);
  }
  return new HexBitstream(nibbles);
}
