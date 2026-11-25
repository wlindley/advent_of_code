import { describe, expect, it } from 'vitest';
import { Grid2D } from '../../../shared/core';
import { TachyonManifold, type ManifoldCell } from './index';

const EXAMPLE = [
  '.......S.......',
  '...............',
  '.......^.......',
  '...............',
  '......^.^......',
  '...............',
  '.....^.^.^.....',
  '...............',
  '....^.^...^....',
  '...............',
  '...^.^...^.^...',
  '...............',
  '..^...^.....^..',
  '...............',
  '.^.^.^.^.^...^.',
  '...............',
].join('\n');

describe('2025 Day 7 shared TachyonManifold', () => {
  it('parses the 16x15 example manifold with computed getters and immutability', () => {
    const m = TachyonManifold.parse(EXAMPLE);
    expect(m.rows).toBe(16);
    expect(m.cols).toBe(15);
    expect(m.startRow).toBe(0);
    expect(m.startCol).toBe(7);
    expect(m.splitterCount).toBe(22);
    expect(m.isSplitter(2, 7)).toBe(true);
    expect(m.isSplitter(0, 7)).toBe(false);
    expect(m.isSplitter(1, 0)).toBe(false);
    expect(() => m.isSplitter(-1, 0)).toThrow(RangeError);
    expect(Object.isFrozen(m)).toBe(true);
  });

  it('supports CRLF line endings and minimal 1x1 emitter grid', () => {
    const crlf = TachyonManifold.parse('.S.\r\n.^.\r\n');
    expect(crlf.rows).toBe(2);
    expect(crlf.cols).toBe(3);
    expect(crlf.startRow).toBe(0);
    expect(crlf.startCol).toBe(1);
    expect(crlf.splitterCount).toBe(1);

    const single = TachyonManifold.parse('S');
    expect(single.rows).toBe(1);
    expect(single.cols).toBe(1);
    expect(single.startRow).toBe(0);
    expect(single.startCol).toBe(0);
    expect(single.splitterCount).toBe(0);
    expect(single.isSplitter(0, 0)).toBe(false);
  });

  it('rejects empty, jagged, unknown-char, missing-S, and duplicate-S inputs', () => {
    expect(() => TachyonManifold.parse('')).toThrow(Error);
    expect(() => TachyonManifold.parse('..S\n..')).toThrow(Error);
    expect(() => TachyonManifold.parse('..S\n.x.')).toThrow(/row 1, col 1/i);
    expect(() => TachyonManifold.parse('...\n.^.')).toThrow(/missing.*S/i);
    expect(() => TachyonManifold.parse('S..\n..S')).toThrow(/duplicate.*S/i);
  });

  it('validates direct constructor start coordinates against grid', () => {
    const grid = Grid2D.fromLines<ManifoldCell>('.S.\n.^.', (ch) => ch as ManifoldCell);
    expect(() => new TachyonManifold(grid, 0, 0)).toThrow(Error);
    expect(() => new TachyonManifold(grid, 2, 1)).toThrow(Error);
    const valid = new TachyonManifold(grid, 0, 1);
    expect(valid.startCol).toBe(1);
  });
});
