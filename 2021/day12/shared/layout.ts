import {
  classifyCave,
  END_CAVE,
  START_CAVE,
  type CaveEdge,
  type CaveKind,
  type CaveSystem,
} from './cave';

export interface CaveNodeLayout {
  readonly name: string;
  readonly kind: CaveKind;
  readonly col: number;
  readonly x: number;
  readonly y: number;
}

export interface CaveEdgeLayout {
  readonly from: string;
  readonly to: string;
  readonly x1: number;
  readonly y1: number;
  readonly cx: number;
  readonly cy: number;
  readonly x2: number;
  readonly y2: number;
}

export interface CaveGraphLayout {
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly CaveNodeLayout[];
  readonly edges: readonly CaveEdgeLayout[];
}

function validateDimension(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a finite positive number, got ${value}`);
  }
}

function computeBfsDistances(system: CaveSystem): Map<string, number> {
  const distances = new Map<string, number>([[START_CAVE, 0]]);
  const queue: string[] = [START_CAVE];
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head]!;
    const nextDist = distances.get(current)! + 1;
    for (const neighbor of system.neighborsOf(current)) {
      if (neighbor === END_CAVE || distances.has(neighbor)) continue;
      distances.set(neighbor, nextDist);
      queue.push(neighbor);
    }
  }
  return distances;
}

function assignColumns(
  system: CaveSystem,
  distances: ReadonlyMap<string, number>,
): { readonly columns: Map<string, number>; readonly endCol: number } {
  const columns = new Map<string, number>([[START_CAVE, 0]]);
  let maxDist = 0;
  for (const dist of distances.values()) {
    if (dist > maxDist) maxDist = dist;
  }
  let hasOverflow = false;
  const overflowCol = maxDist + 1;
  for (const cave of system.caves) {
    if (cave === START_CAVE || cave === END_CAVE) continue;
    const dist = distances.get(cave);
    if (dist === undefined) {
      columns.set(cave, overflowCol);
      hasOverflow = true;
    } else {
      columns.set(cave, dist);
    }
  }
  const endCol = hasOverflow ? overflowCol + 1 : overflowCol;
  columns.set(END_CAVE, endCol);
  return { columns, endCol };
}

function positionNodes(
  system: CaveSystem,
  columns: ReadonlyMap<string, number>,
  endCol: number,
  width: number,
  height: number,
): Map<string, CaveNodeLayout> {
  const padX = Math.min(56, width * 0.14);
  const padY = Math.min(44, height * 0.14);
  const buckets = new Map<number, string[]>();
  for (const cave of system.caves) {
    const col = columns.get(cave)!;
    const list = buckets.get(col);
    if (list === undefined) buckets.set(col, [cave]);
    else list.push(cave);
  }
  const positioned = new Map<string, CaveNodeLayout>();
  for (const [col, names] of buckets.entries()) {
    const x = padX + (col / endCol) * (width - 2 * padX);
    for (let i = 0; i < names.length; i += 1) {
      const name = names[i]!;
      const y = names.length === 1 ? height / 2 : padY + (i / (names.length - 1)) * (height - 2 * padY);
      positioned.set(name, Object.freeze({ name, kind: classifyCave(name), col, x, y }));
    }
  }
  return positioned;
}

function buildEdgeLayout(
  edge: CaveEdge,
  nodeA: CaveNodeLayout,
  nodeB: CaveNodeLayout,
  width: number,
  height: number,
): CaveEdgeLayout {
  const midX = (nodeA.x + nodeB.x) / 2;
  const midY = (nodeA.y + nodeB.y) / 2;
  let cx = midX;
  let cy = midY;
  if (nodeA.col === nodeB.col) {
    cx = midX + Math.min(28, width * 0.08);
  } else if (Math.abs(nodeA.col - nodeB.col) >= 2 && Math.abs(nodeA.y - nodeB.y) < 1) {
    cy = midY - Math.min(34, height * 0.14);
  }
  return Object.freeze({
    from: edge.a, to: edge.b,
    x1: nodeA.x, y1: nodeA.y, cx, cy, x2: nodeB.x, y2: nodeB.y,
  });
}

/** Computes a deterministic layered layout with quadratic Bezier edge curves. */
export function computeCaveLayout(system: CaveSystem, width: number, height: number): CaveGraphLayout {
  validateDimension(width, 'width');
  validateDimension(height, 'height');
  const distances = computeBfsDistances(system);
  const { columns, endCol } = assignColumns(system, distances);
  const nodeMap = positionNodes(system, columns, endCol, width, height);
  const nodes = system.caves.map((name) => nodeMap.get(name)!);
  const edges = system.edges.map((edge) =>
    buildEdgeLayout(edge, nodeMap.get(edge.a)!, nodeMap.get(edge.b)!, width, height),
  );
  return Object.freeze({ width, height, nodes: Object.freeze(nodes), edges: Object.freeze(edges) });
}
