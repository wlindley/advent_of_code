import { describe, expect, it } from 'vitest';
import { ApplicableRule, assertPageNumber, PageOrderRule, PageOrderRules } from './rules';

describe('assertPageNumber', () => {
  it('accepts positive safe integers', () => {
    expect(() => assertPageNumber(1, 'page')).not.toThrow();
    expect(() => assertPageNumber(47, 'page')).not.toThrow();
    expect(() => assertPageNumber(Number.MAX_SAFE_INTEGER, 'page')).not.toThrow();
  });

  it('rejects non-positive, fractional, non-finite, and unsafe values', () => {
    for (const bad of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => assertPageNumber(bad, 'page')).toThrow(RangeError);
    }
  });
});

describe('PageOrderRule', () => {
  it('stores frozen before and after page numbers', () => {
    const rule = new PageOrderRule(47, 53);
    expect(rule.before).toBe(47);
    expect(rule.after).toBe(53);
    expect(Object.isFrozen(rule)).toBe(true);
  });

  it('rejects invalid page numbers and self-referential rules', () => {
    expect(() => new PageOrderRule(0, 53)).toThrow(RangeError);
    expect(() => new PageOrderRule(47, -2)).toThrow(RangeError);
    expect(() => new PageOrderRule(47, 47)).toThrow(RangeError);
  });
});

describe('ApplicableRule', () => {
  it('computes dynamic isSatisfied from index order and freezes instance', () => {
    const ok = new ApplicableRule(47, 53, 0, 2);
    const bad = new ApplicableRule(97, 75, 3, 1);
    expect(ok.isSatisfied).toBe(true);
    expect(bad.isSatisfied).toBe(false);
    expect(Object.isFrozen(ok)).toBe(true);
  });

  it('rejects invalid page numbers, equal pages, invalid indices, and equal indices', () => {
    expect(() => new ApplicableRule(0, 53, 0, 1)).toThrow(RangeError);
    expect(() => new ApplicableRule(47, 0, 0, 1)).toThrow(RangeError);
    expect(() => new ApplicableRule(47, 47, 0, 1)).toThrow(RangeError);
    expect(() => new ApplicableRule(47, 53, -1, 1)).toThrow(RangeError);
    expect(() => new ApplicableRule(47, 53, 0, 1.5)).toThrow(RangeError);
    expect(() => new ApplicableRule(47, 53, 2, 2)).toThrow(RangeError);
  });
});

describe('PageOrderRules', () => {
  it('supports empty rulesets and deduplicates identical pairs', () => {
    const empty = new PageOrderRules([]);
    expect(Object.isFrozen(empty)).toBe(true);
    expect(empty.ruleCount).toBe(0);
    expect(empty.mustPrecede(1, 2)).toBe(false);
    expect(empty.isValidOrder([1, 2, 3])).toBe(true);
    expect(empty.applicableRules([1, 2, 3])).toEqual([]);

    const deduped = new PageOrderRules([
      new PageOrderRule(47, 53),
      new PageOrderRule(47, 53),
      new PageOrderRule(47, 13),
    ]);
    expect(deduped.ruleCount).toBe(2);
    expect(deduped.mustPrecede(47, 53)).toBe(true);
    expect(deduped.mustPrecede(47, 99)).toBe(false);
    expect(deduped.mustPrecede(99, 47)).toBe(false);
  });

  it('detects adjacent, sparse non-adjacent, and 2-cycle contradictions', () => {
    const rules = new PageOrderRules([new PageOrderRule(97, 13), new PageOrderRule(47, 53)]);
    expect(rules.isValidOrder([97, 47, 53, 13])).toBe(true);
    expect(rules.isValidOrder([53, 47])).toBe(false);
    expect(rules.isValidOrder([13, 47, 53, 97])).toBe(false);

    const cycle = new PageOrderRules([new PageOrderRule(47, 53), new PageOrderRule(53, 47)]);
    expect(cycle.isValidOrder([47, 53])).toBe(false);
    expect(cycle.isValidOrder([53, 47])).toBe(false);

    const apps = cycle.applicableRules([47, 53]);
    expect(Object.isFrozen(apps)).toBe(true);
    expect(apps).toHaveLength(2);
    expect(apps[0]?.isSatisfied).toBe(true);
    expect(apps[1]?.isSatisfied).toBe(false);
  });

  it('builds inducedGraph with sink nodes, deduplicated pages, and cycles', () => {
    const rules = new PageOrderRules([
      new PageOrderRule(1, 2),
      new PageOrderRule(2, 3),
      new PageOrderRule(3, 1),
      new PageOrderRule(1, 99),
    ]);

    const dag = rules.inducedGraph([1, 2, 99, 1]);
    expect(dag.nodeCount).toBe(3);
    expect(dag.outNeighbors(1)).toEqual([2, 99]);
    expect(dag.outNeighbors(2)).toEqual([]);
    expect(dag.outNeighbors(99)).toEqual([]);
    expect(dag.topologicalOrder()).toEqual([1, 2, 99]);

    const cycleGraph = rules.inducedGraph([1, 2, 3]);
    expect(cycleGraph.edgeCount).toBe(3);
    expect(() => cycleGraph.topologicalOrder()).toThrow('Cycle detected');
  });
});
