import { describe, expect, it } from 'vitest';
import {
  BitSpan,
  LITERAL_TYPE_ID,
  LiteralPacket,
  OperatorPacket,
  type Packet,
} from './packet';

describe('Packet AST value objects', () => {
  it('constructs frozen BitSpan with positive length', () => {
    const span = new BitSpan(3, 14);
    expect(Object.isFrozen(span)).toBe(true);
    expect(span.startBit).toBe(3);
    expect(span.endBit).toBe(14);
    expect(span.length).toBe(11);
  });

  it('rejects invalid BitSpan bounds', () => {
    expect(() => new BitSpan(-1, 5)).toThrow(RangeError);
    expect(() => new BitSpan(5, 5)).toThrow(RangeError);
    expect(() => new BitSpan(6, 4)).toThrow(RangeError);
    expect(() => new BitSpan(0.5, 4)).toThrow(RangeError);
    expect(() => new BitSpan(0, 4.5)).toThrow(RangeError);
  });

  it('constructs frozen LiteralPacket with derived structural metrics', () => {
    const lit = new LiteralPacket(6, 2021n, new BitSpan(0, 21));
    expect(Object.isFrozen(lit)).toBe(true);
    expect(lit.kind).toBe('literal');
    expect(lit.version).toBe(6);
    expect(lit.typeId).toBe(LITERAL_TYPE_ID);
    expect(lit.value).toBe(2021n);
    expect(lit.groupCount).toBe(3);
    expect(lit.versionSum).toBe(6);
    expect(lit.packetCount).toBe(1);
    expect(lit.maxDepth).toBe(0);
  });

  it('rejects negative literal values or invalid literal bit lengths', () => {
    expect(() => new LiteralPacket(1, -1n, new BitSpan(0, 11))).toThrow(RangeError);
    expect(() => new LiteralPacket(1, 0n, new BitSpan(0, 10))).toThrow(RangeError);
    expect(() => new LiteralPacket(1, 0n, new BitSpan(0, 12))).toThrow(RangeError);
  });

  it('constructs frozen OperatorPacket with defensive frozen children and recursive getters', () => {
    const a = new LiteralPacket(2, 10n, new BitSpan(22, 33));
    const b = new LiteralPacket(4, 20n, new BitSpan(33, 49));
    const inner = new OperatorPacket(3, 0, 1, [a, b], new BitSpan(18, 49));
    const inputChildren: Packet[] = [inner];
    const outer = new OperatorPacket(5, 1, 0, inputChildren, new BitSpan(0, 49));

    inputChildren.push(a);
    expect(Object.isFrozen(outer)).toBe(true);
    expect(Object.isFrozen(outer.children)).toBe(true);
    expect(outer.kind).toBe('operator');
    expect(outer.children).toHaveLength(1);
    expect(outer.headerBitLength).toBe(22);
    expect(inner.headerBitLength).toBe(18);
    expect(outer.versionSum).toBe(14);
    expect(outer.packetCount).toBe(4);
    expect(outer.maxDepth).toBe(2);
  });

  it('rejects OperatorPacket without children', () => {
    expect(() => new OperatorPacket(1, 0, 0, [], new BitSpan(0, 22))).toThrow(RangeError);
  });
});
