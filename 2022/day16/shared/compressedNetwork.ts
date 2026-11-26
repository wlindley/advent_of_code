import { START_VALVE_NAME, type ValveNetwork, type ValveNode } from './valveNetwork';

export const MAX_POSITIVE_VALVES = 24;
export const MAX_INT32 = 0x7fffffff;

function bfsDistances(network: ValveNetwork, startRawIdx: number): Int32Array {
  const dist = new Int32Array(network.size).fill(-1);
  const queue: number[] = [startRawIdx];
  dist[startRawIdx] = 0;
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++]!;
    const nextDist = dist[cur]! + 1;
    const node = network.valves[cur]!;
    for (const target of node.tunnels) {
      const next = network.indexOf(target);
      if (dist[next]! === -1) {
        dist[next] = nextDist;
        queue.push(next);
      }
    }
  }
  return dist;
}

function compareValvesDesc(a: ValveNode, b: ValveNode): number {
  return b.flowRate !== a.flowRate ? b.flowRate - a.flowRate : a.name < b.name ? -1 : 1;
}

function assertIndex(index: number, limit: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= limit) {
    throw new RangeError(`Compressed valve index out of bounds: ${index}`);
  }
}

function buildPairwiseDistances(network: ValveNetwork, ordered: readonly ValveNode[]): Int32Array {
  const n = ordered.length;
  const distances = new Int32Array(n * n).fill(-1);
  const rawIndices = ordered.map((node) => network.indexOf(node.name));
  for (let from = 0; from < n; from++) {
    const rawDist = bfsDistances(network, rawIndices[from]!);
    const rowOffset = from * n;
    for (let to = 0; to < n; to++) {
      distances[rowOffset + to] = rawDist[rawIndices[to]!]!;
    }
  }
  return distances;
}

/** Compressed shortest-path network retaining only reachable positive valves and the start node. */
export class CompressedValveNetwork {
  readonly positiveCount: number;
  readonly nodeCount: number;
  readonly startIndex: number;
  private readonly ordered: readonly ValveNode[];
  private readonly distances: Int32Array;

  private constructor(
    ordered: readonly ValveNode[],
    positiveCount: number,
    startIndex: number,
    distances: Int32Array,
  ) {
    this.ordered = Object.freeze([...ordered]);
    this.positiveCount = positiveCount;
    this.nodeCount = ordered.length;
    this.startIndex = startIndex;
    this.distances = distances;
    Object.freeze(this);
  }

  static fromNetwork(network: ValveNetwork, startName = START_VALVE_NAME): CompressedValveNetwork {
    const startRawIdx = network.indexOf(startName);
    const reachDist = bfsDistances(network, startRawIdx);
    const positives = network.valves
      .filter((v, idx) => reachDist[idx]! >= 0 && v.flowRate > 0)
      .sort(compareValvesDesc);
    if (positives.length > MAX_POSITIVE_VALVES) {
      throw new RangeError(`Positive valve count ${positives.length} exceeds ${MAX_POSITIVE_VALVES}`);
    }
    const startNode = network.valves[startRawIdx]!;
    const startInPos = positives.findIndex((n) => n.name === startNode.name);
    const ordered = startInPos >= 0 ? positives : [...positives, startNode];
    const startIndex = startInPos >= 0 ? startInPos : positives.length;
    const distances = buildPairwiseDistances(network, ordered);
    return new CompressedValveNetwork(ordered, positives.length, startIndex, distances);
  }

  get fullMask(): number {
    return (1 << this.positiveCount) - 1;
  }

  get nodes(): readonly ValveNode[] {
    return this.ordered;
  }

  flowRateAt(index: number): number {
    assertIndex(index, this.nodeCount);
    return this.ordered[index]!.flowRate;
  }

  nameAt(index: number): string {
    assertIndex(index, this.nodeCount);
    return this.ordered[index]!.name;
  }

  distance(from: number, to: number): number {
    assertIndex(from, this.nodeCount);
    assertIndex(to, this.nodeCount);
    return this.distances[from * this.nodeCount + to]!;
  }
}
