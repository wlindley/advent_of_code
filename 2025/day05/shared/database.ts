import { ClosedInterval } from '../../../shared/core';

/** Parsed, frozen ingredient database containing fresh ID ranges and available IDs. */
export interface IngredientDatabase {
  readonly freshRanges: readonly ClosedInterval[];
  readonly availableIds: readonly bigint[];
}

const RANGE_LINE_RE = /^(\d+)-(\d+)$/;
const ID_LINE_RE = /^\d+$/;

/** Parse raw two-section AoC 2025 Day 5 input into a frozen `IngredientDatabase`. */
export function parseDatabase(raw: string): IngredientDatabase {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  if (normalized.length === 0) {
    throw new Error('Ingredient database input must not be empty');
  }

  const sections = normalized.split(/\n[ \t]*\n/);
  if (sections.length !== 2) {
    throw new Error(`Expected 2 sections separated by a blank line, got ${sections.length}`);
  }

  const freshRanges = sections[0]!.split('\n').map((line, index) => {
    const match = RANGE_LINE_RE.exec(line.trim());
    if (!match) {
      throw new Error(`Invalid range on line ${index + 1}: "${line}"`);
    }
    return new ClosedInterval(BigInt(match[1]!), BigInt(match[2]!));
  });

  const availableIds = sections[1]!.split('\n').map((line, index) => {
    const trimmed = line.trim();
    if (!ID_LINE_RE.test(trimmed)) {
      throw new Error(`Invalid ingredient ID on line ${index + 1}: "${line}"`);
    }
    return BigInt(trimmed);
  });

  return Object.freeze({
    freshRanges: Object.freeze(freshRanges),
    availableIds: Object.freeze(availableIds),
  });
}
