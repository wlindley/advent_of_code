import { PartRating } from './partRating';
import type { Category, ComparisonOp } from './types';
import { ConditionalRule, Workflow } from './workflow';
import { WorkflowSystem } from './workflowSystem';

export interface AplentyInput {
  readonly system: WorkflowSystem;
  readonly parts: readonly PartRating[];
}

const WORKFLOW_LINE_RE = /^([a-z]+)\{([^}]+)\}$/;
const RULE_RE = /^([xmas])([<>])([1-9]\d*):(A|R|[a-z]+)$/;
const PART_LINE_RE = /^\{x=([1-9]\d*),m=([1-9]\d*),a=([1-9]\d*),s=([1-9]\d*)\}$/;

function parseRule(clause: string, line: string): ConditionalRule {
  const match = RULE_RE.exec(clause);
  if (!match) {
    throw new Error(`Invalid workflow rule "${clause}" in "${line}"`);
  }
  return new ConditionalRule(
    match[1] as Category,
    match[2] as ComparisonOp,
    Number(match[3]),
    match[4]!,
  );
}

function parseWorkflowLine(line: string): Workflow {
  const match = WORKFLOW_LINE_RE.exec(line);
  if (!match) {
    throw new Error(`Invalid workflow line: "${line}"`);
  }
  const clauses = match[2]!.split(',');
  const fallback = clauses.pop()!;
  const rules = clauses.map((clause) => parseRule(clause, line));
  return new Workflow(match[1]!, rules, fallback);
}

function parsePartLine(line: string): PartRating {
  const match = PART_LINE_RE.exec(line);
  if (!match) {
    throw new Error(`Invalid part rating line: "${line}"`);
  }
  return new PartRating({
    x: Number(match[1]),
    m: Number(match[2]),
    a: Number(match[3]),
    s: Number(match[4]),
  });
}

/** Parses the workflow-definition block into a validated `WorkflowSystem`. */
export function parseWorkflowSystem(block: string): WorkflowSystem {
  const lines = block.replace(/\r\n/g, '\n').trim().split('\n');
  return new WorkflowSystem(lines.map(parseWorkflowLine));
}

/** Parses a complete AoC 2023 Day 19 input (workflows block + blank line + parts block). */
export function parseAplentyInput(raw: string): AplentyInput {
  const sections = raw.replace(/\r\n/g, '\n').trim().split(/\n[ \t]*\n/);
  if (sections.length !== 2) {
    throw new Error('Expected workflows and part ratings sections separated by a blank line');
  }
  const system = parseWorkflowSystem(sections[0]!);
  const parts = Object.freeze(sections[1]!.split('\n').map(parsePartLine));
  return Object.freeze({ system, parts });
}
