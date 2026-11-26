import { describe, expect, it } from 'vitest';
import {
  analyzeDesign,
  analyzeLayout,
  countPossibleDesigns,
  countTotalArrangements,
} from './dp';
import { parseLinenLayout } from './parser';
import { PatternTrie } from './trie';

const EXAMPLE_INPUT = [
  'r, wr, b, g, bwu, rb, gb, br',
  '',
  'brwrr',
  'bggr',
  'gbbr',
  'rrbgbr',
  'ubwu',
  'bwurrg',
  'brgr',
  'bbrgwb',
].join('\n');

describe('DP linen design solver', () => {
  it('solves the official example layout for way counts, witnesses, possible count, and total ways', () => {
    const layout = parseLinenLayout(EXAMPLE_INPUT);
    const analyses = analyzeLayout(layout);

    expect(analyses.map((a) => a.wayCount)).toEqual([2n, 1n, 4n, 6n, 0n, 1n, 2n, 0n]);
    expect(analyses.map((a) => a.possible)).toEqual([true, true, true, true, false, true, true, false]);
    expect(analyses[4]!.witnessDecomposition).toBeNull();
    expect(analyses[0]!.witnessDecomposition?.join('')).toBe('brwrr');
    expect(countPossibleDesigns(layout)).toBe(6);
    expect(countTotalArrangements(layout)).toBe(16n);
  });

  it('handles empty tries, blocked suffixes, and invalid designs', () => {
    const emptyTrie = PatternTrie.fromPatterns([]);
    const blocked = analyzeDesign(emptyTrie, 'r');
    expect(blocked.possible).toBe(false);
    expect(blocked.wayCount).toBe(0n);
    expect(blocked.furthestReachable).toBe(0);
    expect(blocked.witnessDecomposition).toBeNull();

    const partialTrie = PatternTrie.fromPatterns(['w', 'wu']);
    const stalled = analyzeDesign(partialTrie, 'wug');
    expect(stalled.possible).toBe(false);
    expect(stalled.furthestReachable).toBe(2);

    expect(() => analyzeDesign(partialTrie, '')).toThrow(RangeError);
    expect(() => analyzeDesign(partialTrie, 'wx')).toThrow(RangeError);
  });
});
