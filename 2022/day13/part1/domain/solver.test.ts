import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_TRACE_STEPS,
  PacketInt,
  PacketList,
  PacketPair,
  PairTraceFrame,
  solver,
  traceComparison,
} from './index';

const OFFICIAL_EXAMPLE = [
  '[1,1,3,1,1]',
  '[1,1,5,1,1]',
  '',
  '[[1],[2,3,4]]',
  '[[1],4]',
  '',
  '[9]',
  '[[8,7,6]]',
  '',
  '[[4,4],4,4]',
  '[[4,4],4,4,4]',
  '',
  '[7,7,7,7]',
  '[7,7,7]',
  '',
  '[]',
  '[3]',
  '',
  '[[[]]]',
  '[[]]',
  '',
  '[1,[2,[3,[4,[5,6,7]]]],8,9]',
  '[1,[2,[3,[4,[5,6,0]]]],8,9]',
].join('\n');

describe('day13 part1 solver', () => {
  it('solves the official 8-pair example to 13', () => {
    const input = solver.parse(OFFICIAL_EXAMPLE);
    expect(input.pairCount).toBe(8);
    expect(solver.solve(input)).toBe(13);
  });

  it('does not count equivalent pairs such as [4] vs [[4]] as right-ordered', () => {
    const input = solver.parse('[4]\n[[4]]\n\n[1]\n[2]');
    expect(solver.solve(input)).toBe(2);
  });

  it('builds complete trace frames and computes dynamic summary getters', () => {
    const input = solver.parse(OFFICIAL_EXAMPLE);
    const frames = solver.trace?.(input) ?? [];
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(150);
    expect(frames).toHaveLength(8);
    expect(Object.isFrozen(frames)).toBe(true);

    const first = frames[0]!;
    expect(first.pairIndex).toBe(1);
    expect(first.order).toBe(-1);
    expect(first.isRightOrder).toBe(true);
    expect(first.rightOrderCount).toBe(1);
    expect(first.rightOrderIndexSum).toBe(1);
    expect(first.isComplete).toBe(false);

    const last = frames[7]!;
    expect(last.pairIndex).toBe(8);
    expect(last.order).toBe(1);
    expect(last.isRightOrder).toBe(false);
    expect(last.rightOrderCount).toBe(4);
    expect(last.rightOrderIndexSum).toBe(13);
    expect(last.isComplete).toBe(true);
  });

  it('samples trace frames while preserving endpoints and validates maxSteps', () => {
    const blocks = Array.from({ length: 10 }, (_, i) => `[${i}]\n[${i + 1}]`).join('\n\n');
    const input = solver.parse(blocks);

    const sampled = solver.trace?.(input, { maxSteps: 4 }) ?? [];
    expect(sampled.map((frame) => frame.pairIndex)).toEqual([1, 4, 7, 10]);
    expect(sampled[3]!.isComplete).toBe(true);
    expect(sampled[3]!.rightOrderIndexSum).toBe(55);

    const single = solver.trace?.(input, { maxSteps: 1 }) ?? [];
    expect(single.map((frame) => frame.pairIndex)).toEqual([10]);

    expect(() => solver.trace?.(input, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace?.(input, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => solver.trace?.(input, { maxSteps: 2.5 })).toThrow(RangeError);
  });

  it('enforces PairTraceFrame constructor invariants', () => {
    const pair = new PacketPair(
      new PacketList([new PacketInt(1)]),
      new PacketList([new PacketInt(2)]),
    );
    const comparison = traceComparison(pair.left, pair.right);

    expect(() => new PairTraceFrame(1, 0, pair, comparison, [-1])).toThrow(RangeError);
    expect(() => new PairTraceFrame(0, 1, pair, comparison, [])).toThrow(RangeError);
    expect(() => new PairTraceFrame(2, 1, pair, comparison, [-1, -1])).toThrow(RangeError);
    expect(() => new PairTraceFrame(1, 1, pair, comparison, [-1, -1])).toThrow(RangeError);
    expect(() => new PairTraceFrame(1, 1, pair, comparison, [1])).toThrow(Error);
  });
});
