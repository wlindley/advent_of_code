import { describe, expect, it } from 'vitest';
import { MAX_PACKET_DEPTH, parsePacket, parseSignalInput } from './parser';

describe('packet parser', () => {
  it('parses empty, flat, multi-digit, zero, and nested lists', () => {
    expect(parsePacket('[]').format()).toBe('[]');
    expect(parsePacket('[0,10,42]').format()).toBe('[0,10,42]');
    expect(parsePacket('[[1],[2,3,4]]').format()).toBe('[[1],[2,3,4]]');
    expect(parsePacket('[[[]]]').format()).toBe('[[[]]]');
  });

  it('accepts nesting up to MAX_PACKET_DEPTH and rejects deeper nesting', () => {
    const atLimit = `${'['.repeat(MAX_PACKET_DEPTH + 1)}${']'.repeat(MAX_PACKET_DEPTH + 1)}`;
    expect(parsePacket(atLimit).format()).toBe(atLimit);

    const overLimit = `${'['.repeat(MAX_PACKET_DEPTH + 2)}${']'.repeat(MAX_PACKET_DEPTH + 2)}`;
    expect(() => parsePacket(overLimit)).toThrow(RangeError);
  });

  it('rejects malformed packet syntax', () => {
    const invalidPackets = [
      '',
      '42',
      '[',
      '[1,',
      '[1,2',
      '[1]]',
      '[1][2]',
      '[1,]',
      '[,1]',
      '[1,,2]',
      '[1 2]',
      ' [1]',
      '[1] ',
      '[1, 2]',
      '[01]',
      '[-1]',
    ];
    for (const line of invalidPackets) {
      expect(() => parsePacket(line)).toThrow(SyntaxError);
    }
  });

  it('parses valid signal pairs and normalizes CRLF/CR line endings', () => {
    const input = parseSignalInput('\n[1,2]\r\n[1,3]\r\n\r\n[[1]]\r[2]\n');
    expect(input.pairCount).toBe(2);
    expect(input.pairs[0]!.left.format()).toBe('[1,2]');
    expect(input.pairs[1]!.right.format()).toBe('[2]');
  });

  it('rejects empty inputs, non-pair blocks, and double blank lines', () => {
    expect(() => parseSignalInput('')).toThrow(Error);
    expect(() => parseSignalInput('\n\n')).toThrow(Error);
    expect(() => parseSignalInput('[1]\n\n[2]\n[3]')).toThrow(Error);
    expect(() => parseSignalInput('[1]\n[2]\n[3]')).toThrow(Error);
    expect(() => parseSignalInput('[1]\n[2]\n\n\n[3]\n[4]')).toThrow(Error);
  });
});
