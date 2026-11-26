import { DisplayEntry } from './entry';
import { SignalPattern } from './segments';

function parsePatternList(section: string): SignalPattern[] {
  const trimmed = section.trim();
  if (trimmed.length === 0) return [];
  const tokens = trimmed.split(/\s+/);
  const patterns: SignalPattern[] = [];
  for (const token of tokens) {
    patterns.push(SignalPattern.parse(token));
  }
  return patterns;
}

/** Parses one `"10 signal patterns | 4 output patterns"` line into an immutable `DisplayEntry`. */
export function parseDisplayEntry(line: string): DisplayEntry {
  const halves = line.split('|');
  if (halves.length !== 2) {
    throw new SyntaxError(`Expected exactly one '|' separator in line: "${line.trim()}"`);
  }
  const signals = parsePatternList(halves[0]!);
  const outputs = parsePatternList(halves[1]!);
  return new DisplayEntry(signals, outputs);
}

/** Parses multi-line 7-segment display notes into a frozen array of `DisplayEntry` instances. */
export function parseDisplayNotes(raw: string): readonly DisplayEntry[] {
  const entries: DisplayEntry[] = [];
  for (const rawLine of raw.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (trimmed.length > 0) {
      entries.push(parseDisplayEntry(trimmed));
    }
  }
  if (entries.length === 0) {
    throw new RangeError('Display notes must contain at least one non-empty entry line');
  }
  return Object.freeze(entries);
}
