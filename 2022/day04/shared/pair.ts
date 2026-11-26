import { ClosedInterval } from '../../../shared/core';
import { containsInterval, intersection, overlaps } from './intervalOps';
import type { PairRelation } from './tally';

const PAIR_LINE_RE = /^(\d+)-(\d+),(\d+)-(\d+)$/;

function classifyRelation(first: ClosedInterval, second: ClosedInterval): PairRelation {
  if (first.start === second.start && first.end === second.end) return 'identical';
  if (containsInterval(first, second)) return 'first-contains-second';
  if (containsInterval(second, first)) return 'second-contains-first';
  if (overlaps(first, second)) return 'partial-overlap';
  return 'disjoint';
}

function parseIntervalAtLine(startRaw: string, endRaw: string, lineNumber: number): ClosedInterval {
  const start = BigInt(startRaw);
  const end = BigInt(endRaw);
  if (start > end) {
    throw new RangeError(`Line ${lineNumber}: interval start (${start}) must not exceed end (${end})`);
  }
  return new ClosedInterval(start, end);
}

function parsePairLine(trimmed: string, lineNumber: number, pairNumber: number): AssignmentPair {
  const match = PAIR_LINE_RE.exec(trimmed);
  if (!match) {
    throw new RangeError(`Line ${lineNumber}: expected "a-b,c-d" with non-negative integers, got "${trimmed}"`);
  }
  const first = parseIntervalAtLine(match[1]!, match[2]!, lineNumber);
  const second = parseIntervalAtLine(match[3]!, match[4]!, lineNumber);
  return new AssignmentPair(pairNumber, first, second);
}

/** Immutable pair of closed section intervals with dynamically derived relationship getters. */
export class AssignmentPair {
  readonly pairNumber: number;
  readonly first: ClosedInterval;
  readonly second: ClosedInterval;

  constructor(pairNumber: number, first: ClosedInterval, second: ClosedInterval) {
    if (!Number.isSafeInteger(pairNumber) || pairNumber < 1) {
      throw new RangeError(`pairNumber must be a positive safe integer, got ${pairNumber}`);
    }
    this.pairNumber = pairNumber;
    this.first = first;
    this.second = second;
    Object.freeze(this);
  }

  get relation(): PairRelation {
    return classifyRelation(this.first, this.second);
  }

  get hasFullContainment(): boolean {
    return containsInterval(this.first, this.second) || containsInterval(this.second, this.first);
  }

  get hasOverlap(): boolean {
    return overlaps(this.first, this.second);
  }

  get overlapInterval(): ClosedInterval | null {
    return intersection(this.first, this.second);
  }
}

/** Parses `LF`/`CRLF` assignment-pair lines into a frozen array, skipping blank lines. */
export function parseAssignmentPairs(raw: string): readonly AssignmentPair[] {
  const lines = raw.split(/\r?\n/);
  const pairs: AssignmentPair[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i]!.trim();
    if (trimmed === '') continue;
    pairs.push(parsePairLine(trimmed, i + 1, pairs.length + 1));
  }
  if (pairs.length === 0) {
    throw new RangeError('Input must contain at least one assignment pair');
  }
  return Object.freeze(pairs);
}
