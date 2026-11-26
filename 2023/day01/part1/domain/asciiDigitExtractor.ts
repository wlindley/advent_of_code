import { DigitMatch, type DigitExtractor } from '../../shared';

const ASCII_ZERO = 48;
const ASCII_NINE = 57;

/** Part 1 digit extractor matching single ASCII '0'..'9' characters. */
export class AsciiDigitExtractor implements DigitExtractor {
  matchAt(line: string, index: number): DigitMatch | null {
    if (!Number.isInteger(index) || index < 0 || index >= line.length) {
      return null;
    }
    const code = line.charCodeAt(index);
    if (code < ASCII_ZERO || code > ASCII_NINE) {
      return null;
    }
    return new DigitMatch(code - ASCII_ZERO, index, 1);
  }
}

export const asciiDigitExtractor: DigitExtractor = Object.freeze(new AsciiDigitExtractor());
