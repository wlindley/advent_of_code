import type { Grammar, GrammarRule } from './grammar';

export type GrammarPolicyId = 'raw' | 'loop-patched';

export const DEFAULT_MAX_TRACE_STEPS = 120;

export interface GrammarPolicy {
  readonly id: GrammarPolicyId;
  readonly label: string;
  apply(grammar: Grammar): Grammar;
}

const REQUIRED_PATCH_IDS = [8, 11, 42, 31] as const;

const PATCH_RULES: readonly GrammarRule[] = [
  { kind: 'sequence', id: 8, alternatives: [[42], [42, 8]] },
  { kind: 'sequence', id: 11, alternatives: [[42, 31], [42, 11, 31]] },
];

export const RAW_GRAMMAR_POLICY: GrammarPolicy = Object.freeze({
  id: 'raw',
  label: 'Raw Grammar (Part 1)',
  apply(grammar: Grammar): Grammar {
    return grammar;
  },
});

export const LOOP_PATCHED_GRAMMAR_POLICY: GrammarPolicy = Object.freeze({
  id: 'loop-patched',
  label: 'Loop-Patched Grammar (Part 2)',
  apply(grammar: Grammar): Grammar {
    for (const id of REQUIRED_PATCH_IDS) {
      if (!grammar.hasRule(id)) {
        throw new Error(`Loop-patched policy requires rule ${id}`);
      }
    }
    return grammar.withOverrides(PATCH_RULES);
  },
});
