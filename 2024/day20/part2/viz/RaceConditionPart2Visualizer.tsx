import type { VisualizerProps } from '../../../../shared/viz';
import { type CheatConfig, PART2_DEFAULT_CONFIG, PART2_EXAMPLE_CONFIG } from '../../shared';
import { RaceConditionVisualizer } from '../../shared/viz/RaceConditionVisualizer';

export const PART2_EXAMPLE_INPUT = [
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

export function selectPart2Config(raw: string): CheatConfig {
  return raw.replace(/\r\n/g, '\n').trim() === PART2_EXAMPLE_INPUT
    ? PART2_EXAMPLE_CONFIG
    : PART2_DEFAULT_CONFIG;
}

/** Interactive Part 2 Race Condition visualizer (max cheat duration 20). */
export function RaceConditionPart2Visualizer({ rawInput }: VisualizerProps) {
  return <RaceConditionVisualizer rawInput={rawInput} config={selectPart2Config(rawInput)} />;
}
