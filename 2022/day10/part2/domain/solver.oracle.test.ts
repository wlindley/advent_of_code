import { describe, expect, it } from 'vitest';
import { CANONICAL_GLYPHS, type GlyphTemplate, solver } from './index';

function independentOracleSolve(rawProgram: string): string {
  const stringMap = new Map<string, string>(
    CANONICAL_GLYPHS.map((g) => [g.rows.join('\n'), g.letter]),
  );
  let x = 1;
  let cycle = 0;
  const rows: string[] = ['', '', '', '', '', ''];

  for (const line of rawProgram.trim().split('\n')) {
    const duration = line === 'noop' ? 1 : 2;
    for (let step = 0; step < duration; step += 1) {
      if (cycle < 240) {
        const row = Math.floor(cycle / 40);
        const col = cycle % 40;
        rows[row] += Math.abs(col - x) <= 1 ? '#' : '.';
      }
      cycle += 1;
    }
    if (line.startsWith('addx ')) {
      x += Number(line.slice(5));
    }
  }

  let word = '';
  for (let slot = 0; slot < 8; slot += 1) {
    const block = rows.map((r) => r.slice(slot * 5, slot * 5 + 5)).join('\n');
    const letter = stringMap.get(block);
    if (!letter) throw new Error(`Oracle failed at slot ${slot + 1}:\n${block}`);
    word += letter;
  }
  return word;
}

function encodeTemplatesToProgram(
  templates: readonly GlyphTemplate[],
  trailingNoops = 0,
): string {
  expect(templates).toHaveLength(8);
  expect(templates[0]!.rows[0]!.slice(0, 2)).toBe('##');

  const targets: number[] = [];
  for (let row = 0; row < 6; row += 1) {
    const fullRow = templates.map((t) => t.rows[row]!).join('');
    for (let col = 0; col < 40; col += 2) {
      const pair = fullRow.slice(col, col + 2);
      if (pair === '..') targets.push(-2);
      else if (pair === '##') targets.push(row === 0 && col === 0 ? 1 : col);
      else if (pair === '#.') targets.push(col - 1);
      else targets.push(col + 2);
    }
  }

  const lines = targets.map(
    (x, i) => `addx ${(i + 1 < targets.length ? targets[i + 1]! : x) - x}`,
  );
  for (let n = 0; n < trailingNoops; n += 1) lines.push('noop');
  return lines.join('\n');
}

function nextRandom(seedState: { value: number }): number {
  seedState.value = (seedState.value + 0x6d2b79f5) >>> 0;
  let t = Math.imul(seedState.value ^ (seedState.value >>> 15), 1 | seedState.value);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

describe('Day 10 Part 2 constructive differential oracle tests', () => {
  const anchorE = CANONICAL_GLYPHS.find((g) => g.letter === 'E')!;

  it('encodes and decodes EVERY canonical glyph template (including both I variants)', () => {
    for (let offset = 0; offset < CANONICAL_GLYPHS.length; offset += 7) {
      const batch: GlyphTemplate[] = [anchorE];
      for (let i = 0; i < 7; i += 1) {
        batch.push(CANONICAL_GLYPHS[(offset + i) % CANONICAL_GLYPHS.length]!);
      }
      const expected = batch.map((g) => g.letter).join('');
      const programText = encodeTemplatesToProgram(batch);

      expect(solver.solve(solver.parse(programText))).toBe(expected);
      expect(independentOracleSolve(programText)).toBe(expected);
    }
  });

  it('agrees with the independent oracle across seeded random 8-letter words and trailing noops', () => {
    const seedState = { value: 20221002 };
    const validStarts = CANONICAL_GLYPHS.filter((g) => g.rows[0]!.startsWith('##'));

    for (let trial = 0; trial < 20; trial += 1) {
      const first = validStarts[Math.floor(nextRandom(seedState) * validStarts.length)]!;
      const rest = Array.from(
        { length: 7 },
        () => CANONICAL_GLYPHS[Math.floor(nextRandom(seedState) * CANONICAL_GLYPHS.length)]!,
      );
      const templates = [first, ...rest];
      const expected = templates.map((t) => t.letter).join('');
      const trailingNoops = Math.floor(nextRandom(seedState) * 15);
      const programText = encodeTemplatesToProgram(templates, trailingNoops);

      const actual = solver.solve(solver.parse(programText));
      expect(actual).toBe(expected);
      expect(actual).toBe(independentOracleSolve(programText));
    }
  });
});
