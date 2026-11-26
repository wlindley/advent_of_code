import { describe, expect, it } from 'vitest';
import { parseCamelCardsDeal, parseHandLine, parseUnsignedBigInt } from './parser';

describe('Camel Cards parser', () => {
  it('parses unsigned BigInt tokens and rejects invalid tokens', () => {
    expect(parseUnsignedBigInt('0')).toBe(0n);
    expect(parseUnsignedBigInt('123456789012345678901234567890')).toBe(
      123456789012345678901234567890n,
    );
    expect(() => parseUnsignedBigInt('')).toThrow(SyntaxError);
    expect(() => parseUnsignedBigInt('-5')).toThrow(SyntaxError);
    expect(() => parseUnsignedBigInt('12a')).toThrow(SyntaxError);
  });

  it('parses a valid hand line and preserves inputIndex', () => {
    const hand = parseHandLine('  T55J5   684  ', 2);
    expect(hand.label).toBe('T55J5');
    expect(hand.bid).toBe(684n);
    expect(hand.inputIndex).toBe(2);
  });

  it('rejects malformed hand lines', () => {
    expect(() => parseHandLine('32T3K', 0)).toThrow(SyntaxError);
    expect(() => parseHandLine('32T3K 765 extra', 0)).toThrow(SyntaxError);
    expect(() => parseHandLine('   ', 0)).toThrow(SyntaxError);
    expect(() => parseHandLine('32X3K 765', 0)).toThrow(RangeError);
    expect(() => parseHandLine('32T3K abc', 0)).toThrow(SyntaxError);
  });

  it('parses multi-line deals with CRLF and blank lines, rejecting empty input', () => {
    const deal = parseCamelCardsDeal('\r\n32T3K 765\r\n\r\nT55J5 684\n');
    expect(deal.hands.length).toBe(2);
    expect(deal.hands[0]!.label).toBe('32T3K');
    expect(deal.hands[1]!.label).toBe('T55J5');
    expect(deal.hands[1]!.inputIndex).toBe(1);

    expect(() => parseCamelCardsDeal('')).toThrow(SyntaxError);
    expect(() => parseCamelCardsDeal('   \r\n\t\n  ')).toThrow(SyntaxError);
  });
});
