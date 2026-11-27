import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { assembleGrid } from './assembler';
import { type JigsawPuzzle, parseTiles } from './parser';
import type { JigsawPolicy } from './policies';
import { type JigsawTraceFrame, traceJigsaw } from './trace';

/** Policy-parameterized solver for AoC 2020 Day 20 Parts 1 and 2. */
export class JigsawSolver implements PuzzleSolver<JigsawPuzzle, bigint, JigsawTraceFrame> {
  readonly policy: JigsawPolicy;

  constructor(policy: JigsawPolicy) {
    this.policy = policy;
  }

  parse(raw: string): JigsawPuzzle {
    return parseTiles(raw);
  }

  solve(input: JigsawPuzzle): bigint {
    return this.policy.evaluate(assembleGrid(input));
  }

  trace(input: JigsawPuzzle, options?: TraceOptions): readonly JigsawTraceFrame[] {
    return traceJigsaw(input, this.policy.mode, options);
  }
}
