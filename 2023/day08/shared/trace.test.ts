import { describe, expect, it } from 'vitest';
import { parseWastelandNetwork } from './parser';
import {
  DEFAULT_MAX_TRACE_STEPS,
  MAX_BREADCRUMBS,
  WastelandTraceFrame,
  traceNetworkWalk,
} from './trace';

const EXAMPLE_TWO = [
  'LLR',
  '',
  'AAA = (BBB, BBB)',
  'BBB = (AAA, ZZZ)',
  'ZZZ = (ZZZ, ZZZ)',
].join('\n');

describe('WastelandTraceFrame', () => {
  it('computes all derived state dynamically and freezes itself', () => {
    const net = parseWastelandNetwork(EXAMPLE_TWO);
    const aaa = net.requireId('AAA');
    const bbb = net.requireId('BBB');
    const zzz = net.requireId('ZZZ');

    const f0 = new WastelandTraceFrame(net, 0, 6, [aaa]);
    expect(Object.isFrozen(f0)).toBe(true);
    expect(Object.isFrozen(f0.recentPath)).toBe(true);
    expect(f0.nodeId).toBe(aaa);
    expect(f0.previousNodeId).toBeUndefined();
    expect(f0.nodeLabel).toBe('AAA');
    expect(f0.leftId).toBe(bbb);
    expect(f0.rightId).toBe(bbb);
    expect(f0.leftLabel).toBe('BBB');
    expect(f0.rightLabel).toBe('BBB');
    expect(f0.nextTapeIndex).toBe(0);
    expect(f0.nextTurn).toBe('L');
    expect(f0.lastTapeIndex).toBeUndefined();
    expect(f0.lastTurn).toBeUndefined();
    expect(f0.completedLaps).toBe(0);
    expect(f0.isGoal).toBe(false);

    const f6 = new WastelandTraceFrame(net, 6, 6, [aaa, bbb, aaa, bbb, aaa, bbb, zzz]);
    expect(f6.nodeId).toBe(zzz);
    expect(f6.previousNodeId).toBe(bbb);
    expect(f6.nextTapeIndex).toBe(0);
    expect(f6.nextTurn).toBe('L');
    expect(f6.lastTapeIndex).toBe(2);
    expect(f6.lastTurn).toBe('R');
    expect(f6.completedLaps).toBe(2);
    expect(f6.isGoal).toBe(true);
  });

  it('defensively copies recentPath and validates invariants', () => {
    const net = parseWastelandNetwork(EXAMPLE_TWO);
    const aaa = net.requireId('AAA');
    const bbb = net.requireId('BBB');
    const zzz = net.requireId('ZZZ');
    const mutable = [aaa];
    const frame = new WastelandTraceFrame(net, 0, 6, mutable);
    mutable.push(bbb);
    expect(frame.recentPath).toEqual([aaa]);

    expect(() => new WastelandTraceFrame(net, -1, 6, [aaa])).toThrow(RangeError);
    expect(() => new WastelandTraceFrame(net, 7, 6, [aaa, bbb])).toThrow(RangeError);
    expect(() => new WastelandTraceFrame(net, 0, 6, [])).toThrow(/recentPath/i);
    expect(() => new WastelandTraceFrame(net, 0, 6, [aaa, bbb])).toThrow(/step 0/i);
    expect(() => new WastelandTraceFrame(net, 1, 6, [bbb])).toThrow(/step 1/i);
    expect(() => new WastelandTraceFrame(net, 1, 6, [aaa, zzz])).toThrow(/inconsistent/i);
    expect(() =>
      new WastelandTraceFrame(net, 6, 6, new Array(MAX_BREADCRUMBS + 1).fill(aaa)),
    ).toThrow(/recentPath/i);
  });
});

describe('traceNetworkWalk', () => {
  it('traces every step of official example 2 including step 0 and goal', () => {
    const net = parseWastelandNetwork(EXAMPLE_TWO);
    const aaa = net.requireId('AAA');
    const zzz = net.requireId('ZZZ');
    const frames = traceNetworkWalk(net, aaa, (id) => id === zzz);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(240);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames.map((f) => f.nodeLabel)).toEqual([
      'AAA',
      'BBB',
      'AAA',
      'BBB',
      'AAA',
      'BBB',
      'ZZZ',
    ]);
    expect(frames[6]?.isGoal).toBe(true);
  });

  it('handles 0-step walks and maxSteps sampling with bounded breadcrumbs', () => {
    const net = parseWastelandNetwork('LR\n\nAAA = (BBB, AAA)\nBBB = (AAA, BBB)');
    const aaa = net.requireId('AAA');
    const zeroFrames = traceNetworkWalk(net, aaa, (id) => id === aaa);
    expect(zeroFrames).toHaveLength(1);
    expect(zeroFrames[0]!.isGoal).toBe(true);

    const longRaw = [
      'LLLLLLLLLLR',
      '',
      'AAA = (BBB, CCC)',
      'BBB = (AAA, ZZZ)',
      'CCC = (ZZZ, ZZZ)',
      'ZZZ = (ZZZ, ZZZ)',
    ].join('\n');
    const longNet = parseWastelandNetwork(longRaw);
    const sampled = traceNetworkWalk(
      longNet,
      longNet.requireId('AAA'),
      (id) => id === longNet.requireId('ZZZ'),
      { maxSteps: 4 },
    );
    expect(sampled).toHaveLength(4);
    expect(sampled[0]!.step).toBe(0);
    const last = sampled[sampled.length - 1]!;
    expect(last.step).toBe(12);
    expect(last.isGoal).toBe(true);
    expect(last.recentPath.length).toBe(MAX_BREADCRUMBS);
    expect(last.previousNodeId).toBe(longNet.requireId('CCC'));

    const single = traceNetworkWalk(
      longNet,
      longNet.requireId('AAA'),
      (id) => id === longNet.requireId('ZZZ'),
      { maxSteps: 1 },
    );
    expect(single).toHaveLength(1);
    expect(single[0]!.step).toBe(12);
    expect(single[0]!.isGoal).toBe(true);
  });

  it('rejects invalid maxSteps options', () => {
    const net = parseWastelandNetwork(EXAMPLE_TWO);
    expect(() =>
      traceNetworkWalk(net, 0, (id) => id === 2, { maxSteps: 0 }),
    ).toThrow(RangeError);
  });
});
