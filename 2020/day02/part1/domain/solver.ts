import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  AuditTraceFrame,
  countValidPasswords,
  parsePasswordDatabase,
  PasswordDatabase,
  SLED_RENTAL_POLICY,
  tracePasswordAudit,
} from '../../shared';

export const solver: PuzzleSolver<PasswordDatabase, number, AuditTraceFrame> = {
  parse(raw: string): PasswordDatabase {
    return parsePasswordDatabase(raw);
  },
  solve(database: PasswordDatabase): number {
    return countValidPasswords(database, SLED_RENTAL_POLICY);
  },
  trace(database: PasswordDatabase, options?: TraceOptions): readonly AuditTraceFrame[] {
    return tracePasswordAudit(database, SLED_RENTAL_POLICY, options?.maxSteps);
  },
};
