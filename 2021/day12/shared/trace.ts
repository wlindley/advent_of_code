import { validateMaxSteps, type TraceOptions } from '../../../shared/core';
import { classifyCave, END_CAVE, START_CAVE, type CaveSystem } from './cave';
import type { CaveVisitPolicy } from './policy';

/** Default maximum number of frames captured by `captureCaveTrace`. */
export const DEFAULT_TRACE_MAX_STEPS = 120;

export type CaveTraceStatus = 'exploring' | 'path-found' | 'summary';

export interface CaveTraceFrame {
  readonly step: number;
  readonly status: CaveTraceStatus;
  readonly path: readonly string[];
  readonly discoveredPaths: number;
  readonly totalPaths: bigint;
  readonly truncated: boolean;
}

interface TraceContext {
  readonly system: CaveSystem;
  readonly policy: CaveVisitPolicy;
  readonly dfsBudget: number;
  readonly totalPaths: bigint;
  readonly frames: CaveTraceFrame[];
  readonly path: string[];
  readonly visitedSmall: Set<string>;
  discoveredPaths: number;
  truncated: boolean;
}

function createFrame(ctx: TraceContext, status: CaveTraceStatus): CaveTraceFrame {
  return Object.freeze({
    step: ctx.frames.length,
    status,
    path: Object.freeze(ctx.path.slice()),
    discoveredPaths: ctx.discoveredPaths,
    totalPaths: ctx.totalPaths,
    truncated: ctx.truncated,
  });
}

function visitNeighbor(ctx: TraceContext, next: string, revisitBudget: number): void {
  if (classifyCave(next) === 'small') {
    const alreadyVisited = ctx.visitedSmall.has(next);
    const nextBudget = ctx.policy.enterSmallCave(revisitBudget, alreadyVisited);
    if (nextBudget < 0) return;
    if (!alreadyVisited) ctx.visitedSmall.add(next);
    ctx.path.push(next);
    dfsTrace(ctx, next, nextBudget);
    ctx.path.pop();
    if (!alreadyVisited) ctx.visitedSmall.delete(next);
    return;
  }
  ctx.path.push(next);
  dfsTrace(ctx, next, revisitBudget);
  ctx.path.pop();
}

function dfsTrace(ctx: TraceContext, current: string, revisitBudget: number): void {
  if (ctx.frames.length >= ctx.dfsBudget) {
    ctx.truncated = true;
    return;
  }
  if (current === END_CAVE) {
    ctx.discoveredPaths += 1;
    ctx.frames.push(createFrame(ctx, 'path-found'));
    return;
  }
  ctx.frames.push(createFrame(ctx, 'exploring'));
  for (const next of ctx.system.neighborsOf(current)) {
    if (next === START_CAVE) continue;
    visitNeighbor(ctx, next, revisitBudget);
    if (ctx.truncated) break;
  }
}

/** Captures a bounded DFS visualization trace terminated by a `'summary'` frame. */
export function captureCaveTrace(
  system: CaveSystem,
  policy: CaveVisitPolicy,
  totalPaths: bigint,
  options?: TraceOptions,
): readonly CaveTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_TRACE_MAX_STEPS);
  const ctx: TraceContext = {
    system,
    policy,
    dfsBudget: limit - 1,
    totalPaths,
    frames: [],
    path: [START_CAVE],
    visitedSmall: new Set<string>(),
    discoveredPaths: 0,
    truncated: false,
  };
  dfsTrace(ctx, START_CAVE, policy.initialRevisitBudget);
  ctx.frames.push(createFrame(ctx, 'summary'));
  return Object.freeze(ctx.frames);
}
