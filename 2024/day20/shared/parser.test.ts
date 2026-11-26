import { describe, expect, it } from 'vitest';
import { GridPoint } from './model';
import { parseRacetrack } from './parser';

describe('parseRacetrack', () => {
  it('parses rectangular track with CRLF and trailing newlines', () => {
    const raw = '####\r\n#S.#\r\n#.E#\r\n####\r\n\r\n';
    const track = parseRacetrack(raw);

    expect(track.rows).toBe(4);
    expect(track.cols).toBe(4);
    expect(track.start).toEqual(new GridPoint(1, 1));
    expect(track.end).toEqual(new GridPoint(2, 2));
    expect(track.isWall(0, 0)).toBe(true);
    expect(track.isWall(1, 1)).toBe(false);
    expect(track.isWall(1, 2)).toBe(false);
  });

  it('rejects empty, empty-row, non-rectangular, and invalid-character inputs', () => {
    expect(() => parseRacetrack('')).toThrow(Error);
    expect(() => parseRacetrack('\r\n\n')).toThrow(Error);
    expect(() => parseRacetrack('\nS.E')).toThrow(Error);
    expect(() => parseRacetrack('S.E\n..')).toThrow(Error);
    expect(() => parseRacetrack('S?E')).toThrow(Error);
  });

  it('rejects missing or duplicate S and E markers', () => {
    expect(() => parseRacetrack('..E')).toThrow(Error);
    expect(() => parseRacetrack('S..')).toThrow(Error);
    expect(() => parseRacetrack('SSE')).toThrow(Error);
    expect(() => parseRacetrack('SEE')).toThrow(Error);
  });
});
