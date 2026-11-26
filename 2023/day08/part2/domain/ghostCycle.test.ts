import { describe, expect, it } from 'vitest';
import { parseWastelandNetwork } from '../../shared';
import {
  GhostCycle,
  collectGhostStartIds,
  extractGhostCycle,
  isGhostStartLabel,
  isGhostTargetLabel,
} from './ghostCycle';

const MIXED_GRAPH = [
  'LR',
  '',
  '11A = (11B, XXX)',
  '11B = (11Z, 11Z)',
  '11Z = (11C, 11C)',
  '11C = (11Z, 11Z)',
  'XXX = (XXX, XXX)',
].join('\n');

describe('ghost label predicates and start collection', () => {
  it('identifies **A start labels and **Z target labels', () => {
    expect(isGhostStartLabel('11A')).toBe(true);
    expect(isGhostStartLabel('AAZ')).toBe(false);
    expect(isGhostTargetLabel('11Z')).toBe(true);
    expect(isGhostTargetLabel('ZZA')).toBe(false);
  });

  it('collects all **A start node IDs in network order and throws when none exist', () => {
    const net = parseWastelandNetwork([
      'LR',
      '',
      '22A = (22Z, 22Z)',
      '11B = (22Z, 22Z)',
      '11A = (22Z, 22Z)',
      '22Z = (22Z, 22Z)',
    ].join('\n'));
    const ids = collectGhostStartIds(net);
    expect(Object.isFrozen(ids)).toBe(true);
    expect(ids).toEqual([0, 2]);

    const noStarts = parseWastelandNetwork('L\n\nBBB = (ZZZ, ZZZ)\nZZZ = (ZZZ, ZZZ)');
    expect(() => collectGhostStartIds(noStarts)).toThrow(/No ghost start nodes/);
  });
});

describe('GhostCycle', () => {
  it('validates constructor bounds and hit monotonicity', () => {
    const net = parseWastelandNetwork(MIXED_GRAPH);
    expect(() => new GhostCycle(net, 0, -1, 2, [], [])).toThrow(RangeError);
    expect(() => new GhostCycle(net, 0, 1, 0, [], [])).toThrow(RangeError);
    expect(
      () => new GhostCycle(net, 0, 3, 2, [{ step: 3, nodeId: 2 }], []),
    ).toThrow(RangeError);
    expect(
      () =>
        new GhostCycle(
          net,
          0,
          4,
          2,
          [
            { step: 2, nodeId: 2 },
            { step: 2, nodeId: 2 },
          ],
          [],
        ),
    ).toThrow(RangeError);
    expect(
      () => new GhostCycle(net, 0, 1, 2, [], [{ step: 0, nodeId: 2 }]),
    ).toThrow(RangeError);
  });

  it('computes derived congruences, alignment, and target membership dynamically', () => {
    const net = parseWastelandNetwork(MIXED_GRAPH);
    const cycle = new GhostCycle(
      net,
      0,
      3,
      4,
      [{ step: 1, nodeId: 2 }],
      [{ step: 4, nodeId: 2 }],
    );

    expect(Object.isFrozen(cycle)).toBe(true);
    expect(cycle.startLabel).toBe('11A');
    expect(cycle.cycleEnd).toBe(7);
    expect(cycle.isAlignedLcm).toBe(true);
    expect(cycle.congruences.map((c) => c.key)).toEqual(['0:4']);

    expect(cycle.isTargetAt(0)).toBe(false);
    expect(cycle.isTargetAt(1)).toBe(true);
    expect(cycle.isTargetAt(2)).toBe(false);
    expect(cycle.isTargetAt(4)).toBe(true);
    expect(cycle.isTargetAt(5)).toBe(false);
    expect(cycle.isTargetAt(8)).toBe(true);
  });
});

describe('extractGhostCycle', () => {
  it('extracts pre-cycle prefix, cycle length, and hits using (node, ip) state tracking', () => {
    const net = parseWastelandNetwork(MIXED_GRAPH);
    const cycle = extractGhostCycle(net, net.requireId('11A'));
    expect(cycle.prefixLength).toBe(2);
    expect(cycle.cycleLength).toBe(2);
    expect(cycle.preCycleHits).toEqual([]);
    expect(cycle.cycleHits).toEqual([{ step: 2, nodeId: net.requireId('11Z') }]);
    expect(cycle.isAlignedLcm).toBe(true);
  });

  it('captures pre-cycle hits separately from cycle hits', () => {
    const net = parseWastelandNetwork([
      'L',
      '',
      '11A = (11Z, 11Z)',
      '11Z = (11B, 11B)',
      '11B = (11B, 11B)',
    ].join('\n'));
    const cycle = extractGhostCycle(net, net.requireId('11A'));
    expect(cycle.prefixLength).toBe(2);
    expect(cycle.cycleLength).toBe(1);
    expect(cycle.preCycleHits).toEqual([{ step: 1, nodeId: net.requireId('11Z') }]);
    expect(cycle.cycleHits).toEqual([]);
  });

  it('rejects non-**A start node IDs', () => {
    const net = parseWastelandNetwork(MIXED_GRAPH);
    expect(() => extractGhostCycle(net, net.requireId('11B'))).toThrow(/must end with "A"/);
  });
});
