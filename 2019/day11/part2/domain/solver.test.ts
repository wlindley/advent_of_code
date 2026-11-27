import { describe, expect, it } from 'vitest';
import { CANONICAL_GLYPHS, GLYPH_HEIGHT, GLYPH_WIDTH, executePaintingRobot, type GlyphDefinition } from '../../shared';
import { solver } from './solver';

const EXAMPLE_INPUT =
  '3,26,1006,26,25,109,27,204,0,204,1,109,2,1207,0,0,26,1005,26,25,3,26,1105,1,7,99,0,0,1,1,1,1,0,0,0,0,1,0,1,0,0,1,0,1,1,0,1,0,0,0,0,1,1,1,1,1,0,0,0,1,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,1,0,1,1,0,1,0,0,0,0,0,1,1,1,1,0,1,0,0,1,0,1,1,0,1,0,1,1,0,0,0,0,1,1,1,0,0,0,0,1,0,1,0,0,1,0,1,1,0,1,0,0,1,0,0,1,1,1,1,0,1,0,0,1,0,1,0,0,-1';

function appendBand(pairs: number[], top: string, bot: string, cols: number, rtl: boolean): void {
  const t0 = rtl ? 0 : 1, t1 = rtl ? 1 : 0;
  for (let i = 0; i < cols; i += 1) {
    const c = rtl ? cols - 1 - i : i;
    const t = top[c] === '#' ? 1 : 0, b = bot[c] === '#' ? 1 : 0;
    if (i % 2 === 0) pairs.push(t, t0, b, t1);
    else pairs.push(b, t1, t, t0);
  }
}

function renderWordRows(word: string, altSlots?: ReadonlySet<number>): readonly string[] {
  const rows = ['', '', '', '', '', ''];
  for (let i = 0; i < word.length; i += 1) {
    let picked: GlyphDefinition | undefined;
    for (const glyph of CANONICAL_GLYPHS) {
      if (glyph.letter === word[i]) { picked = glyph; if (!altSlots?.has(i)) break; }
    }
    for (let r = 0; r < GLYPH_HEIGHT; r += 1) rows[r] += picked!.rows[r]!;
  }
  return rows;
}

function buildWordProgram(rows: readonly string[]): string {
  let width = 0;
  for (const row of rows) width = Math.max(width, row.lastIndexOf('#') + 1);
  const cols = width % 2 === 0 ? width + 1 : width;
  const pairs = [0, 1];
  appendBand(pairs, rows[0]!, rows[1]!, cols, false);
  pairs.push(0, 1, 0, 1);
  appendBand(pairs, rows[2]!, rows[3]!, cols, true);
  pairs.push(0, 0, 0, 0);
  appendBand(pairs, rows[4]!, rows[5]!, cols, false);
  return [
    3, 26, 1006, 26, 25, 109, 27, 204, 0, 204, 1, 109, 2, 1207, 0, 0, 26, 1005, 26, 25, 3, 26, 1105, 1, 7, 99, 0,
    ...pairs, -1,
  ].join(',');
}

function readRefArg(mem: Map<number, number>, ip: number, off: number, mode: number, rb: number): number {
  const raw = mem.get(ip + off) ?? 0;
  return mode === 1 ? raw : mem.get(mode === 2 ? rb + raw : raw) ?? 0;
}

