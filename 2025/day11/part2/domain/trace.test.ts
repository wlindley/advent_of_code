import { describe, expect, it } from 'vitest';
import { DEFAULT_MAX_TRACE_STEPS, PART2_TARGET, solver, traceReactorWaypoints } from './index';

const EXAMPLE = [
  'svr: aaa bbb', 'aaa: fft', 'fft: ccc', 'bbb: tty', 'tty: ccc', 'ccc: ddd eee',
  'ddd: hub', 'hub: fff', 'eee: dac', 'dac: fff', 'fff: ggg hhh', 'ggg: out', 'hhh: out',
].join('\n');

describe('day11 part2 trace', () => {
  it('traces all 14 nodes of official example with exact 4-state snapshot at out', () => {
    const frames = solver.trace!(solver.parse(EXAMPLE));
    expect([DEFAULT_MAX_TRACE_STEPS, frames.length, frames[0]!.totalGraphNodes]).toEqual([120, 14, 14]);
    expect(frames[0]!.isComplete).toBe(false);
    const last = frames[frames.length - 1]!;
    expect([last.isComplete, last.stepIndex, last.totalSteps]).toEqual([true, 13, 14]);
    const outState = last.states.get(PART2_TARGET)!;
    expect([outState.neither, outState.dacOnly, outState.fftOnly, outState.both]).toEqual([2n, 2n, 2n, 2n]);
  });

  it('computes longest-path layered layout across diamond shortcut and equal-depth merge', () => {
    const raw = 'svr: a d out\na: b\nb: c\nc: out\nd: e\ne: out\nfft: out\ndac: out';
    const frames = traceReactorWaypoints(solver.parse(raw));
    const layers = new Map(frames[0]!.relevantNodes.map((n) => [n.id, n.layer]));
    expect(layers.get('svr')).toBe(0);
    expect([layers.get('a'), layers.get('d')]).toEqual([1, 1]);
    expect([layers.get('b'), layers.get('e')]).toEqual([2, 2]);
    expect(layers.get('c')).toBe(3);
    expect(layers.get('out')).toBe(4);
  });

  it('emits 1 terminal frame for unreachable graphs and respects maxSteps sampling', () => {
    const empty = traceReactorWaypoints(solver.parse('svr: dead\ndac: fft\nout:'));
    expect(empty.length).toBe(1);
    expect([empty[0]!.activeNode, empty[0]!.relevantNodes.length, empty[0]!.edges.length, empty[0]!.activeEdges.length, empty[0]!.states.size, empty[0]!.isComplete]).toEqual([null, 0, 0, 0, 0, true]);

    const parsed = solver.parse(EXAMPLE);
    const one = traceReactorWaypoints(parsed, { maxSteps: 1 });
    expect([one.length, one[0]!.stepIndex, one[0]!.totalSteps, one[0]!.isComplete, one[0]!.states.get(PART2_TARGET)!.both]).toEqual([1, 0, 1, true, 2n]);

    const four = traceReactorWaypoints(parsed, { maxSteps: 4 });
    expect(four.length).toBe(4);
    expect(four.map((f) => f.stepIndex)).toEqual([0, 1, 2, 3]);
    expect([four[3]!.isComplete, four[3]!.states.get(PART2_TARGET)!.both]).toEqual([true, 2n]);
  });

  it('rejects invalid maxSteps values', () => {
    const g = solver.parse(EXAMPLE);
    for (const bad of [0, -2, 2.5, Number.NaN]) {
      expect(() => traceReactorWaypoints(g, { maxSteps: bad })).toThrow(RangeError);
    }
  });
});
