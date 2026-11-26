import { assertPrintableAscii } from './hash';

/** Parses a comma-separated initialization sequence, ignoring line breaks and validating tokens. */
export function parseInitSequence(raw: string): readonly string[] {
  const stripped = raw.replace(/[\r\n]+/g, '');
  if (stripped.length === 0) {
    throw new RangeError('Initialization sequence must not be empty');
  }
  const tokens = stripped.split(',');
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]!;
    if (token.length === 0) {
      throw new RangeError(`Empty token at sequence index ${i}`);
    }
    assertPrintableAscii(token);
    if (token.includes(' ')) {
      throw new RangeError(`Unexpected space in token "${token}" at index ${i}`);
    }
  }
  return Object.freeze(tokens);
}
