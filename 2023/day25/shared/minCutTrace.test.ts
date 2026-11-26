import { describe, expect, it } from 'vitest';
import { DEFAULT_MAX_TRACE_STEPS, buildMinCutTrace } from './minCutTrace';
import { parseWiringGraph, WiringGraph, type WiringEdge } from './wiringGraph';

const EXAMPLE_INPUT = [
  'jqt: rhn xhk nvd', 'rsh: frs pzl lsr', 'xhk: hfx', 'cmg: qnr nvd lhk bvb',
  'rhn: xhk bvb hfx', 'bvb: xhk hfx', 'pzl: lsr hfx nvd', 'qnr: nvd',
  'ntq: jqt hfx bvb xhk', 'nvd: lhk', 'lsr: lhk', 'rzs: qnr cmg lsr rsh', 'frs: qnr lhk lsr',
].join('\n');

function makeCliqueEdges(offset: number, size: number): WiringEdge[] {
  const edges: WiringEdge[] = [];
  for (let i = 0; i < size; i += 1) {
    for (let j = i + 1; j < size; j += 1) edges.push({ u: offset + i, v: offset + j });
  }
  return edges;
}

describe('buildMinCutTrace', () => {
  it('builds deterministic bipartite chasm layout and full phase progression on the example', () => {
    const graph = parseWiringGraph(EXAMPLE_INPUT);
    const frames = buildMinCutTrace(graph);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(48);
    expect(frames.length).toBeGreaterThanOrEqual(7);
    expect(Object.isFrozen(frames)).toBe(true);

    const first = frames[0]!;
    const last = frames[frames.length - 1]!;
    expect(first.phase).toBe('overview');
    expect(last.phase).toBe('severed');
    expect(last.result.product).toBe(54);
    expect(frames.some((f) => f.phase === 'probe')).toBe(true);
    expect(frames.filter((f) => f.phase === 'augment')).toHaveLength(3);
    expect(frames.some((f) => f.phase === 'residual-cut')).toBe(true);

    const sSet = new Set(last.result.sideS);
    const rimSet = new Set<number>();
    for (const e of last.result.cutEdges) {
      rimSet.add(e.u);
      rimSet.add(e.v);
    }
    for (let i = 0; i < frames.length; i += 1) {
      expect(frames[i]!.layout).toBe(first.layout);
      expect(Object.isFrozen(frames[i]!)).toBe(true);
    }
    for (let u = 0; u < graph.vertexCount; u += 1) {
      const pt = first.layout.points[u]!;
      expect(pt.y).toBeGreaterThanOrEqual(0.05);
      expect(pt.y).toBeLessThanOrEqual(0.95);
      if (sSet.has(u)) {
        expect(pt.x).toBeGreaterThanOrEqual(0.05);
        expect(pt.x).toBeLessThanOrEqual(0.4);
        if (rimSet.has(u)) expect(pt.x).toBeCloseTo(0.39, 5);
      } else {
        expect(pt.x).toBeGreaterThanOrEqual(0.6);
        expect(pt.x).toBeLessThanOrEqual(0.95);
        if (rimSet.has(u)) expect(pt.x).toBeCloseTo(0.61, 5);
      }
    }
  });

  it('handles single-node rim side (1x5) and bounds frames when maxSteps is small', () => {
    const labels = Array.from({ length: 6 }, (_, i) => `n${i}`);
    const g1x5 = new WiringGraph(labels, [
      ...makeCliqueEdges(1, 5),
      { u: 0, v: 1 }, { u: 0, v: 2 }, { u: 0, v: 3 },
    ]);
    const frames = buildMinCutTrace(g1x5, { maxSteps: 3 });
    expect(frames).toHaveLength(3);
    expect(frames[0]!.phase).toBe('overview');
    expect(frames[2]!.phase).toBe('severed');
  });

  it('includes failed probe frames when probesRun > 1 and rejects invalid maxSteps', () => {
    const labels = Array.from({ length: 19 }, (_, i) => `v${String(i).padStart(2, '0')}`);
    const g = new WiringGraph(labels, [
      ...makeCliqueEdges(0, 5), ...makeCliqueEdges(5, 5), ...makeCliqueEdges(10, 5), ...makeCliqueEdges(15, 4),
      { u: 1, v: 5 }, { u: 2, v: 6 }, { u: 3, v: 7 }, { u: 4, v: 8 },
      { u: 6, v: 10 }, { u: 7, v: 11 }, { u: 8, v: 12 }, { u: 9, v: 13 },
      { u: 0, v: 15 }, { u: 1, v: 16 }, { u: 2, v: 17 },
    ]);
    const frames = buildMinCutTrace(g);
    const probeFrames = frames.filter((f) => f.phase === 'probe');
    expect(probeFrames.length).toBeGreaterThan(1);
    expect(probeFrames[0]!.probeFlow).toBe(4);

    expect(() => buildMinCutTrace(g, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => buildMinCutTrace(g, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
