import { describe, expect, it } from 'vitest';
import {
  CompressedValveNetwork,
  computeBestByMask,
  MaskPressureTable,
  MAX_INT32,
  parseValveNetwork,
} from '../../shared';
import {
  DualAgentPlan,
  findOptimalDualAgentPlan,
  findOptimalDualAgentRoutes,
} from './dualAgentSearch';

const OFFICIAL_EXAMPLE = [
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

describe('DualAgentPlan invariants', () => {
  it('stores frozen source fields and computes dynamic getters', () => {
    const plan = new DualAgentPlan(0b01, 0b10, 120, 80);
    expect(Object.isFrozen(plan)).toBe(true);
    expect(plan.humanMask).toBe(0b01);
    expect(plan.elephantMask).toBe(0b10);
    expect(plan.humanScore).toBe(120);
    expect(plan.elephantScore).toBe(80);
    expect(plan.totalPressure).toBe(200);
    expect(plan.openedMask).toBe(0b11);
  });

  it('rejects invalid humanMask values', () => {
    expect(() => new DualAgentPlan(-1, 0, 0, 0)).toThrow(RangeError);
    expect(() => new DualAgentPlan(1.5, 0, 0, 0)).toThrow(RangeError);
    expect(() => new DualAgentPlan(Number.NaN, 0, 0, 0)).toThrow(RangeError);
    expect(() => new DualAgentPlan(MAX_INT32 + 1, 0, 0, 0)).toThrow(RangeError);
  });

  it('rejects invalid elephantMask values', () => {
    expect(() => new DualAgentPlan(0, -1, 0, 0)).toThrow(RangeError);
    expect(() => new DualAgentPlan(0, 2.5, 0, 0)).toThrow(RangeError);
    expect(() => new DualAgentPlan(0, Number.NaN, 0, 0)).toThrow(RangeError);
    expect(() => new DualAgentPlan(0, MAX_INT32 + 1, 0, 0)).toThrow(RangeError);
  });

  it('rejects invalid score values and zero-mask positive scores', () => {
    expect(() => new DualAgentPlan(1, 0, -1, 0)).toThrow(RangeError);
    expect(() => new DualAgentPlan(1, 0, 1.5, 0)).toThrow(RangeError);
    expect(() => new DualAgentPlan(1, 0, Number.MAX_SAFE_INTEGER + 1, 0)).toThrow(RangeError);
    expect(() => new DualAgentPlan(0, 1, 0, -1)).toThrow(RangeError);
    expect(() => new DualAgentPlan(0, 1, 0, 1.5)).toThrow(RangeError);
    expect(() => new DualAgentPlan(0, 1, 0, Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
    expect(() => new DualAgentPlan(0, 1, 10, 0)).toThrow(Error);
    expect(() => new DualAgentPlan(1, 0, 0, 10)).toThrow(Error);
  });

  it('rejects overlapping human and elephant masks', () => {
    expect(() => new DualAgentPlan(0b11, 0b10, 50, 40)).toThrow('DualAgentPlan masks must be disjoint');
  });
});

describe('findOptimalDualAgentPlan', () => {
  it('handles K=0 positive valves', () => {
    const net = parseValveNetwork('Valve AA has flow rate=0; tunnel leads to valve BB\nValve BB has flow rate=0; tunnel leads to valve AA');
    const plan = findOptimalDualAgentPlan(computeBestByMask(CompressedValveNetwork.fromNetwork(net), 26));
    expect(plan).toEqual(new DualAgentPlan(0, 0, 0, 0));
  });

  it('canonicalizes K=1 reachable so human opens the valve and elephant stays idle', () => {
    const net = parseValveNetwork('Valve AA has flow rate=0; tunnel leads to valve BB\nValve BB has flow rate=10; tunnel leads to valve AA');
    const compressed = CompressedValveNetwork.fromNetwork(net);
    const plan = findOptimalDualAgentPlan(computeBestByMask(compressed, 5));
    expect(plan.humanMask).toBe(1);
    expect(plan.elephantMask).toBe(0);
    expect(plan.humanScore).toBe(30);
    expect(plan.elephantScore).toBe(0);
    expect(plan.totalPressure).toBe(30);
    expect(findOptimalDualAgentPlan(computeBestByMask(compressed, 0)).totalPressure).toBe(0);
    expect(findOptimalDualAgentPlan(computeBestByMask(compressed, 1)).totalPressure).toBe(0);
  });

  it('handles AA having positive flow rate at T=2', () => {
    const net = parseValveNetwork('Valve AA has flow rate=15; tunnel leads to valve BB\nValve BB has flow rate=0; tunnel leads to valve AA');
    const plan = findOptimalDualAgentPlan(computeBestByMask(CompressedValveNetwork.fromNetwork(net), 2));
    expect(plan.humanScore).toBe(15);
    expect(plan.elephantScore).toBe(0);
    expect(plan.totalPressure).toBe(15);
  });

  it('keeps both agents non-swapped on a symmetric 2-valve star', () => {
    const net = parseValveNetwork([
      'Valve AA has flow rate=0; tunnels lead to valves BB, CC',
      'Valve BB has flow rate=10; tunnel leads to valve AA',
      'Valve CC has flow rate=10; tunnel leads to valve AA',
    ].join('\n'));
    const plan = findOptimalDualAgentPlan(computeBestByMask(CompressedValveNetwork.fromNetwork(net), 5));
    expect(plan.humanScore).toBe(30);
    expect(plan.elephantScore).toBe(30);
    expect(plan.totalPressure).toBe(60);
    expect(plan.openedMask).toBe(0b11);
  });

  it('uses SOS propagation when combined mask is unreachable by a single agent and ignores disconnected islands', () => {
    const net = parseValveNetwork([
      'Valve AA has flow rate=0; tunnels lead to valves BB, CC',
      'Valve BB has flow rate=20; tunnel leads to valve AA',
      'Valve CC has flow rate=0; tunnel leads to valve DD',
      'Valve DD has flow rate=0; tunnel leads to valve EE',
      'Valve EE has flow rate=5; tunnel leads to valve CC',
      'Valve ZZ has flow rate=99; tunnel leads to valve YY',
      'Valve YY has flow rate=0; tunnel leads to valve ZZ',
    ].join('\n'));
    const compressed = CompressedValveNetwork.fromNetwork(net);
    expect(compressed.positiveCount).toBe(2);
    const plan = findOptimalDualAgentPlan(computeBestByMask(compressed, 5));
    expect(plan.humanScore).toBe(60);
    expect(plan.elephantScore).toBe(5);
    expect(plan.totalPressure).toBe(65);
  });

  it('selects optimal subset mask from a synthetic MaskPressureTable with subset ties', () => {
    const table = new MaskPressureTable(2, new Int32Array([0, 40, 25, 0]));
    const plan = findOptimalDualAgentPlan(table);
    expect(plan.totalPressure).toBe(65);
    expect(plan.openedMask).toBe(0b11);
  });
});

describe('findOptimalDualAgentRoutes', () => {
  it('reconstructs disjoint schedules matching 1707 on official example at T=26', () => {
    const compressed = CompressedValveNetwork.fromNetwork(parseValveNetwork(OFFICIAL_EXAMPLE));
    const plan = findOptimalDualAgentPlan(computeBestByMask(compressed, 26));
    const routes = findOptimalDualAgentRoutes(compressed, 26);
    expect(Object.isFrozen(routes)).toBe(true);
    expect(routes.map((r) => r.label)).toEqual(['You', 'Elephant']);
    const [you, elephant] = routes;
    expect(you.schedule.totalPressure + elephant.schedule.totalPressure).toBe(1707);
    expect(you.schedule.openedMask & elephant.schedule.openedMask).toBe(0);
    expect(you.schedule.openedMask & ~plan.humanMask).toBe(0);
    expect(elephant.schedule.openedMask & ~plan.elephantMask).toBe(0);
  });

  it('reconstructs routes for K=0 and K=1', () => {
    const zero = CompressedValveNetwork.fromNetwork(
      parseValveNetwork('Valve AA has flow rate=0; tunnel leads to valve BB\nValve BB has flow rate=0; tunnel leads to valve AA'),
    );
    const zeroRoutes = findOptimalDualAgentRoutes(zero, 26);
    expect(zeroRoutes[0].schedule.steps).toHaveLength(0);
    expect(zeroRoutes[1].schedule.steps).toHaveLength(0);

    const one = CompressedValveNetwork.fromNetwork(
      parseValveNetwork('Valve AA has flow rate=0; tunnel leads to valve BB\nValve BB has flow rate=10; tunnel leads to valve AA'),
    );
    const oneRoutes = findOptimalDualAgentRoutes(one, 5);
    expect(oneRoutes[0].schedule.totalPressure).toBe(30);
    expect(oneRoutes[1].schedule.steps).toHaveLength(0);
  });
});
