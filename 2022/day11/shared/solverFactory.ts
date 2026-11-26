import { type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { KeepAwaySetup } from './setup';
import {
  type KeepAwayRule,
  computeMonkeyBusiness,
  simulateKeepAway,
  validateRuleRounds,
} from './simulation';
import { type KeepAwayTraceFrame, buildKeepAwayTrace } from './trace';

/** Builds an immutable `PuzzleSolver` parameterized by a `KeepAwayRule` strategy. */
export function createKeepAwaySolver(
  rule: KeepAwayRule,
): PuzzleSolver<KeepAwaySetup, bigint, KeepAwayTraceFrame> {
  validateRuleRounds(rule.rounds);
  return Object.freeze({
    parse: (raw: string) => KeepAwaySetup.parse(raw),
    solve: (setup: KeepAwaySetup) => computeMonkeyBusiness(simulateKeepAway(setup, rule)),
    trace: (setup: KeepAwaySetup, options?: TraceOptions) =>
      buildKeepAwayTrace(setup, rule, options),
  });
}
