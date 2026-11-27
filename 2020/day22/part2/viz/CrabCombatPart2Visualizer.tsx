import type { VisualizerProps } from '../../../../shared/viz';
import { CombatArenaVisualizer } from '../../shared/viz/CombatArenaVisualizer';
import { solver } from '../domain';

/** Interactive deck-duel visualizer for 2020 Day 22 Part 2. */
export function CrabCombatPart2Visualizer({ rawInput }: VisualizerProps) {
  return <CombatArenaVisualizer rawInput={rawInput} solver={solver} />;
}
