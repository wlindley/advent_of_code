import { describe, expect, it } from 'vitest';
import {
  buildCosmicExpansionTrace,
  CosmicExpansionTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  parseUniverseMap,
  sumExpandedPairwiseDistances,
} from './index';

const EXAMPLE_RAW = [
  '...#......',
  '.......#..',
  '#.........',
  '..........',
  '......#...',
  '.#........',
  '.........#',
  '..........',
  '.......#..',
  '#...#.....',
].join('\n');

describe('CosmicExpansionTraceFrame and buildCosmicExpansionTrace', () => {
  it('builds a full unsampled trace for the AoC example when R + C <= DEFAULT_MAX_TRACE_STEPS', () => {
    const universe = parseUniverseMap(EXAMPLE_RAW);
    const frames = buildCosmicExpansionTrace(universe, 2n);

    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(20);
    expect(frames[0]).toBeInstanceOf(CosmicExpansionTraceFrame);
    expect(Object.isFrozen(frames[0])).toBe(true);

    // Row 3 and Row 7 are empty rifts; Cols 2, 5, 8 are empty rifts.
    expect(frames[3]!.axis).toBe('row');
    expect(frames[3]!.index).toBe(3);
    expect(frames[3]!.isEmptyRift).toBe(true);
    expect(frames[3]!.stepWidth).toBe(2n);
    expect(frames[3]!.prefixGalaxies).toBe(3);
    expect(frames[3]!.suffixGalaxies).toBe(6);
    expect(frames[3]!.stepContribution).toBe(36n);

    expect(frames[12]!.axis).toBe('col');
    expect(frames[12]!.index).toBe(2);
    expect(frames[12]!.isEmptyRift).toBe(true);
    expect(frames[12]!.stepWidth).toBe(2n);

    const last = frames[frames.length - 1]!;
    expect(last.axis).toBe('col');
    expect(last.index).toBe(9);
    expect(last.runningTotal).toBe(374n);
    expect(last.rowTotal + last.colTotal).toBe(sumExpandedPairwiseDistances(universe, 2n));
  });

  it('preserves isEmptyRift accuracy when expansionFactor is 1n', () => {
    const universe = parseUniverseMap(EXAMPLE_RAW);
    const frames = buildCosmicExpansionTrace(universe, 1n);
    expect(frames[3]!.isEmptyRift).toBe(true);
    expect(frames[3]!.stepWidth).toBe(1n);
    expect(frames[0]!.isEmptyRift).toBe(false);
    expect(frames[frames.length - 1]!.runningTotal).toBe(292n);
  });

  it('samples endpoints cleanly when maxSteps < R + C and when maxSteps === 1', () => {
    const universe = parseUniverseMap(EXAMPLE_RAW);
    const sampled = buildCosmicExpansionTrace(universe, 2n, { maxSteps: 6 });
    expect(sampled).toHaveLength(6);
    expect(sampled[0]!.axis).toBe('row');
    expect(sampled[0]!.index).toBe(0);
    expect(sampled[5]!.axis).toBe('col');
    expect(sampled[5]!.index).toBe(9);
    expect(sampled[5]!.runningTotal).toBe(374n);

    const single = buildCosmicExpansionTrace(universe, 2n, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.axis).toBe('col');
    expect(single[0]!.index).toBe(9);
    expect(single[0]!.runningTotal).toBe(374n);
  });

  it('caps a 140x140 universe at DEFAULT_MAX_TRACE_STEPS (120 frames)', () => {
    const rows = Array.from({ length: 140 }, (_, r) =>
      r % 10 === 0 ? '#'.repeat(140) : '.'.repeat(140),
    ).join('\n');
    const universe = parseUniverseMap(rows);
    const frames = buildCosmicExpansionTrace(universe, 2n);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(frames).toHaveLength(120);
    expect(frames[119]!.runningTotal).toBe(sumExpandedPairwiseDistances(universe, 2n));
  });

  it('rejects invalid expansionFactor and invalid maxSteps', () => {
    const universe = parseUniverseMap('.#\n#.');
    expect(() => buildCosmicExpansionTrace(universe, 0n)).toThrow(RangeError);
    expect(() => buildCosmicExpansionTrace(universe, -2n)).toThrow(RangeError);
    expect(() => buildCosmicExpansionTrace(universe, 2n, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => buildCosmicExpansionTrace(universe, 2n, { maxSteps: -1 })).toThrow(RangeError);
    expect(() => buildCosmicExpansionTrace(universe, 2n, { maxSteps: 2.5 })).toThrow(RangeError);
  });
});
