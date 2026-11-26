import { DigitMatch, type DigitExtractor } from '../../shared';

interface WordEntry {
  readonly word: string;
  readonly value: number;
}

const ASCII_ZERO = 48;
const ASCII_NINE = 57;

// AoC 2023 Day 1 Part 2 defines spelled digits strictly as 1..9 (excluding "zero").
const WORD_ENTRIES: readonly WordEntry[] = Object.freeze([
  Object.freeze({ word: 'one', value: 1 }),
  Object.freeze({ word: 'two', value: 2 }),
  Object.freeze({ word: 'three', value: 3 }),
  Object.freeze({ word: 'four', value: 4 }),
  Object.freeze({ word: 'five', value: 5 }),
  Object.freeze({ word: 'six', value: 6 }),
  Object.freeze({ word: 'seven', value: 7 }),
  Object.freeze({ word: 'eight', value: 8 }),
  Object.freeze({ word: 'nine', value: 9 }),
]);

function buildWordBuckets(): ReadonlyMap<number, readonly WordEntry[]> {
  const grouped = new Map<number, WordEntry[]>();
  for (const entry of WORD_ENTRIES) {
    const code = entry.word.charCodeAt(0);
    const bucket = grouped.get(code);
    if (bucket) {
      bucket.push(entry);
    } else {
      grouped.set(code, [entry]);
    }
  }
  const frozen = new Map<number, readonly WordEntry[]>();
  for (const [code, entries] of grouped) {
    frozen.set(code, Object.freeze(entries));
  }
  return frozen;
}

const WORD_BUCKETS = buildWordBuckets();

function matchWordAt(line: string, index: number, code: number): DigitMatch | null {
  const entries = WORD_BUCKETS.get(code);
  if (!entries) return null;
  for (const entry of entries) {
    if (line.startsWith(entry.word, index)) {
      return new DigitMatch(entry.value, index, entry.word.length);
    }
  }
  return null;
}

/** Part 2 digit extractor matching ASCII '0'..'9' or spelled English digits 'one'..'nine'. */
export class SpelledDigitExtractor implements DigitExtractor {
  matchAt(line: string, index: number): DigitMatch | null {
    if (!Number.isInteger(index) || index < 0 || index >= line.length) {
      return null;
    }
    const code = line.charCodeAt(index);
    if (code >= ASCII_ZERO && code <= ASCII_NINE) {
      return new DigitMatch(code - ASCII_ZERO, index, 1);
    }
    return matchWordAt(line, index, code);
  }
}

export const spelledDigitExtractor: DigitExtractor = Object.freeze(new SpelledDigitExtractor());
