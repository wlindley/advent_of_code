import { type PuzzleSolver, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import { compileCnf } from './cnf';
import { countMatchingMessages } from './cyk';
import type { MonsterMessagesInput } from './grammar';
import { parseMonsterMessages } from './parser';
import { DEFAULT_MAX_TRACE_STEPS, type GrammarPolicy } from './policies';
import { type MonsterTraceFrame, traceMessages } from './trace';

/** Shared Monster Messages CYK solver parameterized by a GrammarPolicy. */
export class MonsterMessagesSolver
  implements Required<PuzzleSolver<MonsterMessagesInput, number, MonsterTraceFrame>>
{
  readonly policy: GrammarPolicy;

  constructor(policy: GrammarPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): MonsterMessagesInput {
    return parseMonsterMessages(raw);
  }

  solve(input: MonsterMessagesInput): number {
    const cnf = compileCnf(this.policy.apply(input.grammar));
    return countMatchingMessages(cnf, input.messages);
  }

  trace(input: MonsterMessagesInput, options?: TraceOptions): readonly MonsterTraceFrame[] {
    const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    const cnf = compileCnf(this.policy.apply(input.grammar));
    return traceMessages(cnf, input.messages, limit);
  }
}
