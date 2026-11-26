import { describe, expect, it } from 'vitest';
import { parseSupplyProcedure } from './parser';

const OFFICIAL_EXAMPLE = [
  '    [D]    ',
  '[N] [C]    ',
  '[Z] [M] [P]',
  ' 1   2   3 ',
  '',
  'move 1 from 2 to 1',
  'move 3 from 1 to 3',
  'move 2 from 2 to 1',
  'move 1 from 1 to 2',
].join('\n');

describe('parseSupplyProcedure', () => {
  it('parses the official example preserving leading spaces in diagram rows', () => {
    const proc = parseSupplyProcedure(OFFICIAL_EXAMPLE);
    expect(proc.stackCount).toBe(3);
    expect(proc.totalCrates).toBe(6);
    expect(proc.moveCount).toBe(4);
    expect(proc.initialTopMessage).toBe('NDP');
    expect(proc.initialStacks[0]!.map((c) => c.label)).toEqual(['Z', 'N']);
    expect(proc.initialStacks[1]!.map((c) => c.label)).toEqual(['M', 'C', 'D']);
    expect(proc.initialStacks[2]!.map((c) => c.label)).toEqual(['P']);
    expect(proc.moves[1]!.summary).toBe('move 3 from 1 to 3');
  });

  it('tolerates stripped trailing spaces on short diagram lines and CRLF endings', () => {
    const input = [
      '    [D]',
      '[N] [C]',
      '[Z] [M] [P]',
      ' 1   2   3',
      '',
      'move 1 from 2 to 1',
      '',
      'move 2 from 1 to 3',
      '',
    ].join('\r\n');
    const proc = parseSupplyProcedure(input);
    expect(proc.initialTopMessage).toBe('NDP');
    expect(proc.moveCount).toBe(2);
  });

  it('allows an initially empty stack column', () => {
    const input = [
      '[A]        ',
      ' 1   2   3 ',
      '',
      'move 1 from 1 to 2',
    ].join('\n');
    const proc = parseSupplyProcedure(input);
    expect(proc.initialStacks[0]!.map((c) => c.label)).toEqual(['A']);
    expect(proc.initialStacks[1]).toEqual([]);
    expect(proc.initialStacks[2]).toEqual([]);
  });

  it('supports 10 or more stacks', () => {
    const top = '                                    [J]';
    const bottom = '[A] [B] [C] [D] [E] [F] [G] [H] [I] [K]';
    const labels = ' 1   2   3   4   5   6   7   8   9  10 ';
    const proc = parseSupplyProcedure([top, bottom, labels, '', 'move 1 from 10 to 1'].join('\n'));
    expect(proc.stackCount).toBe(10);
    expect(proc.initialTopMessage).toBe('ABCDEFGHIJ');
  });

  it('rejects input missing a blank separator line', () => {
    expect(() => parseSupplyProcedure('[A]\n 1 \nmove 1 from 1 to 1')).toThrow();
  });

  it('rejects input starting with a blank line', () => {
    expect(() => parseSupplyProcedure('\n[A]\n 1 \n\nmove 1 from 1 to 2')).toThrow();
  });

  it('rejects diagram with fewer than two lines before blank separator', () => {
    expect(() => parseSupplyProcedure(' 1   2 \n\nmove 1 from 1 to 2')).toThrow();
  });

  it('rejects non-sequential stack numbers', () => {
    expect(() => parseSupplyProcedure('[A] [B]\n 1   3 \n\nmove 1 from 1 to 2')).toThrow();
  });

  it('rejects non-numeric stack labels', () => {
    expect(() => parseSupplyProcedure('[A] [B]\n A   B \n\nmove 1 from 1 to 2')).toThrow();
  });

  it('rejects diagram row wider than expected stack columns', () => {
    expect(() => parseSupplyProcedure('[A] [B] [C]\n 1   2 \n\nmove 1 from 1 to 2')).toThrow();
  });

  it('rejects missing space separator between adjacent crate columns', () => {
    expect(() => parseSupplyProcedure('[A][B]\n 1   2 \n\nmove 1 from 1 to 2')).toThrow();
  });

  it('rejects malformed crate token', () => {
    expect(() => parseSupplyProcedure('[1] [B]\n 1   2 \n\nmove 1 from 1 to 2')).toThrow();
  });

  it('rejects truncated crate token', () => {
    expect(() => parseSupplyProcedure('[A] [B\n 1   2 \n\nmove 1 from 1 to 2')).toThrow();
  });

  it('rejects floating crate above an empty gap (gravity violation)', () => {
    const input = [
      '[A] [B]',
      '[C]    ',
      ' 1   2 ',
      '',
      'move 1 from 1 to 2',
    ].join('\n');
    expect(() => parseSupplyProcedure(input)).toThrow(/Floating crate/);
  });

  it('rejects invalid move syntax', () => {
    expect(() => parseSupplyProcedure('[A] [B]\n 1   2 \n\nshift 1 from 1 to 2')).toThrow();
  });

  it('rejects procedure with zero move instructions', () => {
    expect(() => parseSupplyProcedure('[A] [B]\n 1   2 \n\n   \n')).toThrow();
  });

  it('rejects move referencing out-of-range stack', () => {
    expect(() => parseSupplyProcedure('[A] [B]\n 1   2 \n\nmove 1 from 1 to 3')).toThrow(RangeError);
  });
});
