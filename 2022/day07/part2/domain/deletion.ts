import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../../shared/core';
import type { DirectoryMetrics, FilesystemTree } from '../../shared';

export const TOTAL_DISK_SPACE = 70_000_000;
export const REQUIRED_FREE_SPACE = 30_000_000;
export const DEFAULT_MAX_TRACE_STEPS = 120;

function assertNonNegativeSafeInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer, got ${value}`);
  }
}

function assertDiskConfig(totalDiskSpace: number, requiredFreeSpace: number, rootTotalSize: number): void {
  assertNonNegativeSafeInt(totalDiskSpace, 'totalDiskSpace');
  assertNonNegativeSafeInt(requiredFreeSpace, 'requiredFreeSpace');
  assertNonNegativeSafeInt(rootTotalSize, 'rootTotalSize');
  if (requiredFreeSpace > totalDiskSpace) {
    throw new RangeError(`requiredFreeSpace (${requiredFreeSpace}) exceeds totalDiskSpace (${totalDiskSpace})`);
  }
  if (rootTotalSize > totalDiskSpace) {
    throw new RangeError(`rootTotalSize (${rootTotalSize}) exceeds totalDiskSpace (${totalDiskSpace})`);
  }
}

function computeNeededSpace(totalDiskSpace: number, requiredFreeSpace: number, rootTotalSize: number): number {
  return Math.max(0, requiredFreeSpace - (totalDiskSpace - rootTotalSize));
}

/** Immutable playback snapshot for post-order directory deletion auditing. */
export class DirectoryDeletionTraceFrame {
  readonly directories: readonly DirectoryMetrics[];
  readonly auditedIndex: number;
  readonly totalDiskSpace: number;
  readonly requiredFreeSpace: number;
  readonly totalSteps: number;

  constructor(
    directories: readonly DirectoryMetrics[],
    auditedIndex: number,
    totalDiskSpace: number,
    requiredFreeSpace: number,
    totalSteps: number,
  ) {
    if (directories.length === 0) {
      throw new Error('DirectoryDeletionTraceFrame requires at least one directory');
    }
    if (!Number.isInteger(auditedIndex) || auditedIndex < 0 || auditedIndex >= directories.length) {
      throw new RangeError(`auditedIndex ${auditedIndex} out of bounds [0, ${directories.length - 1}]`);
    }
    if (!Number.isInteger(totalSteps) || totalSteps < 1) {
      throw new RangeError(`totalSteps must be a positive integer, got ${totalSteps}`);
    }
    assertDiskConfig(totalDiskSpace, requiredFreeSpace, directories[directories.length - 1]!.totalSize);
    this.directories = Object.freeze([...directories]);
    this.auditedIndex = auditedIndex;
    this.totalDiskSpace = totalDiskSpace;
    this.requiredFreeSpace = requiredFreeSpace;
    this.totalSteps = totalSteps;
    Object.freeze(this);
  }

  get current(): DirectoryMetrics {
    return this.directories[this.auditedIndex]!;
  }

  get rootTotalSize(): number {
    return this.directories[this.directories.length - 1]!.totalSize;
  }

  get unusedSpace(): number {
    return this.totalDiskSpace - this.rootTotalSize;
  }

  get neededSpace(): number {
    return computeNeededSpace(this.totalDiskSpace, this.requiredFreeSpace, this.rootTotalSize);
  }

  get isQualifying(): boolean {
    return this.current.totalSize >= this.neededSpace;
  }

  get bestIndex(): number | null {
    const needed = this.neededSpace;
    let bestIdx: number | null = null;
    let bestSize = Infinity;
    for (let i = 0; i <= this.auditedIndex; i += 1) {
      const size = this.directories[i]!.totalSize;
      // Strict `<` preserves the earliest qualifying directory on post-order ties.
      if (size >= needed && size < bestSize) {
        bestSize = size;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  get bestCandidate(): DirectoryMetrics | null {
    const idx = this.bestIndex;
    return idx === null ? null : this.directories[idx]!;
  }

  get bestSize(): number | null {
    const idx = this.bestIndex;
    return idx === null ? null : this.directories[idx]!.totalSize;
  }

  get qualifyingCount(): number {
    const needed = this.neededSpace;
    let count = 0;
    for (let i = 0; i <= this.auditedIndex; i += 1) {
      if (this.directories[i]!.totalSize >= needed) count += 1;
    }
    return count;
  }

  get auditedCount(): number {
    return this.auditedIndex + 1;
  }

  get totalDirectories(): number {
    return this.directories.length;
  }

  get isComplete(): boolean {
    return this.auditedIndex === this.directories.length - 1;
  }
}

/** Finds the smallest directory total size that frees at least `requiredFreeSpace`. */
export function findSmallestDirectoryToDelete(
  tree: FilesystemTree,
  totalDiskSpace: number = TOTAL_DISK_SPACE,
  requiredFreeSpace: number = REQUIRED_FREE_SPACE,
): number {
  const rootTotalSize = tree.totalSize;
  assertDiskConfig(totalDiskSpace, requiredFreeSpace, rootTotalSize);
  const needed = computeNeededSpace(totalDiskSpace, requiredFreeSpace, rootTotalSize);
  // Under valid disk config, 0 <= needed <= rootTotalSize, so root is always a valid initial bound.
  let bestSize = rootTotalSize;
  for (const metrics of tree.collectDirectoryMetrics()) {
    if (metrics.totalSize >= needed && metrics.totalSize < bestSize) {
      bestSize = metrics.totalSize;
    }
  }
  return bestSize;
}

/** Produces a uniformly sampled sequence of post-order directory deletion audit snapshots. */
export function traceDirectoryDeletion(
  tree: FilesystemTree,
  totalDiskSpace: number = TOTAL_DISK_SPACE,
  requiredFreeSpace: number = REQUIRED_FREE_SPACE,
  options?: TraceOptions,
): readonly DirectoryDeletionTraceFrame[] {
  assertDiskConfig(totalDiskSpace, requiredFreeSpace, tree.totalSize);
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const directories = tree.collectDirectoryMetrics();
  const indices = sampleTraceIndices(directories.length, limit);
  const frames: DirectoryDeletionTraceFrame[] = [];
  for (const idx of indices) {
    frames.push(
      new DirectoryDeletionTraceFrame(directories, idx, totalDiskSpace, requiredFreeSpace, indices.length),
    );
  }
  return Object.freeze(frames);
}
