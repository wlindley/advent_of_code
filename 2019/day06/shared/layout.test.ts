import { describe, expect, it } from 'vitest';
import {
  MAX_HISTOGRAM_BINS,
  MAX_TREE_SVG_NODES,
  binDepthHistogram,
  computeDepthHistogram,
  computeOrbitTreeLayout,
} from './layout';
import { parseOrbitMap } from './parser';
import type { DepthShellSummary } from './types';

describe('orbit layout & histogram', () => {
  it('computes exact depth shells and bins within maxBins', () => {
    const map = parseOrbitMap('COM)B\nB)C\nC)D\nD)E\nE)F\nB)G\nG)H\nD)I\nE)J\nJ)K\nK)L');
    const shells = computeDepthHistogram(map);
    expect(shells).toEqual([
      { depth: 0, nodeCount: 1 },
      { depth: 1, nodeCount: 1 },
      { depth: 2, nodeCount: 2 },
      { depth: 3, nodeCount: 2 },
      { depth: 4, nodeCount: 2 },
      { depth: 5, nodeCount: 2 },
      { depth: 6, nodeCount: 1 },
      { depth: 7, nodeCount: 1 },
    ]);
    expect(binDepthHistogram([], 5)).toEqual([]);
    const unbinned = binDepthHistogram(shells, MAX_HISTOGRAM_BINS);
    expect(unbinned).toHaveLength(8);
    expect(unbinned.reduce((acc, b) => acc + b.orbitContribution, 0)).toBe(42);

    const manyShells: DepthShellSummary[] = Array.from({ length: 100 }, (_, depth) => ({
      depth,
      nodeCount: 2,
    }));
    const binned = binDepthHistogram(manyShells, MAX_HISTOGRAM_BINS);
    expect(binned).toHaveLength(MAX_HISTOGRAM_BINS);
    expect(binned.every((b) => b.nodeCount > 0)).toBe(true);
    expect(binned.reduce((acc, b) => acc + b.nodeCount, 0)).toBe(200);
    expect(binned.reduce((acc, b) => acc + b.orbitContribution, 0)).toBe(2 * 4950);
    expect(() => binDepthHistogram(shells, 0)).toThrow(RangeError);
    expect(() => binDepthHistogram(shells, 2.5)).toThrow(RangeError);
  });

  it('computes crossing-free tree layout up to MAX_TREE_SVG_NODES and returns null above', () => {
    const small = parseOrbitMap('COM)B\nB)C\nB)D\nD)E');
    const layout = computeOrbitTreeLayout(small, 600, 400);
    expect(layout).not.toBeNull();
    expect(layout!.nodes).toHaveLength(5);
    expect(layout!.edges).toHaveLength(4);
    const byId = new Map(layout!.nodes.map((n) => [n.id, n]));
    for (const edge of layout!.edges) {
      expect(byId.get(edge.parentId)!.x).toBeLessThan(byId.get(edge.childId)!.x);
    }
    expect(byId.get(small.idOf('C')!)!.y).not.toBe(byId.get(small.idOf('D')!)!.y);
    expect(() => computeOrbitTreeLayout(small, 0, 400)).toThrow(RangeError);
    expect(() => computeOrbitTreeLayout(small, 600, -10)).toThrow(RangeError);

    const boundaryLines = Array.from({ length: MAX_TREE_SVG_NODES - 1 }, (_, i) =>
      `${i === 0 ? 'COM' : `N${i}`})N${i + 1}`,
    ).join('\n');
    expect(computeOrbitTreeLayout(parseOrbitMap(boundaryLines), 600, 400)).not.toBeNull();

    const overLines = `${boundaryLines}\nN${MAX_TREE_SVG_NODES - 1})N${MAX_TREE_SVG_NODES}`;
    expect(computeOrbitTreeLayout(parseOrbitMap(overLines), 600, 400)).toBeNull();
  });
});
