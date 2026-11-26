import { describe, expect, it } from 'vitest';
import { CompressedValveNetwork } from './compressedNetwork';
import { computeBestByMask, findOptimalSchedule } from './pressureSearch';
import { parseValveNetwork, START_VALVE_NAME, ValveNetwork, type ValveNode } from './valveNetwork';

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

function rawMinuteDpOracle(
  network: ValveNetwork,
  compressed: CompressedValveNetwork,
  timeLimit: number,
): Int32Array {
  const posIndex = new Map<string, number>();
  for (let i = 0; i < compressed.positiveCount; i++) {
    posIndex.set(compressed.nameAt(i), i);
  }
  const maskCount = 1 << compressed.positiveCount;
  const bestByMask = new Int32Array(maskCount);
  const memo = new Map<string, number>();

  function dfs(valveName: string, mask: number, timeLeft: number): number {
    if (timeLeft <= 0) return 0;
    const key = `${valveName}:${mask}:${timeLeft}`;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;

    let best = 0;
    const node = network.valve(valveName);
    const pIdx = posIndex.get(valveName);
    if (pIdx !== undefined && (mask & (1 << pIdx)) === 0) {
      const gained = node.flowRate * (timeLeft - 1);
      best = Math.max(best, gained + dfs(valveName, mask | (1 << pIdx), timeLeft - 1));
    }
    for (const next of node.tunnels) {
      best = Math.max(best, dfs(next, mask, timeLeft - 1));
    }
    memo.set(key, best);
    return best;
  }

  function collectPerMask(valveName: string, mask: number, timeLeft: number, acc: number, seen: Set<string>): void {
    if (acc > bestByMask[mask]!) bestByMask[mask] = acc;
    if (timeLeft <= 1) return;
    const state = `${valveName}:${mask}:${timeLeft}:${acc}`;
    if (seen.has(state)) return;
    seen.add(state);

    const node = network.valve(valveName);
    const pIdx = posIndex.get(valveName);
    if (pIdx !== undefined && (mask & (1 << pIdx)) === 0) {
      const gained = node.flowRate * (timeLeft - 1);
      collectPerMask(valveName, mask | (1 << pIdx), timeLeft - 1, acc + gained, seen);
    }
    for (const next of node.tunnels) {
      collectPerMask(next, mask, timeLeft - 1, acc, seen);
    }
  }

  const optimal = dfs(START_VALVE_NAME, 0, timeLimit);
  collectPerMask(START_VALVE_NAME, 0, timeLimit, 0, new Set());
  expect(Math.max(...bestByMask)).toBe(optimal);
  return bestByMask;
}

function makeSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function generateRandomNetwork(seed: number, directed: boolean): ValveNetwork {
  const rand = makeSeededRng(seed);
  const count = 4 + Math.floor(rand() * 3); // 4..6 nodes
  const names = Array.from({ length: count }, (_, i) => (i === 0 ? 'AA' : `V${i}`));
  const adj = Array.from({ length: count }, () => new Set<string>());
  for (let i = 0; i < count; i++) {
    const next = (i + 1) % count;
    adj[i]!.add(names[next]!);
    if (!directed) adj[next]!.add(names[i]!);
  }
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < count; j++) {
      if (i !== j && rand() < 0.35) {
        adj[i]!.add(names[j]!);
        if (!directed) adj[j]!.add(names[i]!);
      }
    }
  }
  const nodes: ValveNode[] = names.map((name, i) => ({
    name,
    flowRate: i === 0 && rand() < 0.5 ? 0 : rand() < 0.7 ? 1 + Math.floor(rand() * 25) : 0,
    tunnels: [...adj[i]!],
  }));
  return new ValveNetwork(nodes);
}

describe('pressureSearch differential oracle & official example', () => {
  it('solves the official 10-valve example for Part 1 (1651) and Part 2 SOS DP (1707)', () => {
    const net = parseValveNetwork(OFFICIAL_EXAMPLE);
    const compressed = CompressedValveNetwork.fromNetwork(net);

    const p1 = findOptimalSchedule(compressed, 30);
    expect(p1.totalPressure).toBe(1651);
    expect(p1.steps.map((s) => s.valveName)).toEqual(['DD', 'BB', 'JJ', 'HH', 'EE', 'CC']);

    const table = computeBestByMask(compressed, 26);
    const dp = table.copyScores();
    const k = compressed.positiveCount;
    for (let bit = 0; bit < k; bit++) {
      for (let mask = 0; mask < dp.length; mask++) {
        if ((mask & (1 << bit)) !== 0) {
          dp[mask] = Math.max(dp[mask]!, dp[mask ^ (1 << bit)]!);
        }
      }
    }
    const full = compressed.fullMask;
    let bestPair = 0;
    for (let mask = 0; mask <= full; mask++) {
      bestPair = Math.max(bestPair, dp[mask]! + dp[full ^ mask]!);
    }
    expect(bestPair).toBe(1707);
  });

  it('matches independent raw minute-by-minute DP oracle across 35 seeded random graphs', () => {
    for (let seed = 1; seed <= 35; seed++) {
      const directed = seed % 3 === 0;
      const net = generateRandomNetwork(seed * 7919, directed);
      const compressed = CompressedValveNetwork.fromNetwork(net);
      const timeLimit = 6 + (seed % 4); // 6..9 minutes (fast exhaustive minute DP)

      const oracleByMask = rawMinuteDpOracle(net, compressed, timeLimit);
      const actualTable = computeBestByMask(compressed, timeLimit);
      for (let mask = 0; mask < actualTable.maskCount; mask++) {
        expect(actualTable.scoreFor(mask)).toBe(oracleByMask[mask]!);
      }

      const schedule = findOptimalSchedule(compressed, timeLimit);
      expect(schedule.totalPressure).toBe(Math.max(...oracleByMask));
    }
  });
});
