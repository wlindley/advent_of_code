export const QUESTION_COUNT = 26;
export const CHAR_CODE_A = 97;
export const ALL_QUESTIONS_MASK = (1 << QUESTION_COUNT) - 1;

export const QUESTION_LETTERS: readonly string[] = Object.freeze(
  Array.from({ length: QUESTION_COUNT }, (_, i) => String.fromCharCode(CHAR_CODE_A + i)),
);

/** Throws RangeError unless `index` is an integer in `0..25`. */
export function assertValidQuestionIndex(index: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= QUESTION_COUNT) {
    throw new RangeError(`Question index must be an integer in 0..25, got ${index}`);
  }
}

/** Throws RangeError unless `mask` is a 26-bit integer bitmask in `0..ALL_QUESTIONS_MASK`. */
export function assertValidQuestionMask(mask: number): void {
  if (!Number.isInteger(mask) || mask < 0 || mask > ALL_QUESTIONS_MASK) {
    throw new RangeError(`Question mask must be an integer in 0..${ALL_QUESTIONS_MASK}, got ${mask}`);
  }
}

/** Returns the single-bit mask for question `index` (`0..25`). */
export function questionBit(index: number): number {
  assertValidQuestionIndex(index);
  return 1 << index;
}

/** Returns whether question `index` (`0..25`) is set in `mask`. */
export function hasQuestion(mask: number, index: number): boolean {
  assertValidQuestionMask(mask);
  assertValidQuestionIndex(index);
  return (mask & (1 << index)) !== 0;
}

/** Counts set bits in a validated 26-bit question mask using 32-bit SWAR. */
export function popcount26(mask: number): number {
  assertValidQuestionMask(mask);
  let x = mask - ((mask >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return Math.imul((x + (x >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24;
}

/** Encodes a non-empty raw answer line of `'a'..'z'` without trimming into a 26-bit mask. */
export function encodeAnswerLine(line: string): number {
  if (line.length === 0) {
    throw new SyntaxError('Answer line must not be empty');
  }
  let mask = 0;
  for (let i = 0; i < line.length; i += 1) {
    const offset = line.charCodeAt(i) - CHAR_CODE_A;
    if (offset < 0 || offset >= QUESTION_COUNT) {
      throw new SyntaxError(`Invalid question character '${line[i]}' in line`);
    }
    mask |= 1 << offset;
  }
  return mask;
}

/** Formats a validated 26-bit question mask as a sorted string of `'a'..'z'` letters. */
export function formatQuestionMask(mask: number): string {
  assertValidQuestionMask(mask);
  let letters = '';
  for (let i = 0; i < QUESTION_COUNT; i += 1) {
    if ((mask & (1 << i)) !== 0) {
      letters += String.fromCharCode(CHAR_CODE_A + i);
    }
  }
  return letters;
}
