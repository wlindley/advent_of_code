import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  buildBoxSplitTrace,
  parseWorkflowSystem,
  RatingBox,
  type WorkflowSystem,
  type WorkflowTraceFrame,
} from '../../shared';

const INITIAL_RATING_BOX = RatingBox.uniform(1n, 4000n);

function extractWorkflowBlock(raw: string): string {
  const sections = raw.replace(/\r\n/g, '\n').trim().split(/\n[ \t]*\n/);
  if (sections.length > 2) {
    throw new Error('Expected at most two sections separated by a blank line');
  }
  return sections[0]!;
}

/** AoC 2023 Day 19 Part 2 solver: splits `[1..4000]^4` across the workflow DAG to count accepted combinations. */
export const solver: PuzzleSolver<WorkflowSystem, bigint, WorkflowTraceFrame> = {
  parse(raw: string): WorkflowSystem {
    return parseWorkflowSystem(extractWorkflowBlock(raw));
  },

  solve(system: WorkflowSystem): bigint {
    return system.countAcceptedCombinations(INITIAL_RATING_BOX);
  },

  trace(system: WorkflowSystem, options?: TraceOptions): readonly WorkflowTraceFrame[] {
    return buildBoxSplitTrace(system, INITIAL_RATING_BOX, options);
  },
};
