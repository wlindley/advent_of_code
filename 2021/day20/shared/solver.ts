import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { enhanceImage, traceEnhancement } from './enhancer';
import { parseTrenchMap } from './parser';
import type { EnhancementPolicy } from './policy';
import type { TrenchMapInput, TrenchTraceFrame } from './types';

/** Policy-parameterized solver for Advent of Code 2021 Day 20 (Trench Map). */
export class TrenchMapSolver implements PuzzleSolver<TrenchMapInput, number, TrenchTraceFrame> {
  readonly policy: EnhancementPolicy;

  constructor(policy: EnhancementPolicy) {
    this.policy = policy;
  }

  parse(raw: string): TrenchMapInput {
    return parseTrenchMap(raw);
  }

  solve(input: TrenchMapInput): number {
    return enhanceImage(input.image, input.algorithm, this.policy.steps).totalLitPixels;
  }

  trace(input: TrenchMapInput, options?: TraceOptions): readonly TrenchTraceFrame[] {
    return traceEnhancement(input, this.policy.steps, options);
  }

  formatAnswer(answer: number): string {
    return String(answer);
  }
}
