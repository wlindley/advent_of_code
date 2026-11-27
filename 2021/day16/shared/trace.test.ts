import { describe, expect, it } from 'vitest';
import { parseHexBitstream } from './bitstream';
import { decodeTransmission } from './decoder';
import { EVALUATE_EXPRESSION_POLICY, VERSION_SUM_POLICY } from './evaluator';
import {
  DEFAULT_MAX_TRACE_STEPS,
  IndexedPacketNode,
  PacketTraceFrame,
  PacketTraceSnapshot,
  traceTransmission,
} from './trace';

describe('Packet transmission trace', () => {
  it('traces decode then post-order reduce phases for an operator tree', () => {
    // 38006F45291200 -> 1 operator (<) + 2 literals (10, 20) => 3 nodes, 6 timeline steps
    const tx = decodeTransmission(parseHexBitstream('38006F45291200'));
    const frames = traceTransmission(tx, EVALUATE_EXPRESSION_POLICY);

    expect(DEFAULT_MAX_TRACE_STEPS).toBe(60);
    expect(frames).toHaveLength(6);
    expect(frames[0]).toBeInstanceOf(PacketTraceFrame);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(Object.isFrozen(frames[0])).toBe(true);
    expect(frames[0]!.snapshot).toBeInstanceOf(PacketTraceSnapshot);
    expect(Object.isFrozen(frames[0]!.snapshot)).toBe(true);
    expect(frames[0]!.snapshot.nodes[0]).toBeInstanceOf(IndexedPacketNode);
    expect(Object.isFrozen(frames[0]!.snapshot.nodes[0])).toBe(true);

    // Decode phase (steps 0..2)
    expect(frames[0]!.phase).toBe('decode');
    expect(frames[0]!.activeNodeId).toBe(0);
    expect(frames[0]!.activeNode.headerEndBit).toBe(22);
    expect(frames[0]!.cursorBit).toBe(22);
    expect(frames[0]!.decodedCount).toBe(1);
    expect(frames[0]!.reducedCount).toBe(0);
    expect(frames[0]!.activeResult).toBeNull();
    expect(frames[0]!.runningVersionSum).toBe(1);
    expect(frames[0]!.isComplete).toBe(false);
    expect(frames[0]!.isNodeDecoded(0)).toBe(true);
    expect(frames[0]!.isNodeDecoded(1)).toBe(false);
    expect(frames[0]!.isNodeDecoded(-1)).toBe(false);
    expect(frames[0]!.isNodeReduced(0)).toBe(false);

    // Literal child decode step
    expect(frames[1]!.activeNode.headerEndBit).toBe(28);
    expect(frames[1]!.cursorBit).toBe(33);

    // Reduce phase (steps 3..5): post-order visits child 1, child 2, then root 0
    expect(frames[3]!.phase).toBe('reduce');
    expect(frames[3]!.activeNodeId).toBe(1);
    expect(frames[3]!.activeResult).toBe(10n);
    expect(frames[3]!.cursorBit).toBe(49);
    expect(frames[3]!.isNodeReduced(1)).toBe(true);
    expect(frames[3]!.isNodeReduced(0)).toBe(false);
    expect(frames[3]!.isNodeReduced(-1)).toBe(false);
    expect(frames[3]!.isNodeReduced(99)).toBe(false);

    const last = frames[5]!;
    expect(last.phase).toBe('reduce');
    expect(last.activeNodeId).toBe(0);
    expect(last.activeResult).toBe(1n);
    expect(last.isComplete).toBe(true);
    expect(last.progressRatio).toBe(1);
    expect(last.isNodeReduced(0)).toBe(true);
  });

  it('samples frames uniformly when totalTimeline exceeds maxSteps and supports VERSION_SUM_POLICY', () => {
    const tx = decodeTransmission(parseHexBitstream('A0016C880162017C3686B18A3D4780'));
    const full = traceTransmission(tx, VERSION_SUM_POLICY);
    const sampled = traceTransmission(tx, VERSION_SUM_POLICY, { maxSteps: 4 });

    expect(full.length).toBeGreaterThan(4);
    expect(sampled).toHaveLength(4);
    expect(sampled[0]!.step).toBe(0);
    expect(sampled[3]!.step).toBe(full[full.length - 1]!.step);
    expect(sampled[3]!.activeResult).toBe(31n);
    expect(sampled[3]!.runningVersionSum).toBe(31);
  });

  it('rejects non-positive or non-integer maxSteps', () => {
    const tx = decodeTransmission(parseHexBitstream('D2FE28'));
    expect(() => traceTransmission(tx, VERSION_SUM_POLICY, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceTransmission(tx, VERSION_SUM_POLICY, { maxSteps: 2.5 })).toThrow(RangeError);
  });
});
