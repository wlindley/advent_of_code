import { describe, expect, it } from 'vitest';
import { AdapterChain } from './chain';
import { traceArrangements, traceDifferences } from './trace';
import {
  ChainEdgeArc,
  ChainNodeSlot,
  ChainViewport,
  computeChainViewport,
  DEFAULT_VIEWPORT_SLOTS,
} from './viewport';

describe('ChainViewport value objects', () => {
  it('constructs frozen ChainNodeSlot, ChainEdgeArc, and ChainViewport with derived getters', () => {
    const slot0 = new ChainNodeSlot(0, 0, 'outlet', 1n, 1);
    const slot1 = new ChainNodeSlot(1, 1, 'adapter', null, 0);
    const arc = new ChainEdgeArc(0, 1, 1);
    const vp = new ChainViewport(0, [slot0, slot1], [arc], 0, 0);

    expect(DEFAULT_VIEWPORT_SLOTS).toBe(36);
    expect(vp.nodeCount).toBe(2);
    expect(vp.endIndex).toBe(2);
    expect(vp.slotOf(0)).toBe(0);
    expect(vp.slotOf(1)).toBe(1);
    expect(vp.slotOf(-1)).toBeNull();
    expect(vp.slotOf(2)).toBeNull();
    expect(vp.hasLeftOverflow).toBe(false);
    expect(vp.hasRightOverflow).toBe(true);
    expect(Object.isFrozen(slot0)).toBe(true);
    expect(Object.isFrozen(arc)).toBe(true);
    expect(Object.isFrozen(vp)).toBe(true);

    expect(() => new ChainViewport(0, [], [], 0, 0)).toThrow(RangeError);
  });
});

describe('computeChainViewport', () => {
  it('projects difference and arrangement frames with monotonic maxWaysLog2 and overflow flags', () => {
    const chain = new AdapterChain([16, 10, 15, 5, 1, 11, 7, 19, 6, 12, 4]);
    const diffFrames = traceDifferences(chain, 240);
    const diffVp = computeChainViewport(chain, diffFrames[0]!, DEFAULT_VIEWPORT_SLOTS);
    expect(diffVp.nodeCount).toBe(13);
    expect(diffVp.maxWaysLog2).toBe(0);
    expect(diffVp.edges).toHaveLength(12);
    expect(diffVp.nodes[0]!.ways).toBeNull();
    expect(diffVp.nodes[0]!.normalizedWaysHeight).toBe(0);
    expect(diffVp.hasLeftOverflow).toBe(false);
    expect(diffVp.hasRightOverflow).toBe(false);

    const arrFrames = traceArrangements(chain, 240);
    const midArrVp = computeChainViewport(chain, arrFrames[5]!, DEFAULT_VIEWPORT_SLOTS);
    expect(midArrVp.nodes[5]!.ways).toBe(4n);
    expect(midArrVp.nodes[6]!.ways).toBeNull();
    expect(midArrVp.maxWaysLog2).toBe(2);
    expect(midArrVp.nodes[5]!.normalizedWaysHeight).toBe(1);
    expect(midArrVp.nodes[6]!.normalizedWaysHeight).toBe(0);
  });

  it('clips predecessor arcs where p < start while keeping p >= start for maxSlots = 2 and 1', () => {
    const chain = new AdapterChain([1, 2, 3, 4]);
    const arrFrames = traceArrangements(chain, 240);
    // activeIndex = 4 (joltage 4) has 3 predecessors: [1, 2, 3].
    const frame4 = arrFrames[4]!;
    expect(frame4.activeIndex).toBe(4);
    expect(frame4.predecessorIndices).toEqual([1, 2, 3]);

    const vp2 = computeChainViewport(chain, frame4, 2);
    expect(vp2.startIndex).toBe(3);
    expect(vp2.endIndex).toBe(5);
    expect(vp2.hasLeftOverflow).toBe(true);
    expect(vp2.hasRightOverflow).toBe(true);
    expect(vp2.edges).toHaveLength(1);
    expect(vp2.edges[0]).toEqual(new ChainEdgeArc(3, 4, 1));

    const vp1 = computeChainViewport(chain, frame4, 1);
    expect(vp1.startIndex).toBe(4);
    expect(vp1.endIndex).toBe(5);
    expect(vp1.edges).toEqual([]);
  });

  it('rejects invalid maxSlots and mismatched chain/frame lengths', () => {
    const chain = new AdapterChain([1, 2, 3]);
    const other = new AdapterChain([1, 2]);
    const diffFrame = traceDifferences(chain, 240)[0]!;
    const arrFrame = traceArrangements(chain, 240)[0]!;

    expect(() => computeChainViewport(chain, diffFrame, 0)).toThrow(RangeError);
    expect(() => computeChainViewport(chain, diffFrame, 1.5)).toThrow(RangeError);
    expect(() => computeChainViewport(other, diffFrame, 10)).toThrow(RangeError);
    expect(() => computeChainViewport(other, arrFrame, 10)).toThrow(RangeError);
  });
});
