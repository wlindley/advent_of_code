import { describe, expect, it } from 'vitest';
import { parseBagRuleGraph } from './graph';
import { ANCESTOR_COLORS_POLICY, NESTED_BAG_COUNT_POLICY } from './policy';
import { BagTraceFrame, DEFAULT_MAX_TRACE_STEPS, traceBagQuery } from './trace';

const SAMPLE = [
  'light red bags contain 1 bright white bag.',
  'bright white bags contain 1 shiny gold bag.',
  'shiny gold bags contain 2 dark olive bags.',
  'dark olive bags contain no other bags.',
].join('\n');

describe('BagTraceFrame', () => {
  it('validates numeric bounds and freezes derived properties', () => {
    expect(() => new BagTraceFrame('shiny gold', 'ancestor-colors', -1, 1, [], 1)).toThrow(
      RangeError,
    );
    expect(() => new BagTraceFrame('shiny gold', 'ancestor-colors', 0, -1, [], 1)).toThrow(
      RangeError,
    );
    expect(() => new BagTraceFrame('shiny gold', 'ancestor-colors', 0, 0, [], 0)).toThrow(
      RangeError,
    );
    const empty = new BagTraceFrame('shiny gold', 'ancestor-colors', 0, 0, [], 2);
    expect(Object.isFrozen(empty)).toBe(true);
    expect(empty.targetPresent).toBe(false);
    expect(empty.activeLayer).toBeUndefined();
    expect(empty.runningTotal).toBe(0n);
    expect(empty.discoveredNodeCount).toBe(0);
  });
});

describe('traceBagQuery', () => {
  it('traces full progressive layers for both policies and caps steps cleanly', () => {
    const graph = parseBagRuleGraph(SAMPLE);
    const frames = traceBagQuery(graph, ANCESTOR_COLORS_POLICY, 'shiny gold', undefined);
    expect(frames.length).toBe(3);
    expect(frames[0]!.targetPresent).toBe(true);
    expect(frames[0]!.activeLayer?.depth).toBe(0);
    expect(frames[0]!.runningTotal).toBe(0n);
    expect(frames[0]!.discoveredNodeCount).toBe(1);
    expect(frames[2]!.revealedDepth).toBe(2);
    expect(frames[2]!.runningTotal).toBe(2n);
    expect(frames[2]!.discoveredNodeCount).toBe(3);

    const sampled = traceBagQuery(graph, NESTED_BAG_COUNT_POLICY, 'shiny gold', 1);
    expect(sampled.length).toBe(1);
    expect(sampled[0]!.revealedDepth).toBe(1);
    expect(sampled[0]!.runningTotal).toBe(2n);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(32);
  });

  it('produces a single absent-target frame when target color is missing', () => {
    const graph = parseBagRuleGraph(SAMPLE);
    const frames = traceBagQuery(graph, ANCESTOR_COLORS_POLICY, 'missing color', undefined);
    expect(frames.length).toBe(1);
    expect(frames[0]!.targetPresent).toBe(false);
    expect(frames[0]!.totalRuleCount).toBe(4);
  });

  it('rejects invalid maxSteps', () => {
    const graph = parseBagRuleGraph(SAMPLE);
    expect(() => traceBagQuery(graph, ANCESTOR_COLORS_POLICY, 'shiny gold', 0)).toThrow(RangeError);
  });
});
