import { sampleTraceIndices } from '../../../shared/core';
import type { BinaryExpr, EvalStepSink } from './ast';
import type { HomeworkProgram, ParsedExpression } from './parser';

export interface OperationTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly expressionIndex: number;
  readonly expressionCount: number;
  readonly expression: ParsedExpression;
  readonly activeNodeId: string;
  readonly operationLabel: string;
  readonly stepResult: bigint;
  readonly expressionComplete: boolean;
  readonly cumulativeSum: bigint;
  readonly nodeValues: Readonly<Record<string, bigint>>;
}

interface TraceRunContext {
  readonly expressionCount: number;
  readonly totalSteps: number;
  readonly sampledIndices: readonly number[];
  readonly frames: OperationTraceFrame[];
}

class ExpressionTraceCollector implements EvalStepSink {
  private readonly ctx: TraceRunContext;
  private readonly expression: ParsedExpression;
  private readonly expressionIndex: number;
  private readonly priorSum: bigint;
  private readonly values: Record<string, bigint> = {};
  private opCursor = 0;
  private globalStep: number;
  sampleCursor: number;

  constructor(
    ctx: TraceRunContext,
    expression: ParsedExpression,
    expressionIndex: number,
    priorSum: bigint,
    startStep: number,
    sampleCursor: number,
  ) {
    this.ctx = ctx;
    this.expression = expression;
    this.expressionIndex = expressionIndex;
    this.priorSum = priorSum;
    this.globalStep = startStep;
    this.sampleCursor = sampleCursor;
  }

  recordValue(nodeId: string, value: bigint): void {
    this.values[nodeId] = value;
  }

  onBinaryOp(node: BinaryExpr, leftValue: bigint, rightValue: bigint, result: bigint): void {
    const stepIndex = this.globalStep;
    this.globalStep += 1;
    this.opCursor += 1;
    const expressionComplete = this.opCursor === this.expression.root.binaryOpCount;
    if (stepIndex !== this.ctx.sampledIndices[this.sampleCursor]) return;
    this.sampleCursor += 1;
    this.pushFrame(
      stepIndex,
      node.id,
      `${leftValue} ${node.operator} ${rightValue} = ${result}`,
      result,
      expressionComplete,
      expressionComplete ? this.priorSum + result : this.priorSum,
    );
  }

  emitZeroOp(result: bigint): void {
    const stepIndex = this.globalStep;
    this.sampleCursor += 1;
    this.pushFrame(
      stepIndex,
      this.expression.root.id,
      `${this.expression.source} = ${result}`,
      result,
      true,
      this.priorSum + result,
    );
  }

  private pushFrame(
    stepIndex: number,
    activeNodeId: string,
    operationLabel: string,
    stepResult: bigint,
    expressionComplete: boolean,
    cumulativeSum: bigint,
  ): void {
    this.ctx.frames.push(
      Object.freeze({
        stepIndex,
        totalSteps: this.ctx.totalSteps,
        expressionIndex: this.expressionIndex,
        expressionCount: this.ctx.expressionCount,
        expression: this.expression,
        activeNodeId,
        operationLabel,
        stepResult,
        expressionComplete,
        cumulativeSum,
        nodeValues: Object.freeze({ ...this.values }),
      }),
    );
  }
}

/** Collects uniformly sampled post-order evaluation trace frames bounded by `maxSteps`. */
export function traceHomework(program: HomeworkProgram, maxSteps: number): readonly OperationTraceFrame[] {
  const totalSteps = program.totalSteps;
  const sampledIndices = sampleTraceIndices(totalSteps, maxSteps);
  const frames: OperationTraceFrame[] = [];
  const ctx: TraceRunContext = { expressionCount: program.expressions.length, totalSteps, sampledIndices, frames };
  let sampleCursor = 0;
  let globalStep = 0;
  let cumulativeSum = 0n;

  for (let idx = 0; idx < program.expressions.length; idx += 1) {
    const expr = program.expressions[idx]!;
    const exprSteps = Math.max(1, expr.root.binaryOpCount);
    const exprEnd = globalStep + exprSteps - 1;
    if (sampledIndices[sampleCursor]! > exprEnd) {
      cumulativeSum += expr.root.evaluate();
      globalStep += exprSteps;
      continue;
    }
    const collector = new ExpressionTraceCollector(ctx, expr, idx, cumulativeSum, globalStep, sampleCursor);
    const value = expr.root.collectSteps(collector);
    if (expr.root.binaryOpCount === 0) collector.emitZeroOp(value);
    sampleCursor = collector.sampleCursor;
    cumulativeSum += value;
    globalStep += exprSteps;
  }
  return Object.freeze(frames);
}