function runReferenceWhitePanels(raw: string): Set<string> {
  const mem = new Map<number, number>(), parts = raw.split(',');
  for (let i = 0; i < parts.length; i += 1) mem.set(i, Number(parts[i]));
  const panels = new Map<string, number>(), dx = [0, 1, 0, -1], dy = [-1, 0, 1, 0], out: number[] = [];
  let x = 0, y = 0, h = 0, ip = 0, rb = 0;
  while ((mem.get(ip) ?? 0) !== 99) {
    const ins = mem.get(ip) ?? 0, op = ins % 100, m1 = Math.floor(ins / 100) % 10, m2 = Math.floor(ins / 1000) % 10;
    if (op === 3) {
      mem.set((m1 === 2 ? rb : 0) + (mem.get(ip + 1) ?? 0), panels.get(`${x},${y}`) ?? (x === 0 && y === 0 ? 1 : 0));
      ip += 2;
    } else if (op === 4) {
      out.push(readRefArg(mem, ip, 1, m1, rb));
      if (out.length === 2) {
        panels.set(`${x},${y}`, out[0]!);
        h = (h + (out[1]! === 0 ? 3 : 1)) & 3;
        x += dx[h]!; y += dy[h]!; out.length = 0;
      }
      ip += 2;
    } else if (op === 5 || op === 6) {
      const nz = readRefArg(mem, ip, 1, m1, rb) !== 0;
      ip = (op === 5 ? nz : !nz) ? readRefArg(mem, ip, 2, m2, rb) : ip + 3;
    } else if (op === 7) {
      mem.set(mem.get(ip + 3) ?? 0, readRefArg(mem, ip, 1, m1, rb) < readRefArg(mem, ip, 2, m2, rb) ? 1 : 0);
      ip += 4;
    } else { rb += readRefArg(mem, ip, 1, m1, rb); ip += 2; }
  }
  const white = new Set<string>();
  for (const [k, c] of panels) if (c === 1) white.add(k);
  return white;
}

function decodeReferenceGrid(white: ReadonlySet<string>, length: number): string {
  let word = '';
  for (let slot = 0; slot < length; slot += 1) {
    const baseX = 1 + slot * GLYPH_WIDTH;
    for (const glyph of CANONICAL_GLYPHS) {
      let matched = true;
      for (let r = 0; r < GLYPH_HEIGHT && matched; r += 1) {
        for (let c = 0; c < GLYPH_WIDTH; c += 1) {
          if (white.has(`${baseX + c},${r}`) !== (glyph.rows[r]![c] === '#')) { matched = false; break; }
        }
      }
      if (matched) { word += glyph.letter; break; }
    }
  }
  return word;
}

describe('2019 Day 11 Part 2 solver', () => {
  it('decodes the verified HI example and halts immediately when camera starts black', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(parsed)).toBe('HI');
    expect(executePaintingRobot(parsed, 0).robotSteps).toBe(0);
  });

  it('decodes an 8-letter registration ID with leading centered I, both S variants, and final 5-wide Y', () => {
    const parsed = solver.parse(buildWordProgram(renderWordRows('ISSABCEY', new Set([0, 2]))));
    expect(solver.solve(parsed)).toBe('ISSABCEY');
  });

  it('traces with default, bounded (1 and 4), and invalid trace options', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    const full = solver.trace(parsed);
    expect(full).toHaveLength(60);
    expect(full[0]!.startPanelColor).toBe(1);
    expect(full[0]!.lastPaintColor).toBeNull();
    expect(full[59]!.stepIndex).toBe(59);

    const single = solver.trace(parsed, { maxSteps: 1 });
    expect([single.length, single[0]!.stepIndex]).toEqual([1, 59]);
    const four = solver.trace(parsed, { maxSteps: 4 });
    expect([four.length, four[0]!.stepIndex, four[3]!.stepIndex]).toEqual([4, 0, 59]);
    expect(() => solver.trace(parsed, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('rejects invalid input, wrong hull height, empty white hull, unknown glyphs, and bad signals', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('1,2,foo')).toThrow();
    expect(() => solver.solve(solver.parse('99'))).toThrow(RangeError);
    expect(() => solver.solve(solver.parse('3,7,104,0,104,1,99,0'))).toThrow();
    expect(() => solver.solve(solver.parse(buildWordProgram(['#....', '.....', '.....', '.....', '.....', '#....'])))).toThrow();
    expect(() => solver.solve(solver.parse('3,6,104,2,104,0,99'))).toThrow();
    expect(() => solver.solve(solver.parse('3,6,104,1,104,2,99'))).toThrow();
  });

  it('matches an independent reference implementation across HI, IA, YZ, and OK', () => {
    for (const word of ['HI', 'IA', 'YZ', 'OK']) {
      const raw = buildWordProgram(renderWordRows(word));
      expect(solver.solve(solver.parse(raw))).toBe(word);
      expect(decodeReferenceGrid(runReferenceWhitePanels(raw), word.length)).toBe(word);
    }
  });
});
