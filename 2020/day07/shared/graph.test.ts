import { describe, expect, it } from 'vitest';
import { BagRuleGraph, parseBagRuleGraph } from './graph';
import { BagContainment, BagRule } from './rule';

const SAMPLE_RULES = [
  'light red bags contain 1 bright white bag, 2 muted yellow bags.',
  'bright white bags contain 1 shiny gold bag.',
  'muted yellow bags contain 1 shiny gold bag.',
  'shiny gold bags contain 1 dark olive bag, 1 vibrant plum bag.',
  'dark olive bags contain 1 faded blue bag.',
  'vibrant plum bags contain 1 faded blue bag.',
  'faded blue bags contain no other bags.',
].join('\r\n');

describe('BagRuleGraph', () => {
  it('validates non-empty rules, unique outer colors, and defined inner colors', () => {
    expect(() => new BagRuleGraph([])).toThrow(RangeError);
    const leaf = new BagRule('faded blue', []);
    expect(() => new BagRuleGraph([leaf, leaf])).toThrow(Error);
    const dangling = new BagRule('light red', [new BagContainment('missing blue', 1n)]);
    expect(() => new BagRuleGraph([dangling])).toThrow(Error);
  });

  it('exposes frozen rules, colorCount, ruleFor, and complete reverseAdjacency', () => {
    const graph = parseBagRuleGraph(`\n  ${SAMPLE_RULES}  \n\n`);
    expect(Object.isFrozen(graph)).toBe(true);
    expect(Object.isFrozen(graph.rules)).toBe(true);
    expect(graph.colorCount).toBe(7);
    expect(graph.ruleFor('shiny gold').contents.length).toBe(2);
    expect(() => graph.ruleFor('unknown color')).toThrow(RangeError);

    const rev = graph.reverseAdjacency();
    expect(rev.get('light red')).toEqual([]);
    expect(rev.get('shiny gold')).toEqual(['bright white', 'muted yellow']);
    expect(rev.get('faded blue')).toEqual(['dark olive', 'vibrant plum']);
  });

  it('builds reachableDirectedGraph for diamonds and rejects missing start color', () => {
    const graph = parseBagRuleGraph(SAMPLE_RULES);
    expect(() => graph.reachableDirectedGraph('unknown color')).toThrow(RangeError);

    const dag = graph.reachableDirectedGraph('shiny gold');
    expect(dag.has('shiny gold')).toBe(true);
    expect(dag.has('faded blue')).toBe(true);
    expect(dag.has('light red')).toBe(false);
    expect(dag.topologicalOrder()).toEqual(['shiny gold', 'dark olive', 'vibrant plum', 'faded blue']);
  });

  it('rejects whitespace-only input via BagRuleGraph empty check', () => {
    expect(() => parseBagRuleGraph('  \n \r\n  ')).toThrow(RangeError);
  });
});
