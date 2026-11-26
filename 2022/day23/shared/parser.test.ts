import { describe, expect, it } from 'vitest';
import { parseElves } from './parser';

describe('Day 23 parser', () => {
  it('parses elf coordinates with CRLF and trailing newlines', () => {
    const raw = '##\r\n..\r\n.#.\r\n\r\n';
    const elves = parseElves(raw);
    expect(elves).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 2, col: 1 },
    ]);
    expect(Object.isFrozen(elves)).toBe(true);
  });

  it('rejects empty input and newline-only input', () => {
    expect(() => parseElves('')).toThrow();
    expect(() => parseElves('\r\n\n')).toThrow();
  });

  it('rejects blank internal lines', () => {
    expect(() => parseElves('#.\n\n.#')).toThrow();
  });

  it('rejects characters outside . and #', () => {
    expect(() => parseElves('.#.\n.x.\n')).toThrow();
    expect(() => parseElves(' .#')).toThrow();
  });

  it('rejects grids containing zero elves', () => {
    expect(() => parseElves('...\n...')).toThrow();
  });
});
