import { parseCardTuple } from './cards';
import { CamelHand } from './hand';
import { CamelCardsDeal } from './ranking';

/** Parses a non-negative integer token into an exact `bigint`. */
export function parseUnsignedBigInt(token: string): bigint {
  if (!/^\d+$/.test(token)) {
    throw new SyntaxError(`Expected unsigned integer token, got "${token}"`);
  }
  return BigInt(token);
}

/** Parses one `"CARDS BID"` line into an immutable `CamelHand`. */
export function parseHandLine(line: string, inputIndex: number): CamelHand {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length !== 2) {
    throw new SyntaxError(`Expected "<5-cards> <bid>" on line ${inputIndex + 1}, got "${line}"`);
  }
  return new CamelHand(parseCardTuple(tokens[0]!), parseUnsignedBigInt(tokens[1]!), inputIndex);
}

/** Parses multi-line Camel Cards input into a frozen `CamelCardsDeal`. */
export function parseCamelCardsDeal(raw: string): CamelCardsDeal {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    throw new SyntaxError('Camel Cards input contains no hand lines');
  }
  return new CamelCardsDeal(lines.map((line, index) => parseHandLine(line, index)));
}
