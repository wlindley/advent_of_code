import { describe, expect, it } from 'vitest';
import { parseDonutMaze } from './maze';

const VALID_MINI = [
  '     A     ',
  '     A     ',
  '  ###.###  ',
  'BC...#...DE',
  '  #..#..#  ',
  '  # D#B #  ',
  '  # E#C #  ',
  '  ###.###  ',
  '     Z     ',
  '     Z     ',
].join('\n');

const RAGGED_VALID = [
  '     A',
  '     A',
  '  ###.###',
  'BC...#...DE',
  '  #..#..#',
  '  # D#B #',
  '  # E#C #',
  '  ###.###',
  '     Z',
  '     Z',
].join('\n');

describe('parseDonutMaze', () => {
  it('preserves leading whitespace, trims outer blank lines, and pads ragged lines', () => {
    const maze = parseDonutMaze(`\n\n${RAGGED_VALID}\r\n\n`);
    expect(maze.rows).toBe(10);
    expect(maze.cols).toBe(11);
    expect(maze.charAt(0, 5)).toBe('A');
    expect(maze.charAt(3, 0)).toBe('B');
    expect(maze.charAt(0, 10)).toBe(' ');
    expect(maze.isOpen(2, 5)).toBe(true);
    expect(maze.isOpen(2, 4)).toBe(false);
    expect(maze.isOpen(-1, 0)).toBe(false);
    expect(maze.portals.length).toBe(6);
    expect(Object.isFrozen(maze)).toBe(true);
  });

  it('extracts labels top-to-bottom / left-to-right and classifies outer vs inner portals', () => {
    const padded = VALID_MINI.split('\n')
      .map((line) => `    ${line}`)
      .join('\n');
    const maze = parseDonutMaze(padded);
    const byKey = new Map(maze.portals.map((p) => [`${p.label}:${p.side}`, p]));

    expect(byKey.get('AA:outer')?.row).toBe(2);
    expect(byKey.get('AA:outer')?.col).toBe(9);
    expect(byKey.get('ZZ:outer')?.row).toBe(7);
    expect(byKey.get('ZZ:outer')?.col).toBe(9);
    expect(byKey.get('BC:outer')?.pairId).toBe(byKey.get('BC:inner')?.id);
    expect(byKey.get('BC:inner')?.pairId).toBe(byKey.get('BC:outer')?.id);
    expect(byKey.get('DE:outer')?.pairId).toBe(byKey.get('DE:inner')?.id);
    expect(maze.portals[maze.startId]?.label).toBe('AA');
    expect(maze.portals[maze.goalId]?.label).toBe('ZZ');
  });

  it('rejects out-of-bounds codeAt calls', () => {
    const maze = parseDonutMaze(VALID_MINI);
    expect(() => maze.codeAt(-1, 0)).toThrow(RangeError);
    expect(() => maze.codeAt(0, 99)).toThrow(RangeError);
  });

  it('rejects empty, invalid-character, and wall-less inputs', () => {
    expect(() => parseDonutMaze('')).toThrow(/empty/);
    expect(() => parseDonutMaze('   \n\n  ')).toThrow(/empty/);
    expect(() => parseDonutMaze('###\n#@#\n###')).toThrow(/Invalid character/);
    expect(() => parseDonutMaze('AA\nZZ')).toThrow(/wall or corridor/);
  });

  it('rejects truncated 1-letter portal labels adjacent to open tiles', () => {
    const truncatedTop = ['  A  ', ' #.# ', ' ### '].join('\n');
    const truncatedRight = [' ### ', ' #..A', ' ### '].join('\n');
    expect(() => parseDonutMaze(truncatedTop)).toThrow(/Truncated portal label/);
    expect(() => parseDonutMaze(truncatedRight)).toThrow(/Truncated portal label/);
  });

  it('rejects missing AA/ZZ or unpaired/over-paired portal labels', () => {
    const noAA = ['  ###  ', '  #.#  ', '  #Z#  ', '  #Z#  '].join('\n');
    const twoAA = ['  A  ', '  A  ', ' #.# ', ' #.# ', '  A  ', '  A  ', '  Z  ', '  Z  '].join('\n');
    const noZZ = ['  A  ', '  A  ', ' #.# ', ' ### '].join('\n');
    const singleBC = ['  A  ', '  A  ', ' #.# ', 'BC.# ', ' #.# ', '  Z  ', '  Z  '].join('\n');

    expect(() => parseDonutMaze(noAA)).toThrow(/AA/);
    expect(() => parseDonutMaze(twoAA)).toThrow(/AA/);
    expect(() => parseDonutMaze(noZZ)).toThrow(/ZZ/);
    expect(() => parseDonutMaze(singleBC)).toThrow(/BC/);
  });
});
