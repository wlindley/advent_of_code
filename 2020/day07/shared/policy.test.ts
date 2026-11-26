import { describe, expect, it } from 'vitest';
import { BagRuleGraph, parseBagRuleGraph } from './graph';
import {
  ANCESTOR_COLORS_POLICY,
  BagLayer,
  BagLayerEdge,
  BagLayerNode,
  NESTED_BAG_COUNT_POLICY,
} from './policy';
import { BagContainment, BagRule } from './rule';

const EXAMPLE_9 = [
  'light red bags contain 1 bright white bag, 2 muted yellow bags.',
  'dark orange bags contain 3 bright white bags, 4 muted yellow bags.',
  'bright white bags contain 1 shiny gold bag.',
  'muted yellow bags contain 2 shiny gold bags, 9 faded blue bags.',
  'shiny gold bags contain 1 dark olive bag, 2 vibrant plum bags.',
  'dark olive bags contain 3 faded blue bags, 4 dotted black bags.',
  'vibrant plum bags contain 5 faded blue bags, 6 dotted black bags.',
  'faded blue bags contain no other bags.',
  'dotted black bags contain no other bags.',
].join('\n');

const CHAIN_7 = [
  'shiny gold bags contain 2 dark red bags.',
  'dark red bags contain 2 dark orange bags.',
  'dark orange bags contain 2 dark yellow bags.',
  'dark yellow bags contain 2 dark green bags.',
  'dark green bags contain 2 dark blue bags.',
  'dark blue bags contain 2 dark violet bags.',
  'dark violet bags contain no other bags.',
].join('\n');

function oracleAncestors(graph: BagRuleGraph, target: string): bigint {
  const reach = new Set<string>([target]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const rule of graph.rules) {
      if (!reach.has(rule.color) && rule.contents.some((c) => reach.has(c.color))) {
        reach.add(rule.color);
        changed = true;
      }
    }
  }
  return BigInt(reach.size - 1);
}

function oracleNested(graph: BagRuleGraph, color: string, memo = new Map<string, bigint>()): bigint {
  const cached = memo.get(color);
  if (cached !== undefined) return cached;
  let total = 0n;
  for (const item of graph.ruleFor(color).contents) {
    total += item.quantity * (1n + oracleNested(graph, item.color, memo));
  }
  memo.set(color, total);
  return total;
}

function makeSeededDag(seed: number): { graph: BagRuleGraph; target: string } {
  let state = seed >>> 0;
  const next = () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 0x100000000);
  const n = 5 + Math.floor(next() * 7);
  const colors = Array.from({ length: n }, (_, i) => `bag ${String.fromCharCode(97 + i)}`);
  const rules = colors.map((color, i) => {
    const items: BagContainment[] = [];
    for (let j = i + 1; j < n; j += 1) {
      if (next() < 0.45) items.push(new BagContainment(colors[j]!, BigInt(1 + Math.floor(next() * 4))));
    }
    return new BagRule(color, items);
  });
  return { graph: new BagRuleGraph(rules), target: colors[Math.floor(next() * n)]! };
}

describe('BagLayer value objects', () => {
  it('validates node/edge/layer invariants and sorts tie-breaks deterministically', () => {
    expect(() => new BagLayerNode('red', 0n)).toThrow(RangeError);
    expect(() => new BagLayerEdge('red', 'blue', 0n)).toThrow(RangeError);
    expect(() => new BagLayer(-1, [], [])).toThrow(RangeError);
    const layer = new BagLayer(1, [
      new BagLayerNode('zeta', 2n),
      new BagLayerNode('alpha', 2n),
      new BagLayerNode('beta', 5n),
    ], []);
    expect(layer.nodes.map((n) => n.color)).toEqual(['beta', 'alpha', 'zeta']);
    expect(layer.totalWeight).toBe(9n);
    expect(layer.nodeCount).toBe(3);
  });
});

describe('AncestorColorsPolicy & NestedBagCountPolicy', () => {
  it('evaluates official examples, diamond skip-layer, bigints > 2^63, and missing target', () => {
    const g9 = parseBagRuleGraph(EXAMPLE_9);
    expect(ANCESTOR_COLORS_POLICY.evaluate(g9, 'shiny gold')).toBe(4n);
    expect(NESTED_BAG_COUNT_POLICY.evaluate(g9, 'shiny gold')).toBe(32n);
    expect(NESTED_BAG_COUNT_POLICY.evaluate(parseBagRuleGraph(CHAIN_7), 'shiny gold')).toBe(126n);
    expect(ANCESTOR_COLORS_POLICY.evaluate(g9, 'missing')).toBe(0n);
    expect(NESTED_BAG_COUNT_POLICY.evaluate(g9, 'missing')).toBe(0n);

    const diamond = parseBagRuleGraph([
      'shiny gold bags contain 2 a bags, 2 b bags.',
      'a bags contain 1 b bag.',
      'b bags contain no other bags.',
    ].join('\n'));
    const layers = NESTED_BAG_COUNT_POLICY.buildLayers(diamond, 'shiny gold');
    expect(layers.map((l) => l.nodes.map((n) => `${n.color}:${n.weight}`))).toEqual([
      ['shiny gold:1'], ['a:2'], ['b:4'],
    ]);
    expect(NESTED_BAG_COUNT_POLICY.evaluate(diamond, 'shiny gold')).toBe(6n);

    const huge = parseBagRuleGraph([
      `shiny gold bags contain ${(1n << 64n).toString()} leaf bags.`,
      'leaf bags contain no other bags.',
    ].join('\n'));
    expect(NESTED_BAG_COUNT_POLICY.evaluate(huge, 'shiny gold')).toBe(1n << 64n);
  });

  it('handles reverse-BFS cross/back edges & cycles, and distinguishes reachable vs unreachable Part 2 cycles', () => {
    const cyclic = parseBagRuleGraph([
      'shiny gold bags contain 1 c bag.',
      'a bags contain 1 shiny gold bag, 1 b bag.',
      'b bags contain 1 shiny gold bag, 1 a bag.',
      'c bags contain no other bags.',
      'x bags contain 1 y bag.',
      'y bags contain 1 x bag.',
    ].join('\n'));
    const revLayers = ANCESTOR_COLORS_POLICY.buildLayers(cyclic, 'shiny gold');
    expect(revLayers.map((l) => l.edges.length)).toEqual([0, 2]);
    expect(ANCESTOR_COLORS_POLICY.evaluate(cyclic, 'shiny gold')).toBe(2n);
    expect(NESTED_BAG_COUNT_POLICY.evaluate(cyclic, 'shiny gold')).toBe(1n);
    expect(() => NESTED_BAG_COUNT_POLICY.evaluate(cyclic, 'x')).toThrow(Error);
  });

  it('matches recursive & fixed-point differential oracles across 35 seeded PRNG DAGs', () => {
    for (let seed = 1; seed <= 35; seed += 1) {
      const { graph, target } = makeSeededDag(seed);
      expect(ANCESTOR_COLORS_POLICY.evaluate(graph, target)).toBe(oracleAncestors(graph, target));
      expect(NESTED_BAG_COUNT_POLICY.evaluate(graph, target)).toBe(oracleNested(graph, target));
    }
  });
});
