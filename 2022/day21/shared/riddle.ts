import { DirectedGraph } from '../../../shared/core';
import type { BinaryOp } from './operators';

export interface LiteralJob {
  readonly kind: 'literal';
  readonly name: string;
  readonly value: bigint;
}

export interface OperationJob {
  readonly kind: 'op';
  readonly name: string;
  readonly left: string;
  readonly op: BinaryOp;
  readonly right: string;
}

export type MonkeyJob = LiteralJob | OperationJob;

function buildValidatedJobMap(jobs: Iterable<MonkeyJob>): ReadonlyMap<string, MonkeyJob> {
  const map = new Map<string, MonkeyJob>();
  for (const job of jobs) {
    if (map.has(job.name)) throw new Error(`Duplicate monkey name: ${job.name}`);
    map.set(job.name, Object.freeze({ ...job }));
  }
  if (map.size === 0) throw new RangeError('Monkey riddle cannot be empty');
  for (const job of map.values()) {
    if (job.kind === 'op') {
      if (!map.has(job.left)) throw new Error(`Monkey "${job.name}" references unknown operand "${job.left}"`);
      if (!map.has(job.right)) throw new Error(`Monkey "${job.name}" references unknown operand "${job.right}"`);
    }
  }
  return map;
}

function buildDependencyGraph(jobs: ReadonlyMap<string, MonkeyJob>): DirectedGraph<string> {
  const edges: [string, readonly string[]][] = [];
  for (const job of jobs.values()) {
    edges.push([job.name, job.kind === 'op' ? [job.left, job.right] : []]);
  }
  const graph = new DirectedGraph<string>(edges);
  // Enforce acyclicity immediately at construction time.
  graph.topologicalOrder();
  return graph;
}

function collectReachableNames(graph: DirectedGraph<string>, rootName: string): ReadonlySet<string> {
  const visited = new Set<string>([rootName]);
  const queue: string[] = [rootName];
  for (let head = 0; head < queue.length; head++) {
    for (const dep of graph.outNeighbors(queue[head]!)) {
      if (!visited.has(dep)) {
        visited.add(dep);
        queue.push(dep);
      }
    }
  }
  return visited;
}

/** Validated, immutable DAG of monkey yelling jobs. */
export class MonkeyRiddle {
  private readonly jobs: ReadonlyMap<string, MonkeyJob>;
  private readonly graph: DirectedGraph<string>;

  constructor(jobs: Iterable<MonkeyJob>) {
    this.jobs = buildValidatedJobMap(jobs);
    this.graph = buildDependencyGraph(this.jobs);
    Object.freeze(this);
  }

  get monkeyCount(): number {
    return this.jobs.size;
  }

  get literalCount(): number {
    let count = 0;
    for (const job of this.jobs.values()) {
      if (job.kind === 'literal') count += 1;
    }
    return count;
  }

  get operationCount(): number {
    return this.jobs.size - this.literalCount;
  }

  get names(): readonly string[] {
    return Object.freeze([...this.jobs.keys()]);
  }

  get topDownOrder(): readonly string[] {
    return this.graph.topologicalOrder();
  }

  get bottomUpOrder(): readonly string[] {
    return Object.freeze([...this.graph.topologicalOrder()].reverse());
  }

  has(name: string): boolean {
    return this.jobs.has(name);
  }

  get(name: string): MonkeyJob | undefined {
    return this.jobs.get(name);
  }

  require(name: string): MonkeyJob {
    const job = this.jobs.get(name);
    if (!job) throw new Error(`Unknown monkey: ${name}`);
    return job;
  }

  /** Returns monkeys reachable from `rootName` in bottom-up dependency order. */
  reachableBottomUp(rootName: string): readonly string[] {
    this.require(rootName);
    const reachable = collectReachableNames(this.graph, rootName);
    return Object.freeze(this.bottomUpOrder.filter((name) => reachable.has(name)));
  }
}
