import { validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { parseTicketDocument, TicketDocument } from './model';
import { DEFAULT_MAX_TRACE_STEPS, type TicketPolicy } from './policies';

/** Policy-parameterized solver for AoC 2020 Day 16 (Ticket Translation). */
export class TicketTranslationSolver<TTrace>
  implements PuzzleSolver<TicketDocument, bigint, TTrace>
{
  readonly policy: TicketPolicy<TTrace>;

  constructor(policy: TicketPolicy<TTrace>) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): TicketDocument {
    return parseTicketDocument(raw);
  }

  solve(input: TicketDocument): bigint {
    return this.policy.solve(input);
  }

  trace(input: TicketDocument, options?: TraceOptions): readonly TTrace[] {
    const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    return this.policy.trace(input, maxSteps);
  }
}
