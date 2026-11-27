import type { VisualizerProps } from '../../../../shared/viz';
import { CombatArenaVisualizer } from '../../shared/viz/CombatArenaVisualizer';
import { solver } from '../domain';

/** Interactive deck-duel visualizer for 2020 Day 22 Part 1. */
export function CrabCombatPart1Visualizer({ rawInput }: VisualizerProps) {
  return <CombatArenaVisualizer rawInput={rawInput} solver={solver} />;
}
