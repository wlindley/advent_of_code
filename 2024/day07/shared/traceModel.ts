import type { CalibrationEquation } from './equation';
import type { CalibrationOperator } from './operator';

export const SEARCH_NODE_STATUS = Object.freeze({
  WINNING: 'winning',
  BACKTRACKED: 'backtracked',
  PRUNED: 'pruned',
} as const);

export type SearchNodeStatus = (typeof SEARCH_NODE_STATUS)[keyof typeof SEARCH_NODE_STATUS];

export interface VisitedSearchNode {
  readonly kind: 'visited';
  readonly id: number;
  readonly parentId: number | null;
  readonly operandIndex: number;
  readonly remaining: bigint;
  readonly operator: CalibrationOperator | null;
  readonly status: 'winning' | 'backtracked';
}

export interface PrunedSearchNode {
  readonly kind: 'pruned';
  readonly id: number;
  readonly parentId: number;
  readonly operandIndex: number;
  readonly operator: CalibrationOperator;
  readonly pruneReason: string;
  readonly status: 'pruned';
}

export type SearchNode = VisitedSearchNode | PrunedSearchNode;

/** Immutable reverse-DFS trace for one equation without stored derived flags. */
export class EquationTrace {
  readonly witness: readonly CalibrationOperator[] | null;
  readonly nodes: readonly SearchNode[];

  constructor(
    readonly equation: CalibrationEquation,
    readonly operatorCount: number,
    witness: readonly CalibrationOperator[] | null,
    nodes: readonly SearchNode[],
    readonly visitedCount: number,
    readonly prunedCount: number,
  ) {
    this.witness = witness ? Object.freeze([...witness]) : null;
    this.nodes = Object.freeze([...nodes]);
    Object.freeze(this);
  }

  get solvable(): boolean {
    return this.witness !== null;
  }

  get truncated(): boolean {
    return this.nodes.length < this.visitedCount + this.prunedCount;
  }

  get naiveCombinations(): bigint {
    return BigInt(this.operatorCount) ** BigInt(this.equation.operands.length - 1);
  }
}

/** Immutable per-equation playback frame with derived `unsolvedSoFar`. */
export class CalibrationTraceFrame {
  constructor(
    readonly equationIndex: number,
    readonly totalEquations: number,
    readonly trace: EquationTrace,
    readonly runningTotal: bigint,
    readonly solvedSoFar: number,
  ) {
    Object.freeze(this);
  }

  get unsolvedSoFar(): number {
    return this.equationIndex + 1 - this.solvedSoFar;
  }
}
