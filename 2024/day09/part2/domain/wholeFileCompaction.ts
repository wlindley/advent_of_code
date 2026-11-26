import {
  CompactionMove,
  FreeSpan,
  type CompactionStrategy,
  type DiskMap,
} from '../../shared';
import { LeftmostSpanIndex } from './leftmostSpanIndex';

/** Coalesces adjacent ordered free spans into maximal disjoint spans. */
export function coalesceFreeSpans(freeSpans: readonly FreeSpan[]): readonly FreeSpan[] {
  if (freeSpans.length === 0) return Object.freeze([]);

  const merged: FreeSpan[] = [];
  let start = freeSpans[0]!.start;
  let end = freeSpans[0]!.end;
  for (let i = 1; i < freeSpans.length; i += 1) {
    const span = freeSpans[i]!;
    if (span.start < end) {
      throw new RangeError(`Free spans must be ordered and disjoint (${span.start} < ${end})`);
    }
    if (span.start === end) {
      end = span.end;
    } else {
      merged.push(new FreeSpan(start, end - start));
      start = span.start;
      end = span.end;
    }
  }
  merged.push(new FreeSpan(start, end - start));
  return Object.freeze(merged);
}

/** Plans whole-file compaction moves in descending file ID order via a max-segment tree. */
export function planWholeFileCompaction(disk: DiskMap): readonly CompactionMove[] {
  const coalesced = coalesceFreeSpans(disk.freeSpans);
  if (coalesced.length === 0) return Object.freeze([]);

  const index = new LeftmostSpanIndex(coalesced);
  const moves: CompactionMove[] = [];
  for (let i = disk.files.length - 1; i >= 0; i -= 1) {
    const file = disk.files[i]!;
    if (file.length === 0) continue;
    const toStart = index.claimLeftmost(file.length, file.start);
    if (toStart >= 0) {
      moves.push(new CompactionMove(file.id, file.start, toStart, file.length));
    }
  }
  return Object.freeze(moves);
}

/** Strategy descriptor for AoC 2024 Day 9 Part 2 whole-file compaction. */
export const WHOLE_FILE_COMPACTION_STRATEGY: CompactionStrategy = Object.freeze({
  id: 'whole-file-compaction',
  label: 'Whole-File Compaction',
  plan: planWholeFileCompaction,
});
