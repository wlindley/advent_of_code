import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { parseSnailfishHomework } from './parser';
import type { SnailfishPolicy } from './policy';
import type { SnailfishHomework } from './snailfish';
import { traceSnailfish, type SnailfishTraceFrame } from './trace';

/** Parameterizable solver for 2021 Day 18 Snailfish (Part 1 = homework sum, Part 2 = max pair). */
export class SnailfishSolver
  implements Required<PuzzleSolver<SnailfishHomework, number, SnailfishTraceFrame>>
{
  constructor(readonly policy: SnailfishPolicy) {
    Object.freeze(this);
  }

  parse(raw: string): SnailfishHomework {
    return parseSnailfishHomework(raw);
  }

  solve(input: SnailfishHomework): number {
    return this.policy.solve(input);
  }

  trace(input: SnailfishHomework, options?: TraceOptions): readonly SnailfishTraceFrame[] {
    return traceSnailfish(input, this.policy, options);
  }

  formatAnswer(answer: number): string {
    return String(answer);
  }
}
