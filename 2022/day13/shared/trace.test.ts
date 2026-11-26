import { describe, expect, it } from 'vitest';
import {
  comparePackets,
  ComparisonTrace,
  parsePacket,
  traceComparison,
  type ComparisonStepKind,
} from './index';

describe('comparison trace', () => {
  it('records all six comparison step kinds and deep-freezes the trace', () => {
    const t1 = traceComparison(parsePacket('[[1],[2,3,4]]'), parsePacket('[[1],4]'));
    const t2 = traceComparison(parsePacket('[9]'), parsePacket('[[8,7,6]]'));
    const t3 = traceComparison(parsePacket('[1,2]'), parsePacket('[1,2,3]'));
    const t4 = traceComparison(parsePacket('[7,7,7,7]'), parsePacket('[7,7,7]'));

    expect(t1).toBeInstanceOf(ComparisonTrace);
    expect(Object.isFrozen(t1)).toBe(true);
    expect(Object.isFrozen(t1.steps)).toBe(true);
    expect(Object.isFrozen(t1.steps[0])).toBe(true);

    const observedKinds = new Set<ComparisonStepKind>(
      [t1, t2, t3, t4].flatMap((trace) => trace.steps.map((step) => step.kind)),
    );
    expect(observedKinds).toEqual(
      new Set<ComparisonStepKind>([
        'compare-list',
        'compare-int',
        'promote-left',
        'promote-right',
        'left-exhausted',
        'right-exhausted',
      ]),
    );
    expect(t1.steps.some((s) => s.kind === 'promote-right' && s.outcome === null)).toBe(true);
    expect(t2.steps.some((s) => s.kind === 'promote-left' && s.outcome === null)).toBe(true);
  });

  it('handles equal lists and mixed-type equivalence with outcome 0', () => {
    const empty = traceComparison(parsePacket('[]'), parsePacket('[]'));
    expect(empty.outcome).toBe(0);
    expect(empty.steps).toHaveLength(1);
    expect(empty.steps[0]!.kind).toBe('compare-list');

    const equiv = traceComparison(parsePacket('[4]'), parsePacket('[[4]]'));
    expect(equiv.outcome).toBe(0);
    expect(equiv.steps.map((s) => s.kind)).toEqual([
      'compare-list',
      'promote-left',
      'compare-list',
      'compare-int',
    ]);
  });

  it('satisfies traceComparison(l, r).outcome === comparePackets(l, r) across diverse pairs', () => {
    const pairs: readonly [string, string][] = [
      ['[1,1,3,1,1]', '[1,1,5,1,1]'],
      ['[[1],[2,3,4]]', '[[1],4]'],
      ['[9]', '[[8,7,6]]'],
      ['[[4,4],4,4]', '[[4,4],4,4,4]'],
      ['[7,7,7,7]', '[7,7,7]'],
      ['[]', '[3]'],
      ['[[[]]]', '[[]]'],
      ['[1,[2,[3,[4,[5,6,7]]]],8,9]', '[1,[2,[3,[4,[5,6,0]]]],8,9]'],
      ['[[4]]', '[4]'],
      ['[10,2]', '[2,10]'],
    ];
    for (const [leftRaw, rightRaw] of pairs) {
      const left = parsePacket(leftRaw);
      const right = parsePacket(rightRaw);
      expect(traceComparison(left, right).outcome).toBe(comparePackets(left, right));
    }
  });
});
