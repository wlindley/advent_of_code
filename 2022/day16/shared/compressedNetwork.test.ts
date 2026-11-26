import { describe, expect, it } from 'vitest';
import {
  CompressedValveNetwork,
  MAX_POSITIVE_VALVES,
} from './compressedNetwork';
import { parseValveNetwork, ValveNetwork, type ValveNode } from './valveNetwork';

const SAMPLE = [
  'Valve AA has flow rate=0; tunnels lead to valves DD, II, BB',
  'Valve BB has flow rate=13; tunnels lead to valves CC, AA',
  'Valve CC has flow rate=2; tunnels lead to valves DD, BB',
  'Valve DD has flow rate=20; tunnels lead to valves CC, AA, EE',
  'Valve EE has flow rate=3; tunnels lead to valves FF, DD',
  'Valve FF has flow rate=0; tunnels lead to valves EE, GG',
  'Valve GG has flow rate=0; tunnels lead to valves FF, HH',
  'Valve HH has flow rate=22; tunnel leads to valve GG',
  'Valve II has flow rate=0; tunnels lead to valves AA, JJ',
  'Valve JJ has flow rate=21; tunnel leads to valve II',
].join('\n');

describe('CompressedValveNetwork', () => {
  it('compresses reachable positive valves sorted by flowRate desc then name asc', () => {
    const net = parseValveNetwork(SAMPLE);
    const compressed = CompressedValveNetwork.fromNetwork(net);

    expect(compressed.positiveCount).toBe(6);
    expect(compressed.nodeCount).toBe(7);
    expect(compressed.startIndex).toBe(6);
    expect(compressed.fullMask).toBe((1 << 6) - 1);
    expect(compressed.nodes.map((n) => n.name)).toEqual(['HH', 'JJ', 'DD', 'BB', 'EE', 'CC', 'AA']);
    expect(compressed.nameAt(0)).toBe('HH');
    expect(compressed.flowRateAt(0)).toBe(22);
    expect(compressed.nameAt(6)).toBe('AA');
    expect(compressed.flowRateAt(6)).toBe(0);
    expect(compressed.distance(6, 0)).toBe(5); // AA -> DD -> EE -> FF -> GG -> HH
    expect(compressed.distance(6, 1)).toBe(2); // AA -> II -> JJ
    expect(compressed.distance(0, 0)).toBe(0);
    expect(Object.isFrozen(compressed)).toBe(true);
  });

  it('places start node inside positive indices when start has positive flowRate', () => {
    const net = new ValveNetwork([
      { name: 'AA', flowRate: 10, tunnels: ['BB'] },
      { name: 'BB', flowRate: 10, tunnels: ['AA'] },
    ]);
    const compressed = CompressedValveNetwork.fromNetwork(net);
    expect(compressed.positiveCount).toBe(2);
    expect(compressed.nodeCount).toBe(2);
    expect(compressed.startIndex).toBe(0);
    expect(compressed.nodes.map((n) => n.name)).toEqual(['AA', 'BB']);
    expect(compressed.distance(0, 1)).toBe(1);
  });

  it('handles tie-break ordering in both directions and zero positive valves', () => {
    const net = new ValveNetwork([
      { name: 'AA', flowRate: 0, tunnels: ['CC', 'BB'] },
      { name: 'CC', flowRate: 5, tunnels: ['AA'] },
      { name: 'BB', flowRate: 5, tunnels: ['AA'] },
    ]);
    const compressed = CompressedValveNetwork.fromNetwork(net);
    expect(compressed.nodes.map((n) => n.name)).toEqual(['BB', 'CC', 'AA']);

    const zeroNet = new ValveNetwork([{ name: 'AA', flowRate: 0, tunnels: ['AA'] }]);
    const zeroCompressed = CompressedValveNetwork.fromNetwork(zeroNet);
    expect(zeroCompressed.positiveCount).toBe(0);
    expect(zeroCompressed.nodeCount).toBe(1);
    expect(zeroCompressed.fullMask).toBe(0);
    expect(zeroCompressed.startIndex).toBe(0);
  });

  it('preserves -1 distance for directed one-way edges and ignores unreachable nodes', () => {
    const net = new ValveNetwork([
      { name: 'AA', flowRate: 0, tunnels: ['BB'] },
      { name: 'BB', flowRate: 10, tunnels: ['BB'] },
      { name: 'ZZ', flowRate: 99, tunnels: ['AA'] },
    ]);
    const compressed = CompressedValveNetwork.fromNetwork(net);
    expect(compressed.positiveCount).toBe(1);
    expect(compressed.distance(1, 0)).toBe(1);
    expect(compressed.distance(0, 1)).toBe(-1);
  });

  it('throws RangeError when positive valves exceed MAX_POSITIVE_VALVES or index out of bounds', () => {
    const nodes: ValveNode[] = [{ name: 'AA', flowRate: 0, tunnels: ['V00'] }];
    for (let i = 0; i <= MAX_POSITIVE_VALVES; i++) {
      const name = `V${String(i).padStart(2, '0')}`;
      const next = i < MAX_POSITIVE_VALVES ? `V${String(i + 1).padStart(2, '0')}` : 'AA';
      nodes.push({ name, flowRate: i + 1, tunnels: [next] });
    }
    expect(() => CompressedValveNetwork.fromNetwork(new ValveNetwork(nodes))).toThrow(RangeError);

    const small = CompressedValveNetwork.fromNetwork(parseValveNetwork(SAMPLE));
    expect(() => small.flowRateAt(-1)).toThrow(RangeError);
    expect(() => small.nameAt(small.nodeCount)).toThrow(RangeError);
    expect(() => small.distance(0, 99)).toThrow(RangeError);
    expect(() => small.distance(1.5, 0)).toThrow(RangeError);
  });
});
