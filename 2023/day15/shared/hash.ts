export const HASH_MULTIPLIER = 17;
export const HASH_BUCKET_COUNT = 256;
export const HASH_MASK = 255;

const MIN_PRINTABLE_ASCII = 0x20;
const MAX_PRINTABLE_ASCII = 0x7e;

/** Validates that every character in `text` is printable ASCII (0x20..0x7E). */
export function assertPrintableAscii(text: string): void {
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code < MIN_PRINTABLE_ASCII || code > MAX_PRINTABLE_ASCII) {
      throw new RangeError(`Non-printable ASCII code ${code} at index ${i}`);
    }
  }
}

/** Immutable record of a single character step in the Holiday ASCII String Helper (HASH). */
export class HashCharTransition {
  readonly index: number;
  readonly char: string;
  readonly before: number;

  constructor(index: number, char: string, before: number) {
    if (!Number.isInteger(index) || index < 0) {
      throw new RangeError(`Character index must be a non-negative integer, got ${index}`);
    }
    if (char.length !== 1) {
      throw new RangeError(`Expected a single character, got length ${char.length}`);
    }
    assertPrintableAscii(char);
    if (!Number.isInteger(before) || before < 0 || before >= HASH_BUCKET_COUNT) {
      throw new RangeError(`Bucket value before step must be in [0, 255], got ${before}`);
    }
    this.index = index;
    this.char = char;
    this.before = before;
    Object.freeze(this);
  }

  get ascii(): number {
    return this.char.charCodeAt(0);
  }

  get added(): number {
    return this.before + this.ascii;
  }

  get multiplied(): number {
    return this.added * HASH_MULTIPLIER;
  }

  get after(): number {
    return this.multiplied & HASH_MASK;
  }
}

/** Computes the 8-bit HASH value of a printable ASCII string. */
export function hashAscii(text: string): number {
  assertPrintableAscii(text);
  let current = 0;
  for (let i = 0; i < text.length; i += 1) {
    current = ((current + text.charCodeAt(i)) * HASH_MULTIPLIER) & HASH_MASK;
  }
  return current;
}

/** Produces an immutable per-character trace of the HASH calculation for `text`. */
export function traceHashCharacters(text: string): readonly HashCharTransition[] {
  assertPrintableAscii(text);
  const transitions: HashCharTransition[] = [];
  let current = 0;
  for (let i = 0; i < text.length; i += 1) {
    const transition = new HashCharTransition(i, text[i]!, current);
    transitions.push(transition);
    current = transition.after;
  }
  return Object.freeze(transitions);
}
