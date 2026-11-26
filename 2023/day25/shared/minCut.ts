import type { WiringEdge } from './wiringGraph';

export type CutEdgeTuple = readonly [WiringEdge, WiringEdge, WiringEdge];
export type DisjointPathTuple = readonly [readonly number[], readonly number[], readonly number[]];

export interface ProbeRecord {
  readonly target: number;
  readonly flow: number;
}

/**
 * Immutable 3-edge minimum cut partition and augmenting-path decomposition.
 * Derived metrics (`sizeS`, `sizeT`, `product`, `probesRun`) are computed dynamically.
 */
export class MinCutResult {
  readonly source: number;
  readonly target: number;
  readonly sideS: readonly number[];
  readonly sideT: readonly number[];
  readonly cutEdges: CutEdgeTuple;
  readonly disjointPaths: DisjointPathTuple;
  readonly probes: readonly ProbeRecord[];

  constructor(
    source: number,
    target: number,
    sideS: readonly number[],
    sideT: readonly number[],
    cutEdges: CutEdgeTuple,
    disjointPaths: DisjointPathTuple,
    probes: readonly ProbeRecord[],
  ) {
    this.source = source;
    this.target = target;
    this.sideS = Object.freeze([...sideS]);
    this.sideT = Object.freeze([...sideT]);
    this.cutEdges = Object.freeze([cutEdges[0], cutEdges[1], cutEdges[2]]) as CutEdgeTuple;
    this.disjointPaths = Object.freeze([
      Object.freeze([...disjointPaths[0]]),
      Object.freeze([...disjointPaths[1]]),
      Object.freeze([...disjointPaths[2]]),
    ]) as DisjointPathTuple;
    this.probes = Object.freeze([...probes]);
    Object.freeze(this);
  }

  get sizeS(): number { return this.sideS.length; }
  get sizeT(): number { return this.sideT.length; }
  get product(): number { return this.sideS.length * this.sideT.length; }
  get probesRun(): number { return this.probes.length; }
}
