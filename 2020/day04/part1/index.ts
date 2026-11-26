import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { PassportProcessingPart1Visualizer } from './viz/PassportProcessingPart1Visualizer';

const EXAMPLE_INPUT = [
  'ecl:gry pid:860033327 eyr:2020 hcl:#fffffd',
  'byr:1937 iyr:2017 cid:147 hgt:183cm',
  '',
  'iyr:2013 ecl:amb cid:350 eyr:2023 pid:028048884',
  'hcl:#cfa07d byr:1929',
  '',
  'hcl:#ae17e1 iyr:2013',
  'eyr:2024',
  'ecl:brn pid:760753108 byr:1931',
  'hgt:179cm',
  '',
  'hcl:#cfa07d eyr:2025 pid:166559648',
  'iyr:2011 ecl:brn hgt:59in',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 4,
    part: 1,
    title: 'Passport Processing',
    puzzleUrl: 'https://adventofcode.com/2020/day/4',
    summary: 'Count passport records containing all seven mandatory fields, treating cid as optional.',
    algorithmSummary: 'Parse blank-line-separated key:value blocks into PassportRecords and evaluate each against PRESENCE_POLICY.',
    complexity: 'O(N * F) parse and validation time, O(F) space per record',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '2',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: PassportProcessingPart1Visualizer,
};
