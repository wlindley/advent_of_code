import { type Rational, sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import { type EqualitySolution, evaluateAllMonkeys, solveEqualitySolution, toExactBigInt } from './evaluator';
import { type MonkeyRiddle } from './riddle';

export const DEFAULT_TRACE_MAX_STEPS = 120;
export const MAX_FOCUSED_NODES = 15;
export type TraceNodeRole = 'root' | 'unknown' | 'active' | 'resolved' | 'pending' | 'constant';

export interface TraceNodeView {
  readonly name: string; readonly label: string;
  readonly depth: number; readonly lane: number; readonly laneCount: number;
  readonly role: TraceNodeRole; readonly valueText: string; readonly opText: string;
}

export interface TraceEdgeView {
  readonly from: string; readonly to: string;
  readonly side: 'left' | 'right'; readonly highlighted: boolean;
}

export interface MonkeyTraceFrame {
  readonly mode: 'evaluate' | 'equality';
  readonly stepIndex: number; readonly totalSteps: number;
  readonly reachableCount: number; readonly resolvedCount: number;
  readonly activeName: string | null;
  readonly headline: string; readonly formula: string;
  readonly answerText: string; readonly finalAnswerText: string;
  readonly isSampled: boolean;
  readonly nodes: readonly TraceNodeView[]; readonly edges: readonly TraceEdgeView[];
}

interface NodeStyle { readonly role: TraceNodeRole; readonly valueText: string; }

function buildParentMap(riddle: MonkeyRiddle, rootName: string): ReadonlyMap<string, string> {
  const parents = new Map<string, string>();
  const queue = [rootName];
  for (let head = 0; head < queue.length; head += 1) {
    const job = riddle.require(queue[head]!);
    if (job.kind !== 'op') continue;
    for (const child of [job.left, job.right]) {
      if (!parents.has(child)) { parents.set(child, job.name); queue.push(child); }
    }
  }
  return parents;
}

function collectBfsWindow(riddle: MonkeyRiddle, topAnchor: string, maxNodes: number): ReadonlySet<string> {
  const picked = new Set<string>([topAnchor]);
  const queue = [topAnchor];
  for (let head = 0; head < queue.length && picked.size < maxNodes; head += 1) {
    const job = riddle.require(queue[head]!);
    if (job.kind !== 'op') continue;
    for (const child of [job.left, job.right]) {
      if (!picked.has(child) && picked.size < maxNodes) { picked.add(child); queue.push(child); }
    }
  }
  return picked;
}

function collectLevelsAndEdges(
  riddle: MonkeyRiddle, topAnchor: string, focus: ReadonlySet<string>, activeName: string | null,
): { readonly levels: readonly (readonly string[])[]; readonly edges: readonly TraceEdgeView[] } {
  const depthMap = new Map<string, number>([[topAnchor, 0]]);
  const levels: string[][] = [];
  const queue = [topAnchor];
  const edges: TraceEdgeView[] = [];
  for (let head = 0; head < queue.length; head += 1) {
    const name = queue[head]!;
    const depth = depthMap.get(name)!;
    (levels[depth] ??= []).push(name);
    const job = riddle.require(name);
    if (job.kind !== 'op') continue;
    for (const [side, child] of [['left', job.left], ['right', job.right]] as const) {
      if (!focus.has(child)) continue;
      edges.push(Object.freeze({ from: name, to: child, side, highlighted: name === activeName || child === activeName }));
      if (!depthMap.has(child)) { depthMap.set(child, depth + 1); queue.push(child); }
    }
  }
  return { levels, edges: Object.freeze(edges) };
}

function buildLayout(
  riddle: MonkeyRiddle, topAnchor: string, focus: ReadonlySet<string>, activeName: string | null,
  equalityRoot: string | null, styles: ReadonlyMap<string, NodeStyle>,
): { readonly nodes: readonly TraceNodeView[]; readonly edges: readonly TraceEdgeView[] } {
  const { levels, edges } = collectLevelsAndEdges(riddle, topAnchor, focus, activeName);
  const nodes: TraceNodeView[] = [];
  for (let depth = 0; depth < levels.length; depth += 1) {
    const row = levels[depth]!;
    for (let lane = 0; lane < row.length; lane += 1) {
      const name = row[lane]!;
      const job = riddle.require(name);
      const opText = name === equalityRoot ? '=' : job.kind === 'literal' ? '#' : job.op;
      const style = styles.get(name)!;
      nodes.push(Object.freeze({ name, label: `${name}: ${job.kind === 'literal' ? style.valueText : opText}`, depth, lane, laneCount: row.length, role: style.role, valueText: style.valueText, opText }));
    }
  }
  return { nodes: Object.freeze(nodes), edges };
}

function buildEvalFrame(
  riddle: MonkeyRiddle, rootName: string, order: readonly string[], values: ReadonlyMap<string, Rational>,
  parents: ReadonlyMap<string, string>, rawIdx: number, stepIndex: number, totalSteps: number, isSampled: boolean,
): MonkeyTraceFrame {
  const resolved = new Set(order.slice(0, rawIdx));
  const activeName = rawIdx === 0 ? null : order[rawIdx - 1]!;
  let topAnchor = activeName ?? rootName;
  if (order.length <= MAX_FOCUSED_NODES) topAnchor = rootName;
  else for (let h = 0; h < 2; h += 1) topAnchor = parents.get(topAnchor) ?? topAnchor;
  const focus = collectBfsWindow(riddle, topAnchor, MAX_FOCUSED_NODES);
  const styles = new Map<string, NodeStyle>();
  for (const name of focus) styles.set(name, { role: name === activeName ? 'active' : name === rootName ? 'root' : resolved.has(name) ? 'resolved' : 'pending', valueText: resolved.has(name) ? values.get(name)!.toString() : '?' });
  const { nodes, edges } = buildLayout(riddle, topAnchor, focus, activeName, null, styles);
  const job = activeName ? riddle.require(activeName) : null;
  const finalAnswerText = toExactBigInt(values.get(rootName)!).toString();
  const formula = !job ? 'Ready to evaluate bottom-up' : job.kind === 'literal' ? `${job.name} = ${values.get(job.name)!.toString()}` : `${job.name} = ${job.left} (${values.get(job.left)!.toString()}) ${job.op} ${job.right} (${values.get(job.right)!.toString()}) = ${values.get(job.name)!.toString()}`;
  const headline = !job ? 'Initial expression DAG' : job.kind === 'literal' ? `Monkey ${job.name} yells ${values.get(job.name)!.toString()}` : `Evaluate ${job.name}`;
  return Object.freeze({ mode: 'evaluate', stepIndex, totalSteps, reachableCount: order.length, resolvedCount: rawIdx, activeName, headline, formula, answerText: resolved.has(rootName) ? finalAnswerText : '?', finalAnswerText, isSampled, nodes, edges });
}

/** Builds bounded bottom-up evaluation trace frames for Part 1. */
export function buildEvaluationTrace(riddle: MonkeyRiddle, rootName: string, options?: TraceOptions): readonly MonkeyTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_TRACE_MAX_STEPS);
  const order = riddle.reachableBottomUp(rootName);
  const values = evaluateAllMonkeys(riddle, rootName);
  const parents = buildParentMap(riddle, rootName);
  const sampled = sampleTraceIndices(order.length + 1, maxSteps);
  const isSampled = order.length + 1 > maxSteps;
  return Object.freeze(sampled.map((rawIdx, idx) => buildEvalFrame(riddle, rootName, order, values, parents, rawIdx, idx, sampled.length, isSampled)));
}

