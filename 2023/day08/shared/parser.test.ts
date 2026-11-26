import { describe, expect, it } from 'vitest';
import { parseNodeLine, parseTape, parseWastelandNetwork } from './parser';

describe('parseTape', () => {
  it('parses trimmed L/R instruction lines', () => {
    const turns = parseTape('  RLRL  ');
    expect(turns).toEqual(['R', 'L', 'R', 'L']);
    expect(Object.isFrozen(turns)).toBe(true);
  });

  it('rejects empty or non-L/R instruction tapes', () => {
    expect(() => parseTape('')).toThrow(/tape/i);
    expect(() => parseTape('   ')).toThrow(/tape/i);
    expect(() => parseTape('RLX')).toThrow(/tape/i);
    expect(() => parseTape('rl')).toThrow(/tape/i);
  });
});

describe('parseNodeLine', () => {
  it('parses standard and alphanumeric node definitions', () => {
    expect(parseNodeLine('AAA = (BBB, CCC)')).toEqual({ label: 'AAA', left: 'BBB', right: 'CCC' });
    expect(parseNodeLine('  11A=(22B,   ZZ9) ')).toEqual({ label: '11A', left: '22B', right: 'ZZ9' });
  });

  it('rejects malformed node definitions', () => {
    expect(() => parseNodeLine('AAA = BBB, CCC')).toThrow(/node/i);
    expect(() => parseNodeLine('AA_A = (BBB, CCC)')).toThrow(/node/i);
    expect(() => parseNodeLine('LR')).toThrow(/node/i);
  });
});

describe('parseWastelandNetwork', () => {
  it('parses CRLF and blank lines into a WastelandNetwork', () => {
    const raw = 'RL\r\n\r\n11A = (11B, 22Z)\r\n11B = (11A, 11B)\r\n22Z = (22Z, 22Z)\r\n\r\n';
    const net = parseWastelandNetwork(raw);
    expect(net.tapeLength).toBe(2);
    expect(net.nodeCount).toBe(3);
    expect(net.labelOf(net.stepFrom(net.requireId('11A'), 0))).toBe('22Z');
  });

  it('rejects empty input and tape-only input', () => {
    expect(() => parseWastelandNetwork('')).toThrow(/empty/i);
    expect(() => parseWastelandNetwork('  \n \r\n ')).toThrow(/empty/i);
    expect(() => parseWastelandNetwork('RLR\n\n')).toThrow(/node/i);
  });

  it('rejects multi-line tape and malformed node lines', () => {
    expect(() => parseWastelandNetwork('RL\nLR\nAAA = (AAA, AAA)')).toThrow(/node/i);
    expect(() => parseWastelandNetwork('RL\nBAD LINE')).toThrow(/node/i);
  });

  it('rejects duplicate LHS labels and dangling left/right targets', () => {
    expect(() =>
      parseWastelandNetwork('L\nAAA = (AAA, AAA)\nAAA = (AAA, AAA)'),
    ).toThrow(/duplicate/i);
    expect(() =>
      parseWastelandNetwork('L\nAAA = (MISSING, AAA)'),
    ).toThrow(/MISSING/);
    expect(() =>
      parseWastelandNetwork('L\nAAA = (AAA, MISSING)'),
    ).toThrow(/MISSING/);
  });
});
