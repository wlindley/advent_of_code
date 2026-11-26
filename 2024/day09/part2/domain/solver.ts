import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  computeCompactedChecksum,
  parseDiskMap,
  sampleCompactionTrace,
  type CompactionTraceFrame,
  type DiskMap,
} from '../../shared';
import { planWholeFileCompaction } from './wholeFileCompaction';

/** Computes the exact compacted filesystem checksum using whole-file compaction. */
export function solvePart2(disk: DiskMap): bigint {
  return computeCompactedChecksum(disk, planWholeFileCompaction(disk));
}

/** Records a bounded step-by-step trace of Part 2 whole-file compaction frames. */
export function tracePart2(disk: DiskMap, options?: TraceOptions): readonly CompactionTraceFrame[] {
  return sampleCompactionTrace(disk, planWholeFileCompaction(disk), options);
}

/** AoC 2024 Day 9 Part 2 solver contract. */
export const solver: PuzzleSolver<DiskMap, bigint, CompactionTraceFrame> = Object.freeze({
  parse: parseDiskMap,
  solve: solvePart2,
  trace: tracePart2,
});
