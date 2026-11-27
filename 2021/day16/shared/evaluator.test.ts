import { describe, expect, it } from 'vitest';
import { parseHexBitstream } from './bitstream';
import { decodeTransmission } from './decoder';
import {
  EVALUATE_EXPRESSION_POLICY,
  OPERATOR_SPECS,
  PacketPolicy,
  VERSION_SUM_POLICY,
  evaluatePacket,
} from './evaluator';
import { BitSpan, LiteralPacket, OperatorPacket } from './packet';

describe('Packet evaluator and policies', () => {
  it('evaluates all eight classic Part 2 expression examples', () => {
    const cases: readonly [string, bigint][] = [
      ['C200B40A82', 3n],
      ['04005AC33890', 54n],
      ['880086C3E88112', 7n],
      ['CE00C43D881120', 9n],
      ['D8005AC2A8F0', 1n],
      ['F600BC2D8F', 0n],
      ['9C005AC2F8F0', 0n],
      ['9C0141080250320F1802104A08', 1n],
    ];
    for (const [hex, expected] of cases) {
      const { root } = decodeTransmission(parseHexBitstream(hex));
      expect(evaluatePacket(root)).toBe(expected);
      expect(EVALUATE_EXPRESSION_POLICY.compute(root)).toBe(expected);
    }
  });

  it('covers all comparison truth branches and min/max orderings', () => {
    expect(OPERATOR_SPECS[2].evaluate([9n, 3n, 7n])).toBe(3n);
    expect(OPERATOR_SPECS[3].evaluate([3n, 9n, 7n])).toBe(9n);
    expect(OPERATOR_SPECS[5].evaluate([9n, 4n])).toBe(1n);
    expect(OPERATOR_SPECS[5].evaluate([4n, 9n])).toBe(0n);
    expect(OPERATOR_SPECS[6].evaluate([4n, 9n])).toBe(1n);
    expect(OPERATOR_SPECS[6].evaluate([9n, 4n])).toBe(0n);
    expect(OPERATOR_SPECS[7].evaluate([8n, 8n])).toBe(1n);
    expect(OPERATOR_SPECS[7].evaluate([8n, 9n])).toBe(0n);
  });

  it('throws RangeError for empty inputs and invalid binary operator arity', () => {
    expect(() => OPERATOR_SPECS[0].evaluate([])).toThrow(RangeError);
    expect(() => OPERATOR_SPECS[1].evaluate([])).toThrow(RangeError);
    expect(() => OPERATOR_SPECS[2].evaluate([])).toThrow(RangeError);
    expect(() => OPERATOR_SPECS[3].evaluate([])).toThrow(RangeError);
    expect(() => OPERATOR_SPECS[5].evaluate([1n])).toThrow(RangeError);
    expect(() => OPERATOR_SPECS[6].evaluate([1n, 2n, 3n])).toThrow(RangeError);
    expect(() => OPERATOR_SPECS[7].evaluate([])).toThrow(RangeError);
  });

  it('allows VERSION_SUM_POLICY on a 3-child type-5 packet while EVALUATE_EXPRESSION_POLICY rejects it', () => {
    const c1 = new LiteralPacket(2, 1n, new BitSpan(18, 29));
    const c2 = new LiteralPacket(3, 2n, new BitSpan(29, 40));
    const c3 = new LiteralPacket(5, 3n, new BitSpan(40, 51));
    const op = new OperatorPacket(7, 5, 1, [c1, c2, c3], new BitSpan(0, 51));

    expect(VERSION_SUM_POLICY).toBeInstanceOf(PacketPolicy);
    expect(Object.isFrozen(VERSION_SUM_POLICY)).toBe(true);
    expect(Object.isFrozen(OPERATOR_SPECS)).toBe(true);
    expect(VERSION_SUM_POLICY.mode).toBe('version-sum');
    expect(VERSION_SUM_POLICY.compute(op)).toBe(17n);
    expect(VERSION_SUM_POLICY.compute(c1)).toBe(2n);
    expect(() => evaluatePacket(op)).toThrow(RangeError);
  });
});
