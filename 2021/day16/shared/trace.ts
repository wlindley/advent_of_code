import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import type { DecodedTransmission } from './decoder';
import type { PacketPolicy } from './evaluator';
import type { Packet } from './packet';

export const DEFAULT_MAX_TRACE_STEPS = 60;
export type PacketTracePhase = 'decode' | 'reduce';

/** Immutable pre-order indexed packet node for O(1) trace and tree rendering. */
export class IndexedPacketNode {
  constructor(
    readonly id: number,
    readonly postOrderRank: number,
    readonly parentId: number | null,
    readonly depth: number,
    readonly packet: Packet,
  ) {
    Object.freeze(this);
  }

  get headerEndBit(): number {
    const headerBits = this.packet.kind === 'literal' ? 6 : this.packet.headerBitLength;
    return this.packet.span.startBit + headerBits;
  }
}

/** Shared immutable transmission tree, policy values, and timeline metadata. */
export class PacketTraceSnapshot {
  readonly nodes: readonly IndexedPacketNode[];
  readonly nodeValues: readonly bigint[];
  readonly totalTimeline: number;

  constructor(
    readonly transmission: DecodedTransmission,
    readonly policy: PacketPolicy,
    nodes: readonly IndexedPacketNode[],
    nodeValues: readonly bigint[],
  ) {
    this.nodes = Object.freeze([...nodes]);
    this.nodeValues = Object.freeze([...nodeValues]);
    this.totalTimeline = this.nodes.length * 2;
    Object.freeze(this);
  }
}

/** Immutable step frame capturing decode discovery or post-order reduction progress. */
export class PacketTraceFrame {
  constructor(
    readonly step: number,
    readonly phase: PacketTracePhase,
    readonly activeNodeId: number,
    readonly decodedCount: number,
    readonly reducedCount: number,
    readonly cursorBit: number,
    readonly runningVersionSum: number,
    readonly activeResult: bigint | null,
    readonly snapshot: PacketTraceSnapshot,
  ) {
    Object.freeze(this);
  }

  get activeNode(): IndexedPacketNode {
    return this.snapshot.nodes[this.activeNodeId]!;
  }

  get isComplete(): boolean {
    return this.reducedCount === this.snapshot.nodes.length;
  }

  get progressRatio(): number {
    return (this.decodedCount + this.reducedCount) / this.snapshot.totalTimeline;
  }

  isNodeDecoded(id: number): boolean {
    return id >= 0 && id < this.decodedCount;
  }

  isNodeReduced(id: number): boolean {
    return (
      id >= 0 &&
      id < this.snapshot.nodes.length &&
      this.snapshot.nodes[id]!.postOrderRank < this.reducedCount
    );
  }
}

interface DraftNode {
  readonly id: number;
  readonly parentId: number | null;
  readonly depth: number;
  readonly packet: Packet;
  postOrderRank: number;
  value: bigint;
}

function collectPacketDrafts(
  packet: Packet,
  parentId: number | null,
  depth: number,
  policy: PacketPolicy,
  drafts: DraftNode[],
  postOrderIds: number[],
): bigint {
  const id = drafts.length;
  const draft: DraftNode = { id, parentId, depth, packet, postOrderRank: -1, value: 0n };
  drafts.push(draft);
  let value: bigint;
  if (packet.kind === 'literal') {
    value = policy.reduceLiteral(packet);
  } else {
    const childValues: bigint[] = [];
    for (const child of packet.children) {
      childValues.push(collectPacketDrafts(child, id, depth + 1, policy, drafts, postOrderIds));
    }
    value = policy.reduceOperator(packet, childValues);
  }
  draft.postOrderRank = postOrderIds.length;
  draft.value = value;
  postOrderIds.push(id);
  return value;
}

function buildTraceArtifacts(transmission: DecodedTransmission, policy: PacketPolicy) {
  const drafts: DraftNode[] = [];
  const postOrderIds: number[] = [];
  collectPacketDrafts(transmission.root, null, 0, policy, drafts, postOrderIds);

  const nodes = drafts.map((d) => new IndexedPacketNode(d.id, d.postOrderRank, d.parentId, d.depth, d.packet));
  const nodeValues = drafts.map((d) => d.value);
  const prefixVersionSums = new Int32Array(nodes.length);
  let acc = 0;
  for (let i = 0; i < nodes.length; i += 1) {
    acc += nodes[i]!.packet.version;
    prefixVersionSums[i] = acc;
  }
  return { snapshot: new PacketTraceSnapshot(transmission, policy, nodes, nodeValues), postOrderIds, prefixVersionSums };
}

function buildFrame(
  step: number,
  snapshot: PacketTraceSnapshot,
  postOrderIds: readonly number[],
  prefixVersionSums: Int32Array,
): PacketTraceFrame {
  const nodeCount = snapshot.nodes.length;
  if (step < nodeCount) {
    const node = snapshot.nodes[step]!;
    const cursorBit = node.packet.kind === 'literal' ? node.packet.span.endBit : node.headerEndBit;
    return new PacketTraceFrame(
      step, 'decode', node.id, step + 1, 0, cursorBit, prefixVersionSums[step]!, null, snapshot,
    );
  }
  const rank = step - nodeCount;
  const activeNodeId = postOrderIds[rank]!;
  return new PacketTraceFrame(
    step,
    'reduce',
    activeNodeId,
    nodeCount,
    rank + 1,
    snapshot.transmission.bitsConsumed,
    prefixVersionSums[nodeCount - 1]!,
    snapshot.nodeValues[activeNodeId]!,
    snapshot,
  );
}

/** Samples unified decode + post-order reduction trace frames bounded by `maxSteps`. */
export function traceTransmission(
  transmission: DecodedTransmission,
  policy: PacketPolicy,
  options?: TraceOptions,
): readonly PacketTraceFrame[] {
  const maxSteps = validateMaxSteps(options === undefined ? undefined : options.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const { snapshot, postOrderIds, prefixVersionSums } = buildTraceArtifacts(transmission, policy);
  const indices = sampleTraceIndices(snapshot.totalTimeline, maxSteps);
  const frames: PacketTraceFrame[] = [];
  for (const step of indices) {
    frames.push(buildFrame(step, snapshot, postOrderIds, prefixVersionSums));
  }
  return Object.freeze(frames);
}
