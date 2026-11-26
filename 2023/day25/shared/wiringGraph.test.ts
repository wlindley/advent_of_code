import { describe, expect, it } from 'vitest';
import { parseWiringGraph, WiringGraph } from './wiringGraph';

const EXAMPLE_INPUT = [
  'jqt: rhn xhk nvd',
  'rsh: frs pzl lsr',
  'xhk: hfx',
  'cmg: qnr nvd lhk bvb',
  'rhn: xhk bvb hfx',
  'bvb: xhk hfx',
  'pzl: lsr hfx nvd',
  'qnr: nvd',
  'ntq: jqt hfx bvb xhk',
  'nvd: lhk',
  'lsr: lhk',
  'rzs: qnr cmg lsr rsh',
  'frs: qnr lhk lsr',
].join('\n');

describe('WiringGraph & parseWiringGraph', () => {
  it('parses the 15-node example with sorted labels and canonical edges', () => {
    const g = parseWiringGraph(EXAMPLE_INPUT);
    expect(g.vertexCount).toBe(15);
    expect(g.edgeCount).toBe(33);
    expect(Object.isFrozen(g)).toBe(true);
    expect(Object.isFrozen(g.labels)).toBe(true);
    expect(Object.isFrozen(g.edges)).toBe(true);
    expect(g.labels[0]).toBe('bvb');
    expect(g.labels[14]).toBe('xhk');
    expect(g.labelOf(0)).toBe('bvb');

    for (const e of g.edges) {
      expect(e.u).toBeLessThan(e.v);
      expect(Object.isFrozen(e)).toBe(true);
    }

    const degrees = new Array<number>(g.vertexCount).fill(0);
    for (let u = 0; u < g.vertexCount; u += 1) {
      for (let he = g.firstHalfEdge(u); he !== -1; he = g.nextHalfEdge(he)) {
        degrees[u] = (degrees[u] ?? 0) + 1;
        const v = g.targetOf(he);
        const rev = he ^ 1;
        expect(g.targetOf(rev)).toBe(u);
        expect(g.edgeOf(he)).toBe(g.edgeOf(rev));
        expect(v).not.toBe(u);
      }
    }
    const totalHalfEdges = degrees.reduce((sum, d) => sum + d, 0);
    expect(totalHalfEdges).toBe(g.edgeCount * 2);
  });

  it('deduplicates reverse/repeated edges and handles CRLF and outer blank lines', () => {
    const raw = '\r\n  a_1: b-2 b-2  \r\n  b-2: a_1 c3 \r\n\r\n';
    const g = parseWiringGraph(raw);
    expect(g.labels).toEqual(['a_1', 'b-2', 'c3']);
    expect(g.edges).toEqual([
      { u: 0, v: 1 },
      { u: 1, v: 2 },
    ]);
  });

  it('supports direct WiringGraph construction', () => {
    const g = new WiringGraph(['x', 'y'], [{ u: 0, v: 1 }]);
    expect(g.vertexCount).toBe(2);
    expect(g.edgeCount).toBe(1);
    expect(g.targetOf(0)).toBe(1);
    expect(g.targetOf(1)).toBe(0);
  });

  it('rejects empty input and malformed lines', () => {
    expect(() => parseWiringGraph('')).toThrow();
    expect(() => parseWiringGraph('   \n\r\n  ')).toThrow();
    expect(() => parseWiringGraph('abc def')).toThrow(/colon/i);
    expect(() => parseWiringGraph('a: b: c')).toThrow(/colon/i);
    expect(() => parseWiringGraph(': b c')).toThrow(/left-hand/i);
    expect(() => parseWiringGraph('a$b: c')).toThrow(/invalid component label/i);
    expect(() => parseWiringGraph('a:   ')).toThrow(/right-hand/i);
    expect(() => parseWiringGraph('a: b@c')).toThrow(/invalid component label/i);
    expect(() => parseWiringGraph('a: a')).toThrow(/self-loop/i);
  });
});
