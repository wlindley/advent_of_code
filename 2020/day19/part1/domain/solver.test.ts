import { describe, expect, it } from 'vitest';
import {
  compileCnf,
  countMatchingMessages,
  Grammar,
  type GrammarRule,
  LOOP_PATCHED_GRAMMAR_POLICY,
  parseMonsterMessages,
} from '../../shared';
import { solver } from './index';

const PART1_EXAMPLE = [
  '0: 4 1 5',
  '1: 2 3 | 3 2',
  '2: 4 4 | 5 5',
  '3: 4 5 | 5 4',
  '4: "a"',
  '5: "b"',
  '',
  'ababbb',
  'bababa',
  'abbbab',
  'aaabbb',
  'aaaabbb',
].join('\n');

const PART2_EXAMPLE = [
  '42: 9 14 | 10 1', '9: 14 27 | 1 26', '10: 23 14 | 28 1', '1: "a"',
  '11: 42 31', '5: 1 14 | 15 1', '19: 14 1 | 14 14', '12: 24 14 | 19 1',
  '16: 15 1 | 14 14', '31: 14 17 | 1 13', '6: 14 14 | 1 14', '2: 1 24 | 14 4',
  '0: 8 11', '13: 14 3 | 1 12', '15: 1 | 14', '17: 14 2 | 1 7',
  '23: 25 1 | 22 14', '28: 16 1', '4: 1 1', '20: 14 14 | 1 15',
  '3: 5 14 | 16 1', '27: 1 6 | 14 18', '14: "b"', '21: 14 1 | 1 14',
  '25: 1 1 | 1 14', '22: 14 14', '8: 42', '26: 14 22 | 1 20',
  '18: 15 15', '7: 14 5 | 1 21', '24: 14 1',
  '',
  'abbbbbabbbaaaababbaabbbbabababbbabbbbbbabaaaa',
  'bbabbbbaabaabba',
  'babbbbaabbbbbabbbbbbaabaaabaaa',
  'aaabbbbbbaaaabaababaabababbabaaabbababababaaa',
  'bbbbbbbaaaabbbbaaabbabaaa',
  'bbbababbbbaaaaaaaabbababaaababaabab',
  'ababaaaaaabaaab',
  'ababaaaaabbbaba',
  'baabbaaaabbaaaababbaababb',
  'abbbbabbbbaaaababbbbbbaaaababb',
  'aaaaabbaabaaaaababaa',
  'aaaabbaaaabbaaa',
  'aaaabbaabbaaaaaaabbbabbbaaabbaabaaa',
  'babaaabbbaaabaababbaabababaaab',
  'aabbbbbaabbbaaaaaabbbbbababaaaaabbaaabba',
].join('\n');

function compileAcyclicRegex(grammar: Grammar, ruleId: number): string {
  const rule = grammar.ruleOf(ruleId);
  if (rule.kind === 'terminal') return rule.symbol;
  const parts = rule.alternatives.map((alt) =>
    alt.map((childId) => compileAcyclicRegex(grammar, childId)).join(''),
  );
  return `(?:${parts.join('|')})`;
}

function matches42m31kOracle(
  msg: string,
  re42: RegExp,
  re31: RegExp,
  chunkLen: number,
): boolean {
  if (msg.length % chunkLen !== 0) return false;
  const totalChunks = msg.length / chunkLen;
  if (totalChunks < 3) return false;
  let m = 0;
  while (m < totalChunks && re42.test(msg.slice(m * chunkLen, (m + 1) * chunkLen))) {
    m += 1;
  }
  let k = 0;
  while (m + k < totalChunks && re31.test(msg.slice((m + k) * chunkLen, (m + k + 1) * chunkLen))) {
    k += 1;
  }
  return m + k === totalChunks && k >= 1 && m > k;
}

function nextSeed(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

function generateRandomAcyclicGrammar(seedInit: number): { grammar: Grammar; next: number } {
  let seed = seedInit;
  const rules: GrammarRule[] = [
    { kind: 'terminal', id: 7, symbol: 'a' },
    { kind: 'terminal', id: 8, symbol: 'b' },
  ];
  for (let id = 6; id >= 0; id -= 1) {
    const alts: number[][] = [];
    seed = nextSeed(seed);
    const altCount = 1 + (seed % 2);
    for (let a = 0; a < altCount; a += 1) {
      seed = nextSeed(seed);
      const seqLen = 1 + (seed % 3);
      const seq: number[] = [];
      for (let j = 0; j < seqLen; j += 1) {
        seed = nextSeed(seed);
        seq.push(id + 1 + (seed % (8 - id)));
      }
      alts.push(seq);
    }
    rules.push({ kind: 'sequence', id, alternatives: alts });
  }
  return { grammar: new Grammar(rules), next: seed };
}

describe('2020 Day 19 Part 1 solver', () => {
  it('solves the official Part 1 example and exposes raw policy', () => {
    expect(solver.policy.id).toBe('raw');
    const parsed = solver.parse(PART1_EXAMPLE);
    expect(solver.solve(parsed)).toBe(2);
    const trace = solver.trace(parsed);
    expect(trace.length).toBe(5);
    expect(trace[4]!.cumulativeMatches).toBe(2);
  });

  it('matches official Part 2 example under raw (3) and patched (12) vs 42^m 31^k oracle', () => {
    const parsed = solver.parse(PART2_EXAMPLE);
    expect(solver.solve(parsed)).toBe(3);

    const patchedCnf = compileCnf(LOOP_PATCHED_GRAMMAR_POLICY.apply(parsed.grammar));
    expect(countMatchingMessages(patchedCnf, parsed.messages)).toBe(12);

    const re42 = new RegExp(`^${compileAcyclicRegex(parsed.grammar, 42)}$`);
    const re31 = new RegExp(`^${compileAcyclicRegex(parsed.grammar, 31)}$`);
    const oracleMatches = parsed.messages.filter((m) => matches42m31kOracle(m, re42, re31, 5));
    expect(oracleMatches.length).toBe(12);
  });

  it('agrees with an independent acyclic regex oracle across 30 seeded random grammars', () => {
    let seed = 20201901;
    const candidates: string[] = [];
    for (let i = 0; i < 24; i += 1) {
      seed = nextSeed(seed);
      const len = 1 + (seed % 7);
      let s = '';
      for (let c = 0; c < len; c += 1) {
        seed = nextSeed(seed);
        s += (seed & 1) === 0 ? 'a' : 'b';
      }
      candidates.push(s);
    }

    for (let trial = 0; trial < 30; trial += 1) {
      const { grammar, next } = generateRandomAcyclicGrammar(seed);
      seed = next;
      const re0 = new RegExp(`^${compileAcyclicRegex(grammar, 0)}$`);
      const expected = candidates.filter((msg) => re0.test(msg)).length;
      const rawText = [
        ...grammar.rules.map((r) =>
          r.kind === 'terminal'
            ? `${r.id}: "${r.symbol}"`
            : `${r.id}: ${r.alternatives.map((a) => a.join(' ')).join(' | ')}`,
        ),
        '',
        ...candidates,
      ].join('\n');
      expect(solver.solve(parseMonsterMessages(rawText))).toBe(expected);
    }
  });
});
