import { describe, expect, it } from 'vitest';
import { CalibrationEquation } from '../equation';
import { PART1_OPERATORS } from '../operator';
import { traceEquation } from '../search';
import { computeTreeLayout } from './treeLayout';

describe('computeTreeLayout', () => {
  it('returns an empty frozen layout when nodes are empty', () => {
    const layout = computeTreeLayout([]);
    expect(layout.nodes).toEqual([]);
    expect(layout.edges).toEqual([]);
    expect(layout.levelY).toEqual([]);
    expect(layout.width).toBe(0);
    expect(layout.height).toBe(0);
    expect(layout.maxDepth).toBe(0);
    expect(Object.isFrozen(layout)).toBe(true);
  });

  it('lays out a single-node trace without edges', () => {
    const trace = traceEquation(new CalibrationEquation(5n, [5n]), PART1_OPERATORS);
    const layout = computeTreeLayout(trace.nodes);
    expect(layout.nodes).toHaveLength(1);
    expect(layout.edges).toEqual([]);
    expect(layout.maxDepth).toBe(0);
    expect(layout.levelY).toHaveLength(1);
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
  });

  it('positions branching tree nodes without leaf collisions and links every child edge', () => {
    const trace = traceEquation(new CalibrationEquation(21n, [10n, 1n, 10n]), PART1_OPERATORS);
    const layout = computeTreeLayout(trace.nodes);
    expect(layout.nodes).toHaveLength(trace.nodes.length);
    expect(layout.edges).toHaveLength(trace.nodes.length - 1);
    expect(layout.maxDepth).toBe(2);
    expect(layout.levelY).toHaveLength(3);

    const byId = new Map(layout.nodes.map((entry) => [entry.node.id, entry]));
    const root = byId.get(0)!;
    const childrenOfRoot = layout.nodes.filter((entry) => entry.node.parentId === 0);
    expect(childrenOfRoot).toHaveLength(2);
    const expectedMidX = (childrenOfRoot[0]!.x + childrenOfRoot[1]!.x) / 2;
    expect(root.x).toBe(expectedMidX);

    const leafXs = layout.nodes.filter((entry) => entry.depth === 2).map((entry) => entry.x);
    expect(new Set(leafXs).size).toBe(leafXs.length);
    for (const edge of layout.edges) {
      expect(edge.y2).toBeGreaterThan(edge.y1);
    }
  });
});
