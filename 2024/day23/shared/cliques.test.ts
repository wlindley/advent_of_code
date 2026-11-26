import { describe, expect, it } from 'vitest';
import {
  LanClique,
  findMaximumClique,
  findMaximumCliqueHistory,
  findTriangles,
} from './cliques';
import { type LanGraph, parseLanGraph } from './graph';

const OFFICIAL_EXAMPLE = [
  'kh-tc', 'qp-kh', 'de-cg', 'ka-co', 'yn-aq', 'qp-ub', 'cg-tb', 'vc-aq',
  'tb-ka', 'wh-tc', 'yn-cg', 'kh-ub', 'ta-co', 'de-co', 'tc-td', 'tb-wq',
  'wh-td', 'ta-ka', 'td-qp', 'aq-cg', 'wq-ub', 'ub-vc', 'de-ta', 'wq-aq',
  'wq-vc', 'wh-yn', 'ka-de', 'kh-ta', 'co-tc', 'wh-qp', 'tb-vc', 'td-yn',
].join('\n');

function bruteForceTriangles(graph: LanGraph, prefix: string): string[] {
  const n = graph.nodeCount;
  const out: string[] = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (!graph.hasEdge(u, v)) continue;
      for (let w = v + 1; w < n; w += 1) {
        if (graph.hasEdge(u, w) && graph.hasEdge(v, w)) {
          const clique = graph.createClique([u, v, w]);
          if (clique.hasNodeStartingWith(prefix)) out.push(clique.password);
        }
      }
    }
  }
  return out;
}

function bruteForceMaximumClique(graph: LanGraph): string {
  const n = graph.nodeCount;
  let bestIds: number[] = [];
  for (let mask = 1; mask < 1 << n; mask += 1) {
    const nodes: number[] = [];
    for (let i = 0; i < n; i += 1) {
      if ((mask & (1 << i)) !== 0) nodes.push(i);
    }
    if (nodes.length < bestIds.length) continue;
    let isClique = true;
    for (let i = 0; i < nodes.length && isClique; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        if (!graph.hasEdge(nodes[i]!, nodes[j]!)) {
          isClique = false;
          break;
        }
      }
    }
    if (!isClique) continue;
    if (
      nodes.length > bestIds.length ||
      graph.createClique(nodes).password < graph.createClique(bestIds).password
    ) {
      bestIds = nodes;
    }
  }
  return graph.createClique(bestIds).password;
}

function buildSeededGraph(seed: number, vertexCount: number, edgeProbPct: number): LanGraph {
  let state = seed >>> 0;
  const edges: string[] = ['n00-n01'];
  for (let u = 0; u < vertexCount; u += 1) {
    for (let v = u + 1; v < vertexCount; v += 1) {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      if (state % 100 < edgeProbPct) {
        const a = `n${String(u).padStart(2, '0')}`;
        const b = `n${String(v).padStart(2, '0')}`;
        edges.push(`${a}-${b}`);
      }
    }
  }
  return parseLanGraph(edges.join('\n'));
}

describe('clique detection', () => {
  it('re-exports LanClique and solves the official 32-edge example', () => {
    expect(LanClique).toBeDefined();
    const graph = parseLanGraph(OFFICIAL_EXAMPLE);

    const allTriangles = findTriangles(graph, '');
    expect(allTriangles).toHaveLength(12);

    const tTriangles = findTriangles(graph, 't');
    expect(tTriangles).toHaveLength(7);

    const maxClique = findMaximumClique(graph);
    expect(maxClique.size).toBe(4);
    expect(maxClique.password).toBe('co,de,ka,ta');
  });

  it('handles a single edge and rejects lex-larger same-root ties', () => {
    const single = parseLanGraph('aa-bb');
    expect(findTriangles(single, '')).toHaveLength(0);
    expect(findMaximumClique(single).password).toBe('aa,bb');

    const bowtie = parseLanGraph('n0-n1\nn0-n2\nn1-n2\nn0-n3\nn0-n4\nn3-n4');
    const history = findMaximumCliqueHistory(bowtie);
    expect(history[history.length - 1]!.password).toBe('n0,n1,n2');
  });

  it('normalizes unsorted R before tie-breaking on pivot-ordered equal-size cliques', () => {
    const raw = [
      'n0-n1', 'n0-n2', 'n0-n3', 'n0-n4', 'n0-n5', 'n0-n6', 'n0-n7',
      'n1-n2', 'n1-n6', 'n2-n6',
      'n3-n4', 'n3-n5', 'n4-n5',
      'n6-n7',
    ].join('\n');
    const graph = parseLanGraph(raw);
    const history = findMaximumCliqueHistory(graph);
    expect(history.some((c) => c.password === 'n0,n3,n4,n5')).toBe(true);
    expect(findMaximumClique(graph).password).toBe('n0,n1,n2,n6');
  });

  it('matches a brute-force oracle across 30 seeded random graphs (V = 8..14)', () => {
    for (let i = 0; i < 30; i += 1) {
      const vCount = 8 + (i % 7);
      const prob = 35 + ((i * 11) % 45);
      const graph = buildSeededGraph(1000 + i * 7919, vCount, prob);

      const expectedTriangles = bruteForceTriangles(graph, '');
      expect(findTriangles(graph, '').map((c) => c.password)).toEqual(expectedTriangles);

      const expectedPrefix = bruteForceTriangles(graph, 'n0');
      expect(findTriangles(graph, 'n0').map((c) => c.password)).toEqual(expectedPrefix);

      const expectedMax = bruteForceMaximumClique(graph);
      const actualMax = findMaximumClique(graph);
      expect(actualMax.password).toBe(expectedMax);
    }
  });
});
