import { describe, expect, it } from 'vitest';
import { contractTrailGraph, TrailEdge, TrailGraph } from './trailGraph';
import { parseTrailMap, type TrailMap } from './trailMap';
import { findLongestPath } from './longestPath';

const OFFICIAL_EXAMPLE = [
  '#.#####################',
  '#.......#########...###',
  '#######.#########.#.###',
  '###.....#.>.>.###.#.###',
  '###v#####.#v#.###.#.###',
  '###.>...#.#.#.....#...#',
  '###v###.#.#.#########.#',
  '###...#.#.#.......#...#',
  '#####.#.#.#######.#.###',
  '#.....#.#.#.......#...#',
  '#.#####.#.#.#########v#',
  '#.#...#...#...###...>.#',
  '#.#.#v#######v###.###v#',
  '#...#.>.#...>.>.#.###.#',
  '#####v#.#.###v#.#.###.#',
  '#.....#...#...#.#.#...#',
  '#.#########.###.#.#.###',
  '#...###...#...#...#.###',
  '###.###.#.###v#####v###',
  '#...#...#.#.>.>.#.>.###',
  '#.###.###.#.###.#.#v###',
  '#.....###...###...#...#',
  '#####################.#',
].join('\n');

function bruteForceLongest(map: TrailMap, ignoreSlopes: boolean): number | null {
  const visited = new Uint8Array(map.size);
  const dfs = (cell: number, dist: number): number => {
    if (cell === map.end) return dist;
    let best = -1;
    for (const next of map.outgoingNeighbors(cell, ignoreSlopes)) {
      if (visited[next] === 1) continue;
      visited[next] = 1;
      const cand = dfs(next, dist + 1);
      if (cand > best) best = cand;
      visited[next] = 0;
    }
    return best;
  };
  visited[map.start] = 1;
  const best = dfs(map.start, 0);
  return best >= 0 ? best : null;
}

describe('longestPath', () => {
  it('solves the official 23x23 example for Part 1 (94) and Part 2 (154) and records improvements', () => {
    const map = parseTrailMap(OFFICIAL_EXAMPLE);
    const p1 = findLongestPath(contractTrailGraph(map, false));
    expect(p1?.distance).toBe(94);
    expect(p1?.improvements.length).toBeGreaterThan(0);
    expect(p1?.improvements[p1.improvements.length - 1]?.distance).toBe(94);

    const p2 = findLongestPath(contractTrailGraph(map, true));
    expect(p2?.distance).toBe(154);
    expect(p2?.prunedBranches).toBeGreaterThan(0);
  });

  it('handles 2x1 direct start-to-end, equal-weight dual-incoming tie-break, and unreachable', () => {
    const direct = findLongestPath(contractTrailGraph(parseTrailMap('.\n.'), false));
    expect(direct?.distance).toBe(1);
    expect(direct?.vertexPath).toEqual([0, 1]);

    const dualGraph = new TrailGraph([0, 1, 2, 3], 0, 1, [
      new TrailEdge(0, 2, [0, 10, 2]),
      new TrailEdge(0, 3, [0, 20, 3]),
      new TrailEdge(2, 1, [2, 11, 1]),
      new TrailEdge(3, 1, [3, 21, 1]),
    ]);
    const dualRes = findLongestPath(dualGraph);
    expect(dualRes?.distance).toBe(4);
    expect(dualRes?.improvements.length).toBe(1);

    const blocked = parseTrailMap('#.#\n#^#\n#.#');
    expect(findLongestPath(contractTrailGraph(blocked, false))).toBeNull();
    const disconnected = parseTrailMap('#.#\n###\n#.#');
    expect(findLongestPath(contractTrailGraph(disconnected, true))).toBeNull();
  });

  it('exercises forcedPreEnd skip and cyclic undirected visited guard', () => {
    // 0 -> 2 (w=2), 2 -> 3 (w=5), 3 -> 2 (w=5, hits visited[2]), 3 -> 1 (forcedPreEnd! skips 3->2)
    // Wait: 0 -> 2 -> 3 -> 1 (forcedPreEnd at 3 skips 3->2 and 3->4), plus 0 -> 4 -> 3 -> 1
    const g = new TrailGraph([0, 1, 2, 3, 4], 0, 1, [
      new TrailEdge(0, 2, [0, 10, 2]),
      new TrailEdge(0, 4, [0, 11, 4]),
      new TrailEdge(2, 4, [2, 12, 4]),
      new TrailEdge(4, 2, [4, 13, 2]),
      new TrailEdge(2, 3, [2, 14, 15, 3]),
      new TrailEdge(4, 3, [4, 16, 3]),
      new TrailEdge(3, 2, [3, 15, 14, 2]),
      new TrailEdge(3, 4, [3, 16, 4]),
      new TrailEdge(3, 1, [3, 1]),
    ]);
    const res = findLongestPath(g);
    expect(res?.distance).toBe(8); // 0->4 (2) ->2 (2) ->3 (3) ->1 (1) = 8
    expect(res?.vertexPath).toEqual([0, 4, 2, 3, 1]);
  });

  it('matches an independent cell-by-cell brute-force oracle across official and synthetic mazes', () => {
    const synthetic = [
      '#.#######',
      '#...>...#',
      '#.#.#v#.#',
      '#.#...#.#',
      '#.###.#.#',
      '#...v...#',
      '#.#.#.#.#',
      '#.....#.#',
      '#######.#',
    ].join('\n');
    const cyclicDeadEnd = [
      '#.#####',
      '#.....#',
      '#.#.#.#',
      '#...#.#',
      '###.#.#',
      '#.....#',
      '#####.#',
    ].join('\n');

    for (const raw of [OFFICIAL_EXAMPLE, synthetic, cyclicDeadEnd]) {
      const map = parseTrailMap(raw);
      for (const ignoreSlopes of [false, true]) {
        const res = findLongestPath(contractTrailGraph(map, ignoreSlopes));
        const oracle = bruteForceLongest(map, ignoreSlopes);
        expect(res?.distance ?? null).toBe(oracle);
      }
    }
  });
});
