import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  computeCompactedChecksum,
  parseDiskMap,
  sampleCompactionTrace,
  type CompactionTraceFrame,
  type DiskMap,
} from '../../shared';
import { planBlockCompaction } from './blockCompaction';

/** Computes the exact compacted filesystem checksum using block-by-block compaction. */
export function solvePart1(disk: DiskMap): bigint {
  return computeCompactedChecksum(disk, planBlockCompaction(disk));
}

/** Records a bounded step-by-step trace of Part 1 block compaction frames. */
export function tracePart1(disk: DiskMap, options?: TraceOptions): readonly CompactionTraceFrame[] {
  return sampleCompactionTrace(disk, planBlockCompaction(disk), options);
}

/** AoC 2024 Day 9 Part 1 solver contract. */
export const solver: PuzzleSolver<DiskMap, bigint, CompactionTraceFrame> = Object.freeze({
  parse: parseDiskMap,
  solve: solvePart1,
  trace: tracePart1,
});
