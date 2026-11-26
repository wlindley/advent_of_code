import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { parseFilesystem, type FilesystemTree } from '../../shared';
import {
  DirectoryAuditTraceFrame,
  MAX_ELIGIBLE_DIR_SIZE,
  sumDirectoriesAtMost,
  traceDirectoryAudit,
} from './audit';

export interface DirectoryAuditSolver
  extends PuzzleSolver<FilesystemTree, number, DirectoryAuditTraceFrame> {
  trace(input: FilesystemTree, options?: TraceOptions): readonly DirectoryAuditTraceFrame[];
}

export const solver: DirectoryAuditSolver = Object.freeze({
  parse: parseFilesystem,
  solve: sumDirectoriesAtMost,
  trace: (tree: FilesystemTree, options?: TraceOptions) =>
    traceDirectoryAudit(tree, MAX_ELIGIBLE_DIR_SIZE, options),
});
