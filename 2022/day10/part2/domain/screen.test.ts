import { describe, expect, it } from 'vitest';
import { CpuProgram, CpuTimeline } from '../../shared';
import {
  CRT_PIXEL_COUNT,
  CrtScreen,
  decodeCrtScreen,
  rasterizeCrtPrefix,
  rasterizeCrtScreen,
  tryDecodeCrtScreen,
} from './index';

const OFFICIAL_STRIPED_PROGRAM = [
  'addx 15', 'addx -11', 'addx 6', 'addx -3', 'addx 5', 'addx -1', 'addx -8', 'addx 13',
  'addx 4', 'noop', 'addx -1', 'addx 5', 'addx -1', 'addx 5', 'addx -1', 'addx 5',
  'addx -1', 'addx 5', 'addx -1', 'addx -35', 'addx 1', 'addx 24', 'addx -19', 'addx 1',
  'addx 16', 'addx -11', 'noop', 'noop', 'addx 21', 'addx -15', 'noop', 'noop',
  'addx -3', 'addx 9', 'addx 1', 'addx -3', 'addx 8', 'addx 1', 'addx 5', 'noop',
  'noop', 'noop', 'noop', 'noop', 'addx -36', 'noop', 'addx 1', 'addx 7',
  'noop', 'noop', 'noop', 'addx 2', 'addx 6', 'noop', 'noop', 'noop',
  'noop', 'noop', 'addx 1', 'noop', 'noop', 'addx 7', 'addx 1', 'noop',
  'addx -13', 'addx 13', 'addx 7', 'noop', 'addx 1', 'addx -33', 'noop', 'noop',
  'noop', 'addx 2', 'noop', 'noop', 'noop', 'addx 8', 'noop', 'addx -1',
  'addx 2', 'addx 1', 'noop', 'addx 17', 'addx -9', 'addx 1', 'addx 1', 'addx -3',
  'addx 11', 'noop', 'noop', 'addx 1', 'noop', 'addx 1', 'noop', 'noop',
  'addx -13', 'addx -19', 'addx 1', 'addx 3', 'addx 26', 'addx -30', 'addx 12', 'addx -1',
  'addx 3', 'addx 1', 'noop', 'noop', 'noop', 'addx -9', 'addx 18', 'addx 1',
  'addx 2', 'noop', 'noop', 'addx 9', 'noop', 'noop', 'noop', 'addx -1',
  'addx 2', 'addx -37', 'addx 1', 'addx 3', 'noop', 'addx 15', 'addx -21', 'addx 22',
  'addx -6', 'addx 1', 'noop', 'addx 2', 'addx 1', 'noop', 'addx -10', 'noop',
  'noop', 'addx 20', 'addx 1', 'addx 2', 'addx 2', 'addx -6', 'addx -11', 'noop',
  'noop', 'noop',
].join('\n');

const EXPECTED_STRIPED_ROWS = [
  '##..##..##..##..##..##..##..##..##..##..',
  '###...###...###...###...###...###...###.',
  '####....####....####....####....####....',
  '#####.....#####.....#####.....#####.....',
  '######......######......######......####',
  '#######.......#######.......#######.....',
];

function programWithConstantX(xValue: number, cycles: number): CpuTimeline {
  const lines = [`addx ${xValue - 1}`, ...Array.from({ length: cycles - 2 }, () => 'noop')];
  return CpuTimeline.execute(CpuProgram.parse(lines.join('\n')));
}

