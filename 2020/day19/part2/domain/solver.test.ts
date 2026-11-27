import { describe, expect, it } from 'vitest';
import { Grammar, type GrammarRule, parseMonsterMessages } from '../../shared';
import { solver } from './index';

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
  'bbabbbbaabaabba', 'babbbbaabbbbbabbbbbbaabaaabaaa',
  'aaabbbbbbaaaabaababaabababbabaaabbababababaaa', 'bbbbbbbaaaabbbbaaabbabaaa',
  'bbbababbbbaaaaaaaabbababaaababaabab', 'ababaaaaaabaaab', 'ababaaaaabbbaba',
  'baabbaaaabbaaaababbaababb', 'abbbbabbbbaaaababbbbbbaaaababb',
  'aaaaabbaabaaaaababaa', 'aaaabbaaaabbaaa', 'aaaabbaabbaaaaaaabbbabbbaaabbaabaaa',
  'babaaabbbaaabaababbaabababaaab', 'aabbbbbaabbbaaaaaabbbbbababaaaaabbaaabba',
].join('\n');

const BOUNDARY_GRAMMAR = '0: 8 11\n8: 42\n11: 42 31\n42: 1 1\n31: 2 2\n1: "a"\n2: "b"';
const OVERLAP_GRAMMAR = '0: 8 11\n8: 42\n11: 42 31\n42: 1 | 1 2\n31: 2 | 1 2\n1: "a"\n2: "b"';

function matchesSeq(
  grammar: Grammar, seq: readonly number[], idx: number,
  msg: string, start: number, end: number, memo: Map<string, boolean>,
): boolean {
  if (idx === seq.length) return start === end;
  for (let split = start + 1; split <= end; split += 1) {
    if (matchesAcyclicSpan(grammar, seq[idx]!, msg, start, split, memo) &&
        matchesSeq(grammar, seq, idx + 1, msg, split, end, memo)) return true;
  }
  return false;
}

function matchesAcyclicSpan(
  grammar: Grammar, ruleId: number, msg: string,
  start: number, end: number, memo: Map<string, boolean>,
): boolean {
  const key = `${ruleId}:${start}:${end}`;
  const cached = memo.get(key);
  if (cached !== undefined) return cached;
  const rule = grammar.ruleOf(ruleId);
  let ok = false;
  if (rule.kind === 'terminal') {
    ok = end - start === 1 && msg[start] === rule.symbol;
  } else {
    for (const seq of rule.alternatives) {
      if (matchesSeq(grammar, seq, 0, msg, start, end, memo)) { ok = true; break; }
    }
  }
  memo.set(key, ok);
  return ok;
}

function matches42m31kOracle(grammar: Grammar, msg: string): boolean {
  const n = msg.length;
  const memo = new Map<string, boolean>();
  const max42 = new Int32Array(n + 1).fill(-1);
  const min31 = new Int32Array(n + 1).fill(n + 1);
  max42[0] = 0;
  min31[n] = 0;
  for (let i = 0; i < n; i += 1) {
    if (max42[i]! < 0) continue;
    for (let j = i + 1; j <= n; j += 1) {
      if (matchesAcyclicSpan(grammar, 42, msg, i, j, memo)) max42[j] = Math.max(max42[j]!, max42[i]! + 1);
    }
  }
  for (let j = n; j > 0; j -= 1) {
    if (min31[j]! > n) continue;
    for (let i = j - 1; i >= 0; i -= 1) {
      if (matchesAcyclicSpan(grammar, 31, msg, i, j, memo)) min31[i] = Math.min(min31[i]!, min31[j]! + 1);
    }
  }
  for (let mid = 1; mid < n; mid += 1) {
    if (min31[mid]! >= 1 && min31[mid]! <= n && max42[mid]! > min31[mid]!) return true;
  }
  return false;
}

