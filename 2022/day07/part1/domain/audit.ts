import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../../shared/core';
import type { DirectoryMetrics, FilesystemTree } from '../../shared';

export const MAX_ELIGIBLE_DIR_SIZE = 100_000;
export const DEFAULT_MAX_TRACE_STEPS = 120;

function assertMaxSize(maxSize: number): void {
  if (!Number.isSafeInteger(maxSize) || maxSize < 0) {
    throw new RangeError(`maxSize must be a non-negative safe integer, got ${maxSize}`);
  }
}

/** Immutable playback snapshot for post-order directory size auditing. */
export class DirectoryAuditTraceFrame {
  readonly directories: readonly DirectoryMetrics[];
  readonly auditedIndex: number;
  readonly threshold: number;
  readonly runningSum: number;
  readonly qualifyingCount: number;
  readonly totalSteps: number;

  constructor(
    directories: readonly DirectoryMetrics[],
    auditedIndex: number,
    threshold: number,
    runningSum: number,
    qualifyingCount: number,
    totalSteps: number,
  ) {
    if (directories.length === 0) {
      throw new Error('DirectoryAuditTraceFrame requires at least one directory');
    }
    if (!Number.isInteger(auditedIndex) || auditedIndex < 0 || auditedIndex >= directories.length) {
      throw new RangeError(`auditedIndex ${auditedIndex} out of bounds [0, ${directories.length - 1}]`);
    }
    this.directories = Object.freeze([...directories]);
    this.auditedIndex = auditedIndex;
    this.threshold = threshold;
    this.runningSum = runningSum;
    this.qualifyingCount = qualifyingCount;
    this.totalSteps = totalSteps;
    Object.freeze(this);
  }

  get current(): DirectoryMetrics {
    return this.directories[this.auditedIndex]!;
  }

  get isQualifying(): boolean {
    return this.current.totalSize <= this.threshold;
  }

  get auditedCount(): number {
    return this.auditedIndex + 1;
  }

  get totalDirectories(): number {
    return this.directories.length;
  }

  get rootTotalSize(): number {
    return this.directories[this.directories.length - 1]!.totalSize;
  }

  get isComplete(): boolean {
    return this.auditedIndex === this.directories.length - 1;
  }
}

/** Sums total sizes of all directories whose recursive size is at most `maxSize`. */
export function sumDirectoriesAtMost(
  tree: FilesystemTree,
  maxSize: number = MAX_ELIGIBLE_DIR_SIZE,
): number {
  assertMaxSize(maxSize);
  let total = 0;
  for (const metrics of tree.collectDirectoryMetrics()) {
    if (metrics.totalSize <= maxSize) {
      total += metrics.totalSize;
    }
  }
  return total;
}

function accumulateAuditTotals(
  directories: readonly DirectoryMetrics[],
  maxSize: number,
): { readonly runningSums: readonly number[]; readonly qualifyingCounts: readonly number[] } {
  const runningSums: number[] = [];
  const qualifyingCounts: number[] = [];
  let sum = 0;
  let count = 0;
  for (const dir of directories) {
    if (dir.totalSize <= maxSize) {
      sum += dir.totalSize;
      count += 1;
    }
    runningSums.push(sum);
    qualifyingCounts.push(count);
  }
  return { runningSums, qualifyingCounts };
}

/** Produces a uniformly sampled sequence of post-order directory audit snapshots. */
export function traceDirectoryAudit(
  tree: FilesystemTree,
  maxSize: number = MAX_ELIGIBLE_DIR_SIZE,
  options?: TraceOptions,
): readonly DirectoryAuditTraceFrame[] {
  assertMaxSize(maxSize);
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const directories = tree.collectDirectoryMetrics();
  const { runningSums, qualifyingCounts } = accumulateAuditTotals(directories, maxSize);
  const indices = sampleTraceIndices(directories.length, limit);
  const frames: DirectoryAuditTraceFrame[] = [];
  for (const idx of indices) {
    frames.push(
      new DirectoryAuditTraceFrame(
        directories,
        idx,
        maxSize,
        runningSums[idx]!,
        qualifyingCounts[idx]!,
        indices.length,
      ),
    );
  }
  return Object.freeze(frames);
}
