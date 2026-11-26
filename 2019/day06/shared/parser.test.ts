import { describe, expect, it } from 'vitest';
import { parseOrbitMap } from './parser';

describe('parseOrbitMap', () => {
  it('parses CRLF/LF lines, skips blank lines, and trims whitespace', () => {
    const raw = '\n  COM ) B \r\n\r\n B)C\nC)D  \n';
    const map = parseOrbitMap(raw);
    expect(map.nodeCount).toBe(4);
    expect(map.totalOrbits).toBe(6);
  });

  it('rejects malformed lines, empty inputs, and empty labels', () => {
    expect(() => parseOrbitMap('   \n\r\n')).toThrow(RangeError);
    expect(() => parseOrbitMap('COM-B')).toThrow(SyntaxError);
    expect(() => parseOrbitMap('COM)B)C')).toThrow(SyntaxError);
    expect(() => parseOrbitMap(')B')).toThrow(RangeError);
    expect(() => parseOrbitMap('COM)   ')).toThrow(RangeError);
  });
});