function nextSeed(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

function buildSeededGrammar(seedInit: number): { grammar: Grammar; next: number } {
  let seed = seedInit;
  const rules: GrammarRule[] = [
    { kind: 'sequence', id: 0, alternatives: [[8, 11]] },
    { kind: 'sequence', id: 8, alternatives: [[42]] },
    { kind: 'sequence', id: 11, alternatives: [[42, 31]] },
    { kind: 'terminal', id: 1, symbol: 'a' },
    { kind: 'terminal', id: 2, symbol: 'b' },
  ];
  const ids = [42, 31, 3, 4];
  for (let idx = 0; idx < ids.length; idx += 1) {
    const pool = idx < 2 ? [3, 4, 1, 2] : [1, 2];
    const alts: number[][] = [];
    seed = nextSeed(seed);
    const altCount = 1 + (seed % 2);
    for (let a = 0; a < altCount; a += 1) {
      seed = nextSeed(seed);
      const len = 1 + (seed % 2);
      const seq: number[] = [];
      for (let j = 0; j < len; j += 1) { seed = nextSeed(seed); seq.push(pool[seed % pool.length]!); }
      alts.push(seq);
    }
    rules.push({ kind: 'sequence', id: ids[idx]!, alternatives: alts });
  }
  return { grammar: new Grammar(rules), next: seed };
}

describe('2020 Day 19 Part 2 solver', () => {
  it('solves the official 31-rule Part 2 example with loop-patched policy', () => {
    expect(solver.policy.id).toBe('loop-patched');
    expect(solver.solve(solver.parse(PART2_EXAMPLE))).toBe(12);
  });

  it('enforces 42^m 31^k (m > k >= 1) boundaries and rejects invalid forms', () => {
    const accepted = ['aaaabb', 'aaaaaabb', 'aaaaaabbbb'];
    const rejected = ['aa', 'bb', 'aabb', 'aabbbb', 'aaaabbbb', 'aabbaabb'];
    expect(solver.solve(solver.parse(`${BOUNDARY_GRAMMAR}\n\n${accepted.join('\n')}`))).toBe(3);
    expect(solver.solve(solver.parse(`${BOUNDARY_GRAMMAR}\n\n${rejected.join('\n')}`))).toBe(0);
  });

  it('handles variable-length and overlapping 42/31 rules via general CYK', () => {
    const accepted = ['aab', 'aaab', 'abab', 'ababab'];
    const rejected = ['ab', 'abb', 'baab'];
    expect(solver.solve(solver.parse(`${OVERLAP_GRAMMAR}\n\n${accepted.join('\n')}`))).toBe(4);
    expect(solver.solve(solver.parse(`${OVERLAP_GRAMMAR}\n\n${rejected.join('\n')}`))).toBe(0);
  });

  it('agrees with an independent memoized 42^m 31^k CFG oracle on seeded grammars', () => {
    let seed = 20201902;
    const candidates = ['aab', 'aaab', 'ababab', 'abba', 'bbba', 'aaaabb', 'aababb', 'babab'];
    for (let t = 0; t < 20; t += 1) {
      const { grammar, next } = buildSeededGrammar(seed);
      seed = next;
      const expected = candidates.filter((m) => matches42m31kOracle(grammar, m)).length;
      const raw = [
        ...grammar.rules.map((r) =>
          r.kind === 'terminal'
            ? `${r.id}: "${r.symbol}"`
            : `${r.id}: ${r.alternatives.map((a) => a.join(' ')).join(' | ')}`,
        ),
        '',
        ...candidates,
      ].join('\n');
      expect(solver.solve(parseMonsterMessages(raw))).toBe(expected);
    }
  });

  it('produces bounded trace frames with spans and rejects maxSteps <= 0', () => {
    const parsed = solver.parse(PART2_EXAMPLE);
    expect(() => solver.trace(parsed, { maxSteps: 0 })).toThrow(RangeError);
    const frames = solver.trace(parsed, { maxSteps: 4 });
    expect(frames.length).toBe(4);
    expect(frames[3]!.cumulativeMatches).toBe(12);
    const matchedFrame = frames.find((f) => f.analysis.matched)!;
    expect(matchedFrame.analysis.triangleRows.length).toBe(matchedFrame.analysis.message.length);
    expect(matchedFrame.analysis.spans.some((s) => s.role === 'rule42')).toBe(true);
    expect(matchedFrame.analysis.spans.some((s) => s.role === 'rule31')).toBe(true);
  });

  it('throws clear errors when required patch rules or malformed input are given', () => {
    const missing42 = '0: 8 11\n8: 1\n11: 1 31\n31: 2\n1: "a"\n2: "b"\n\nab';
    const missing31 = '0: 8 11\n8: 42\n11: 42 2\n42: 1\n1: "a"\n2: "b"\n\nab';
    expect(() => solver.solve(solver.parse(missing42))).toThrow(/requires rule 42/);
    expect(() => solver.solve(solver.parse(missing31))).toThrow(/requires rule 31/);
    expect(() => solver.parse('invalid')).toThrow();
  });
});
