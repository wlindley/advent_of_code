import type { VisualizerProps } from '../../../../shared/viz';
import { LAST_WINNER_POLICY } from '../../shared';
import { BingoVisualizer } from '../../shared/viz/BingoVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for 2021 Day 4 Part 2 (last winning board). */
export function Part2Visualizer({ rawInput }: VisualizerProps) {
  return <BingoVisualizer rawInput={rawInput} solver={solver} policy={LAST_WINNER_POLICY} />;
}
