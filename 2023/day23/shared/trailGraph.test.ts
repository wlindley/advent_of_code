import { describe, expect, it } from 'vitest';
import { parseTrailMap } from './trailMap';
import { contractTrailGraph, TrailEdge, TrailGraph } from './trailGraph';

describe('trailGraph', () => {
  it('validates TrailEdge and TrailGraph invariants and expands vertex paths', () => {
    expect(() => new TrailEdge(0, 1, [4])).toThrow(RangeError);
    const e02 = new TrailEdge(0, 2, [1, 6, 11]);
    const e21 = new TrailEdge(2, 1, [11, 12]);
    expect(e02.weight).toBe(2);
    expect(e21.weight).toBe(1);

    expect(() => new TrailGraph([1], 0, 0, [])).toThrow(RangeError);
    const graph = new TrailGraph([1, 12, 11], 0, 1, [e02, e21]);
    expect(graph.vertexCount).toBe(3);
    expect(graph.edgeCount).toBe(2);
    expect(graph.edgeBetween(0, 2)).toBe(e02);
    expect(graph.edgeBetween(1, 0)).toBeNull();
    expect(graph.expandVertexPath([])).toEqual([]);
    expect(graph.expandVertexPath([0])).toEqual([1]);
    expect(graph.expandVertexPath([0, 2, 1])).toEqual([1, 6, 11, 12]);
    expect(() => graph.expandVertexPath([0, 1])).toThrow();
  });

  it('handles weight-1 direct start-to-end and skips start/end re-entry', () => {
    const direct = parseTrailMap('.\n.');
    const gDirect = contractTrailGraph(direct, false);
    expect(gDirect.vertexCount).toBe(2);
    expect(gDirect.edgeCount).toBe(1);
    expect(gDirect.edgeBetween(0, 1)?.weight).toBe(1);
    expect(gDirect.edgeBetween(1, 0)).toBeNull();

    // Start has degree 3 on row 0; still assigned ID 0 only, and edges back to start are skipped.
    const topJunction = parseTrailMap([
      '#.#',
      '...',
      '#.#',
    ].join('\n'));
    const gTop = contractTrailGraph(topJunction, true);
    expect(gTop.vertexCount).toBe(3); // start=0, end=1, (1,1)=2
    expect(gTop.edgeBetween(2, 0)).toBeNull();
    expect(gTop.edgeBetween(0, 2)?.weight).toBe(1);
    expect(gTop.edgeBetween(2, 1)?.weight).toBe(1);
  });

  it('contracts dead ends, slope-blocked corridors, self-loops, and parallel corridors keeping longest', () => {
    // 7x7 maze with:
    // - junction A at (1,3) (cell 10)
    // - junction B at (5,3) (cell 38)
    // - right branch from A->B has length 4 (via col 4,5) -> discovered before down/left!
    // - down/left? Let's make one branch shorter (4) and one longer (6), plus a self-loop and dead end!
    const maze = parseTrailMap([
      '###.###',
      '#.....#', // row 1: (1,1)..(1,5) -> (1,3) is junction A
      '#.#.#.#', // row 2: col 1, col 3, col 5
      '#.#v#.#', // row 3: (3,3) is 'v' (one-way down!), col 1 & col 5 open
      '#.#.#.#', // row 4
      '#.....#', // row 5: (5,1)..(5,5) -> (5,3) is junction B
      '###.###',
    ].join('\n'));
    // Wait: from A=(1,3):
    // - up (0,3)=start
    // - right (1,4)->(1,5)->(2,5)->(3,5)->(4,5)->(5,5)->(5,4)->B=(5,3) weight 8
    // - down (2,3)->(3,3,'v')->(4,3)->B=(5,3) weight 4
    // - left (1,2)->(1,1)->(2,1)->(3,1)->(4,1)->(5,1)->(5,2)->B=(5,3) weight 8
    // From B=(5,3), going up hits (4,3)->(3,3,'v') which only exits down -> dead end in Part 1!
    const gPart1 = contractTrailGraph(maze, false);
    expect(gPart1.edgeBetween(2, 3)?.weight).toBe(8);
    expect(gPart1.edgeBetween(3, 2)?.weight).toBe(8);

    // Parallel corridors: longer-first (2->3) and shorter-first replacement (3->2)
    const parallelMaze = parseTrailMap([
      '#.#####',
      '#...###',
      '#.#.###',
      '#...###',
      '#.#####',
    ].join('\n'));
    const gPar = contractTrailGraph(parallelMaze, true);
    // From C=(1,1): right is longer (weight 6), down is shorter (weight 2) -> tests longer-first!
    expect(gPar.edgeBetween(2, 3)?.weight).toBe(6);
    // From D=(3,1): up is shorter (weight 2), right is longer (weight 6) -> tests shorter-first replacement!
    expect(gPar.edgeBetween(3, 2)?.weight).toBe(6);
  });

  it('ignores self-loops from a junction back to itself', () => {
    const pureLoop = parseTrailMap([
      '##.###',
      '#....#',
      '#..#.#',
      '####.#',
    ].join('\n'));
    const g = contractTrailGraph(pureLoop, true);
    expect(g.vertexCount).toBe(3); // start=0, end=1, (1,2)=2
    expect(g.edgeBetween(2, 2)).toBeNull();
    expect(g.edgeBetween(0, 2)?.weight).toBe(1);
    expect(g.edgeBetween(2, 1)?.weight).toBe(4);
  });
});
