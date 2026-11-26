import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { DualAgentValveVisualizer } from './viz/DualAgentValveVisualizer';

const EXAMPLE_INPUT = [
  'Valve AA has flow rate=0; tunnels lead to valves DD, II, BB',
  'Valve BB has flow rate=13; tunnels lead to valves CC, AA',
  'Valve CC has flow rate=2; tunnels lead to valves DD, BB',
  'Valve DD has flow rate=20; tunnels lead to valves CC, AA, EE',
  'Valve EE has flow rate=3; tunnels lead to valves FF, DD',
  'Valve FF has flow rate=0; tunnels lead to valves EE, GG',
  'Valve GG has flow rate=0; tunnels lead to valves FF, HH',
  'Valve HH has flow rate=22; tunnel leads to valve GG',
  'Valve II has flow rate=0; tunnels lead to valves AA, JJ',
  'Valve JJ has flow rate=21; tunnel leads to valve II',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 16,
    part: 2,
    title: 'Proboscidea Volcanium',
    puzzleUrl: 'https://adventofcode.com/2022/day/16#part2',
    summary: 'Maximize total pressure released over 26 minutes by coordinating two agents across disjoint valve subsets.',
    algorithmSummary:
      'Compute single-agent max pressure per valve mask, propagate subset maximums via Sum-over-Subsets DP in O(K * 2^K), then pair complementary subsets.',
    complexity: 'O(V(V+E)) compression + subset DFS + O(K * 2^K) SOS DP',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '1707',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: DualAgentValveVisualizer,
};
