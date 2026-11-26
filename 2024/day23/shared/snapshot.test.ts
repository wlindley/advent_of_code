import { describe, expect, it } from 'vitest';
import { parseLanGraph } from './graph';
import {
  DEFAULT_MAX_TRACE_STEPS,
  LanPartySnapshot,
  buildMaximumCliqueTrace,
  buildTriangleTrace,
} from './snapshot';

const SMALL_TRIANGLE_GRAPH = parseLanGraph(
  ['ta-tb', 'tb-tc', 'ta-tc', 'ta-td', 'tc-td', 'aa-bb', 'bb-cc', 'aa-cc'].join('\n'),
);

describe('LanPartySnapshot and trace builders', () => {
  it('builds triangle traces with default and explicit maxSteps options', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(48);

    const defaultFrames = buildTriangleTrace(SMALL_TRIANGLE_GRAPH, 't');
    expect(defaultFrames).toHaveLength(3);
    expect(defaultFrames[0]!.phase).toBe('step');
    expect(defaultFrames[0]!.isComplete).toBe(false);
    expect(defaultFrames[0]!.revealedCount).toBe(1);
    expect(defaultFrames[0]!.totalCliques).toBe(2);
    expect(defaultFrames[0]!.filterPrefix).toBe('t');
    expect(defaultFrames[0]!.activeClique?.size).toBe(3);
    expect(defaultFrames[0]!.largestRevealedSize).toBe(3);

    const last = defaultFrames[defaultFrames.length - 1]!;
    expect(last.phase).toBe('complete');
    expect(last.isComplete).toBe(true);
    expect(last.revealedCount).toBe(2);

    const singleFrame = buildTriangleTrace(SMALL_TRIANGLE_GRAPH, 't', { maxSteps: 1 });
    expect(singleFrame).toHaveLength(1);
    expect(singleFrame[0]!.isComplete).toBe(true);
  });

  it('handles empty triangle results and maximum-clique history traces', () => {
    const singleEdge = parseLanGraph('aa-bb');
    const emptyTriangleFrames = buildTriangleTrace(singleEdge, 't');
    expect(emptyTriangleFrames).toHaveLength(1);
    expect(emptyTriangleFrames[0]!.isComplete).toBe(true);
    expect(emptyTriangleFrames[0]!.totalCliques).toBe(0);
    expect(emptyTriangleFrames[0]!.activeClique).toBeNull();
    expect(emptyTriangleFrames[0]!.largestRevealedSize).toBe(0);

    const maxDefault = buildMaximumCliqueTrace(SMALL_TRIANGLE_GRAPH);
    expect(maxDefault[maxDefault.length - 1]!.activeClique?.size).toBe(3);

    const maxSampled = buildMaximumCliqueTrace(SMALL_TRIANGLE_GRAPH, { maxSteps: 2 });
    expect(maxSampled.length).toBeLessThanOrEqual(2);
    expect(maxSampled[maxSampled.length - 1]!.isComplete).toBe(true);
  });

  it('validates revealedCount bounds on LanPartySnapshot', () => {
    expect(() => new LanPartySnapshot('complete', SMALL_TRIANGLE_GRAPH, [], -1, '')).toThrow(
      RangeError,
    );
    expect(() => new LanPartySnapshot('complete', SMALL_TRIANGLE_GRAPH, [], 1, '')).toThrow(
      RangeError,
    );
    expect(() => new LanPartySnapshot('complete', SMALL_TRIANGLE_GRAPH, [], 0.5, '')).toThrow(
      RangeError,
    );
  });
});
