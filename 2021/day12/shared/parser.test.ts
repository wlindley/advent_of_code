import { describe, expect, it } from 'vitest';
import { parseCaveSystem } from './parser';

describe('parseCaveSystem', () => {
  it('parses LF and CRLF edge lists into a canonical CaveSystem', () => {
    const system = parseCaveSystem('start-A\r\nA-end\r\nstart-b\nb-end\n');

    expect(system.caves).toEqual(['A', 'b', 'end', 'start']);
    expect(system.edges).toEqual([
      { a: 'A', b: 'end' },
      { a: 'A', b: 'start' },
      { a: 'b', b: 'end' },
      { a: 'b', b: 'start' },
    ]);
  });

  it('rejects empty or whitespace-only input', () => {
    expect(() => parseCaveSystem('')).toThrow(/empty/i);
    expect(() => parseCaveSystem('   \n\t  ')).toThrow(/empty/i);
  });

  it('rejects lines without exact two-segment a-b syntax', () => {
    expect(() => parseCaveSystem('start-A\n\nA-end')).toThrow(/line 2/i);
    expect(() => parseCaveSystem('startA\nA-end')).toThrow(/line 1/i);
    expect(() => parseCaveSystem('start-A-end')).toThrow(/line 1/i);
  });

  it('delegates graph validation to CaveSystem', () => {
    expect(() => parseCaveSystem('start-A\nA-B\nB-end')).toThrow(/Big-to-big/);
  });
});
