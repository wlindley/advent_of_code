import { createElement } from 'react';
import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { CANONICAL_GLYPHS, GLYPH_HEIGHT, GLYPH_WIDTH } from '../shared';
import { solver as domainSolver } from './domain';
import { Visualizer } from './viz/Visualizer';

function pixelDigit(target: string, layer: number, revealLayer: number): string {
  if (layer < revealLayer) return '2';
  const isWhite = target === '#';
  if (layer === revealLayer) return isWhite ? '1' : '0';
  return isWhite ? '0' : '1';
}

function buildSpaceExampleInput(): string {
  const glyphs = [...'SPACE'].map((ch) => CANONICAL_GLYPHS.find((g) => g.letter === ch)!);
  let out = '';
  for (let layer = 0; layer < 6; layer += 1) {
    for (let row = 0; row < GLYPH_HEIGHT; row += 1) {
      for (let slot = 0; slot < glyphs.length; slot += 1) {
        const line = glyphs[slot]!.rows[row]!;
        const revealLayer = slot + (row % 2);
        for (let col = 0; col < GLYPH_WIDTH; col += 1) {
          out += pixelDigit(line[col]!, layer, revealLayer);
        }
      }
    }
  }
  return out;
}

const EXAMPLE_INPUT = buildSpaceExampleInput();

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 8,
    part: 2,
    title: 'Space Image Format',
    puzzleUrl: 'https://adventofcode.com/2019/day/8#part2',
    summary:
      'Composite stacked 25x6 image layers front-to-back where 2 is transparent, then OCR the 5x6 bitmap message.',
    algorithmSummary:
      'Scan layers front-to-back taking the first non-transparent pixel per coordinate, pack each 5x6 slot into a 30-bit mask, and match canonical uppercase glyphs.',
    complexity: 'O(N) time, O(W * H) composite buffer (O(L * W * H) trace snapshots bounded to 100 frames)',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: 'SPACE',
  solver: domainSolver as PuzzleSolver<unknown, unknown>,
  Visualizer: ({ rawInput }) => createElement(Visualizer, { rawInput }),
};
