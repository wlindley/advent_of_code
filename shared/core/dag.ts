const EMPTY: readonly never[] = Object.freeze([]);

/** Immutable directed multigraph with topological sorting and path counting. */
export class DirectedGraph<T = string> {
  private readonly adjacency: ReadonlyMap<T, readonly T[]>;

  constructor(adjacency: Iterable<readonly [T, Iterable<T>]>) {
    const map = new Map<T, readonly T[]>();
    const sinks: T[] = [];
    for (const [source, targets] of adjacency) {
      if (map.has(source)) throw new Error(`Duplicate node definition: ${String(source)}`);
      const frozen = Object.freeze([...targets]);
      map.set(source, frozen);
      for (const target of frozen) sinks.push(target);
    }
    for (const sink of sinks) if (!map.has(sink)) map.set(sink, EMPTY);
    this.adjacency = map;
    Object.freeze(this);
  }

  get nodeCount(): number { return this.adjacency.size; }
  get edgeCount(): number {
    let total = 0;
    for (const targets of this.adjacency.values()) total += targets.length;
    return total;
  }
  get nodes(): readonly T[] { return Object.freeze([...this.adjacency.keys()]); }
  has(node: T): boolean { return this.adjacency.has(node); }
  outNeighbors(node: T): readonly T[] { return this.adjacency.get(node) ?? EMPTY; }

  /** Returns the induced subgraph of vertices lying on at least one s -> t walk. */
  relevantSubgraph(source: T, target: T): DirectedGraph<T> {
    if (!this.has(source) || !this.has(target)) return new DirectedGraph([]);
    const forward = new Set<T>([source]);
    const revAdj = new Map<T, T[]>();
    const fQueue: T[] = [source];
    for (let head = 0; head < fQueue.length; head++) {
      const u = fQueue[head]!;
      for (const v of this.outNeighbors(u)) {
        const rev = revAdj.get(v);
        if (rev) rev.push(u); else revAdj.set(v, [u]);
        if (!forward.has(v)) { forward.add(v); fQueue.push(v); }
      }
    }
    if (!forward.has(target)) return new DirectedGraph([]);
    const relevant = new Set<T>([target]);
    const bQueue: T[] = [target];
    for (let head = 0; head < bQueue.length; head++) {
      for (const u of revAdj.get(bQueue[head]!) ?? EMPTY) {
        if (!relevant.has(u)) { relevant.add(u); bQueue.push(u); }
      }
    }
    return new DirectedGraph([...relevant].map((u) => [u, this.outNeighbors(u).filter((v) => relevant.has(v))]));
  }

  /** Iterative Kahn's algorithm; throws if any cycle exists in the graph. */
  topologicalOrder(): readonly T[] {
    const inDegree = new Map<T, number>();
    for (const node of this.adjacency.keys()) inDegree.set(node, 0);
    for (const targets of this.adjacency.values()) {
      for (const v of targets) inDegree.set(v, inDegree.get(v)! + 1);
    }
    const queue: T[] = [];
    for (const [node, deg] of inDegree) if (deg === 0) queue.push(node);
    const order: T[] = [];
    for (let head = 0; head < queue.length; head++) {
      const u = queue[head]!;
      order.push(u);
      for (const v of this.outNeighbors(u)) {
        const next = inDegree.get(v)! - 1;
        inDegree.set(v, next);
        if (next === 0) queue.push(v);
      }
    }
    if (order.length < this.nodeCount) throw new Error('Cycle detected in directed graph');
    return Object.freeze(order);
  }

  /** Counts walks from source to target; throws if an on-path cycle exists. */
  countPaths(source: T, target: T): bigint {
    // Prune to s-t relevant subgraph first so off-path cycles do not fail, while s === t cycles still fail.
    const sub = this.relevantSubgraph(source, target);
    if (sub.nodeCount === 0) return 0n;
    const order = sub.topologicalOrder();
    const ways = new Map<T, bigint>(order.map((node) => [node, 0n]));
    ways.set(source, 1n);
    for (const u of order) {
      const w = ways.get(u)!;
      for (const v of sub.outNeighbors(u)) ways.set(v, ways.get(v)! + w);
    }
    return ways.get(target)!;
  }
}
