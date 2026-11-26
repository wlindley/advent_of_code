import { DirectedGraph } from '../../../shared/core';
import type { PartRating } from './partRating';
import type { RatingBox } from './ratingBox';
import { ENTRY_WORKFLOW, isTerminalOutcome, type TerminalOutcome, type WorkflowTarget } from './types';
import type { ConditionalRule, Workflow } from './workflow';

export interface RouteStep {
  readonly workflowName: string;
  readonly matchedRule: ConditionalRule | null;
  readonly nextTarget: WorkflowTarget;
}

export interface PartRoute {
  readonly part: PartRating;
  readonly steps: readonly RouteStep[];
  readonly outcome: TerminalOutcome;
}

interface BoxFrame {
  readonly target: WorkflowTarget;
  readonly box: RatingBox;
}

function buildWorkflowMap(workflows: Iterable<Workflow>): ReadonlyMap<string, Workflow> {
  const map = new Map<string, Workflow>();
  for (const wf of workflows) {
    if (map.has(wf.name)) {
      throw new Error(`Duplicate workflow name: "${wf.name}"`);
    }
    map.set(wf.name, wf);
  }
  if (!map.has(ENTRY_WORKFLOW)) {
    throw new Error(`Missing required entry workflow "${ENTRY_WORKFLOW}"`);
  }
  return map;
}

function validateWorkflowGraph(map: ReadonlyMap<string, Workflow>): void {
  const edges: Array<readonly [string, readonly string[]]> = [];
  for (const wf of map.values()) {
    const nonTerminal: string[] = [];
    for (const target of wf.targets) {
      if (!isTerminalOutcome(target)) {
        if (!map.has(target)) {
          throw new Error(`Unknown target workflow "${target}" referenced by "${wf.name}"`);
        }
        nonTerminal.push(target);
      }
    }
    edges.push([wf.name, nonTerminal]);
  }
  // DirectedGraph checks cycle-freedom across all reachable and unreachable workflows.
  new DirectedGraph(edges).topologicalOrder();
}

function pushReversed(stack: BoxFrame[], transitions: readonly BoxFrame[]): void {
  for (let i = transitions.length - 1; i >= 0; i -= 1) {
    stack.push(transitions[i]!);
  }
}

function applyWorkflowToBox(workflow: Workflow, initialBox: RatingBox, stack: BoxFrame[]): void {
  const transitions: BoxFrame[] = [];
  let remaining: RatingBox | null = initialBox;
  for (const rule of workflow.rules) {
    const { matched, remaining: nextRemaining } = remaining.split(rule);
    if (matched !== null) transitions.push({ target: rule.target, box: matched });
    // Short-circuit immediately once no ratings remain for subsequent rules or fallback.
    if (nextRemaining === null) {
      pushReversed(stack, transitions);
      return;
    }
    remaining = nextRemaining;
  }
  transitions.push({ target: workflow.fallback, box: remaining });
  pushReversed(stack, transitions);
}

/** Validated acyclic system of AoC 2023 Day 19 workflows rooted at `'in'`. */
export class WorkflowSystem {
  private readonly workflows: ReadonlyMap<string, Workflow>;

  constructor(workflows: Iterable<Workflow>) {
    const map = buildWorkflowMap(workflows);
    validateWorkflowGraph(map);
    this.workflows = map;
    Object.freeze(this);
  }

  /** Number of workflows in this system. */
  get size(): number {
    return this.workflows.size;
  }

  /** Looks up a workflow by name or throws if absent. */
  workflow(name: string): Workflow {
    const wf = this.workflows.get(name);
    if (!wf) throw new Error(`Unknown workflow: "${name}"`);
    return wf;
  }

  /** Traces the exact routing path of a single part from `'in'` to `'A'` or `'R'`. */
  routePart(part: PartRating): PartRoute {
    let current: WorkflowTarget = ENTRY_WORKFLOW;
    const steps: RouteStep[] = [];
    while (!isTerminalOutcome(current)) {
      const wf = this.workflow(current);
      const matchedRule = wf.matchRule(part);
      const nextTarget = matchedRule ? matchedRule.target : wf.fallback;
      steps.push(Object.freeze({ workflowName: wf.name, matchedRule, nextTarget }));
      current = nextTarget;
    }
    return Object.freeze({ part, steps: Object.freeze(steps), outcome: current });
  }

  /** Returns true when `part` routes to terminal acceptance `'A'`. */
  isAccepted(part: PartRating): boolean {
    return this.routePart(part).outcome === 'A';
  }

  /** Partitions `initialBox` through the workflow DAG and returns all disjoint accepted sub-boxes. */
  collectAcceptedBoxes(initialBox: RatingBox): readonly RatingBox[] {
    const accepted: RatingBox[] = [];
    const stack: BoxFrame[] = [{ target: ENTRY_WORKFLOW, box: initialBox }];
    while (stack.length > 0) {
      const frame = stack.pop()!;
      if (frame.target === 'A') {
        accepted.push(frame.box);
      } else if (frame.target !== 'R') {
        applyWorkflowToBox(this.workflow(frame.target), frame.box, stack);
      }
    }
    return Object.freeze(accepted);
  }

  /** Computes the exact BigInt number of accepted integer combinations inside `initialBox`. */
  countAcceptedCombinations(initialBox: RatingBox): bigint {
    let total = 0n;
    for (const box of this.collectAcceptedBoxes(initialBox)) {
      total += box.volume;
    }
    return total;
  }
}
