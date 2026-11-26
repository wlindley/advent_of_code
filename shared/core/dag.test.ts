import { describe, expect, it } from 'vitest';
import { DirectedGraph } from './dag';

function countPathsDfsOracle(graph: DirectedGraph<string>, source: string, target: string): bigint {
  if (!graph.has(source) || !graph.has(target)) return 0n;
  const color = new Map<string, 0 | 1 | 2>();
  const memo = new Map<string, bigint>();
  const dfs = (u: string): bigint => {
    if (color.get(u) === 1) throw new Error('Cycle');
    if (memo.has(u)) return memo.get(u)!;
    color.set(u, 1);
    let total = u === target ? 1n : 0n;
    for (const v of graph.outNeighbors(u)) total += dfs(v);
    color.set(u, 2);
    memo.set(u, total);
    return total;
  };
  return dfs(source);
}

describe('DirectedGraph', () => {
  it('registers implicit sinks, exposes counts/queries, and freezes state', () => {
    const src = ['b', 'b', 'c'];
    const g = new DirectedGraph([['a', src], ['b', ['d']]]);
    src.push('x');
    expect([g.nodeCount, g.edgeCount, g.nodes]).toEqual([4, 4, ['a', 'b', 'c', 'd']]);
    expect([g.has('d'), g.has('missing')]).toEqual([true, false]);
    expect([g.outNeighbors('a'), g.outNeighbors('d'), g.outNeighbors('missing')]).toEqual([['b', 'b', 'c'], [], []]);
    expect([Object.isFrozen(g), Object.isFrozen(g.nodes), Object.isFrozen(g.outNeighbors('a'))]).toEqual([true, true, true]);
  });

  it('rejects duplicate source definitions', () => {
    expect(() => new DirectedGraph([['a', ['b']], ['a', ['c']]])).toThrow(/Duplicate/);
  });

  it('extracts relevantSubgraph preserving parallel edges and pruning unreachable nodes', () => {
    const g = new DirectedGraph([
      ['pre', ['s']], ['s', ['a', 'a', 'dead']], ['a', ['t']], ['dead', ['sink']], ['t', ['post']],
    ]);
    expect(g.relevantSubgraph('missing', 't').nodeCount).toBe(0);
    expect(g.relevantSubgraph('s', 'missing').nodeCount).toBe(0);
    expect(g.relevantSubgraph('dead', 's').nodeCount).toBe(0);
    const sub = g.relevantSubgraph('s', 't');
    expect(new Set(sub.nodes)).toEqual(new Set(['s', 'a', 't']));
    expect([sub.outNeighbors('s'), sub.outNeighbors('t')]).toEqual([['a', 'a'], []]);
  });

  it('computes topologicalOrder for empty and diamond DAGs and rejects cycles', () => {
    expect(new DirectedGraph<string>([]).topologicalOrder()).toEqual([]);
    const order = new DirectedGraph([['a', ['b', 'c']], ['b', ['d']], ['c', ['d']]]).topologicalOrder();
    expect([order[0], order[3], Object.isFrozen(order)]).toEqual(['a', 'd', true]);
    expect(() => new DirectedGraph([['a', ['a']]]).topologicalOrder()).toThrow(/Cycle/);
    expect(() => new DirectedGraph([['a', ['b']], ['b', ['a']]]).topologicalOrder()).toThrow(/Cycle/);
    expect(() => new DirectedGraph([['tail', ['a']], ['a', ['b']], ['b', ['a']]]).topologicalOrder()).toThrow(/Cycle/);
  });

  it('handles countPaths edge cases, cycles, bigints, and deep iterative chains', () => {
    const g = new DirectedGraph([
      ['s', ['a', 'b']], ['a', ['t']], ['b', ['off']], ['off', ['off']], ['c1', ['c2']], ['c2', ['c1']],
    ]);
    expect([g.countPaths('missing', 't'), g.countPaths('t', 's'), g.countPaths('t', 't'), g.countPaths('s', 't')]).toEqual([0n, 0n, 1n, 1n]);
    expect(() => new DirectedGraph([['s', ['s']]]).countPaths('s', 's')).toThrow(/Cycle/);
    expect(() => new DirectedGraph([['s', ['a']], ['a', ['s']]]).countPaths('s', 's')).toThrow(/Cycle/);
    expect(() => new DirectedGraph([['s', ['a']], ['a', ['b']], ['b', ['a', 't']]]).countPaths('s', 't')).toThrow(/Cycle/);

    const diamond65 = Array.from({ length: 65 }, (_, i) => [`n${i}`, [`n${i + 1}`, `n${i + 1}`]] as const);
    expect(new DirectedGraph(diamond65).countPaths('n0', 'n65')).toBe(2n ** 65n);
    const chain = Array.from({ length: 14999 }, (_, i) => [`c${i}`, [`c${i + 1}`]] as const);
    expect(new DirectedGraph(chain).countPaths('c0', 'c14999')).toBe(1n);
  });

  it('matches memoized DFS oracle across 40 seeded random DAGs', () => {
    let seed = 0x51a7b3c9;
    const rand = (max: number) => ((seed = (seed * 1664525 + 1013904223) >>> 0) % max);
    for (let t = 0; t < 40; t++) {
      const n = 5 + rand(12);
      const entries: [string, string[]][] = Array.from({ length: n }, (_, i) => {
        const edges: string[] = [];
        for (let j = i + 1; j < n; j++) {
          if (rand(3) === 0) edges.push(`v${j}`);
          if (rand(8) === 0) edges.push(`v${j}`);
        }
        return [`v${i}`, edges];
      });
      const graph = new DirectedGraph(entries);
      const src = `v${rand(Math.max(1, Math.floor(n / 2)))}`;
      const dst = `v${Math.floor(n / 2) + rand(n - Math.floor(n / 2))}`;
      expect(graph.countPaths(src, dst)).toBe(countPathsDfsOracle(graph, src, dst));
    }
  });
});
