import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import type { CavernPolicy, RiskGrid } from './cavern';
import { parseRiskGrid } from './parser';
import { findLowestRiskPath, type CavernPathResult } from './pathfinder';
import { traceCavernPath, type CavernTraceFrame } from './trace';

/** Parameterizable solver for 2021 Day 15 Chiton (Part 1 = 1x, Part 2 = 5x). */
export class CavernRiskSolver
  implements Required<PuzzleSolver<RiskGrid, number, CavernTraceFrame>>
{
  readonly policy: CavernPolicy;

  constructor(policy: CavernPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): RiskGrid {
    return parseRiskGrid(raw);
  }

  analyze(input: RiskGrid): CavernPathResult {
    return findLowestRiskPath(input.expand(this.policy));
  }

  solve(input: RiskGrid): number {
    return this.analyze(input).totalRisk;
  }

  trace(input: RiskGrid, options?: TraceOptions): readonly CavernTraceFrame[] {
    return traceCavernPath(this.analyze(input), options);
  }

  formatAnswer(answer: number): string {
    return String(answer);
  }
}
