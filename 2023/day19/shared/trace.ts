import { sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import type { AplentyInput } from './parser';
import { RatingBox } from './ratingBox';
import { ENTRY_WORKFLOW, isTerminalOutcome, type TerminalOutcome, type WorkflowTarget } from './types';
import type { ConditionalRule, Workflow } from './workflow';
import type { WorkflowSystem } from './workflowSystem';

export const DEFAULT_MAX_TRACE_STEPS = 200;
export type TraceMode = 'part-routing' | 'box-split';

export interface WorkflowTraceFrame {
  readonly mode: TraceMode;
  readonly stepIndex: number;
  readonly totalRawSteps: number;
  readonly workflowName: string;
  readonly path: readonly string[];
  readonly activeRule: ConditionalRule | null;
  readonly nextTarget: WorkflowTarget;
  readonly outcome: TerminalOutcome | null;
  readonly box: RatingBox;
  readonly partIndex: number | null;
  readonly partTotal: number | null;
  readonly runningAcceptedSum: number;
  readonly runningAcceptedCombinations: bigint;
}

interface BoxTraceItem {
  readonly target: WorkflowTarget;
  readonly box: RatingBox;
  readonly path: readonly string[];
}

function finalizeTraceFrames(raw: readonly WorkflowTraceFrame[], maxSteps: number): readonly WorkflowTraceFrame[] {
  const total = raw.length;
  return Object.freeze(
    sampleTraceIndices(total, maxSteps).map((idx) => Object.freeze({ ...raw[idx]!, totalRawSteps: total })),
  );
}

function makeFrame(
  mode: TraceMode,
  stepIndex: number,
  workflowName: string,
  path: readonly string[],
  activeRule: ConditionalRule | null,
  nextTarget: WorkflowTarget,
  outcome: TerminalOutcome | null,
  box: RatingBox,
  partIndex: number | null,
  partTotal: number | null,
  runningAcceptedSum: number,
  runningAcceptedCombinations: bigint,
): WorkflowTraceFrame {
  return Object.freeze({
    mode,
    stepIndex,
    totalRawSteps: 0,
    workflowName,
    path: Object.freeze([...path]),
    activeRule,
    nextTarget,
    outcome,
    box,
    partIndex,
    partTotal,
    runningAcceptedSum,
    runningAcceptedCombinations,
  });
}

function pushChildrenReversed(stack: BoxTraceItem[], children: readonly BoxTraceItem[]): void {
  for (let i = children.length - 1; i >= 0; i -= 1) stack.push(children[i]!);
}

function expandBoxWorkflowTrace(
  wf: Workflow,
  initialBox: RatingBox,
  path: readonly string[],
  accepted: bigint,
  raw: WorkflowTraceFrame[],
  stack: BoxTraceItem[],
): void {
  const children: BoxTraceItem[] = [];
  let rem: RatingBox | null = initialBox;
  for (const rule of wf.rules) {
    const { matched, remaining: next } = rem.split(rule);
    raw.push(makeFrame('box-split', raw.length, wf.name, path, rule, rule.target, null, rem, null, null, 0, accepted));
    if (matched !== null) children.push({ target: rule.target, box: matched, path: [...path, rule.target] });
    if (next === null) {
      pushChildrenReversed(stack, children);
      return;
    }
    rem = next;
  }
  raw.push(makeFrame('box-split', raw.length, wf.name, path, null, wf.fallback, null, rem, null, null, 0, accepted));
  children.push({ target: wf.fallback, box: rem, path: [...path, wf.fallback] });
  pushChildrenReversed(stack, children);
}

function appendPartFrames(
  input: AplentyInput,
  partIndex: number,
  runningSum: number,
  raw: WorkflowTraceFrame[],
): number {
  const part = input.parts[partIndex]!;
  const box = RatingBox.fromPart(part);
  const path: string[] = [];
  let sum = runningSum;
  for (const step of input.system.routePart(part).steps) {
    path.push(step.workflowName);
    const outcome = isTerminalOutcome(step.nextTarget) ? step.nextTarget : null;
    if (outcome === 'A') sum += part.total;
    const fullPath = outcome ? [...path, outcome] : path;
    raw.push(makeFrame('part-routing', raw.length, step.workflowName, fullPath, step.matchedRule, step.nextTarget, outcome, box, partIndex, input.parts.length, sum, 0n));
  }
  return sum;
}

/** Builds a bounded trace of single-part routing steps for Part 1 visualization. */
export function buildPartRoutingTrace(input: AplentyInput, options?: TraceOptions): readonly WorkflowTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const raw: WorkflowTraceFrame[] = [];
  let sum = 0;
  for (let i = 0; i < input.parts.length; i += 1) sum = appendPartFrames(input, i, sum, raw);
  return finalizeTraceFrames(raw, maxSteps);
}

/** Builds a bounded trace of 4D hyperrectangle splits for Part 2 visualization. */
export function buildBoxSplitTrace(
  system: WorkflowSystem,
  initialBox: RatingBox,
  options?: TraceOptions,
): readonly WorkflowTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const raw: WorkflowTraceFrame[] = [];
  const stack: BoxTraceItem[] = [{ target: ENTRY_WORKFLOW, box: initialBox, path: [ENTRY_WORKFLOW] }];
  let accepted = 0n;
  while (stack.length > 0) {
    const item = stack.pop()!;
    if (isTerminalOutcome(item.target)) {
      if (item.target === 'A') accepted += item.box.volume;
      raw.push(makeFrame('box-split', raw.length, item.target, item.path, null, item.target, item.target, item.box, null, null, 0, accepted));
    } else {
      expandBoxWorkflowTrace(system.workflow(item.target), item.box, item.path, accepted, raw, stack);
    }
  }
  return finalizeTraceFrames(raw, maxSteps);
}
