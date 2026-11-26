import { describe, expect, it } from 'vitest';
import { parseBingoGame } from './parser';

const SAMPLE_RAW = [
  '7,4,9,5,11,17,23,2,0,14,21,24,10,16,13,6,15,25,12,22,18,20,8,19,3,26,1',
  '',
  '22 13 17 11  0',
  ' 8  2 23  4 24',
  '21  9 14 16  7',
  ' 6 10  3 18  5',
  ' 1 12 20 15 19',
  '',
  ' 3 15  0  2 22',
  ' 9 18 13 17  5',
  '19  8  7 25 23',
  '20 11 10 24  4',
  '14 21 16 12  6',
].join('\n');

describe('2021 Day 4 parser', () => {
  it('parses valid draw header and CRLF/whitespace-padded 5x5 boards', () => {
    const crlf = `\n${SAMPLE_RAW.replace(/\n/g, '\r\n')}\r\n\r\n`;
    const game = parseBingoGame(crlf);
    expect(game.drawCount).toBe(27);
    expect(game.boardCount).toBe(2);
    expect(game.draws[0]).toBe(7);
    expect(game.draws[8]).toBe(0);
    expect(game.boards[0]?.id).toBe(0);
    expect(game.boards[0]?.cellAt(0, 0)).toBe(22);
    expect(game.boards[1]?.id).toBe(1);
    expect(game.boards[1]?.cellAt(4, 4)).toBe(6);
  });

  it('rejects empty input and missing board blocks', () => {
    expect(() => parseBingoGame('')).toThrow(RangeError);
    expect(() => parseBingoGame('   \r\n  ')).toThrow(RangeError);
    expect(() => parseBingoGame('7,4,9')).toThrow(RangeError);
  });

  it('rejects malformed draw tokens and non-safe-integer values', () => {
    const oneBoard = '1 2 3 4 5\n6 7 8 9 10\n11 12 13 14 15\n16 17 18 19 20\n21 22 23 24 25';
    expect(() => parseBingoGame(`1,2,\n\n${oneBoard}`)).toThrow(SyntaxError);
    expect(() => parseBingoGame(`1,-2,3\n\n${oneBoard}`)).toThrow(SyntaxError);
    expect(() => parseBingoGame(`1,abc,3\n\n${oneBoard}`)).toThrow(SyntaxError);
    expect(() => parseBingoGame(`9007199254740993\n\n${oneBoard}`)).toThrow(RangeError);
  });

  it('rejects boards with invalid row counts, column counts, or non-integer cells', () => {
    const fourRows = '1 2 3 4 5\n6 7 8 9 10\n11 12 13 14 15\n16 17 18 19 20';
    expect(() => parseBingoGame(`1,2,3\n\n${fourRows}`)).toThrow(RangeError);

    const fourCols = '1 2 3 4\n6 7 8 9 10\n11 12 13 14 15\n16 17 18 19 20\n21 22 23 24 25';
    expect(() => parseBingoGame(`1,2,3\n\n${fourCols}`)).toThrow(RangeError);

    const badCell = '1 2 x 4 5\n6 7 8 9 10\n11 12 13 14 15\n16 17 18 19 20\n21 22 23 24 25';
    expect(() => parseBingoGame(`1,2,3\n\n${badCell}`)).toThrow(SyntaxError);
  });
});
