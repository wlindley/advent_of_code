import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { MonsterMessagesPart1Visualizer } from './viz/MonsterMessagesPart1Visualizer';

const EXAMPLE_INPUT = [
  '0: 4 1 5',
  '1: 2 3 | 3 2',
  '2: 4 4 | 5 5',
  '3: 4 5 | 5 4',
  '4: "a"',
  '5: "b"',
  '',
  'ababbb',
  'bababa',
  'abbbab',
  'aaabbb',
  'aaaabbb',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 19,
    part: 1,
    title: 'Monster Messages',
    puzzleUrl: 'https://adventofcode.com/2020/day/19',
    summary:
      'Count how many candidate messages completely match rule 0 of a context-free grammar of literal and sequence rules.',
    algorithmSummary:
      'Compile the grammar into Chomsky Normal Form with cycle-safe unit closure and CSR indexing, then evaluate each message using a reusable triangular Uint32Array bitset CYK chart.',
    complexity: 'O(M * n^3 * W) worst-case bitset CYK over M messages of length n and W bitset words',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '2',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: MonsterMessagesPart1Visualizer,
};
