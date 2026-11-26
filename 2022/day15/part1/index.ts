import { createElement } from 'react';
import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { countExcludedOnRow, parseSensorReadings, type SensorReading } from '../shared';
import { PART1_TARGET_Y } from './domain';
import { ExclusionZoneVisualizer } from './viz/ExclusionZoneVisualizer';

const EXAMPLE_TARGET_Y = 10;

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

function selectTargetYForInput(raw: string): number {
  return raw.trim() === EXAMPLE_INPUT ? EXAMPLE_TARGET_Y : PART1_TARGET_Y;
}

const manifestSolver: PuzzleSolver<{ readonly readings: readonly SensorReading[]; readonly targetY: number }, bigint> = {
  parse: (raw) => ({ readings: parseSensorReadings(raw), targetY: selectTargetYForInput(raw) }),
  solve: ({ readings, targetY }) => countExcludedOnRow(readings, targetY),
};

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 15,
    part: 1,
    title: 'Beacon Exclusion Zone',
    puzzleUrl: 'https://adventofcode.com/2022/day/15',
    summary: 'Count horizontal positions along a target row where no distress beacon can exist.',
    algorithmSummary:
      'Project each sensor Manhattan diamond onto the target scanline as a closed BigInt interval, coalesce overlaps via IntervalUnion, and subtract unique beacons on that row.',
    complexity: 'O(N log N) time, O(N) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '26',
  solver: manifestSolver as PuzzleSolver<unknown, unknown>,
  Visualizer: ({ rawInput }) =>
    createElement(ExclusionZoneVisualizer, { rawInput, targetY: selectTargetYForInput(rawInput) }),
};
