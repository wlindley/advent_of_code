/** Canonical endpoint name for the cave entrance. */
export const START_CAVE = 'start';
/** Canonical endpoint name for the cave exit. */
export const END_CAVE = 'end';

export type CaveKind = 'start' | 'end' | 'big' | 'small';

export interface CaveEdge {
  readonly a: string;
  readonly b: string;
}

const BIG_CAVE_RE = /^[A-Z]+$/;
const SMALL_CAVE_RE = /^[a-z]+$/;

/** Classifies a cave name and enforces pure ASCII uppercase or lowercase naming. */
export function classifyCave(name: string): CaveKind {
  if (name === START_CAVE) return 'start';
  if (name === END_CAVE) return 'end';
  if (BIG_CAVE_RE.test(name)) return 'big';
  if (SMALL_CAVE_RE.test(name)) return 'small';
  throw new Error(`Invalid cave name "${name}": must be pure ASCII uppercase or lowercase letters`);
}

/** Returns the first small cave visited at least twice along `path`, or `null`. */
export function findRevisitedSmallCave(path: readonly string[]): string | null {
  const seen = new Set<string>();
  for (const name of path) {
    if (classifyCave(name) !== 'small') continue;
    if (seen.has(name)) return name;
    seen.add(name);
  }
  return null;
}

function canonicalizeEdge(edge: CaveEdge): CaveEdge {
  const kindA = classifyCave(edge.a);
  const kindB = classifyCave(edge.b);
  if (edge.a === edge.b) {
    throw new Error(`Self-loop edge on cave "${edge.a}" is not allowed`);
  }
  if (kindA === 'big' && kindB === 'big') {
    throw new Error(`Big-to-big edge "${edge.a}-${edge.b}" would allow infinite cycles`);
  }
  return edge.a < edge.b
    ? Object.freeze({ a: edge.a, b: edge.b })
    : Object.freeze({ a: edge.b, b: edge.a });
}

function compareEdges(left: CaveEdge, right: CaveEdge): number {
  if (left.a !== right.a) return left.a < right.a ? -1 : 1;
  return left.b < right.b ? -1 : 1;
}

function addAdjacency(adjacency: Map<string, string[]>, from: string, to: string): void {
  const list = adjacency.get(from);
  if (list === undefined) {
    adjacency.set(from, [to]);
    return;
  }
  list.push(to);
}

interface GraphData {
  readonly caves: readonly string[];
  readonly edges: readonly CaveEdge[];
  readonly adjacency: ReadonlyMap<string, readonly string[]>;
}

function buildGraphData(rawEdges: readonly CaveEdge[]): GraphData {
  const seenEdges = new Set<string>();
  const edges: CaveEdge[] = [];
  const mutableAdj = new Map<string, string[]>();

  for (const rawEdge of rawEdges) {
    const edge = canonicalizeEdge(rawEdge);
    const key = `${edge.a}-${edge.b}`;
    if (seenEdges.has(key)) {
      throw new Error(`Duplicate edge "${key}" is not allowed`);
    }
    seenEdges.add(key);
    edges.push(edge);
    addAdjacency(mutableAdj, edge.a, edge.b);
    addAdjacency(mutableAdj, edge.b, edge.a);
  }

  if (!mutableAdj.has(START_CAVE) || !mutableAdj.has(END_CAVE)) {
    throw new Error('Cave system must contain both "start" and "end" caves');
  }

  edges.sort(compareEdges);
  const caves = [...mutableAdj.keys()].sort();
  const adjacency = new Map<string, readonly string[]>();
  for (const [cave, neighbors] of mutableAdj.entries()) {
    adjacency.set(cave, Object.freeze([...neighbors].sort()));
  }
  return { caves: Object.freeze(caves), edges: Object.freeze(edges), adjacency };
}

/** Validated, immutable undirected cave passage graph. */
export class CaveSystem {
  readonly caves: readonly string[];
  readonly edges: readonly CaveEdge[];
  private readonly adjacency: ReadonlyMap<string, readonly string[]>;

  constructor(edges: readonly CaveEdge[]) {
    const data = buildGraphData(edges);
    this.caves = data.caves;
    this.edges = data.edges;
    this.adjacency = data.adjacency;
    Object.freeze(this);
  }

  /** Returns the sorted neighbors of `cave`, throwing if `cave` is not in the graph. */
  neighborsOf(cave: string): readonly string[] {
    const neighbors = this.adjacency.get(cave);
    if (neighbors === undefined) {
      throw new Error(`Unknown cave "${cave}"`);
    }
    return neighbors;
  }
}
