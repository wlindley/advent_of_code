import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import type { CalibrationEquation } from './equation';
import type { CalibrationOperator } from './operator';
import {
  CalibrationTraceFrame,
  EquationTrace,
  SEARCH_NODE_STATUS,
  type PrunedSearchNode,
  type SearchNode,
  type SearchNodeStatus,
  type VisitedSearchNode,
} from './traceModel';

export {
  CalibrationTraceFrame,
  EquationTrace,
  SEARCH_NODE_STATUS,
  type PrunedSearchNode,
  type SearchNode,
  type SearchNodeStatus,
  type VisitedSearchNode,
};

export const DEFAULT_MAX_TRACE_STEPS = 120;
export const DEFAULT_MAX_TREE_NODES = 120;

export interface CalibrationTraceOptions extends TraceOptions {
  readonly maxTreeNodes?: number;
}

function dfsFast(
  operands: readonly bigint[],
  operators: readonly CalibrationOperator[],
  idx: number,
  remaining: bigint,
  witness: CalibrationOperator[],
): boolean {
  if (idx === 0) return remaining === operands[0]!;
  const right = operands[idx]!;
  for (const op of operators) {
    const prev = op.tryInvert(remaining, right);
    if (prev !== null && dfsFast(operands, operators, idx - 1, prev, witness)) {
      witness[idx - 1] = op;
      return true;
    }
  }
  return false;
}

/** Zero-allocation reverse DFS solver returning frozen operator witness or `null`. */
export function solveEquation(
  equation: CalibrationEquation,
  operators: readonly CalibrationOperator[],
): readonly CalibrationOperator[] | null {
  const witness = new Array<CalibrationOperator>(equation.operands.length - 1);
  const ok = dfsFast(equation.operands, operators, equation.operands.length - 1, equation.target, witness);
  return ok ? Object.freeze(witness) : null;
}

type DraftNode = Omit<VisitedSearchNode, 'status'> | PrunedSearchNode;

interface TraceContext {
  readonly operands: readonly bigint[];
  readonly operators: readonly CalibrationOperator[];
  readonly maxNodes: number;
  readonly drafts: DraftNode[];
  readonly winningIds: Set<number>;
  readonly witness: CalibrationOperator[];
  visitedCount: number;
  prunedCount: number;
}

function pushPruned(ctx: TraceContext, parentId: number, idx: number, rem: bigint, op: CalibrationOperator): void {
  ctx.prunedCount += 1;
  if (ctx.drafts.length >= ctx.maxNodes) return;
  ctx.drafts.push(Object.freeze({
    kind: 'pruned',
    id: ctx.drafts.length,
    parentId,
    operandIndex: idx - 1,
    operator: op,
    pruneReason: op.explainPrune(rem, ctx.operands[idx]!),
    status: SEARCH_NODE_STATUS.PRUNED,
  }));
}

function dfsTrace(
  ctx: TraceContext,
  idx: number,
  remaining: bigint,
  parentId: number | null,
  operator: CalibrationOperator | null,
): boolean {
  ctx.visitedCount += 1;
  const nodeId = ctx.drafts.length < ctx.maxNodes ? ctx.drafts.length : null;
  if (nodeId !== null) ctx.drafts.push({ kind: 'visited', id: nodeId, parentId, operandIndex: idx, remaining, operator });
  if (idx === 0) {
    const won = remaining === ctx.operands[0]!;
    if (won && nodeId !== null) ctx.winningIds.add(nodeId);
    return won;
  }
  const right = ctx.operands[idx]!;
  for (const op of ctx.operators) {
    const prev = op.tryInvert(remaining, right);
    if (prev === null) { pushPruned(ctx, nodeId!, idx, remaining, op); continue; }
    if (dfsTrace(ctx, idx - 1, prev, nodeId, op)) {
      ctx.witness[idx - 1] = op;
      if (nodeId !== null) ctx.winningIds.add(nodeId);
      return true;
    }
  }
  return false;
}

/** Traces reverse-DFS pruning for one equation, capping recorded nodes at `maxNodes`. */
export function traceEquation(
  equation: CalibrationEquation,
  operators: readonly CalibrationOperator[],
  maxNodes = DEFAULT_MAX_TREE_NODES,
): EquationTrace {
  const limit = validateMaxSteps(maxNodes, DEFAULT_MAX_TREE_NODES);
  const operands = equation.operands;
  const ctx: TraceContext = {
    operands, operators, maxNodes: limit, drafts: [], winningIds: new Set<number>(),
    witness: new Array<CalibrationOperator>(operands.length - 1), visitedCount: 0, prunedCount: 0,
  };
  const solved = dfsTrace(ctx, operands.length - 1, equation.target, null, null);
  const nodes: SearchNode[] = ctx.drafts.map((node) =>
    node.kind === 'pruned' ? node : Object.freeze({
      ...node, status: ctx.winningIds.has(node.id) ? SEARCH_NODE_STATUS.WINNING : SEARCH_NODE_STATUS.BACKTRACKED,
    }),
  );
  return new EquationTrace(equation, operators.length, solved ? ctx.witness : null, nodes, ctx.visitedCount, ctx.prunedCount);
}

/** Computes total calibration sum of solvable equation targets. */
export function totalCalibrationResult(
  equations: readonly CalibrationEquation[],
  operators: readonly CalibrationOperator[],
): bigint {
  let total = 0n;
  for (const eq of equations) if (solveEquation(eq, operators) !== null) total += eq.target;
  return total;
}

/** Builds a uniformly sampled calibration trace using fast solver on unsampled indices. */
export function traceCalibration(
  equations: readonly CalibrationEquation[],
  operators: readonly CalibrationOperator[],
  options?: CalibrationTraceOptions,
): readonly CalibrationTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const maxTreeNodes = validateMaxSteps(options?.maxTreeNodes, DEFAULT_MAX_TREE_NODES);
  const sampled = sampleTraceIndices(equations.length, maxSteps);
  const frames: CalibrationTraceFrame[] = [];
  let runningTotal = 0n;
  let solvedSoFar = 0;
  let cursor = 0;
  for (let i = 0; i < equations.length; i += 1) {
    const eq = equations[i]!;
    if (i === sampled[cursor]) {
      const trace = traceEquation(eq, operators, maxTreeNodes);
      if (trace.solvable) { runningTotal += eq.target; solvedSoFar += 1; }
      frames.push(new CalibrationTraceFrame(i, equations.length, trace, runningTotal, solvedSoFar));
      cursor += 1;
    } else if (solveEquation(eq, operators) !== null) {
      runningTotal += eq.target;
      solvedSoFar += 1;
    }
  }
  return Object.freeze(frames);
}
