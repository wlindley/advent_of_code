import { Almanac } from './almanac';
import { RangeMap, RangeRule } from './rangeMap';

const SEEDS_HEADER_RE = /^seeds:\s*(.+)$/;
const MAP_HEADER_RE = /^([a-zA-Z0-9_]+)-to-([a-zA-Z0-9_]+)\s+map:$/;
const UNSIGNED_INT_RE = /^\d+$/;

function parseUnsignedBigInt(token: string, label: string): bigint {
  if (!UNSIGNED_INT_RE.test(token)) {
    throw new SyntaxError(`Expected non-negative integer for ${label}, got "${token}"`);
  }
  return BigInt(token);
}

/** Parses a `seeds: ...` header line into a frozen list of non-negative `bigint` seed IDs. */
export function parseSeedsLine(line: string): readonly bigint[] {
  const match = SEEDS_HEADER_RE.exec(line.trim());
  if (match === null) {
    throw new SyntaxError(`Invalid seeds line: "${line}"`);
  }
  const tokens = match[1]!.trim().split(/\s+/);
  const seeds: bigint[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    seeds.push(parseUnsignedBigInt(tokens[i]!, `seeds[${i}]`));
  }
  return Object.freeze(seeds);
}

/** Parses a single `destStart sourceStart length` rule triple into an immutable `RangeRule`. */
export function parseRuleLine(line: string): RangeRule {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length !== 3) {
    throw new SyntaxError(`Expected 3 integers in rule line, got "${line}"`);
  }
  const destStart = parseUnsignedBigInt(tokens[0]!, 'destStart');
  const sourceStart = parseUnsignedBigInt(tokens[1]!, 'sourceStart');
  const length = parseUnsignedBigInt(tokens[2]!, 'length');
  return RangeRule.fromTriple(destStart, sourceStart, length);
}

/** Parses a single `<source>-to-<dest> map:` section and its rule lines into a `RangeMap`. */
export function parseMapSection(lines: readonly string[]): RangeMap {
  if (lines.length === 0) {
    throw new SyntaxError('Map section must not be empty');
  }
  const header = MAP_HEADER_RE.exec(lines[0]!.trim());
  if (header === null) {
    throw new SyntaxError(`Invalid map header: "${lines[0]!}"`);
  }
  if (lines.length < 2) {
    throw new SyntaxError(`Map section "${lines[0]!}" has no rules`);
  }
  const rules: RangeRule[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    rules.push(parseRuleLine(lines[i]!));
  }
  return new RangeMap(header[1]!, header[2]!, rules);
}

function splitSections(raw: string): string[][] {
  const sections: string[][] = [];
  let current: string[] = [];
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) {
      if (current.length > 0) {
        sections.push(current);
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) sections.push(current);
  return sections;
}

/** Parses a complete Day 05 almanac input (LF/CRLF tolerant) into an immutable `Almanac`. */
export function parseAlmanac(raw: string): Almanac {
  const sections = splitSections(raw);
  if (sections.length === 0) {
    throw new SyntaxError('Almanac input is empty');
  }
  const firstSection = sections[0]!;
  if (firstSection.length !== 1) {
    throw new SyntaxError('Expected single-line seeds header before map sections');
  }
  const seeds = parseSeedsLine(firstSection[0]!);
  if (sections.length < 2) {
    throw new SyntaxError('Almanac must contain at least one map section');
  }
  const maps: RangeMap[] = [];
  for (let i = 1; i < sections.length; i += 1) {
    maps.push(parseMapSection(sections[i]!));
  }
  return new Almanac(seeds, maps);
}
