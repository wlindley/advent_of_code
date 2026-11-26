import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { type AplentyInput, buildPartRoutingTrace, parseAplentyInput, type WorkflowTraceFrame } from '../../shared';

/** AoC 2023 Day 19 Part 1 solver: routes parts through the workflow DAG and sums accepted ratings. */
export const solver: PuzzleSolver<AplentyInput, number, WorkflowTraceFrame> = {
  parse(raw: string): AplentyInput {
    return parseAplentyInput(raw);
  },

  solve(input: AplentyInput): number {
    let total = 0;
    for (const part of input.parts) {
      if (input.system.isAccepted(part)) total += part.total;
    }
    return total;
  },

  trace(input: AplentyInput, options?: TraceOptions): readonly WorkflowTraceFrame[] {
    return buildPartRoutingTrace(input, options);
  },
};
