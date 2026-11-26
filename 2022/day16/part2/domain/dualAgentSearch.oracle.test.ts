import { describe, expect, it } from 'vitest';
import {
  CompressedValveNetwork,
  computeBestByMask,
  type MaskPressureTable,
  parseValveNetwork,
  START_VALVE_NAME,
  type ValveNetwork,
} from '../../shared';
import { findOptimalDualAgentPlan } from './dualAgentSearch';

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

function submaskOracle(table: MaskPressureTable): number {
  const raw = table.copyScores();
  const fullMask = raw.length - 1;
  let best = 0;
  for (let a = 0; a <= fullMask; a++) {
    const scoreA = raw[a]!;
    const comp = fullMask ^ a;
    for (let b = comp; ; b = (b - 1) & comp) {
      const total = scoreA + raw[b]!;
      if (total > best) best = total;
      if (b === 0) break;
    }
  }
  return best;
}

interface JointDpContext {
  readonly network: ValveNetwork;
  readonly posBitByNode: Int32Array;
  readonly neighbors: readonly (readonly number[])[];
  readonly maskCount: number;
  readonly nodeCount: number;
}

function buildJointDpContext(network: ValveNetwork): JointDpContext {
  const posBitByNode = new Int32Array(network.size).fill(-1);
  let posCount = 0;
  const neighbors = network.valves.map((v, idx) => {
    if (v.flowRate > 0) posBitByNode[idx] = posCount++;
    return v.tunnels.map((t) => network.indexOf(t));
  });
  return { network, posBitByNode, neighbors, maskCount: 1 << posCount, nodeCount: network.size };
}

function pairIndex(a: number, b: number, n: number): number {
  const lo = a <= b ? a : b;
  const hi = a <= b ? b : a;
  return lo * n - ((lo * (lo - 1)) >> 1) + (hi - lo);
}

interface AgentAction {
  readonly nextNode: number;
  readonly openBit: number;
  readonly gain: number;
}

function collectActions(ctx: JointDpContext, node: number, mask: number, timeLeft: number): AgentAction[] {
  const actions: AgentAction[] = [{ nextNode: node, openBit: 0, gain: 0 }];
  const posBit = ctx.posBitByNode[node]!;
  if (posBit >= 0 && (mask & (1 << posBit)) === 0) {
    actions.push({ nextNode: node, openBit: 1 << posBit, gain: ctx.network.valves[node]!.flowRate * (timeLeft - 1) });
  }
  for (const nextNode of ctx.neighbors[node]!) {
    actions.push({ nextNode, openBit: 0, gain: 0 });
  }
  return actions;
}

function stepJointState(
  ctx: JointDpContext,
  prev: Int32Array,
  a: number,
  b: number,
  mask: number,
  timeLeft: number,
): number {
  const actionsA = collectActions(ctx, a, mask, timeLeft);
  const actionsB = a === b ? actionsA : collectActions(ctx, b, mask, timeLeft);
  let best = 0;
  for (const actA of actionsA) {
    for (const actB of actionsB) {
      if (a === b && actA.openBit !== 0 && actA.openBit === actB.openBit) continue;
      const nextMask = mask | actA.openBit | actB.openBit;
      const nextIdx = pairIndex(actA.nextNode, actB.nextNode, ctx.nodeCount) * ctx.maskCount + nextMask;
      const candidate = actA.gain + actB.gain + prev[nextIdx]!;
      if (candidate > best) best = candidate;
    }
  }
  return best;
}

function directJointDpOracle(network: ValveNetwork, timeLimit: number): number {
  if (timeLimit <= 1) return 0;
  const ctx = buildJointDpContext(network);
  const pairCount = (ctx.nodeCount * (ctx.nodeCount + 1)) >> 1;
  let prev = new Int32Array(pairCount * ctx.maskCount);
  let curr = new Int32Array(pairCount * ctx.maskCount);
  for (let t = 2; t <= timeLimit; t++) {
    for (let a = 0; a < ctx.nodeCount; a++) {
      for (let b = a; b < ctx.nodeCount; b++) {
        const base = pairIndex(a, b, ctx.nodeCount) * ctx.maskCount;
        for (let mask = 0; mask < ctx.maskCount; mask++) {
          curr[base + mask] = stepJointState(ctx, prev, a, b, mask, t);
        }
      }
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }
  const start = network.indexOf(START_VALVE_NAME);
  return prev[pairIndex(start, start, ctx.nodeCount) * ctx.maskCount]!;
}

function assertAllThreeAgree(raw: string, timeLimit: number, expected?: number): void {
  const network = parseValveNetwork(raw);
  const compressed = CompressedValveNetwork.fromNetwork(network);
  const table = computeBestByMask(compressed, timeLimit);
  const sosAnswer = findOptimalDualAgentPlan(table).totalPressure;
  const submaskAnswer = submaskOracle(table);
  const jointDpAnswer = directJointDpOracle(network, timeLimit);
  expect(sosAnswer).toBe(submaskAnswer);
  expect(sosAnswer).toBe(jointDpAnswer);
  if (expected !== undefined) expect(sosAnswer).toBe(expected);
}

describe('Dual-agent search cross-check against independent oracles', () => {
  it('agrees for K=0 and K=1', () => {
    assertAllThreeAgree('Valve AA has flow rate=0; tunnel leads to valve BB\nValve BB has flow rate=0; tunnel leads to valve AA', 10, 0);
    assertAllThreeAgree('Valve AA has flow rate=0; tunnel leads to valve BB\nValve BB has flow rate=12; tunnel leads to valve AA', 6, 48);
  });

  it('agrees when AA has positive flow across T=0, 1, 2, 6', () => {
    const raw = 'Valve AA has flow rate=15; tunnel leads to valve BB\nValve BB has flow rate=7; tunnel leads to valve AA';
    assertAllThreeAgree(raw, 0, 0);
    assertAllThreeAgree(raw, 1, 0);
    assertAllThreeAgree(raw, 2, 15);
    assertAllThreeAgree(raw, 6, 15 * 5 + 7 * 4);
  });

  it('agrees on star/hub, asymmetric two-wing, and disconnected island graphs', () => {
    const star = [
      'Valve AA has flow rate=0; tunnels lead to valves BB, CC, DD',
      'Valve BB has flow rate=10; tunnel leads to valve AA',
      'Valve CC has flow rate=14; tunnel leads to valve AA',
      'Valve DD has flow rate=8; tunnel leads to valve AA',
    ].join('\n');
    assertAllThreeAgree(star, 7);

    const asymmetric = [
      'Valve AA has flow rate=0; tunnels lead to valves BB, CC',
      'Valve BB has flow rate=20; tunnel leads to valve AA',
      'Valve CC has flow rate=0; tunnels lead to valves AA, DD',
      'Valve DD has flow rate=0; tunnels lead to valves CC, EE',
      'Valve EE has flow rate=9; tunnel leads to valve DD',
    ].join('\n');
    assertAllThreeAgree(asymmetric, 7);

    const disconnected = [
      'Valve AA has flow rate=0; tunnel leads to valve BB',
      'Valve BB has flow rate=11; tunnel leads to valve AA',
      'Valve XX has flow rate=50; tunnel leads to valve YY',
      'Valve YY has flow rate=0; tunnel leads to valve XX',
    ].join('\n');
    assertAllThreeAgree(disconnected, 8, 66);
  });

  it('agrees on the official 10-valve AoC example at T=26 (1707)', () => {
    assertAllThreeAgree(OFFICIAL_EXAMPLE, 26, 1707);
  });
});