function buildEqFrame(
  riddle: MonkeyRiddle, rootName: string, unknownName: string, sol: EqualitySolution,
  reachableCount: number, rawIdx: number, stepIndex: number, totalSteps: number, isSampled: boolean,
): MonkeyTraceFrame {
  const finalAnswerText = sol.unknownValue.toString();
  const start = Math.max(0, Math.min(sol.steps.length - 7, Math.max(0, rawIdx - 1) - 3));
  const end = Math.min(sol.steps.length, start + 7);
  const topAnchor = sol.steps.length === 0 ? rootName : sol.steps[start]!.node;
  const focus = new Set<string>(sol.steps.length === 0 ? collectBfsWindow(riddle, rootName, MAX_FOCUSED_NODES) : [topAnchor]);
  for (let k = start; k < end; k += 1) { focus.add(sol.steps[k]!.knownChild); focus.add(sol.steps[k]!.unknownChild); }
  const targets = new Map<string, Rational>();
  for (let k = 0; k < rawIdx; k += 1) targets.set(sol.steps[k]!.unknownChild, sol.steps[k]!.targetAfter);
  const step = rawIdx === 0 || sol.steps.length === 0 ? null : sol.steps[rawIdx - 1]!;
  const activeName = sol.steps.length === 0 ? unknownName : step ? step.unknownChild : rootName;
  const styles = new Map<string, NodeStyle>();
  for (const name of focus) {
    const role: TraceNodeRole = name === unknownName ? 'unknown' : name === activeName ? 'active' : name === rootName ? 'root' : sol.constants.has(name) ? 'constant' : targets.has(name) ? 'resolved' : 'pending';
    styles.set(name, { role, valueText: sol.steps.length === 0 && name === unknownName ? finalAnswerText : sol.constants.get(name)?.toString() ?? targets.get(name)?.toString() ?? '?' });
  }
  const { nodes, edges } = buildLayout(riddle, topAnchor, focus, activeName, rootName, styles);
  const headline = sol.steps.length === 0 ? `Affine solve (${sol.unknownOccurrences} occurrences)` : step ? `Invert ${step.node} (${step.op})` : `Initialize ${rootName} equality`;
  const formula = sol.steps.length === 0 ? `${unknownName} = ${finalAnswerText}` : step ? `${step.unknownChild} = ${step.targetAfter.toString()} (from ${step.node})` : `Equate both sides of ${rootName}`;
  return Object.freeze({ mode: 'equality', stepIndex, totalSteps, reachableCount, resolvedCount: sol.steps.length === 0 ? 1 : rawIdx, activeName, headline, formula, answerText: sol.steps.length === 0 ? finalAnswerText : targets.get(unknownName)?.toString() ?? '?', finalAnswerText, isSampled, nodes, edges });
}

/** Builds bounded equality-inversion trace frames for Part 2. */
export function buildEqualitySolveTrace(riddle: MonkeyRiddle, rootName: string, unknownName: string, options?: TraceOptions): readonly MonkeyTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_TRACE_MAX_STEPS);
  const sol = solveEqualitySolution(riddle, rootName, unknownName);
  const reachableCount = riddle.reachableBottomUp(rootName).length;
  if (sol.steps.length === 0) return Object.freeze([buildEqFrame(riddle, rootName, unknownName, sol, reachableCount, 0, 0, 1, false)]);
  const sampled = sampleTraceIndices(sol.steps.length + 1, maxSteps);
  return Object.freeze(sampled.map((rawIdx, idx) => buildEqFrame(riddle, rootName, unknownName, sol, reachableCount, rawIdx, idx, sampled.length, sol.steps.length + 1 > maxSteps)));
}
