export interface TerminalRule {
  readonly kind: 'terminal';
  readonly id: number;
  readonly symbol: string;
}

export interface SequenceRule {
  readonly kind: 'sequence';
  readonly id: number;
  readonly alternatives: readonly (readonly number[])[];
}

export type GrammarRule = TerminalRule | SequenceRule;

const TERMINAL_PATTERN = /^[a-z]$/;
const MESSAGE_PATTERN = /^[a-z]+$/;

function freezeSequence(seq: readonly number[]): readonly number[] {
  if (seq.length === 0) {
    throw new Error('Sequence alternative cannot be empty');
  }
  return Object.freeze([...seq]);
}

function freezeRule(rule: GrammarRule): GrammarRule {
  if (!Number.isInteger(rule.id) || rule.id < 0) {
    throw new RangeError(`Rule id must be a non-negative integer, got ${rule.id}`);
  }
  if (rule.kind === 'terminal') {
    if (!TERMINAL_PATTERN.test(rule.symbol)) {
      throw new Error(`Invalid terminal symbol '${rule.symbol}' in rule ${rule.id}`);
    }
    return Object.freeze({ kind: 'terminal', id: rule.id, symbol: rule.symbol });
  }
  if (rule.alternatives.length === 0) {
    throw new Error(`Rule ${rule.id} must have at least one alternative`);
  }
  const alts = rule.alternatives.map(freezeSequence);
  return Object.freeze({ kind: 'sequence', id: rule.id, alternatives: Object.freeze(alts) });
}

function validateReferences(
  rules: readonly GrammarRule[],
  ruleMap: ReadonlyMap<number, GrammarRule>,
): void {
  if (!ruleMap.has(0)) {
    throw new Error('Rule 0 is required');
  }
  for (const rule of rules) {
    if (rule.kind !== 'sequence') continue;
    for (const alt of rule.alternatives) {
      for (const refId of alt) {
        if (!ruleMap.has(refId)) {
          throw new Error(`Rule ${rule.id} references missing rule ${refId}`);
        }
      }
    }
  }
}

/** Validated, immutable context-free grammar keyed by non-negative integer rule IDs. */
export class Grammar {
  readonly rules: readonly GrammarRule[];
  private readonly ruleMap: Map<number, GrammarRule>;

  constructor(rules: readonly GrammarRule[]) {
    const map = new Map<number, GrammarRule>();
    for (const raw of rules) {
      const rule = freezeRule(raw);
      if (map.has(rule.id)) {
        throw new Error(`Duplicate rule id ${rule.id}`);
      }
      map.set(rule.id, rule);
    }
    const sorted = [...map.values()].sort((a, b) => a.id - b.id);
    validateReferences(sorted, map);
    this.rules = Object.freeze(sorted);
    this.ruleMap = map;
    Object.freeze(this);
  }

  get ruleCount(): number {
    return this.rules.length;
  }

  hasRule(id: number): boolean {
    return this.ruleMap.has(id);
  }

  ruleOf(id: number): GrammarRule {
    const rule = this.ruleMap.get(id);
    if (!rule) {
      throw new Error(`Unknown rule id ${id}`);
    }
    return rule;
  }

  withOverrides(overrides: readonly GrammarRule[]): Grammar {
    const merged = new Map(this.ruleMap);
    for (const raw of overrides) {
      const rule = freezeRule(raw);
      merged.set(rule.id, rule);
    }
    return new Grammar([...merged.values()]);
  }
}

/** Validated Monster Messages puzzle input pairing a Grammar with candidate messages. */
export class MonsterMessagesInput {
  readonly grammar: Grammar;
  readonly messages: readonly string[];

  constructor(grammar: Grammar, messages: readonly string[]) {
    if (messages.length === 0) {
      throw new Error('At least one message is required');
    }
    for (const msg of messages) {
      if (!MESSAGE_PATTERN.test(msg)) {
        throw new Error(`Invalid message '${msg}': expected lowercase letters`);
      }
    }
    this.grammar = grammar;
    this.messages = Object.freeze([...messages]);
    Object.freeze(this);
  }

  get messageCount(): number {
    return this.messages.length;
  }
}
