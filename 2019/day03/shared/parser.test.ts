import { describe, expect, it } from 'vitest';
import { buildWireSegments, parseWireMoves, parseWirePair } from './parser';

describe('parseWireMoves', () => {
  it('parses valid comma-separated moves with optional whitespace and huge distances', () => {
    const moves = parseWireMoves(' R8 , U5 , L5 , D100000000000000000000 ');
    expect(moves).toEqual([
      { direction: 'R', distance: 8n },
      { direction: 'U', distance: 5n },
      { direction: 'L', distance: 5n },
      { direction: 'D', distance: 100000000000000000000n },
    ]);
    expect(Object.isFrozen(moves)).toBe(true);
  });

  it('rejects empty path and malformed tokens', () => {
    expect(() => parseWireMoves('   ')).toThrow();
    expect(() => parseWireMoves('R0')).toThrow();
    expect(() => parseWireMoves('L-3')).toThrow();
    expect(() => parseWireMoves('X5')).toThrow();
    expect(() => parseWireMoves('R8,,U5')).toThrow();
    expect(() => parseWireMoves('R8,')).toThrow();
  });
});

describe('buildWireSegments', () => {
  it('chains endpoints and cumulative step counts from origin', () => {
    const segments = buildWireSegments(parseWireMoves('R8,U5,L5,D3'));
    expect(segments).toHaveLength(4);
    expect(segments[0]!.start).toEqual({ x: 0n, y: 0n });
    expect(segments[0]!.end).toEqual({ x: 8n, y: 0n });
    expect(segments[1]!.startSteps).toBe(8n);
    expect(segments[3]!.end).toEqual({ x: 3n, y: 2n });
    expect(segments[3]!.endSteps).toBe(21n);
    expect(buildWireSegments([])).toEqual([]);
  });
});

describe('parseWirePair', () => {
  it('parses two non-empty lines supporting CRLF and surrounding blank lines', () => {
    const pair = parseWirePair('\r\n  R8,U5  \r\n\r\n  U7,R6 \r\n');
    expect(Object.isFrozen(pair)).toBe(true);
    expect(pair.first).toHaveLength(2);
    expect(pair.second).toHaveLength(2);
    expect(pair.first[1]!.end).toEqual({ x: 8n, y: 5n });
    expect(pair.second[1]!.end).toEqual({ x: 6n, y: 7n });
  });

  it('rejects inputs without exactly two wire lines', () => {
    expect(() => parseWirePair('')).toThrow();
    expect(() => parseWirePair('R8,U5')).toThrow();
    expect(() => parseWirePair('R8,U5\nU7,R6\nD1')).toThrow();
  });
});
