import { describe, expect, it } from 'vitest';
import { buildSweepSpec, sweepLine, tiltBuffer } from './sweep';

const encoder = new TextEncoder();
const decoder = new TextDecoder('ascii');

function encodeGrid(lines: readonly string[]): Uint8Array {
  return encoder.encode(lines.join(''));
}

function decodeGrid(buf: Uint8Array, width: number): string[] {
  const text = decoder.decode(buf);
  const rows: string[] = [];
  for (let i = 0; i < text.length; i += width) {
    rows.push(text.slice(i, i + width));
  }
  return rows;
}

describe('2023/day14/shared/sweep', () => {
  it('computes sweep specs for all four directions', () => {
    expect(buildSweepSpec('north', 3, 5)).toEqual({
      lineCount: 5,
      lineLength: 3,
      baseOffset: 0,
      lineStride: 1,
      stepStride: 5,
    });
    expect(buildSweepSpec('west', 3, 5)).toEqual({
      lineCount: 3,
      lineLength: 5,
      baseOffset: 0,
      lineStride: 5,
      stepStride: 1,
    });
    expect(buildSweepSpec('south', 3, 5)).toEqual({
      lineCount: 5,
      lineLength: 3,
      baseOffset: 10,
      lineStride: 1,
      stepStride: -5,
    });
    expect(buildSweepSpec('east', 3, 5)).toEqual({
      lineCount: 3,
      lineLength: 5,
      baseOffset: 4,
      lineStride: 5,
      stepStride: -1,
    });
  });

  it('sweeps single lines for both writeStep === step and writeStep !== step', () => {
    const src = encoder.encode('O.#.O.');
    const dst = new Uint8Array(src.length);
    sweepLine(src, dst, 0, src.length, 1);
    expect(decoder.decode(dst)).toBe('O.#O..');
  });

  it('tilts an asymmetric 3x5 buffer in all four directions without mutating source', () => {
    const original = ['.O.#.', '..O.O', '#..O.'];
    const src = encodeGrid(original);
    const snapshot = new Uint8Array(src);

    expect(decodeGrid(tiltBuffer(src, 3, 5, 'north'), 5)).toEqual(['.OO#O', '...O.', '#....']);
    expect(decodeGrid(tiltBuffer(src, 3, 5, 'west'), 5)).toEqual(['O..#.', 'OO...', '#O...']);
    expect(decodeGrid(tiltBuffer(src, 3, 5, 'south'), 5)).toEqual(['...#.', '.....', '#OOOO']);
    expect(decodeGrid(tiltBuffer(src, 3, 5, 'east'), 5)).toEqual(['..O#.', '...OO', '#...O']);
    expect(src).toEqual(snapshot);
  });

  it('handles 1x1, 1xN, and Nx1 buffers', () => {
    expect(decodeGrid(tiltBuffer(encodeGrid(['O']), 1, 1, 'north'), 1)).toEqual(['O']);
    expect(decodeGrid(tiltBuffer(encodeGrid(['.O#.O']), 1, 5, 'west'), 5)).toEqual(['O.#O.']);
    expect(decodeGrid(tiltBuffer(encodeGrid(['.', 'O', '#', '.', 'O']), 5, 1, 'south'), 1)).toEqual([
      '.',
      'O',
      '#',
      '.',
      'O',
    ]);
  });
});
