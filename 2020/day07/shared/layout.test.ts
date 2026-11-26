import { describe, expect, it } from 'vitest';
import { parseBagRuleGraph } from './graph';
import {
  DEFAULT_VISIBLE_NODES_PER_LAYER,
  layoutBagTraceFrame,
  MAX_SKIP_ARC_LIFT,
  MAX_VISIBLE_NODES_PER_LAYER,
  SKIP_ARC_STEP,
} from './layout';
import { BagLayer, BagLayerEdge, BagLayerNode, NESTED_BAG_COUNT_POLICY } from './policy';
import { BagTraceFrame, traceBagQuery } from './trace';

describe('layoutBagTraceFrame', () => {
  it('validates maxVisiblePerLayer bounds and handles absent-target empty frames', () => {
    const empty = new BagTraceFrame('shiny gold', 'ancestor-colors', 0, 0, [], 1);
    expect(() => layoutBagTraceFrame(empty, 0)).toThrow(RangeError);
    expect(() => layoutBagTraceFrame(empty, MAX_VISIBLE_NODES_PER_LAYER + 1)).toThrow(RangeError);
    expect(() => layoutBagTraceFrame(empty, 1.5)).toThrow(RangeError);

    const layout = layoutBagTraceFrame(empty, DEFAULT_VISIBLE_NODES_PER_LAYER);
    expect(Object.isFrozen(layout)).toBe(true);
    expect(layout.columns).toEqual([]);
    expect(layout.nodes).toEqual([]);
    expect(layout.edges).toEqual([]);
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
  });

  it('anchors columns across totalLayers and lifts skip-layer Bezier curves upward', () => {
    const graph = parseBagRuleGraph([
      'shiny gold bags contain 1 a bag, 1 b bag, 1 d bag.',
      'a bags contain 1 b bag.',
      'b bags contain 1 c bag.',
      'c bags contain 1 d bag.',
      'd bags contain no other bags.',
    ].join('\n'));
    const frames = traceBagQuery(graph, NESTED_BAG_COUNT_POLICY, 'shiny gold', undefined);
    const finalLayout = layoutBagTraceFrame(frames.at(-1)!, DEFAULT_VISIBLE_NODES_PER_LAYER);

    expect(finalLayout.columns.length).toBe(5);
    expect(finalLayout.columns.map((c) => c.x)).toEqual([28, 248, 468, 688, 908]);
    expect(finalLayout.nodes.find((n) => n.color === 'shiny gold')?.isOrigin).toBe(true);
    expect(finalLayout.nodes.find((n) => n.color === 'd')?.isActive).toBe(true);

    const adj = finalLayout.edges.find((e) => e.fromColor === 'a' && e.toColor === 'b')!;
    const skip1 = finalLayout.edges.find((e) => e.fromColor === 'shiny gold' && e.toColor === 'b')!;
    const skipLong = finalLayout.edges.find((e) => e.fromColor === 'shiny gold' && e.toColor === 'd')!;
    expect(adj.isSkip).toBe(false);
    expect(skip1.isSkip).toBe(true);
    expect(skipLong.isSkip).toBe(true);
    expect(SKIP_ARC_STEP * 3).toBeGreaterThanOrEqual(MAX_SKIP_ARC_LIFT);
  });

  it('drops edges when either !from or !to is truncated beyond maxVisiblePerLayer', () => {
    const l0 = new BagLayer(0, [new BagLayerNode('shiny gold', 1n)], []);
    const l1 = new BagLayer(
      1,
      [new BagLayerNode('alpha', 5n), new BagLayerNode('beta', 1n)],
      [new BagLayerEdge('shiny gold', 'alpha', 1n), new BagLayerEdge('shiny gold', 'beta', 1n)],
    );
    const l2 = new BagLayer(
      2,
      [new BagLayerNode('gamma', 5n), new BagLayerNode('delta', 1n)],
      [
        new BagLayerEdge('alpha', 'gamma', 1n),
        new BagLayerEdge('beta', 'gamma', 1n),
        new BagLayerEdge('alpha', 'delta', 1n),
      ],
    );
    const frame = new BagTraceFrame('shiny gold', 'nested-bag-count', 2, 3, [l0, l1, l2], 5);
    const layout = layoutBagTraceFrame(frame, 1);

    expect(layout.columns.map((c) => c.hiddenCount)).toEqual([0, 1, 1]);
    expect(layout.edges.map((e) => `${e.fromColor}->${e.toColor}`)).toEqual([
      'shiny gold->alpha',
      'alpha->gamma',
    ]);
  });
});
