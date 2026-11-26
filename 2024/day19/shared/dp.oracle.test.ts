import { describe, expect, it } from 'vitest';
import { analyzeDesign, analyzeLayout, countPossibleDesigns, countTotalArrangements } from './dp';
import { LinenLayout, STRIPE_COLORS } from './model';
import { parseLinenLayout } from './parser';
import { PatternTrie } from './trie';

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/** Independent recursive memoized startsWith DP oracle (no Trie). */
function oracleCountWays(patterns: readonly string[], design: string): bigint {
  const memo = new Map<number, bigint>();
  const solve = (pos: number): bigint => {
    if (pos === design.length) return 1n;
    const cached = memo.get(pos);
    if (cached !== undefined) return cached;
    let total = 0n;
    for (const pattern of patterns) {
      if (design.startsWith(pattern, pos)) {
        total += solve(pos + pattern.length);
      }
    }
    memo.set(pos, total);
    return total;
  };
  return solve(0);
}

/** Independent exhaustive backtracking partition enumerator for short strings. */
function enumeratePartitions(patterns: readonly string[], design: string): string[][] {
  const results: string[][] = [];
  const walk = (pos: number, path: string[]): void => {
    if (pos === design.length) {
      results.push(path.slice());
      return;
    }
    for (const pattern of patterns) {
      if (design.startsWith(pattern, pos)) {
        path.push(pattern);
        walk(pos + pattern.length, path);
        path.pop();
      }
    }
  };
  walk(0, []);
  return results;
}

function randomStripeString(rng: () => number, length: number, alphabetSize: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += STRIPE_COLORS[Math.floor(rng() * alphabetSize)]!;
  }
  return out;
}

describe('DP differential & stress oracles', () => {
  it('matches startsWith memoized oracle across the official example and 30 seeded random layouts', () => {
    const example = parseLinenLayout(
      'r, wr, b, g, bwu, rb, gb, br\n\nbrwrr\nbggr\ngbbr\nrrbgbr\nubwu\nbwurrg\nbrgr\nbbrgwb',
    );
    expect(analyzeLayout(example).map((a) => a.wayCount)).toEqual([2n, 1n, 4n, 6n, 0n, 1n, 2n, 0n]);
    expect(countPossibleDesigns(example)).toBe(6);
    expect(countTotalArrangements(example)).toBe(16n);

    const rng = createRng(20241219);
    for (let trial = 0; trial < 30; trial += 1) {
      const alphabetSize = 2 + Math.floor(rng() * 4);
      const patternSet = new Set<string>();
      const targetPatterns = 4 + Math.floor(rng() * 14);
      while (patternSet.size < targetPatterns) {
        patternSet.add(randomStripeString(rng, 1 + Math.floor(rng() * 5), alphabetSize));
      }
      const patterns = [...patternSet];
      const designs: string[] = [];
      for (let d = 0; d < 8; d += 1) {
        designs.push(randomStripeString(rng, 4 + Math.floor(rng() * 16), alphabetSize));
      }
      const layout = new LinenLayout(patterns, designs);
      const analyses = analyzeLayout(layout);

      for (const analysis of analyses) {
        const expected = oracleCountWays(patterns, analysis.design);
        expect(analysis.wayCount).toBe(expected);
        if (expected > 0n) {
          expect(analysis.witnessDecomposition).not.toBeNull();
          expect(analysis.witnessDecomposition!.every((tile) => patternSet.has(tile))).toBe(true);
          expect(analysis.witnessDecomposition!.join('')).toBe(analysis.design);
        } else {
          expect(analysis.witnessDecomposition).toBeNull();
        }
      }
    }
  });

  it('matches exhaustive partition enumeration on short strings (L <= 12) and verifies witness membership', () => {
    const rng = createRng(9919);
    for (let trial = 0; trial < 15; trial += 1) {
      const patternSet = new Set<string>();
      while (patternSet.size < 6) {
        patternSet.add(randomStripeString(rng, 1 + Math.floor(rng() * 3), 3));
      }
      const patterns = [...patternSet];
      const trie = PatternTrie.fromPatterns(patterns);
      const design = randomStripeString(rng, 4 + Math.floor(rng() * 9), 3);
      const analysis = analyzeDesign(trie, design);
      const allPartitions = enumeratePartitions(patterns, design);

      expect(analysis.wayCount).toBe(BigInt(allPartitions.length));
      if (allPartitions.length > 0) {
        const witnessKey = analysis.witnessDecomposition!.join('|');
        expect(allPartitions.some((p) => p.join('|') === witnessKey)).toBe(true);
      } else {
        expect(analysis.witnessDecomposition).toBeNull();
      }
    }
  });

  it('handles > 2^64 BigInt counts without overflow and detects late dead-end traps', () => {
    const eightPatterns = Array.from({ length: 8 }, (_, idx) => 'w'.repeat(idx + 1));
    const eightTrie = PatternTrie.fromPatterns(eightPatterns);
    const w65 = 'w'.repeat(65);
    const eightAnalysis = analyzeDesign(eightTrie, w65);
    expect(eightAnalysis.wayCount).toBe(oracleCountWays(eightPatterns, w65));
    expect(eightAnalysis.wayCount).toBeGreaterThan(1n << 63n);
    const w66 = 'w'.repeat(66);
    expect(analyzeDesign(eightTrie, w66).wayCount).toBeGreaterThan(1n << 64n);

    const fibPatterns = ['w', 'ww'];
    const fibTrie = PatternTrie.fromPatterns(fibPatterns);
    const w80 = 'w'.repeat(80);
    let a = 1n;
    let b = 1n;
    for (let i = 2; i <= 80; i += 1) {
      const next = a + b;
      a = b;
      b = next;
    }
    const fibAnalysis = analyzeDesign(fibTrie, w80);
    expect(fibAnalysis.wayCount).toBe(b);

    const trapPatterns = ['w', 'ww', 'www', 'wwww'];
    const trapTrie = PatternTrie.fromPatterns(trapPatterns);
    const trapDesign = `${'w'.repeat(60)}u`;
    const trapAnalysis = analyzeDesign(trapTrie, trapDesign);
    expect(trapAnalysis.possible).toBe(false);
    expect(trapAnalysis.wayCount).toBe(0n);
    expect(trapAnalysis.furthestReachable).toBe(60);
    expect(trapAnalysis.witnessDecomposition).toBeNull();
  });
});
