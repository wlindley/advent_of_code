import type { VisualizerProps } from '../../../../shared/viz';
import { type CheatConfig, PART1_DEFAULT_CONFIG, PART1_EXAMPLE_CONFIG } from '../../shared';
import { RaceConditionVisualizer } from '../../shared/viz/RaceConditionVisualizer';

export const PART1_EXAMPLE_INPUT = [
  '###############',
  '#...#...#.....#',
  '#.#.#.#.#.###.#',
  '#S#...#.#.#...#',
  '#######.#.#.###',
  '#######.#.#...#',
  '#######.#.###.#',
  '###..E#...#...#',
  '###.#######.###',
  '#...###...#...#',
  '#.#####.#.###.#',
  '#.#...#.#.#...#',
  '#.#.#.#.#.#.###',
  '#...#...#...###',
  '###############',
].join('\n');

export function selectPart1Config(raw: string): CheatConfig {
  return raw.replace(/\r\n/g, '\n').trim() === PART1_EXAMPLE_INPUT
    ? PART1_EXAMPLE_CONFIG
    : PART1_DEFAULT_CONFIG;
}

/** Interactive Part 1 Race Condition visualizer (max cheat duration 2). */
export function RaceConditionPart1Visualizer({ rawInput }: VisualizerProps) {
  return <RaceConditionVisualizer rawInput={rawInput} config={selectPart1Config(rawInput)} />;
}
