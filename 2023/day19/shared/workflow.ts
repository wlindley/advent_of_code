import type { PartRating } from './partRating';
import {
  type Category,
  type ComparisonOp,
  type WorkflowTarget,
  validatePositiveInt,
  validateWorkflowName,
  validateWorkflowTarget,
} from './types';

/** Immutable conditional branch inside a workflow (`<cat><op><threshold>:<target>`). */
export class ConditionalRule {
  readonly category: Category;
  readonly op: ComparisonOp;
  readonly threshold: number;
  readonly target: WorkflowTarget;

  constructor(
    category: Category,
    op: ComparisonOp,
    threshold: number,
    target: WorkflowTarget,
  ) {
    this.category = category;
    this.op = op;
    this.threshold = validatePositiveInt(threshold, 'Rule threshold');
    this.target = validateWorkflowTarget(target);
    Object.freeze(this);
  }

  /** Evaluates whether the given part strictly satisfies this rule. */
  matches(part: PartRating): boolean {
    const value = part.valueOf(this.category);
    return this.op === '<' ? value < this.threshold : value > this.threshold;
  }

  /** Formats the rule in canonical AoC syntax. */
  format(): string {
    return `${this.category}${this.op}${this.threshold}:${this.target}`;
  }
}

/** Immutable workflow consisting of ordered conditional rules and an unconditional fallback target. */
export class Workflow {
  readonly name: string;
  readonly rules: readonly ConditionalRule[];
  readonly fallback: WorkflowTarget;

  constructor(name: string, rules: readonly ConditionalRule[], fallback: WorkflowTarget) {
    this.name = validateWorkflowName(name);
    this.rules = Object.freeze([...rules]);
    this.fallback = validateWorkflowTarget(fallback);
    Object.freeze(this);
  }

  /** Dynamic list of all outgoing targets in rule evaluation order. */
  get targets(): readonly WorkflowTarget[] {
    return Object.freeze([...this.rules.map((rule) => rule.target), this.fallback]);
  }

  /** Returns the first matching conditional rule, or `null` if fallback applies. */
  matchRule(part: PartRating): ConditionalRule | null {
    for (const rule of this.rules) {
      if (rule.matches(part)) return rule;
    }
    return null;
  }

  /** Evaluates the workflow on a single part and returns the next target. */
  evaluate(part: PartRating): WorkflowTarget {
    return this.matchRule(part)?.target ?? this.fallback;
  }
}
