import { describe, expect, it } from 'vitest';
import { findThreeEdgeCut } from './edmondsKarp';
import { parseWiringGraph, WiringGraph, type WiringEdge } from './wiringGraph';

const EXAMPLE_INPUT = [
  'jqt: rhn xhk nvd', 'rsh: frs pzl lsr', 'xhk: hfx', 'cmg: qnr nvd lhk bvb',
  'rhn: xhk bvb hfx', 'bvb: xhk hfx', 'pzl: lsr hfx nvd', 'qnr: nvd',
  'ntq: jqt hfx bvb xhk', 'nvd: lhk', 'lsr: lhk', 'rzs: qnr cmg lsr rsh', 'frs: qnr lhk lsr',
].join('\n');

function stoerWagnerMinCut(graph: WiringGraph): number {
  const n = graph.vertexCount;
  const w = new Int32Array(n * n);
  for (const e of graph.edges) {
    w[e.u * n + e.v] = 1;
    w[e.v * n + e.u] = 1;
  }
  const active = Array.from({ length: n }, (_, i) => i);
  let best = Infinity;
  while (active.length > 1) {
    const added = new Uint8Array(n);
    const weights = new Int32Array(n);
    let prev = -1;
    let last = -1;
    for (let step = 0; step < active.length; step += 1) {
      let pick = -1;
      for (const u of active) {
        if (!added[u] && (pick === -1 || weights[u]! > weights[pick]!)) pick = u;
      }
      added[pick] = 1;
      prev = last;
      last = pick;
      for (const v of active) {
        if (!added[v]) weights[v] = (weights[v] ?? 0) + w[pick * n + v]!;
      }
    }
    best = Math.min(best, weights[last]!);
    for (const v of active) {
      if (v !== last && v !== prev) {
        w[prev * n + v] = (w[prev * n + v] ?? 0) + w[last * n + v]!;
        w[v * n + prev] = w[prev * n + v]!;
      }
    }
    active.splice(active.indexOf(last), 1);
  }
  return best;
}

function makeCliqueEdges(offset: number, size: number): WiringEdge[] {
  const edges: WiringEdge[] = [];
  for (let i = 0; i < size; i += 1) {
    for (let j = i + 1; j < size; j += 1) edges.push({ u: offset + i, v: offset + j });
  }
  return edges;
}

function makeGraph(n: number, edges: readonly WiringEdge[]): WiringGraph {
  const labels = Array.from({ length: n }, (_, i) => `v${String(i).padStart(2, '0')}`);
  const canon = edges.map((e) => (e.u < e.v ? e : { u: e.v, v: e.u }));
  return new WiringGraph(labels, canon);
}

