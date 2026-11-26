import { describe, expect, it } from 'vitest';
import { NO_CHILD, PatternTrie } from './trie';

describe('PatternTrie', () => {
  it('handles empty pattern sets cleanly', () => {
    const trie = PatternTrie.fromPatterns([]);
    expect(Object.isFrozen(trie)).toBe(true);
    expect(trie.nodeCount).toBe(1);
    expect(trie.patternCount).toBe(0);
    expect(trie.maxPatternLength).toBe(0);
    expect(trie.isTerminal(0)).toBe(false);
    expect(trie.has('')).toBe(false);
    expect(trie.has('r')).toBe(false);
  });

  it('builds a prefix-shared trie, deduplicates patterns, and queries membership', () => {
    const trie = PatternTrie.fromPatterns(['w', 'wr', 'w', 'wubrg', 'br']);
    expect(trie.patternCount).toBe(4);
    expect(trie.maxPatternLength).toBe(5);
    expect(trie.nodeCount).toBe(9);

    expect(trie.has('w')).toBe(true);
    expect(trie.has('wr')).toBe(true);
    expect(trie.has('wubrg')).toBe(true);
    expect(trie.has('br')).toBe(true);

    expect(trie.has('')).toBe(false);
    expect(trie.has('wu')).toBe(false);
    expect(trie.has('wx')).toBe(false);
    expect(trie.has('wrr')).toBe(false);
    expect(trie.has('g')).toBe(false);

    const wNode = trie.next(0, 0);
    expect(wNode).toBeGreaterThan(0);
    expect(trie.isTerminal(wNode)).toBe(true);
    expect(trie.next(0, 4)).toBe(NO_CHILD);
  });

  it('rejects invalid patterns during construction and out-of-bounds queries', () => {
    expect(() => PatternTrie.fromPatterns([''])).toThrow(RangeError);
    expect(() => PatternTrie.fromPatterns(['rx'])).toThrow(RangeError);

    const trie = PatternTrie.fromPatterns(['r']);
    expect(() => trie.isTerminal(-1)).toThrow(RangeError);
    expect(() => trie.isTerminal(1.5)).toThrow(RangeError);
    expect(() => trie.isTerminal(trie.nodeCount)).toThrow(RangeError);

    expect(() => trie.next(-1, 0)).toThrow(RangeError);
    expect(() => trie.next(0, -1)).toThrow(RangeError);
    expect(() => trie.next(0, 1.5)).toThrow(RangeError);
    expect(() => trie.next(0, 5)).toThrow(RangeError);
  });
});
