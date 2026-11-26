import { describe, expect, it } from 'vitest';
import { parseReindeerMaze } from './parse';

describe('parseReindeerMaze', () => {
  it('parses a valid grid with CRLF and trailing newlines', () => {
    const raw = '#####\r\n#S.E#\r\n#####\r\n\n';
    const maze = parseReindeerMaze(raw);
    expect(maze.width).toBe(5);
    expect(maze.height).toBe(3);
    expect(maze.startCell).toBe(maze.cellIndex(1, 1));
    expect(maze.endCell).toBe(maze.cellIndex(1, 3));
    expect(maze.isWall(0, 0)).toBe(true);
    expect(maze.isWall(1, 2)).toBe(false);
    expect(maze.isWall(1, 1)).toBe(false);
    expect(maze.isWall(1, 3)).toBe(false);
  });

  it('rejects empty inputs and interior blank lines', () => {
    expect(() => parseReindeerMaze('')).toThrow(Error);
    expect(() => parseReindeerMaze('\r\n\n')).toThrow(Error);
    expect(() => parseReindeerMaze('#S#\n\n#E#')).toThrow(Error);
  });

  it('rejects non-rectangular grids and invalid characters', () => {
    expect(() => parseReindeerMaze('#S#\n#E##')).toThrow(Error);
    expect(() => parseReindeerMaze('#S#\n#X#\n#E#')).toThrow(Error);
  });

  it('requires exactly one start S and one end E', () => {
    expect(() => parseReindeerMaze('#.#\n#E#')).toThrow(Error);
    expect(() => parseReindeerMaze('#S#\n#.#')).toThrow(Error);
    expect(() => parseReindeerMaze('#S#\n#S#\n#E#')).toThrow(Error);
    expect(() => parseReindeerMaze('#S#\n#E#\n#E#')).toThrow(Error);
  });
});
