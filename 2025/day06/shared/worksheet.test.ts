import { describe, expect, it } from 'vitest';
import { ProblemBlock, parseWorksheet } from './index';

const EXAMPLE = [
  '123 328  51 64 ',
  ' 45 64  387 23 ',
  '  6 98  215 314',
  '*   +   *   +  ',
].join('\n');

describe('2025/day06/shared worksheet', () => {
  it('parses the official 4x15 example preserving alignment and freezing objects', () => {
    const ws = parseWorksheet(EXAMPLE);
    expect(ws.width).toBe(15);
    expect(ws.blocks).toHaveLength(4);
    expect(ws.blocks.map((b) => [b.startCol, b.endCol, b.width, b.operator, b.digitRows])).toEqual([
      [0, 2, 3, '*', ['123', ' 45', '  6']],
      [4, 6, 3, '+', ['328', '64 ', '98 ']],
      [8, 10, 3, '*', [' 51', '387', '215']],
      [12, 14, 3, '+', ['64 ', '23 ', '314']],
    ]);
    expect(Object.isFrozen(ws)).toBe(true);
    expect(Object.isFrozen(ws.blocks)).toBe(true);
    expect(Object.isFrozen(ws.blocks[0])).toBe(true);
    expect(Object.isFrozen(ws.blocks[0]!.digitRows)).toBe(true);
  });

  it('preserves leading spaces on row 0, blank cols, multi-space gaps, CRLF, ragged lines, and single block', () => {
    const leadingAndGaps = ['', '   ', '  12   34  ', ' 100   5   ', ' +     *   ', '  '].join('\r\n');
    const ws1 = parseWorksheet(leadingAndGaps);
    expect(ws1.width).toBe(11);
    expect(ws1.blocks.map((b) => [b.startCol, b.endCol, b.operator, b.digitRows])).toEqual([
      [1, 3, '+', [' 12', '100']],
      [7, 8, '*', ['34', '5 ']],
    ]);

    const ragged = parseWorksheet('12\n3\n+');
    expect(ragged.width).toBe(2);
    expect(ragged.blocks[0]!.digitRows).toEqual(['12', '3 ']);

    const single = parseWorksheet('42\n+');
    expect(single.width).toBe(2);
    expect(single.blocks.map((b) => [b.operator, b.digitRows])).toEqual([['+', ['42']]]);
  });

  it('evaluates + and * with BigInt precision exceeding Number.MAX_SAFE_INTEGER', () => {
    const addBlock = new ProblemBlock(0, 1, '+', ['10', '20']);
    const mulBlock = new ProblemBlock(0, 1, '*', ['10', '20']);
    const big = 9_007_199_254_740_993n;
    expect(addBlock.evaluate([big, 4n])).toBe(9_007_199_254_740_997n);
    expect(mulBlock.evaluate([big, 3n])).toBe(27_021_597_764_222_979n);
    expect(() => addBlock.evaluate([])).toThrow(Error);
  });

  it('rejects invalid worksheet inputs separately', () => {
    const badInputs = ['', '   \r\n  ', '123', '12\n\n+ ', '12\n  ', '12\n- ', '123\n+ *', '12  \n+ * ', '1a\n+ '];
    for (const bad of badInputs) {
      expect(() => parseWorksheet(bad)).toThrow(Error);
    }
  });

  it('validates ProblemBlock constructor arguments directly', () => {
    expect(() => new ProblemBlock(-1, 1, '+', ['123'])).toThrow(RangeError);
    expect(() => new ProblemBlock(0.5, 1, '+', ['12'])).toThrow(RangeError);
    expect(() => new ProblemBlock(2, 1, '+', ['1'])).toThrow(RangeError);
    expect(() => new ProblemBlock(0, 1.5, '+', ['12'])).toThrow(RangeError);
    expect(() => new ProblemBlock(0, 1, '-' as '+', ['12'])).toThrow(Error);
    expect(() => new ProblemBlock(0, 1, '+', [])).toThrow(RangeError);
    expect(() => new ProblemBlock(0, 1, '+', ['1'])).toThrow(Error);
    expect(() => new ProblemBlock(0, 1, '+', ['1a'])).toThrow(Error);
    expect(() => new ProblemBlock(0, 1, '+', ['  '])).toThrow(Error);
  });
});
