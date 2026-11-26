/** Canonical rating categories in AoC 2023 Day 19. */
export const CATEGORIES = Object.freeze(['x', 'm', 'a', 's'] as const);

export type Category = (typeof CATEGORIES)[number];
export type ComparisonOp = '<' | '>';
export type TerminalOutcome = 'A' | 'R';
export type WorkflowTarget = TerminalOutcome | string;

export const ENTRY_WORKFLOW = 'in';

const WORKFLOW_NAME_RE = /^[a-z]+$/;

/** Returns true when `target` is a terminal acceptance (`A`) or rejection (`R`) outcome. */
export function isTerminalOutcome(target: string): target is TerminalOutcome {
  return target === 'A' || target === 'R';
}

/** Validates a lowercase alphabetic workflow identifier. */
export function validateWorkflowName(name: string): string {
  if (!WORKFLOW_NAME_RE.test(name)) {
    throw new Error(`Invalid workflow name: "${name}"`);
  }
  return name;
}

/** Validates a workflow target (`A`, `R`, or lowercase workflow name). */
export function validateWorkflowTarget(target: string): WorkflowTarget {
  if (!isTerminalOutcome(target) && !WORKFLOW_NAME_RE.test(target)) {
    throw new Error(`Invalid workflow target: "${target}"`);
  }
  return target;
}

/** Validates that `value` is a positive safe integer (`>= 1`). */
export function validatePositiveInt(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${label} must be a positive safe integer, got ${value}`);
  }
  return value;
}
