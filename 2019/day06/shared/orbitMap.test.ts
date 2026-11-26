import { describe, expect, it } from 'vitest';
import { OrbitMap } from './orbitMap';
import type { OrbitEdge } from './types';

function makeEdges(pairs: readonly string[]): OrbitEdge[] {
  return pairs.map((pair) => {
    const [parent, child] = pair.split(')');
    return { parent: parent!, child: child! };
  });
}

function nextSeed(seed: number): number {
  return (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
}

function naiveTotalOrbits(edges: readonly OrbitEdge[]): number {
  const parentOf = new Map(edges.map((e) => [e.child, e.parent]));
  let total = 0;
  for (const child of parentOf.keys()) {
    for (let cur: string | undefined = child; cur !== undefined && cur !== 'COM'; cur = parentOf.get(cur)) {
      total += 1;
    }
  }
  return total;
}

function bfsShortestPath(edges: readonly OrbitEdge[], start: string, target: string): string[] {
  const adj = new Map<string, string[]>();
  for (const { parent, child } of edges) {
    adj.set(parent, [...(adj.get(parent) ?? []), child]);
    adj.set(child, [...(adj.get(child) ?? []), parent]);
  }
  const queue: string[] = [start];
  const prev = new Map<string, string | null>([[start, null]]);
  for (let head = 0; head < queue.length; head += 1) {
    const cur = queue[head]!;
    if (cur === target) break;
    for (const next of adj.get(cur) ?? []) {
      if (!prev.has(next)) { prev.set(next, cur); queue.push(next); }
    }
  }
  const path: string[] = [];
  for (let cur: string | null = target; cur !== null; cur = prev.get(cur) ?? null) path.push(cur);
  return path.reverse();
}

describe('OrbitMap', () => {
  it('computes official Part 1 (42) and Part 2 (4 via D) examples and accessors', () => {
    const base = ['COM)B', 'B)C', 'C)D', 'D)E', 'E)F', 'B)G', 'G)H', 'D)I', 'E)J', 'J)K', 'K)L'];
    const part1 = new OrbitMap(makeEdges(base));
    expect(part1.rootLabel).toBe('COM');
    expect(part1.nodeCount).toBe(12);
    expect(part1.edgeCount).toBe(11);
    expect(part1.maxDepth).toBe(7);
    expect(part1.totalOrbits).toBe(42);
    expect(part1.parentIdOf(0)).toBeNull();
    expect(part1.idOf('MISSING')).toBeNull();
    const dId = part1.idOf('D')!;
    expect(part1.labelOf(dId)).toBe('D');
    expect(part1.depthOfId(dId)).toBe(3);
    expect(part1.parentIdOf(dId)).toBe(part1.idOf('C'));
    expect(part1.childIdsOf(dId).map((id) => part1.labelOf(id))).toEqual(['E', 'I']);

    const part2 = new OrbitMap(makeEdges([...base, 'K)YOU', 'I)SAN']));
    const route = part2.findTransferRoute('YOU', 'SAN');
    expect(route.pathNodeIds.map((id) => part2.labelOf(id))).toEqual(['K', 'J', 'E', 'D', 'I']);
    expect(route.pathNodeIds.length - 1).toBe(4);
    expect(part2.labelOf(route.lcaId)).toBe('D');
  });

  it('handles symmetric transfers, ancestor-descendant routes, same-parent, and prototype labels', () => {
    const map = new OrbitMap(makeEdges([
      'COM)constructor', 'constructor)toString', 'toString)__proto__',
      'constructor)A', 'constructor)B', '__proto__)C',
    ]));
    expect(map.findTransferRoute('A', 'A').pathNodeIds.length - 1).toBe(0);
    expect(map.findTransferRoute('A', 'B').pathNodeIds.length - 1).toBe(0);
    const up = map.findTransferRoute('C', 'A');
    const down = map.findTransferRoute('A', 'C');
    expect(up.pathNodeIds.map((id) => map.labelOf(id))).toEqual(['__proto__', 'toString', 'constructor']);
    expect(down.pathNodeIds.map((id) => map.labelOf(id))).toEqual(['constructor', 'toString', '__proto__']);
    expect(up.lcaId).toBe(map.idOf('constructor'));
    expect(down.lcaId).toBe(map.idOf('constructor'));
  });

  it('rejects invalid trees, invalid IDs, and invalid transfer endpoints', () => {
    expect(() => new OrbitMap([])).toThrow(RangeError);
    expect(() => new OrbitMap([{ parent: '', child: 'A' }])).toThrow(RangeError);
    expect(() => new OrbitMap([{ parent: 'COM', child: '' }])).toThrow(RangeError);
    expect(() => new OrbitMap(makeEdges(['A)COM']))).toThrow(RangeError);
    expect(() => new OrbitMap(makeEdges(['A)B']))).toThrow(RangeError);
    expect(() => new OrbitMap(makeEdges(['COM)A', 'COM)B', 'A)B']))).toThrow(RangeError);
    expect(() => new OrbitMap(makeEdges(['COM)A', 'B)C', 'C)B']))).toThrow(RangeError);

    const map = new OrbitMap(makeEdges(['COM)A', 'A)B']));
    expect(() => map.labelOf(-1)).toThrow(RangeError);
    expect(() => map.depthOfId(1.5)).toThrow(RangeError);
    expect(() => map.parentIdOf(3)).toThrow(RangeError);
    expect(() => map.childIdsOf(99)).toThrow(RangeError);
    expect(() => map.findTransferRoute('NOPE', 'A')).toThrow(RangeError);
    expect(() => map.findTransferRoute('A', 'NOPE')).toThrow(RangeError);
    expect(() => map.findTransferRoute('COM', 'A')).toThrow(RangeError);
  });

  it('handles deep chain stress (N = 2000) and matches independent oracles across 30 seeded trees', () => {
    const deep = new OrbitMap(Array.from({ length: 2000 }, (_, i) => ({
      parent: i === 0 ? 'COM' : `N${i}`,
      child: `N${i + 1}`,
    })));
    expect(deep.maxDepth).toBe(2000);
    expect(deep.totalOrbits).toBe((2000 * 2001) / 2);

    let seed = 20_190_601;
    for (let t = 0; t < 30; t += 1) {
      seed = nextSeed(seed);
      const count = 4 + (seed % 35);
      const nodes = ['COM'];
      const edges: OrbitEdge[] = [];
      for (let i = 1; i < count; i += 1) {
        seed = nextSeed(seed);
        const child = `N${i}`;
        edges.push({ parent: nodes[seed % nodes.length]!, child });
        nodes.push(child);
      }
      const map = new OrbitMap(edges);
      expect(map.totalOrbits).toBe(naiveTotalOrbits(edges));
      seed = nextSeed(seed);
      const a = nodes[1 + (seed % (nodes.length - 1))]!;
      seed = nextSeed(seed);
      const b = nodes[1 + (seed % (nodes.length - 1))]!;
      const route = map.findTransferRoute(a, b);
      const start = map.labelOf(map.parentIdOf(map.idOf(a)!)!);
      const goal = map.labelOf(map.parentIdOf(map.idOf(b)!)!);
      expect(route.pathNodeIds.map((id) => map.labelOf(id))).toEqual(bfsShortestPath(edges, start, goal));
    }
  });
});
