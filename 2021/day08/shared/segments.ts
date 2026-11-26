export type WireIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type WireLetter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';
export type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type WireFrequencies = readonly [number, number, number, number, number, number, number];

export const WIRE_INDICES = Object.freeze([0, 1, 2, 3, 4, 5, 6] as const);
export const WIRE_LETTERS = Object.freeze(['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const);

/** Canonical 7-bit segment masks (bit 0 = 'a' .. bit 6 = 'g') for digits 0..9. */
export const CANONICAL_DIGIT_MASKS = Object.freeze([
  0b1110111, 0b0100100, 0b1011101, 0b1101101, 0b0101110,
  0b1101011, 0b1111011, 0b0100101, 0b1111111, 0b1101111,
] as const);

const FULL_WIRE_MASK = 0x7f;
const WIRE_CHAR_CODE_A = 97;

function buildCanonicalMaskMap(): ReadonlyMap<number, Digit> {
  const entries = new Map<number, Digit>();
  for (const [digit, mask] of CANONICAL_DIGIT_MASKS.entries()) {
    entries.set(mask, digit as Digit);
  }
  return entries;
}

export const CANONICAL_MASK_TO_DIGIT: ReadonlyMap<number, Digit> = buildCanonicalMaskMap();
export const UNIQUE_SEGMENT_COUNTS: ReadonlySet<number> = new Set([2, 3, 4, 7]);

/** Counts active bits in a 7-bit segment mask in `[0, 127]`. */
export function popcount7(mask: number): number {
  if (!Number.isInteger(mask) || mask < 0 || mask > FULL_WIRE_MASK) {
    throw new RangeError(`7-segment mask must be an integer in [0, 127], got ${mask}`);
  }
  let bits = mask;
  let count = 0;
  while (bits !== 0) {
    bits &= bits - 1;
    count += 1;
  }
  return count;
}

/** Immutable 7-segment signal pattern backed by a validated 7-bit wire mask. */
export class SignalPattern {
  readonly mask: number;

  constructor(mask: number) {
    if (!Number.isInteger(mask) || mask < 1 || mask > FULL_WIRE_MASK) {
      throw new RangeError(`SignalPattern mask must be an integer in [1, 127], got ${mask}`);
    }
    this.mask = mask;
    Object.freeze(this);
  }

  get segmentCount(): number {
    return popcount7(this.mask);
  }

  get letters(): string {
    let out = '';
    for (const wire of WIRE_INDICES) {
      if ((this.mask & (1 << wire)) !== 0) {
        out += WIRE_LETTERS[wire];
      }
    }
    return out;
  }

  get isUniqueSegmentCount(): boolean {
    return UNIQUE_SEGMENT_COUNTS.has(this.segmentCount);
  }

  hasWire(wire: WireIndex): boolean {
    return (this.mask & (1 << wire)) !== 0;
  }

  static parse(token: string): SignalPattern {
    if (token.length === 0) {
      throw new SyntaxError('Signal pattern token cannot be empty');
    }
    let mask = 0;
    for (let i = 0; i < token.length; i += 1) {
      const code = token.charCodeAt(i) - WIRE_CHAR_CODE_A;
      if (code < 0 || code > 6) {
        throw new SyntaxError(`Invalid wire letter in pattern "${token}"`);
      }
      const bit = 1 << code;
      if ((mask & bit) !== 0) {
        throw new SyntaxError(`Duplicate wire letter in pattern "${token}"`);
      }
      mask |= bit;
    }
    return new SignalPattern(mask);
  }
}
