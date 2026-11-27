import { describe, expect, it } from 'vitest';
import { parseBurrow } from './parser';

const VALID_INPUT = [
  '#############',
  '#...........#',
  '###B#C#B#D###',
  '  #A#D#C#A#',
  '  #########',
].join('\n');

describe('parseBurrow', () => {
  it('parses a valid 5-line burrow diagram with CRLF and trailing spaces', () => {
    const withCrlf = [
      '#############',
      '#...........#',
      '###B#C#B#D###  ',
      '  #A#D#C#A# ',
      '  #########   ',
    ].join('\r\n');
    const diagram = parseBurrow(withCrlf + '\r\n');
    expect(diagram.rooms).toEqual([
      ['B', 'A'],
      ['C', 'D'],
      ['B', 'C'],
      ['D', 'A'],
    ]);
    expect(Object.isFrozen(diagram)).toBe(true);
    expect(Object.isFrozen(diagram.rooms)).toBe(true);
    expect(Object.isFrozen(diagram.rooms[0])).toBe(true);
  });

  it('rejects empty, malformed, or unbalanced inputs', () => {
    expect(() => parseBurrow('')).toThrow();
    expect(() => parseBurrow('   \n  ')).toThrow();
    expect(() => parseBurrow(VALID_INPUT + '\n#')).toThrow();
    expect(() => parseBurrow(VALID_INPUT.replace('#############', '############'))).toThrow();
    expect(() => parseBurrow(VALID_INPUT.replace('#...........#', '#.....A.....#'))).toThrow();
    expect(() => parseBurrow(VALID_INPUT.replace('###B#C#B#D###', '###B#C#B#X###'))).toThrow();
    expect(() => parseBurrow(VALID_INPUT.replace('  #A#D#C#A#', '  #A#D#C#B#'))).toThrow();
    expect(() => parseBurrow(VALID_INPUT.replace('  #########', '  ########'))).toThrow();
  });
});
