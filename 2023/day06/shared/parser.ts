import { BoatRace, RaceSheet } from './race';

/** Extracted non-empty bodies from the `Time:` and `Distance:` rows of a race sheet. */
export interface RawRaceRows {
  readonly timeBody: string;
  readonly distanceBody: string;
}

/** Extracts and validates the `Time:` and `Distance:` row bodies from raw input. */
export function extractRaceRows(raw: string): RawRaceRows {
  const lines: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length > 0) lines.push(trimmed);
  }
  if (lines.length !== 2) {
    throw new SyntaxError(`Expected exactly 2 non-empty lines, got ${lines.length}`);
  }
  const timeMatch = /^Time:\s*(.+)$/.exec(lines[0]!);
  if (!timeMatch) {
    throw new SyntaxError('First line must start with "Time:" followed by values');
  }
  const distMatch = /^Distance:\s*(.+)$/.exec(lines[1]!);
  if (!distMatch) {
    throw new SyntaxError('Second line must start with "Distance:" followed by values');
  }
  return Object.freeze({ timeBody: timeMatch[1]!, distanceBody: distMatch[1]! });
}

/** Parses an unsigned decimal token into a non-negative `bigint`. */
export function parseUnsignedBigInt(token: string, label: string): bigint {
  if (!/^\d+$/.test(token)) {
    throw new SyntaxError(`Invalid ${label} token: "${token}"`);
  }
  return BigInt(token);
}

/** Parses whitespace-separated `Time:` / `Distance:` columns into a `RaceSheet`. */
export function parseRaceColumns(raw: string): RaceSheet {
  const { timeBody, distanceBody } = extractRaceRows(raw);
  const timeTokens = timeBody.split(/\s+/);
  const distanceTokens = distanceBody.split(/\s+/);
  if (timeTokens.length !== distanceTokens.length) {
    throw new SyntaxError(
      `Column count mismatch: ${timeTokens.length} times vs ${distanceTokens.length} distances`,
    );
  }
  const races: BoatRace[] = [];
  for (let i = 0; i < timeTokens.length; i += 1) {
    const time = parseUnsignedBigInt(timeTokens[i]!, 'time');
    const record = parseUnsignedBigInt(distanceTokens[i]!, 'distance');
    races.push(new BoatRace(time, record));
  }
  return new RaceSheet(races);
}
