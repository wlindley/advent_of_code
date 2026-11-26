import { sampleTraceIndices, validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../../shared/core';
import {
  comparePackets,
  ComparisonTrace,
  PacketList,
  parsePacket,
  parseSignalInput,
  SignalInput,
  traceComparison,
} from '../../shared';

export const DIVIDER_FIRST = parsePacket('[[2]]');
export const DIVIDER_SECOND = parsePacket('[[6]]');
export const DEFAULT_MAX_TRACE_STEPS = 150;

export type DividerBand = 'before-first' | 'between' | 'after-second';

/** Classifies a packet into its partition relative to [[2]] and [[6]]. */
export function classifyPacket(packet: PacketList): DividerBand {
  if (comparePackets(packet, DIVIDER_FIRST) < 0) return 'before-first';
  if (comparePackets(packet, DIVIDER_SECOND) < 0) return 'between';
  return 'after-second';
}

function validateComparisons(
  firstComparison: ComparisonTrace,
  secondComparison: ComparisonTrace | null,
  band: DividerBand,
): void {
  if (firstComparison.outcome < 0) {
    if (secondComparison !== null || band !== 'before-first') {
      throw new Error('before-first frame cannot have secondComparison or mismatched band');
    }
    return;
  }
  if (secondComparison === null) {
    throw new Error('non-before-first frame requires secondComparison');
  }
  const expected: DividerBand = secondComparison.outcome < 0 ? 'between' : 'after-second';
  if (band !== expected) {
    throw new Error(`band ${band} does not match secondComparison outcome`);
  }
}

function countBand(bands: readonly DividerBand[], target: DividerBand): number {
  let count = 0;
  for (const band of bands) {
    if (band === target) count += 1;
  }
  return count;
}

/** Immutable divider-classification snapshot at a 1-based packet index. */
export class DividerTraceFrame {
  readonly packetIndex: number;
  readonly totalPackets: number;
  readonly packet: PacketList;
  readonly firstComparison: ComparisonTrace;
  readonly secondComparison: ComparisonTrace | null;
  readonly bands: readonly DividerBand[];

  constructor(
    packetIndex: number,
    totalPackets: number,
    packet: PacketList,
    firstComparison: ComparisonTrace,
    secondComparison: ComparisonTrace | null,
    bands: readonly DividerBand[],
  ) {
    if (!Number.isInteger(totalPackets) || totalPackets < 1) {
      throw new RangeError(`totalPackets must be a positive integer, got ${totalPackets}`);
    }
    if (!Number.isInteger(packetIndex) || packetIndex < 1 || packetIndex > totalPackets) {
      throw new RangeError(`packetIndex must be in [1, ${totalPackets}], got ${packetIndex}`);
    }
    if (bands.length !== packetIndex) {
      throw new RangeError(`bands length must equal packetIndex ${packetIndex}, got ${bands.length}`);
    }
    validateComparisons(firstComparison, secondComparison, bands[packetIndex - 1]!);
    this.packetIndex = packetIndex;
    this.totalPackets = totalPackets;
    this.packet = packet;
    this.firstComparison = firstComparison;
    this.secondComparison = secondComparison;
    this.bands = Object.freeze([...bands]);
    Object.freeze(this);
  }

  get band(): DividerBand { return this.bands[this.packetIndex - 1]!; }
  get beforeFirstCount(): number { return countBand(this.bands, 'before-first'); }
  get betweenCount(): number { return countBand(this.bands, 'between'); }
  get afterSecondCount(): number { return countBand(this.bands, 'after-second'); }
  get firstDividerIndex(): number { return 1 + this.beforeFirstCount; }
  get secondDividerIndex(): number { return 2 + this.beforeFirstCount + this.betweenCount; }
  get decoderKey(): number { return this.firstDividerIndex * this.secondDividerIndex; }
  get isComplete(): boolean { return this.packetIndex === this.totalPackets; }
  get decidingDivider(): PacketList { return this.secondComparison === null ? DIVIDER_FIRST : DIVIDER_SECOND; }
  get decidingComparison(): ComparisonTrace { return this.secondComparison ?? this.firstComparison; }
}

/** Computes the decoder key via O(N) single-pass divider classification. */
export function solvePart2(input: SignalInput): number {
  const packets = input.packets;
  let beforeFirst = 0;
  let between = 0;
  for (const packet of packets) {
    const band = classifyPacket(packet);
    if (band === 'before-first') beforeFirst += 1;
    else if (band === 'between') between += 1;
  }
  return (1 + beforeFirst) * (2 + beforeFirst + between);
}

function buildFrame(
  idx: number,
  packets: readonly PacketList[],
  allBands: readonly DividerBand[],
): DividerTraceFrame {
  const packet = packets[idx]!;
  const first = traceComparison(packet, DIVIDER_FIRST);
  const second = first.outcome < 0 ? null : traceComparison(packet, DIVIDER_SECOND);
  return new DividerTraceFrame(idx + 1, packets.length, packet, first, second, allBands.slice(0, idx + 1));
}

/** Builds a bounded sequence of divider classification frames for visualization. */
export function buildPart2Trace(
  input: SignalInput,
  options?: TraceOptions,
): readonly DividerTraceFrame[] {
  const packets = input.packets;
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const allBands = packets.map(classifyPacket);
  const sampled = sampleTraceIndices(packets.length, limit);
  return Object.freeze(sampled.map((idx) => buildFrame(idx, packets, allBands)));
}

export const solver: PuzzleSolver<SignalInput, number, DividerTraceFrame> = Object.freeze({
  parse: parseSignalInput,
  solve: solvePart2,
  trace: buildPart2Trace,
});
