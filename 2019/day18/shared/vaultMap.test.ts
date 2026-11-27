import { describe, expect, it } from 'vitest';
import { parseVaultMap, splitVaultForQuadRobots } from './vaultMap';

describe('vaultMap', () => {
  it('parses keys sorted alphabetically, doors, walls, and single entrance with 26-bit masks', () => {
    const raw = [
      '#######',
      '#e.A@b#',
      '#######',
    ].join('\n');
    const map = parseVaultMap(raw);

    expect(Object.isFrozen(map)).toBe(true);
    expect(map.rows).toBe(3);
    expect(map.cols).toBe(7);
    expect(map.entrances).toEqual([{ row: 1, col: 4 }]);
    expect(map.keys).toEqual([
      { id: 0, letter: 'b', bit: 1 << 1, pos: { row: 1, col: 5 } },
      { id: 1, letter: 'e', bit: 1 << 4, pos: { row: 1, col: 1 } },
    ]);
    expect(map.nodeCount).toBe(3);
    expect(map.allKeysMask).toBe((1 << 1) | (1 << 4));
    expect(map.isWallCell(map.cellOf(0, 0))).toBe(true);
    expect(map.isWallCell(map.cellOf(1, 2))).toBe(false);
    expect(map.keyIdAtCell(map.cellOf(1, 5))).toBe(0);
    expect(map.keyIdAtCell(map.cellOf(1, 2))).toBe(-1);
    expect(map.doorBitAtCell(map.cellOf(1, 3))).toBe(1 << 0);
    expect(map.doorBitAtCell(map.cellOf(1, 2))).toBe(0);
    expect(map.keyBitById(1)).toBe(1 << 4);
    expect(map.nodePos(0)).toEqual({ row: 1, col: 5 });
    expect(map.nodePos(2)).toEqual({ row: 1, col: 4 });
    expect(map.nodeCell(2)).toBe(1 * 7 + 4);
    expect(map.pointOf(11)).toEqual({ row: 1, col: 4 });
  });

  it('supports zero-key vaults and up to 4 entrances', () => {
    const zeroKey = parseVaultMap('###\n#@#\n###');
    expect(zeroKey.keys).toEqual([]);
    expect(zeroKey.allKeysMask).toBe(0);

    const fourEntrances = parseVaultMap('@.@\n.#.\n@a@');
    expect(fourEntrances.entrances.length).toBe(4);
    expect(fourEntrances.nodeCount).toBe(5);
  });

  it('rejects empty, jagged, invalid characters, duplicate keys, and bad entrance counts', () => {
    expect(() => parseVaultMap('   \n  ')).toThrow();
    expect(() => parseVaultMap('###\n##')).toThrow();
    expect(() => parseVaultMap('#!@')).toThrow(/Invalid vault character/);
    expect(() => parseVaultMap('#[@')).toThrow(/Invalid vault character/);
    expect(() => parseVaultMap('#{@')).toThrow(/Invalid vault character/);
    expect(() => parseVaultMap('#a.@.a#')).toThrow(/Duplicate key/);
    expect(() => parseVaultMap('#a.#')).toThrow(/at least one entrance/);
    expect(() => parseVaultMap('@@@@@')).toThrow(/at most 4 entrances/);
  });

  it('splits a single interior open-neighborhood entrance into four quad entrances', () => {
    const raw = [
      '#######',
      '#a...b#',
      '#..@..#',
      '#c...d#',
      '#######',
    ].join('\n');
    const single = parseVaultMap(raw);
    const quad = splitVaultForQuadRobots(single);

    expect(quad.entrances).toEqual([
      { row: 1, col: 2 },
      { row: 1, col: 4 },
      { row: 3, col: 2 },
      { row: 3, col: 4 },
    ]);
    expect(quad.isWallCell(quad.cellOf(2, 3))).toBe(true);
    expect(quad.isWallCell(quad.cellOf(1, 3))).toBe(true);
    expect(quad.isWallCell(quad.cellOf(2, 2))).toBe(true);
    expect(quad.keys.map((k) => k.letter)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('rejects quad splitting for multi-entrance, border, or non-open 3x3 centers', () => {
    const multi = parseVaultMap('@.@\n...\n@.@');
    expect(() => splitVaultForQuadRobots(multi)).toThrow(/single entrance/);

    const topEdge = parseVaultMap('#@#\n...\n###');
    expect(() => splitVaultForQuadRobots(topEdge)).toThrow(/strictly interior/);

    const rightEdge = parseVaultMap('###\n..@\n###');
    expect(() => splitVaultForQuadRobots(rightEdge)).toThrow(/strictly interior/);

    const blockedNeighbor = parseVaultMap('#####\n#.#.#\n#.@.#\n#...#\n#####');
    expect(() => splitVaultForQuadRobots(blockedNeighbor)).toThrow(/8 open neighbors/);
  });
});
