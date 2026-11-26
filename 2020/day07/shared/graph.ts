import { DirectedGraph } from '../../../shared/core';
import { BagRule, parseBagRule } from './rule';

function buildRuleMap(rules: readonly BagRule[]): ReadonlyMap<string, BagRule> {
  if (rules.length === 0) {
    throw new RangeError('BagRuleGraph requires at least one rule');
  }
  const byColor = new Map<string, BagRule>();
  for (const rule of rules) {
    if (byColor.has(rule.color)) {
      throw new Error(`Duplicate outer bag rule for "${rule.color}"`);
    }
    byColor.set(rule.color, rule);
  }
  for (const rule of rules) {
    for (const item of rule.contents) {
      if (!byColor.has(item.color)) {
        throw new Error(`Missing outer bag rule for referenced color "${item.color}"`);
      }
    }
  }
  return byColor;
}

/** Validated immutable collection of bag containment rules. */
export class BagRuleGraph {
  private readonly rulesByColor: ReadonlyMap<string, BagRule>;

  constructor(rules: readonly BagRule[]) {
    this.rulesByColor = buildRuleMap(rules);
    Object.freeze(this);
  }

  get rules(): readonly BagRule[] {
    return Object.freeze([...this.rulesByColor.values()]);
  }

  get colorCount(): number {
    return this.rulesByColor.size;
  }

  ruleFor(color: string): BagRule {
    const rule = this.rulesByColor.get(color);
    if (!rule) {
      throw new RangeError(`No rule defined for bag color "${color}"`);
    }
    return rule;
  }

  reverseAdjacency(): ReadonlyMap<string, readonly string[]> {
    const rev = new Map<string, string[]>();
    for (const color of this.rulesByColor.keys()) {
      rev.set(color, []);
    }
    for (const rule of this.rulesByColor.values()) {
      for (const item of rule.contents) {
        rev.get(item.color)!.push(rule.color);
      }
    }
    return rev;
  }

  reachableDirectedGraph(startColor: string): DirectedGraph<string> {
    this.ruleFor(startColor);
    const entries = new Map<string, readonly string[]>();
    const queue: string[] = [startColor];
    const seen = new Set<string>([startColor]);
    for (let head = 0; head < queue.length; head += 1) {
      const color = queue[head]!;
      const children = this.ruleFor(color).contents.map((item) => item.color);
      entries.set(color, children);
      for (const child of children) {
        if (!seen.has(child)) {
          seen.add(child);
          queue.push(child);
        }
      }
    }
    return new DirectedGraph(entries);
  }
}

/** Parses newline-separated luggage rules into a validated BagRuleGraph. */
export function parseBagRuleGraph(raw: string): BagRuleGraph {
  const rules: BagRule[] = [];
  for (const rawLine of raw.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (trimmed.length > 0) {
      rules.push(parseBagRule(trimmed));
    }
  }
  return new BagRuleGraph(rules);
}
