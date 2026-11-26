import { compareNumbers, findSortedString, hasSortedNumber, lowerBound } from './sorted';

export type LanEdge = readonly [number, number];

const EDGE_LINE_PATTERN = /^([a-z0-9]+)-([a-z0-9]+)$/;

/** Immutable clique of node IDs and their matching lexicographically sorted computer names. */
export class LanClique {
  readonly nodeIds: readonly number[];
  readonly names: readonly string[];

  constructor(nodeIds: readonly number[], names: readonly string[]) {
    if (nodeIds.length === 0) throw new RangeError('LanClique requires at least one node');
    if (nodeIds.length !== names.length) {
      throw new RangeError('LanClique nodeIds and names must have equal length');
    }
    this.nodeIds = Object.freeze([...nodeIds]);
    this.names = Object.freeze([...names]);
    Object.freeze(this);
  }

  get size(): number { return this.nodeIds.length; }
  get password(): string { return this.names.join(','); }

  hasNodeStartingWith(prefix: string): boolean {
    return this.names.some((name) => name.startsWith(prefix));
  }
}

/** Immutable undirected LAN graph indexed by lexicographically sorted node names. */
export class LanGraph {
  private readonly _names: readonly string[];
  private readonly _adjacency: readonly (readonly number[])[];

  private constructor(names: readonly string[], adjacency: readonly (readonly number[])[]) {
    this._names = names;
    this._adjacency = adjacency;
    Object.freeze(this);
  }

  static fromEdges(rawEdges: readonly (readonly [string, string])[]): LanGraph {
    if (rawEdges.length === 0) throw new RangeError('LAN graph requires at least one edge');
    const nameSet = new Set<string>();
    for (const [a, b] of rawEdges) {
      if (a === b) throw new RangeError(`Self-loop is not allowed: ${a}`);
      nameSet.add(a);
      nameSet.add(b);
    }
    const names = Object.freeze([...nameSet].sort());
    const adjSets = names.map(() => new Set<number>());
    for (const [a, b] of rawEdges) {
      const u = findSortedString(names, a);
      const v = findSortedString(names, b);
      adjSets[u]!.add(v);
      adjSets[v]!.add(u);
    }
    const adjacency = Object.freeze(adjSets.map((set) => Object.freeze([...set].sort(compareNumbers))));
    return new LanGraph(names, adjacency);
  }

  get nodeCount(): number { return this._names.length; }
  get names(): readonly string[] { return this._names; }
  get averageDegree(): number { return (this.edgeCount * 2) / this.nodeCount; }

  get edgeCount(): number {
    let sum = 0;
    for (const adj of this._adjacency) sum += adj.length;
    return sum / 2;
  }

  get minDegree(): number {
    let min = Infinity;
    for (const adj of this._adjacency) if (adj.length < min) min = adj.length;
    return min;
  }

  get maxDegree(): number {
    let max = 0;
    for (const adj of this._adjacency) if (adj.length > max) max = adj.length;
    return max;
  }

  get edges(): readonly LanEdge[] {
    const result: LanEdge[] = [];
    for (let u = 0; u < this._adjacency.length; u += 1) {
      for (const v of this._adjacency[u]!) {
        if (u < v) result.push(Object.freeze([u, v] as const));
      }
    }
    return Object.freeze(result);
  }

  nameOf(nodeId: number): string {
    const name = this._names[nodeId];
    if (name === undefined) throw new RangeError(`Invalid node id: ${nodeId}`);
    return name;
  }

  findNodeId(name: string): number { return findSortedString(this._names, name); }

  neighbors(nodeId: number): readonly number[] {
    const adj = this._adjacency[nodeId];
    if (adj === undefined) throw new RangeError(`Invalid node id: ${nodeId}`);
    return adj;
  }

  upperNeighbors(nodeId: number): readonly number[] {
    const adj = this.neighbors(nodeId);
    return Object.freeze(adj.slice(lowerBound(adj, nodeId + 1)));
  }

  degree(nodeId: number): number { return this.neighbors(nodeId).length; }
  hasEdge(u: number, v: number): boolean { return hasSortedNumber(this.neighbors(u), v); }

  createClique(nodeIds: readonly number[]): LanClique {
    const sorted = [...nodeIds].sort(compareNumbers);
    return new LanClique(sorted, sorted.map((id) => this.nameOf(id)));
  }
}

/** Parses newline-delimited `aa-bb` undirected LAN links into a canonical `LanGraph`. */
export function parseLanGraph(raw: string): LanGraph {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
  if (lines.length === 0) throw new RangeError('LAN graph input must not be empty');
  const edges: [string, string][] = [];
  for (const line of lines) {
    const match = EDGE_LINE_PATTERN.exec(line);
    if (match === null) throw new RangeError(`Invalid LAN edge line: "${line}"`);
    edges.push([match[1]!, match[2]!]);
  }
  return LanGraph.fromEdges(edges);
}