describe('Day 10 Part 2 CRT screen rasterizer', () => {
  it('rasterizes the official 146-line example into the exact 40x6 striped image', () => {
    const timeline = CpuTimeline.execute(CpuProgram.parse(OFFICIAL_STRIPED_PROGRAM));
    const screen = rasterizeCrtScreen(timeline);

    expect(CRT_PIXEL_COUNT).toBe(240);
    expect(screen.toLines()).toEqual(EXPECTED_STRIPED_ROWS);
    expect(screen.toString()).toBe(EXPECTED_STRIPED_ROWS.join('\n'));
    expect(screen.litCount).toBe(124);
    expect(screen.isLit(0, 0)).toBe(true);
    expect(screen.isLit(0, 2)).toBe(false);
    expect(tryDecodeCrtScreen(screen)).toEqual(Array(8).fill(null));
    expect(() => decodeCrtScreen(screen)).toThrow(/slot 1[\s\S]*##\.\.#/);
  });

  it('decodes a valid 8-letter CrtScreen buffer via decodeCrtScreen and tryDecodeCrtScreen', () => {
    const eRows = ['####.', '#....', '###..', '#....', '#....', '####.'];
    const raw = new Uint8Array(CRT_PIXEL_COUNT);
    for (let slot = 0; slot < 8; slot += 1) {
      for (let row = 0; row < 6; row += 1) {
        for (let col = 0; col < 5; col += 1) {
          raw[row * 40 + slot * 5 + col] = eRows[row]![col] === '#' ? 1 : 0;
        }
      }
    }
    const screen = new CrtScreen(raw);
    expect(tryDecodeCrtScreen(screen)).toEqual(Array(8).fill('E'));
    expect(decodeCrtScreen(screen)).toBe('EEEEEEEE');
  });

  it('respects sprite edge and non-wrapping horizontal boundaries', () => {
    const xMinus2 = rasterizeCrtScreen(programWithConstantX(-2, 240));
    expect(xMinus2.litCount).toBe(2);
    expect(xMinus2.isLit(1, 0)).toBe(false);
    expect(xMinus2.isLit(1, 39)).toBe(false);

    const xMinus1 = rasterizeCrtScreen(programWithConstantX(-1, 240));
    expect(xMinus1.isLit(1, 0)).toBe(true);
    expect(xMinus1.isLit(1, 39)).toBe(false);

    const xZero = rasterizeCrtScreen(programWithConstantX(0, 240));
    expect(xZero.isLit(1, 0)).toBe(true);
    expect(xZero.isLit(1, 1)).toBe(true);
    expect(xZero.isLit(1, 39)).toBe(false);

    const x39 = rasterizeCrtScreen(programWithConstantX(39, 240));
    expect(x39.isLit(1, 38)).toBe(true);
    expect(x39.isLit(1, 39)).toBe(true);
    expect(x39.isLit(2, 0)).toBe(false);

    const x40 = rasterizeCrtScreen(programWithConstantX(40, 240));
    expect(x40.isLit(1, 39)).toBe(true);
    expect(x40.isLit(2, 0)).toBe(false);

    const x41 = rasterizeCrtScreen(programWithConstantX(41, 240));
    expect(x41.isLit(1, 39)).toBe(false);
    expect(x41.isLit(2, 0)).toBe(false);
  });

  it('enforces 240-cycle minimum and ignores trailing cycles beyond 240', () => {
    const short239 = CpuTimeline.execute(CpuProgram.parse(Array(239).fill('noop').join('\n')));
    expect(() => rasterizeCrtScreen(short239)).toThrow(/240/);

    const exact240 = CpuTimeline.execute(CpuProgram.parse(Array(240).fill('noop').join('\n')));
    const long260 = CpuTimeline.execute(
      CpuProgram.parse([...Array(240).fill('noop'), ...Array(20).fill('noop')].join('\n')),
    );
    expect(rasterizeCrtScreen(long260).toString()).toBe(rasterizeCrtScreen(exact240).toString());
  });

  it('copies input pixels defensively and validates CrtScreen coordinates and buffers', () => {
    const raw = new Uint8Array(CRT_PIXEL_COUNT);
    raw[0] = 1;
    const screen = new CrtScreen(raw);
    raw[0] = 0;
    expect(screen.isLit(0, 0)).toBe(true);
    expect(screen.litCount).toBe(1);

    expect(() => new CrtScreen(new Uint8Array(10))).toThrow(/240/);
    const badVal = new Uint8Array(CRT_PIXEL_COUNT);
    badVal[5] = 2;
    expect(() => new CrtScreen(badVal)).toThrow(/pixel/i);

    for (const bad of [-1, 6, 1.5]) {
      expect(() => screen.isLit(bad, 0)).toThrow(/row/i);
    }
    for (const bad of [-1, 40, 1.5]) {
      expect(() => screen.isLit(0, bad)).toThrow(/col/i);
    }
    for (const bad of [-1, 8, 1.5]) {
      expect(() => screen.glyphMaskAt(bad)).toThrow(/slot/i);
    }
  });

  it('rasterizes partial, exact, and overlong prefixes with rasterizeCrtPrefix', () => {
    const short10 = CpuTimeline.execute(CpuProgram.parse(Array(10).fill('noop').join('\n')));
    const prefix10 = rasterizeCrtPrefix(short10);
    expect(prefix10).toHaveLength(10);
    expect(prefix10.slice(0, 3)).toEqual([true, true, true]);
    expect(prefix10.slice(3)).toEqual(Array(7).fill(false));

    const exact240 = CpuTimeline.execute(CpuProgram.parse(Array(240).fill('noop').join('\n')));
    expect(rasterizeCrtPrefix(exact240)).toHaveLength(240);

    const long260 = CpuTimeline.execute(CpuProgram.parse(Array(260).fill('noop').join('\n')));
    expect(rasterizeCrtPrefix(long260)).toHaveLength(240);
  });
});
