import { ROOT_OBJECT, type OrbitEdge, type OrbitTransferRoute } from './types';

interface TreeArrays {
  readonly labels: readonly string[];
  readonly idByLabel: Map<string, number>;
  readonly parentIds: Int32Array;
  readonly depths: Int32Array;
  readonly childOffsets: Int32Array;
  readonly childIds: Int32Array;
}

type AdjBuild = {
  readonly parentByChild: Map<string, string>;
  readonly childrenByParent: Map<string, string[]>;
};

function buildAdjacency(edges: readonly OrbitEdge[]): AdjBuild {
  if (edges.length === 0) throw new RangeError('Orbit map requires at least one edge');
  const parentByChild = new Map<string, string>();
  const childrenByParent = new Map<string, string[]>();
  for (const { parent, child } of edges) {
    if (parent.length === 0 || child.length === 0) throw new RangeError('Orbit labels must be non-empty');
    if (child === ROOT_OBJECT) throw new RangeError(`${ROOT_OBJECT} cannot orbit another object`);
    if (parentByChild.has(child)) throw new RangeError(`Duplicate parent for object ${child}`);
    parentByChild.set(child, parent);
    const list = childrenByParent.get(parent);
    if (list !== undefined) list.push(child);
    else childrenByParent.set(parent, [child]);
  }
  if (!childrenByParent.has(ROOT_OBJECT)) throw new RangeError(`Missing root ${ROOT_OBJECT}`);
  return { parentByChild, childrenByParent };
}

function buildTreeArrays(edges: readonly OrbitEdge[]): TreeArrays {
  const { parentByChild, childrenByParent } = buildAdjacency(edges);
  const labels: string[] = [ROOT_OBJECT];
  const idByLabel = new Map<string, number>([[ROOT_OBJECT, 0]]);
  const parents = [-1], depths = [0], childOffsets = [0], childIds: number[] = [];
  for (let head = 0; head < labels.length; head += 1) {
    const children = childrenByParent.get(labels[head]!);
    if (children !== undefined) {
      const nextDepth = depths[head]! + 1;
      for (const child of children) {
        idByLabel.set(child, labels.length);
        childIds.push(labels.length);
        labels.push(child);
        parents.push(head);
        depths.push(nextDepth);
      }
    }
    childOffsets.push(childIds.length);
  }
  if (labels.length !== parentByChild.size + 1) throw new RangeError('Disconnected or cyclic orbit map');
  return {
    labels: Object.freeze(labels),
    idByLabel,
    parentIds: Int32Array.from(parents),
    depths: Int32Array.from(depths),
    childOffsets: Int32Array.from(childOffsets),
    childIds: Int32Array.from(childIds),
  };
}

/** Immutable rooted orbit tree backed by BFS-ordered CSR Int32Array tables. */
export class OrbitMap {
  private readonly labels: readonly string[];
  private readonly idByLabel: Map<string, number>;
  private readonly parentIds: Int32Array;
  private readonly depths: Int32Array;
  private readonly childOffsets: Int32Array;
  private readonly childIds: Int32Array;

  constructor(edges: readonly OrbitEdge[]) {
    const tree = buildTreeArrays(edges);
    this.labels = tree.labels;
    this.idByLabel = tree.idByLabel;
    this.parentIds = tree.parentIds;
    this.depths = tree.depths;
    this.childOffsets = tree.childOffsets;
    this.childIds = tree.childIds;
    Object.freeze(this);
  }

  get nodeCount(): number { return this.labels.length; }
  get edgeCount(): number { return this.labels.length - 1; }
  get rootLabel(): string { return this.labels[0]!; }
  get maxDepth(): number { return this.depths[this.depths.length - 1]!; }

  get totalOrbits(): number {
    let sum = 0;
    for (let i = 0; i < this.depths.length; i += 1) sum += this.depths[i]!;
    return sum;
  }

  idOf(label: string): number | null { return this.idByLabel.get(label) ?? null; }
  labelOf(id: number): string { this.assertValidId(id); return this.labels[id]!; }
  depthOfId(id: number): number { this.assertValidId(id); return this.depths[id]!; }

  parentIdOf(id: number): number | null {
    this.assertValidId(id);
    const parentId = this.parentIds[id]!;
    return parentId === -1 ? null : parentId;
  }

  childIdsOf(id: number): readonly number[] {
    this.assertValidId(id);
    return Object.freeze(
      Array.from(this.childIds.subarray(this.childOffsets[id]!, this.childOffsets[id + 1]!)),
    );
  }

  findTransferRoute(fromLabel: string, toLabel: string): OrbitTransferRoute {
    const fromId = this.requireParentId(fromLabel);
    const toId = this.requireParentId(toLabel);
    let u = fromId, v = toId;
    const upPath: number[] = [], downReversed: number[] = [];
    while (this.depths[u]! > this.depths[v]!) { upPath.push(u); u = this.parentIds[u]!; }
    while (this.depths[v]! > this.depths[u]!) { downReversed.push(v); v = this.parentIds[v]!; }
    while (u !== v) {
      upPath.push(u); u = this.parentIds[u]!;
      downReversed.push(v); v = this.parentIds[v]!;
    }
    upPath.push(u);
    for (let i = downReversed.length - 1; i >= 0; i -= 1) upPath.push(downReversed[i]!);
    return Object.freeze({ fromId, toId, lcaId: u, pathNodeIds: Object.freeze(upPath) });
  }

  private assertValidId(id: number): void {
    if (!Number.isInteger(id) || id < 0 || id >= this.labels.length) throw new RangeError(`Invalid id: ${id}`);
  }

  private requireParentId(label: string): number {
    const id = this.idByLabel.get(label);
    if (id === undefined) throw new RangeError(`Unknown orbit object: ${label}`);
    const parentId = this.parentIds[id]!;
    if (parentId === -1) throw new RangeError(`${label} has no parent orbit`);
    return parentId;
  }
}
