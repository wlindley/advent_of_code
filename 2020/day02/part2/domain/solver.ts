import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  countValidPasswords,
  parsePasswordDatabase,
  TOBOGGAN_POLICY,
  tracePasswordAudit,
  type AuditTraceFrame,
  type PasswordDatabase,
} from '../../shared';

export const solver: PuzzleSolver<PasswordDatabase, number, AuditTraceFrame> = {
  parse(raw: string): PasswordDatabase {
    return parsePasswordDatabase(raw);
  },
  solve(database: PasswordDatabase): number {
    return countValidPasswords(database, TOBOGGAN_POLICY);
  },
  trace(database: PasswordDatabase, options?: TraceOptions): readonly AuditTraceFrame[] {
    return tracePasswordAudit(database, TOBOGGAN_POLICY, options?.maxSteps);
  },
};
