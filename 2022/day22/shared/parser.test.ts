import { describe, expect, it } from 'vitest';
import { parseMonkeyMap } from './parser';
import { Tile } from './types';

describe('parseMonkeyMap', () => {
  it('preserves leading spaces on row 0 and parses CRLF and trailing newlines', () => {
    const raw = '  .#\r\n...\r\n\r\n10R5L0\r\n\r\n';
    const parsed = parseMonkeyMap(raw);

    expect(parsed.board.height).toBe(2);
    expect(parsed.board.width).toBe(4);
    expect(parsed.board.tileAt(0, 0)).toBe(Tile.Void);
    expect(parsed.board.tileAt(0, 1)).toBe(Tile.Void);
    expect(parsed.board.tileAt(0, 2)).toBe(Tile.Open);
    expect(parsed.board.tileAt(0, 3)).toBe(Tile.Wall);
    expect(parsed.board.tileAt(1, 3)).toBe(Tile.Void);
    expect(parsed.path).toEqual([
      { kind: 'move', distance: 10 },
      { kind: 'turn', turn: 'R' },
      { kind: 'move', distance: 5 },
      { kind: 'turn', turn: 'L' },
      { kind: 'move', distance: 0 },
    ]);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.path)).toBe(true);
  });

  it('rejects missing or extra blank-line sections', () => {
    expect(() => parseMonkeyMap('...\n1R1')).toThrow(/section/i);
    expect(() => parseMonkeyMap('...\n\n1R1\n\n2L')).toThrow(/section/i);
  });

  it('rejects board rows with zero non-void tiles or invalid characters', () => {
    expect(() => parseMonkeyMap('   \n\n1')).toThrow(/playable/i);
    expect(() => parseMonkeyMap('...\n   \n\n1')).toThrow(/playable/i);
    expect(() => parseMonkeyMap('.@.\n\n1')).toThrow(/board character/i);
  });

  it('rejects empty path, invalid path characters, and unsafe integer distances', () => {
    expect(() => parseMonkeyMap('...\n\n')).toThrow(/empty/i);
    expect(() => parseMonkeyMap('...\n\n10X2')).toThrow(/path character/i);
    expect(() => parseMonkeyMap('...\n\n9007199254740992')).toThrow(/unsafe/i);
  });
});
