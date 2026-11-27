import { describe, expect, it } from 'vitest';
import { parseHexBitstream } from './bitstream';
import { DecodedTransmission, decodeTransmission } from './decoder';
import { LiteralPacket, OperatorPacket } from './packet';

describe('BITS transmission decoder', () => {
  it('decodes structural literal example D2FE28', () => {
    const decoded = decodeTransmission(parseHexBitstream('D2FE28'));
    expect(decoded).toBeInstanceOf(DecodedTransmission);
    expect(Object.isFrozen(decoded)).toBe(true);
    expect(decoded.bitsConsumed).toBe(21);
    expect(decoded.trailingZeroBits).toBe(3);
    expect(decoded.root).toBeInstanceOf(LiteralPacket);
    const lit = decoded.root as LiteralPacket;
    expect(lit.version).toBe(6);
    expect(lit.value).toBe(2021n);
    expect(lit.groupCount).toBe(3);
  });

  it('decodes structural length-type-0 example 38006F45291200', () => {
    const decoded = decodeTransmission(parseHexBitstream('38006F45291200'));
    expect(decoded.bitsConsumed).toBe(49);
    expect(decoded.trailingZeroBits).toBe(7);
    const op = decoded.root as OperatorPacket;
    expect(op.version).toBe(1);
    expect(op.typeId).toBe(6);
    expect(op.lengthTypeId).toBe(0);
    expect(op.children.map((c) => (c as LiteralPacket).value)).toEqual([10n, 20n]);
  });

  it('decodes structural length-type-1 example EE00D40C823060', () => {
    const decoded = decodeTransmission(parseHexBitstream('EE00D40C823060'));
    expect(decoded.bitsConsumed).toBe(51);
    expect(decoded.trailingZeroBits).toBe(5);
    const op = decoded.root as OperatorPacket;
    expect(op.version).toBe(7);
    expect(op.typeId).toBe(3);
    expect(op.lengthTypeId).toBe(1);
    expect(op.children.map((c) => (c as LiteralPacket).value)).toEqual([1n, 2n, 3n]);
  });

  it('decodes all four Part 1 version-sum examples accurately', () => {
    const cases: readonly [string, number][] = [
      ['8A004A801A8002F478', 16],
      ['620080001611562C8802118E34', 12],
      ['C0015000016115A2E0802F182340', 23],
      ['A0016C880162017C3686B18A3D4780', 31],
    ];
    for (const [hex, expectedSum] of cases) {
      const decoded = decodeTransmission(parseHexBitstream(hex));
      expect(decoded.root.versionSum).toBe(expectedSum);
    }
  });

  it('decodes arbitrary-precision literals exceeding 64 bits', () => {
    const hex = `33${'F'.repeat(19)}DE`;
    const decoded = decodeTransmission(parseHexBitstream(hex));
    const lit = decoded.root as LiteralPacket;
    expect(lit.value).toBe((1n << 68n) - 1n);
    expect(lit.groupCount).toBe(17);
  });

  it('rejects non-zero trailing padding bits and malformed operator headers', () => {
    // D2FE28 with trailing bit set to 1 -> D2FE29
    expect(() => decodeTransmission(parseHexBitstream('D2FE29'))).toThrow(/padding/);
    // Truncated header
    expect(() => decodeTransmission(parseHexBitstream('D'))).toThrow(/Unexpected end/);
    // lengthTypeId = 0, subBitLength = 0: v=0,t=0,I=0,L=0 (22 zero bits -> 6 hex zeros)
    expect(() => decodeTransmission(parseHexBitstream('000000'))).toThrow(/bit length must be positive/);
    // lengthTypeId = 0, subBitLength = 31 (> 10 remaining bits): 00007C00
    expect(() => decodeTransmission(parseHexBitstream('00007C00'))).toThrow(/exceeds remaining/);
    // lengthTypeId = 0, subBitLength = 5 (child literal is 11 bits -> overrun)
    expect(() => decodeTransmission(parseHexBitstream('0000144080'))).toThrow(/overran bit length/);
    // lengthTypeId = 1, subPacketCount = 0: v=0,t=0,I=1,N=0
    expect(() => decodeTransmission(parseHexBitstream('020000'))).toThrow(/count must be positive/);
  });
});
