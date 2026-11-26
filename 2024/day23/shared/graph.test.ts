import { describe, expect, it } from 'vitest';
import { LanClique, LanGraph, parseLanGraph } from './graph';

describe('LanClique', () => {
  it('validates non-empty equal-length inputs and exposes dynamic properties', () => {
    expect(() => new LanClique([], [])).toThrow(RangeError);
    expect(() => new LanClique([0, 1], ['co'])).toThrow(RangeError);

    const clique = new LanClique([0, 1, 2], ['co', 'de', 'ta']);
    expect(clique.size).toBe(3);
    expect(clique.password).toBe('co,de,ta');
    expect(clique.hasNodeStartingWith('t')).toBe(true);
    expect(clique.hasNodeStartingWith('z')).toBe(false);
    expect(clique.hasNodeStartingWith('')).toBe(true);
  });
});

describe('LanGraph and parseLanGraph', () => {
  it('parses, sorts node names, deduplicates undirected edges, and computes degree stats', () => {
    const raw = ['ta-co', 'co-de', 'de-ta', 'co-ta', 'de-ka', 'ta-ka', 'co-ka'].join('\n');
    const graph = parseLanGraph(raw);

    expect(graph.names).toEqual(['co', 'de', 'ka', 'ta']);
    expect(graph.nodeCount).toBe(4);
    expect(graph.edgeCount).toBe(6);
    expect(graph.minDegree).toBe(3);
    expect(graph.maxDegree).toBe(3);
    expect(graph.averageDegree).toBe(3);
    expect(graph.edges).toEqual([
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 2],
      [1, 3],
      [2, 3],
    ]);

    expect(graph.findNodeId('ka')).toBe(2);
    expect(graph.findNodeId('zz')).toBe(-1);
    expect(graph.nameOf(3)).toBe('ta');
    expect(graph.neighbors(1)).toEqual([0, 2, 3]);
    expect(graph.upperNeighbors(1)).toEqual([2, 3]);
    expect(graph.degree(0)).toBe(3);
    expect(graph.hasEdge(0, 3)).toBe(true);

    const clique = graph.createClique([3, 0, 1]);
    expect(clique.nodeIds).toEqual([0, 1, 3]);
    expect(clique.password).toBe('co,de,ta');
  });

  it('computes asymmetric min/max/average degrees on non-regular graphs', () => {
    const graph = parseLanGraph('aa-bb\nbb-cc\nbb-dd');
    expect(graph.nodeCount).toBe(4);
    expect(graph.edgeCount).toBe(3);
    expect(graph.minDegree).toBe(1);
    expect(graph.maxDegree).toBe(3);
    expect(graph.averageDegree).toBe(1.5);
    expect(graph.hasEdge(0, 2)).toBe(false);
  });

  it('rejects empty inputs, malformed lines, self-loops, and invalid node ids', () => {
    expect(() => LanGraph.fromEdges([])).toThrow(RangeError);
    expect(() => parseLanGraph('  \n  ')).toThrow(RangeError);
    expect(() => parseLanGraph('ab_cd')).toThrow(RangeError);
    expect(() => parseLanGraph('aa-aa')).toThrow(RangeError);

    const graph = parseLanGraph('aa-bb');
    expect(() => graph.nameOf(99)).toThrow(RangeError);
    expect(() => graph.neighbors(-1)).toThrow(RangeError);
  });
});
