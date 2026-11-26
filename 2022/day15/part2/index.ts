import { createElement } from 'react';
import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { parseSensorReadings, type SensorReading } from '../shared';
import { findDistressBeacon, PART2_MAX_COORD, tuningFrequency } from './domain';
import { DistressBeaconVisualizer } from './viz/DistressBeaconVisualizer';

const EXAMPLE_MAX_COORD = 20;

const EXAMPLE_INPUT = [
  'Sensor at x=2, y=18: closest beacon is at x=-2, y=15',
  'Sensor at x=9, y=16: closest beacon is at x=10, y=16',
  'Sensor at x=13, y=2: closest beacon is at x=15, y=3',
  'Sensor at x=12, y=14: closest beacon is at x=10, y=16',
  'Sensor at x=10, y=20: closest beacon is at x=10, y=16',
  'Sensor at x=14, y=17: closest beacon is at x=10, y=16',
  'Sensor at x=8, y=7: closest beacon is at x=2, y=10',
  'Sensor at x=2, y=0: closest beacon is at x=2, y=10',
  'Sensor at x=0, y=11: closest beacon is at x=2, y=10',
  'Sensor at x=20, y=14: closest beacon is at x=25, y=17',
  'Sensor at x=17, y=20: closest beacon is at x=21, y=22',
  'Sensor at x=16, y=7: closest beacon is at x=15, y=3',
  'Sensor at x=14, y=3: closest beacon is at x=15, y=3',
  'Sensor at x=20, y=1: closest beacon is at x=15, y=3',
].join('\n');

function selectMaxCoordForInput(raw: string): number {
  return raw.trim() === EXAMPLE_INPUT ? EXAMPLE_MAX_COORD : PART2_MAX_COORD;
}

const manifestSolver: PuzzleSolver<{ readonly readings: readonly SensorReading[]; readonly maxCoord: number }, bigint> = {
  parse: (raw) => ({ readings: parseSensorReadings(raw), maxCoord: selectMaxCoordForInput(raw) }),
  solve: ({ readings, maxCoord }) => tuningFrequency(findDistressBeacon(readings, maxCoord)),
};

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 15,
    part: 2,
    title: 'Beacon Exclusion Zone',
    puzzleUrl: 'https://adventofcode.com/2022/day/15#part2',
    summary: 'Locate the unique uncovered distress beacon in [0, 4_000_000]^2 and compute its tuning frequency.',
    algorithmSummary:
      'Intersect sensor outer bounding diagonals (radius + 1) and search-box edges/corners in BigInt, including odd-parity half-integer pinch corners, then verify unique sensor non-coverage.',
    complexity: 'O(N^3) time, O(N^2) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '56000011',
  solver: manifestSolver as PuzzleSolver<unknown, unknown>,
  Visualizer: ({ rawInput }) =>
    createElement(DistressBeaconVisualizer, { rawInput, maxCoord: selectMaxCoordForInput(rawInput) }),
};