describe('findThreeEdgeCut (Edmonds-Karp + Stoer-Wagner differential oracle)', () => {
  it('solves the official 15-node example with product 54 and 3 disjoint paths', () => {
    const graph = parseWiringGraph(EXAMPLE_INPUT);
    expect(stoerWagnerMinCut(graph)).toBe(3);
    const res = findThreeEdgeCut(graph);
    expect(Object.isFrozen(res)).toBe(true);
    expect(res.product).toBe(54);
    expect(res.sizeS + res.sizeT).toBe(15);
    expect(res.cutEdges).toHaveLength(3);
    expect(res.probesRun).toBeGreaterThanOrEqual(1);
    const usedEdges = new Set<string>();
    for (const path of res.disjointPaths) {
      expect(path[0]).toBe(res.source);
      expect(path[path.length - 1]).toBe(res.target);
      for (let i = 0; i + 1 < path.length; i += 1) {
        const a = path[i]!;
        const b = path[i + 1]!;
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        expect(usedEdges.has(key)).toBe(false);
        usedEdges.add(key);
      }
    }
  });

  it('solves asymmetric 3-cuts (1x5 and 5x7) matching Stoer-Wagner', () => {
    const g1x5 = makeGraph(6, [...makeCliqueEdges(1, 5), { u: 0, v: 1 }, { u: 0, v: 2 }, { u: 0, v: 3 }]);
    expect(stoerWagnerMinCut(g1x5)).toBe(3);
    expect(findThreeEdgeCut(g1x5).product).toBe(5);

    const g5x7 = makeGraph(12, [
      ...makeCliqueEdges(0, 5), ...makeCliqueEdges(5, 7),
      { u: 1, v: 6 }, { u: 2, v: 7 }, { u: 3, v: 8 },
    ]);
    expect(stoerWagnerMinCut(g5x7)).toBe(3);
    expect(findThreeEdgeCut(g5x7).product).toBe(35);
  });

  it('handles farthest-vertex-same-side fallback (probesRun > 1)', () => {
    const edges = [
      ...makeCliqueEdges(0, 5), ...makeCliqueEdges(5, 5), ...makeCliqueEdges(10, 5), ...makeCliqueEdges(15, 4),
      { u: 1, v: 5 }, { u: 2, v: 6 }, { u: 3, v: 7 }, { u: 4, v: 8 },
      { u: 6, v: 10 }, { u: 7, v: 11 }, { u: 8, v: 12 }, { u: 9, v: 13 },
      { u: 0, v: 15 }, { u: 1, v: 16 }, { u: 2, v: 17 },
    ];
    const g = makeGraph(19, edges);
    expect(stoerWagnerMinCut(g)).toBe(3);
    const res = findThreeEdgeCut(g);
    expect(res.product).toBe(15 * 4);
    expect(res.probesRun).toBeGreaterThan(1);
  });

  it('triggers reverse-edge flow cancellation (cap === 2 -> 1)', () => {
    const raw = [
      'a0: z_a m1 k2 k1', 'm1: a0 k1 k2 z_b', 'k1: a0 m1 k2 k3', 'k2: a0 m1 k1 k3',
      'k3: k1 k2 z_a z_b', 'z_a: a0 k3 z_b y_t y2', 'z_b: m1 k3 z_a z_t',
      'y_t: z_a y2 t1 t2 z_t', 'y2: z_a y_t t1 t2 z_t',
      't1: y_t y2 t2 z_t', 't2: y_t y2 t1 z_t', 'z_t: z_b y_t y2 t1 t2',
    ].join('\n');
    const g = parseWiringGraph(raw);
    expect(stoerWagnerMinCut(g)).toBe(3);
    expect(findThreeEdgeCut(g).product).toBe(35);
  });

  it('rejects empty, low-degree, disconnected, 1-bridge, 2-bridge, and K5 graphs', () => {
    expect(() => findThreeEdgeCut(new WiringGraph([], []))).toThrow(RangeError);
    expect(() => findThreeEdgeCut(makeGraph(3, makeCliqueEdges(0, 3)))).toThrow(RangeError);
    expect(() => findThreeEdgeCut(makeGraph(8, [...makeCliqueEdges(0, 4), ...makeCliqueEdges(4, 4)]))).toThrow(RangeError);
    expect(() => findThreeEdgeCut(makeGraph(8, [...makeCliqueEdges(0, 4), ...makeCliqueEdges(4, 4), { u: 0, v: 4 }]))).toThrow(RangeError);
    expect(() => findThreeEdgeCut(makeGraph(8, [...makeCliqueEdges(0, 4), ...makeCliqueEdges(4, 4), { u: 0, v: 4 }, { u: 1, v: 5 }]))).toThrow(RangeError);
    expect(() => findThreeEdgeCut(makeGraph(5, makeCliqueEdges(0, 5)))).toThrow(RangeError);
  });

  it('matches Stoer-Wagner oracle across 20 seeded random two-cluster graphs', () => {
    let seed = 0x12345678;
    const nextInt = (max: number): number => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed % max;
    };
    for (let trial = 0; trial < 20; trial += 1) {
      const sA = 5 + nextInt(4);
      const sB = 5 + nextInt(4);
      const edges = [...makeCliqueEdges(0, sA), ...makeCliqueEdges(sA, sB)];
      const bridges = new Set<string>();
      while (bridges.size < 3) {
        const u = nextInt(sA);
        const v = sA + nextInt(sB);
        const key = `${u}:${v}`;
        if (!bridges.has(key)) { bridges.add(key); edges.push({ u, v }); }
      }
      const g = makeGraph(sA + sB, edges);
      expect(stoerWagnerMinCut(g)).toBe(3);
      expect(findThreeEdgeCut(g).product).toBe(sA * sB);
    }
  });
});
