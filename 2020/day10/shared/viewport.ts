import { bigintLog2 } from '../../../shared/core';
import type { AdapterChain, ChainNodeKind, JoltDelta } from './chain';
import type { AdapterTraceFrame } from './trace';

/** Default maximum number of adapter nodes rendered in the viewport window. */
export const DEFAULT_VIEWPORT_SLOTS = 36;

/** Frozen projection of a single node slot inside the visible chain window. */
export class ChainNodeSlot {
  readonly nodeIndex: number;
  readonly joltage: number;
  readonly kind: ChainNodeKind;
  readonly ways: bigint | null;
  readonly normalizedWaysHeight: number;

  constructor(nodeIndex: number, joltage: number, kind: ChainNodeKind, ways: bigint | null, normalizedWaysHeight: number) {
    this.nodeIndex = nodeIndex;
    this.joltage = joltage;
    this.kind = kind;
    this.ways = ways;
    this.normalizedWaysHeight = normalizedWaysHeight;
    Object.freeze(this);
  }
}

/** Frozen directed edge or predecessor jump arc visible inside the viewport. */
export class ChainEdgeArc {
  readonly fromIndex: number;
  readonly toIndex: number;
  readonly delta: JoltDelta;

  constructor(fromIndex: number, toIndex: number, delta: JoltDelta) {
    this.fromIndex = fromIndex;
    this.toIndex = toIndex;
    this.delta = delta;
    Object.freeze(this);
  }
}

/** Frozen viewport slice centered around the active trace node. */
export class ChainViewport {
  readonly startIndex: number;
  readonly nodes: readonly ChainNodeSlot[];
  readonly edges: readonly ChainEdgeArc[];
  readonly activeIndex: number;
  readonly maxWaysLog2: number;

  constructor(startIndex: number, nodes: readonly ChainNodeSlot[], edges: readonly ChainEdgeArc[], activeIndex: number, maxWaysLog2: number) {
    if (nodes.length === 0) {
      throw new RangeError('ChainViewport requires at least one node slot');
    }
    this.startIndex = startIndex;
    this.nodes = Object.freeze([...nodes]);
    this.edges = Object.freeze([...edges]);
    this.activeIndex = activeIndex;
    this.maxWaysLog2 = maxWaysLog2;
    Object.freeze(this);
  }

  get nodeCount(): number { return this.nodes.length; }
  get endIndex(): number { return this.startIndex + this.nodes.length; }
  get hasLeftOverflow(): boolean { return this.startIndex > 0; }
  get hasRightOverflow(): boolean { return this.nodes[this.nodes.length - 1]!.kind !== 'device'; }

  slotOf(nodeIndex: number): number | null {
    if (nodeIndex < this.startIndex || nodeIndex >= this.endIndex) return null;
    return nodeIndex - this.startIndex;
  }
}

function validateViewportArgs(chain: AdapterChain, frame: AdapterTraceFrame, maxSlots: number): void {
  if (!Number.isInteger(maxSlots) || maxSlots < 1) {
    throw new RangeError(`maxSlots must be a positive integer, got ${maxSlots}`);
  }
  const expectedSteps = frame.phase === 'differences' ? chain.nodeCount - 1 : chain.nodeCount;
  if (frame.totalSteps !== expectedSteps) {
    throw new RangeError(`Frame totalSteps ${frame.totalSteps} does not match expected ${expectedSteps}`);
  }
}

function resolveWindow(nodeCount: number, activeIndex: number, maxSlots: number): readonly [number, number] {
  if (nodeCount <= maxSlots) return [0, nodeCount];
  const start = Math.min(Math.max(0, activeIndex - Math.floor(maxSlots / 2)), nodeCount - maxSlots);
  return [start, start + maxSlots];
}

function buildViewportEdges(chain: AdapterChain, frame: AdapterTraceFrame, start: number, end: number): readonly ChainEdgeArc[] {
  const edges: ChainEdgeArc[] = [];
  if (frame.phase === 'differences') {
    for (let i = start + 1; i < end; i += 1) {
      edges.push(new ChainEdgeArc(i - 1, i, chain.stepDelta(i)));
    }
    return edges;
  }
  for (const p of frame.predecessorIndices) {
    if (p < start) continue;
    const delta = (chain.joltageAt(frame.activeIndex) - chain.joltageAt(p)) as JoltDelta;
    edges.push(new ChainEdgeArc(p, frame.activeIndex, delta));
  }
  return edges;
}

/** Projects a chain and trace frame into a bounded viewport with monotonic log2 scaling. */
export function computeChainViewport(chain: AdapterChain, frame: AdapterTraceFrame, maxSlots: number): ChainViewport {
  validateViewportArgs(chain, frame, maxSlots);
  const [start, end] = resolveWindow(chain.nodeCount, frame.activeIndex, maxSlots);
  const maxWaysLog2 = frame.phase === 'arrangements' ? bigintLog2(frame.ways) : 0;
  const nodes: ChainNodeSlot[] = [];
  for (let i = start; i < end; i += 1) {
    const ways = frame.phase === 'arrangements' ? frame.waysIfComputed(i) : null;
    const normalizedWaysHeight = ways === null ? 0 : (bigintLog2(ways) + 1) / (maxWaysLog2 + 1);
    nodes.push(new ChainNodeSlot(i, chain.joltageAt(i), chain.nodeKind(i), ways, normalizedWaysHeight));
  }
  const edges = buildViewportEdges(chain, frame, start, end);
  return new ChainViewport(start, nodes, edges, frame.activeIndex, maxWaysLog2);
}
