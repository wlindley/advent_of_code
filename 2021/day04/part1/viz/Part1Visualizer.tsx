import type { VisualizerProps } from '../../../../shared/viz';
import { FIRST_WINNER_POLICY } from '../../shared';
import { BingoVisualizer } from '../../shared/viz/BingoVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for 2021 Day 4 Part 1 (first winning board). */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <BingoVisualizer rawInput={rawInput} solver={solver} policy={FIRST_WINNER_POLICY} />;
}
