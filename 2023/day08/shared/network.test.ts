import { describe, expect, it } from 'vitest';
import { WastelandNetwork, type NetworkNodeSpec, type Turn } from './network';

function buildSampleNetwork(): WastelandNetwork {
  const nodes: NetworkNodeSpec[] = [
    { label: 'AAA', leftId: 1, rightId: 2 },
    { label: 'BBB', leftId: 3, rightId: 4 },
    { label: 'CCC', leftId: 5, rightId: 6 },
    { label: 'DDD', leftId: 3, rightId: 3 },
    { label: 'EEE', leftId: 4, rightId: 4 },
    { label: 'GGG', leftId: 5, rightId: 5 },
    { label: 'ZZZ', leftId: 6, rightId: 6 },
  ];
  return new WastelandNetwork(['R', 'L'], nodes);
}

describe('WastelandNetwork', () => {
  it('exposes frozen topology properties and lookup methods', () => {
    const net = buildSampleNetwork();
    expect(Object.isFrozen(net)).toBe(true);
    expect(Object.isFrozen(net.labels)).toBe(true);
    expect(net.tapeLength).toBe(2);
    expect(net.nodeCount).toBe(7);
    expect(net.labels).toEqual(['AAA', 'BBB', 'CCC', 'DDD', 'EEE', 'GGG', 'ZZZ']);
    expect(net.turnAt(0)).toBe('R');
    expect(net.turnAt(1)).toBe('L');
    expect(net.leftOf(0)).toBe(1);
    expect(net.rightOf(0)).toBe(2);
    expect(net.labelOf(6)).toBe('ZZZ');
    expect(net.idOf('CCC')).toBe(2);
    expect(net.idOf('MISSING')).toBeUndefined();
    expect(net.requireId('AAA')).toBe(0);
    expect(net.stepFrom(0, 0)).toBe(2);
    expect(net.stepFrom(2, 1)).toBe(5);
  });

  it('throws on missing required label and out-of-range indices', () => {
    const net = buildSampleNetwork();
    expect(() => net.requireId('NOPE')).toThrow(/NOPE/);
    expect(() => net.turnAt(-1)).toThrow(RangeError);
    expect(() => net.turnAt(2)).toThrow(RangeError);
    expect(() => net.turnAt(0.5)).toThrow(RangeError);
    expect(() => net.leftOf(-1)).toThrow(RangeError);
    expect(() => net.rightOf(7)).toThrow(RangeError);
    expect(() => net.labelOf(7)).toThrow(RangeError);
    expect(() => net.stepFrom(7, 0)).toThrow(RangeError);
    expect(() => net.stepFrom(0, 2)).toThrow(RangeError);
  });

  it('validates turns and nodes at construction', () => {
    const validNode: NetworkNodeSpec[] = [{ label: 'AAA', leftId: 0, rightId: 0 }];
    expect(() => new WastelandNetwork([], validNode)).toThrow(/tape/i);
    expect(() => new WastelandNetwork(['X' as Turn], validNode)).toThrow(/turn/i);
    expect(() => new WastelandNetwork(['L'], [])).toThrow(/node/i);
    expect(() => new WastelandNetwork(['L'], [{ label: '', leftId: 0, rightId: 0 }])).toThrow(/label/i);
    expect(
      () =>
        new WastelandNetwork(
          ['L'],
          [
            { label: 'AAA', leftId: 0, rightId: 0 },
            { label: 'AAA', leftId: 0, rightId: 0 },
          ],
        ),
    ).toThrow(/duplicate/i);
    expect(() => new WastelandNetwork(['L'], [{ label: 'AAA', leftId: -1, rightId: 0 }])).toThrow(RangeError);
    expect(() => new WastelandNetwork(['L'], [{ label: 'AAA', leftId: 0, rightId: 1 }])).toThrow(RangeError);
    expect(() => new WastelandNetwork(['L'], [{ label: 'AAA', leftId: 0.5, rightId: 0 }])).toThrow(RangeError);
  });

  it('finds target at step 0 without stepping', () => {
    const net = new WastelandNetwork(['L', 'R'], [{ label: 'ZZZ', leftId: 0, rightId: 0 }]);
    expect(net.findFirstTarget(0, (id) => id === 0)).toBe(0);
  });

  it('wraps tape index and finds target across multiple laps', () => {
    const net = new WastelandNetwork(
      ['L', 'L', 'R'],
      [
        { label: 'AAA', leftId: 1, rightId: 1 },
        { label: 'BBB', leftId: 0, rightId: 2 },
        { label: 'ZZZ', leftId: 2, rightId: 2 },
      ],
    );
    expect(net.findFirstTarget(0, (id) => id === 2)).toBe(6);
  });

  it('detects unreachable target cycles and validates startId', () => {
    const net = new WastelandNetwork(
      ['L', 'R'],
      [
        { label: 'AAA', leftId: 1, rightId: 1 },
        { label: 'BBB', leftId: 0, rightId: 0 },
        { label: 'ZZZ', leftId: 2, rightId: 2 },
      ],
    );
    expect(() => net.findFirstTarget(0, (id) => id === 2)).toThrow(/cycle|unreachable/i);
    expect(() => net.findFirstTarget(-1, () => true)).toThrow(RangeError);
  });
});
