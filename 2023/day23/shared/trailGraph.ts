import type { TrailMap } from './trailMap';

/** Contracted directed corridor between two junction vertices. */
export class TrailEdge {
  readonly from: number;
  readonly to: number;
  readonly cells: readonly number[];

  constructor(from: number, to: number, cells: readonly number[]) {
    if (cells.length < 2) {
      throw new RangeError(`TrailEdge requires at least 2 cells, got ${cells.length}`);
    }
    this.from = from;
    this.to = to;
    this.cells = Object.freeze(cells.slice());
    Object.freeze(this);
  }

  get weight(): number {
    return this.cells.length - 1;
  }
}

/** Contracted junction graph preserving corridor cell paths for visualization. */
export class TrailGraph {
  readonly junctions: readonly number[];
  readonly startId: number;
  readonly endId: number;
  readonly edges: readonly TrailEdge[];

  constructor(
    junctions: readonly number[],
    startId: number,
    endId: number,
    edges: readonly TrailEdge[],
  ) {
    if (junctions.length < 2) {
      throw new RangeError(`TrailGraph requires at least 2 junctions, got ${junctions.length}`);
    }
    this.junctions = Object.freeze(junctions.slice());
    this.startId = startId;
    this.endId = endId;
    this.edges = Object.freeze(edges.slice());
    Object.freeze(this);
  }

  get vertexCount(): number {
    return this.junctions.length;
  }

  get edgeCount(): number {
    return this.edges.length;
  }

  edgeBetween(from: number, to: number): TrailEdge | null {
    for (const edge of this.edges) {
      if (edge.from === from && edge.to === to) return edge;
    }
    return null;
  }

  expandVertexPath(vertexPath: readonly number[]): number[] {
    if (vertexPath.length === 0) return [];
    const expanded: number[] = [this.junctions[vertexPath[0]!]!];
    for (let i = 0; i < vertexPath.length - 1; i += 1) {
      const from = vertexPath[i]!;
      const to = vertexPath[i + 1]!;
      const edge = this.edgeBetween(from, to);
      if (edge === null) {
        throw new Error(`Missing trail edge between junctions ${from} and ${to}`);
      }
      for (let k = 1; k < edge.cells.length; k += 1) {
        expanded.push(edge.cells[k]!);
      }
    }
    return expanded;
  }
}

function walkCorridor(
  map: TrailMap,
  vertexOfCell: Int32Array,
  startCell: number,
  firstStep: number,
  ignoreSlopes: boolean,
): number[] | null {
  const cells = [startCell, firstStep];
  let prev = startCell;
  let curr = firstStep;
  while (vertexOfCell[curr] === -1) {
    let next = -1;
    for (const candidate of map.outgoingNeighbors(curr, ignoreSlopes)) {
      if (candidate !== prev) {
        next = candidate;
        break;
      }
    }
    if (next === -1) return null;
    cells.push(next);
    prev = curr;
    curr = next;
  }
  return cells;
}

function assignJunctions(map: TrailMap): {
  readonly vertexOfCell: Int32Array;
  readonly junctions: number[];
} {
  const vertexOfCell = new Int32Array(map.size).fill(-1);
  const junctions: number[] = [map.start, map.end];
  vertexOfCell[map.start] = 0;
  vertexOfCell[map.end] = 1;
  for (let cell = 0; cell < map.size; cell += 1) {
    if (cell !== map.start && cell !== map.end && map.walkableDegree(cell) >= 3) {
      vertexOfCell[cell] = junctions.length;
      junctions.push(cell);
    }
  }
  return { vertexOfCell, junctions };
}

/** Contracts degree-<=2 trail corridors into weighted junction-to-junction edges. */
export function contractTrailGraph(map: TrailMap, ignoreSlopes: boolean): TrailGraph {
  const { vertexOfCell, junctions } = assignJunctions(map);
  const bestEdges = new Map<number, TrailEdge>();
  const stride = junctions.length;
  for (let fromId = 0; fromId < stride; fromId += 1) {
    if (fromId === 1) continue;
    const fromCell = junctions[fromId]!;
    for (const firstStep of map.outgoingNeighbors(fromCell, ignoreSlopes)) {
      const cells = walkCorridor(map, vertexOfCell, fromCell, firstStep, ignoreSlopes);
      if (cells === null) continue;
      const toId = vertexOfCell[cells[cells.length - 1]!]!;
      if (toId === 0 || toId === fromId) continue;
      const key = fromId * stride + toId;
      const existing = bestEdges.get(key);
      if (existing === undefined || cells.length - 1 > existing.weight) {
        bestEdges.set(key, new TrailEdge(fromId, toId, cells));
      }
    }
  }
  return new TrailGraph(junctions, 0, 1, Array.from(bestEdges.values()));
}
