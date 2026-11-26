import { BoatRace, RaceSheet, extractRaceRows, parseUnsignedBigInt } from '../../shared';

/** Parses kerning-separated `Time:` and `Distance:` rows by stripping internal whitespace into one race. */
export function parseMergedRace(raw: string): RaceSheet {
  const { timeBody, distanceBody } = extractRaceRows(raw);
  const time = parseUnsignedBigInt(timeBody.replace(/\s+/g, ''), 'time');
  const record = parseUnsignedBigInt(distanceBody.replace(/\s+/g, ''), 'distance');
  return new RaceSheet([new BoatRace(time, record)]);
}
