import { describe, expect, it } from 'vitest';
import { GridPoint, parseAntennaMap } from './map';
import {
  collectAntinodes,
  DEFAULT_MAX_TRACE_STEPS,
  ResonanceTraceFrame,
  traceAntinodes,
  type AntinodeProjectionRule,
} from './resonance';

const TEST_REFLECTION_RULE: AntinodeProjectionRule = {
  id: 'test-reflection',
  label: 'Test exterior reflection',
  projectPair(a, b, rows, cols) {
    const dr = b.row - a.row;
    const dc = b.col - a.col;
    const candidates = [new GridPoint(a.row - dr, a.col - dc), new GridPoint(b.row + dr, b.col + dc)];
    const inBounds: GridPoint[] = [];
    const outOfBounds: GridPoint[] = [];
    for (const pt of candidates) {
      if (pt.row >= 0 && pt.row < rows && pt.col >= 0 && pt.col < cols) inBounds.push(pt);
      else outOfBounds.push(pt);
    }
    return { inBounds, outOfBounds };
  },
};

const BROKEN_OOB_RULE: AntinodeProjectionRule = {
  id: 'broken-oob',
  label: 'Broken OOB rule',
  projectPair(_a, _b, rows, cols) {
    return { inBounds: [new GridPoint(rows, cols)], outOfBounds: [] };
  },
};

describe('ResonanceTraceFrame', () => {
  it('freezes fields and computes uniqueCount dynamically from cumulativeAntinodes', () => {
    const a = new GridPoint(1, 1);
    const b = new GridPoint(1, 2);
    const p1 = new GridPoint(1, 0);
    const p2 = new GridPoint(1, 3);
    const frame = new ResonanceTraceFrame({
      stepIndex: 0,
      totalPairs: 1,
      frequency: 'a',
      anchorA: a,
      anchorB: b,
      inBounds: [p1, p2],
      outOfBounds: [],
      added: [p1, p2],
      duplicates: [],
      cumulativeAntinodes: [p1, p2],
    });
    expect(Object.isFrozen(frame)).toBe(true);
    expect(Object.isFrozen(frame.cumulativeAntinodes)).toBe(true);
    expect(frame.uniqueCount).toBe(2);
    expect(frame.frequency).toBe('a');
  });
});

describe('collectAntinodes', () => {
  it('deduplicates overlapping antinodes across pairs and frequencies', () => {
    const map = parseAntennaMap(['aa.', '..A', '..A'].join('\n'));
    const result = collectAntinodes(map, TEST_REFLECTION_RULE);
    expect(result).toEqual([new GridPoint(0, 2)]);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('throws RangeError if a rule emits an out-of-bounds point inside inBounds', () => {
    const map = parseAntennaMap('aa');
    expect(() => collectAntinodes(map, BROKEN_OOB_RULE)).toThrow(RangeError);
  });
});

describe('traceAntinodes', () => {
  it('validates maxSteps before returning empty trace on maps with zero pairs', () => {
    const emptyMap = parseAntennaMap('a.\n.b');
    expect(() => traceAntinodes(emptyMap, TEST_REFLECTION_RULE, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceAntinodes(emptyMap, TEST_REFLECTION_RULE, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => traceAntinodes(emptyMap, TEST_REFLECTION_RULE, { maxSteps: 1.5 })).toThrow(RangeError);
    expect(traceAntinodes(emptyMap, TEST_REFLECTION_RULE)).toEqual([]);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(300);
  });

  it('tracks added, duplicates, outOfBounds, and cumulativeAntinodes across pairs', () => {
    // 3 collinear 'a' antennas in row 0: .aaa.. -> pairs: (0,1)&(0,2), (0,1)&(0,3), (0,2)&(0,3)
    const map = parseAntennaMap('.aaa..');
    const frames = traceAntinodes(map, TEST_REFLECTION_RULE);
    expect(frames).toHaveLength(3);
    // Pair 0: (0,1) & (0,2) -> (0,0) added, (0,3) added
    expect(frames[0]!.added).toEqual([new GridPoint(0, 0), new GridPoint(0, 3)]);
    expect(frames[0]!.duplicates).toEqual([]);
    expect(frames[0]!.uniqueCount).toBe(2);
    // Pair 1: (0,1) & (0,3) -> (0,-1) OOB, (0,5) added
    expect(frames[1]!.outOfBounds).toEqual([new GridPoint(0, -1)]);
    expect(frames[1]!.added).toEqual([new GridPoint(0, 5)]);
    expect(frames[1]!.uniqueCount).toBe(3);
    // Pair 2: (0,2) & (0,3) -> (0,1) added, (0,4) added
    expect(frames[2]!.uniqueCount).toBe(5);
  });

  it('detects duplicate projections into cumulative antinodes', () => {
    // Pair (0,0)&(0,1)->(0,2); Pair (1,2)&(2,2)->(0,2) duplicate!
    const map = parseAntennaMap(['aa.', '..A', '..A'].join('\n'));
    const frames = traceAntinodes(map, TEST_REFLECTION_RULE);
    expect(frames).toHaveLength(2);
    expect(frames[1]!.added).toEqual([]);
    expect(frames[1]!.duplicates).toEqual([new GridPoint(0, 2)]);
    expect(frames[1]!.uniqueCount).toBe(1);
  });

  it('samples trace frames while preserving exact cumulative antinodes on unsampled pairs', () => {
    const map = parseAntennaMap('.aaaa.');
    // 4 antennas -> 6 pairs
    const full = collectAntinodes(map, TEST_REFLECTION_RULE);
    const sampled = traceAntinodes(map, TEST_REFLECTION_RULE, { maxSteps: 3 });
    expect(sampled).toHaveLength(3);
    expect(sampled[0]!.stepIndex).toBe(0);
    expect(sampled[2]!.stepIndex).toBe(5);
    expect(sampled[2]!.uniqueCount).toBe(full.length);

    const single = traceAntinodes(map, TEST_REFLECTION_RULE, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.stepIndex).toBe(5);
    expect(single[0]!.uniqueCount).toBe(full.length);
  });

  it('throws RangeError in traceAntinodes when rule emits out-of-bounds point inside inBounds', () => {
    const map = parseAntennaMap('aa');
    expect(() => traceAntinodes(map, BROKEN_OOB_RULE)).toThrow(RangeError);
  });
});
