import { describe, expect, it } from 'vitest';
import { findLongestPath } from './longestPath';
import { contractTrailGraph } from './trailGraph';
import { parseTrailMap } from './trailMap';
import { buildHikeTrace, DEFAULT_MAX_TRACE_STEPS } from './hikeTrace';

const BRANCHING_MAZE = [
  '#.#####',
  '#...###',
  '#.#.###',
  '#...###',
  '#.#####',
].join('\n');

describe('hikeTrace', () => {
  it('builds contracted, search, and hike phases when options are omitted', () => {
    const map = parseTrailMap(BRANCHING_MAZE);
    const graph = contractTrailGraph(map, true);
    const result = findLongestPath(graph);
    const frames = buildHikeTrace(map, graph, result);

    expect(frames.length).toBeLessThanOrEqual(DEFAULT_MAX_TRACE_STEPS);
    expect(frames[0]?.phase).toBe('contracted');
    expect(frames[0]?.hikerCell).toBe(map.start);
    expect(frames.some((f) => f.phase === 'search')).toBe(true);
    expect(frames.some((f) => f.phase === 'hike')).toBe(true);

    const last = frames[frames.length - 1]!;
    expect(last.isFinal).toBe(true);
    expect(last.distance).toBe(result?.distance);
    expect(last.hikerCell).toBe(map.end);
    expect(last.totalSteps).toBe(frames.length);
  });

  it('samples frames cleanly with explicit maxSteps including maxSteps=1 and multi-hop hikes', () => {
    const map = parseTrailMap([
      '#.#####',
      '#...###',
      '#.#.###',
      '#.....#',
      '###.#.#',
      '###...#',
      '#####.#',
    ].join('\n'));
    const graph = contractTrailGraph(map, true);
    const result = findLongestPath(graph);

    const full = buildHikeTrace(map, graph, result, { maxSteps: 40 });
    expect(full.filter((f) => f.phase === 'hike').length).toBeGreaterThan(1);

    const bounded = buildHikeTrace(map, graph, result, { maxSteps: 3 });
    expect(bounded.length).toBe(3);
    expect(bounded.map((f) => f.step)).toEqual([0, 1, 2]);
    expect(bounded[2]?.isFinal).toBe(true);

    const single = buildHikeTrace(map, graph, result, { maxSteps: 1 });
    expect(single.length).toBe(1);
    expect(single[0]?.isFinal).toBe(true);
    expect(single[0]?.phase).toBe('hike');
  });

  it('emits unreachable phase when result is null and validates maxSteps', () => {
    const map = parseTrailMap('#.#\n#^#\n#.#');
    const graph = contractTrailGraph(map, false);
    const frames = buildHikeTrace(map, graph, null);

    expect(frames.length).toBe(2);
    expect(frames[0]?.phase).toBe('contracted');
    expect(frames[1]?.phase).toBe('unreachable');
    expect(frames[1]?.isFinal).toBe(true);
    expect(frames[1]?.distance).toBe(0);

    const single = buildHikeTrace(map, graph, null, { maxSteps: 1 });
    expect(single.length).toBe(1);
    expect(single[0]?.phase).toBe('unreachable');

    expect(() => buildHikeTrace(map, graph, null, { maxSteps: 0 })).toThrow(RangeError);
  });
});
