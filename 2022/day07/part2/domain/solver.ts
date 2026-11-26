import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { parseFilesystem, type FilesystemTree } from '../../shared';
import {
  DirectoryDeletionTraceFrame,
  REQUIRED_FREE_SPACE,
  TOTAL_DISK_SPACE,
  findSmallestDirectoryToDelete,
  traceDirectoryDeletion,
} from './deletion';

export interface DirectoryDeletionSolver
  extends PuzzleSolver<FilesystemTree, number, DirectoryDeletionTraceFrame> {
  trace(input: FilesystemTree, options?: TraceOptions): readonly DirectoryDeletionTraceFrame[];
}

export const solver: DirectoryDeletionSolver = Object.freeze({
  parse: parseFilesystem,
  solve: findSmallestDirectoryToDelete,
  trace: (tree: FilesystemTree, options?: TraceOptions) =>
    traceDirectoryDeletion(tree, TOTAL_DISK_SPACE, REQUIRED_FREE_SPACE, options),
});
