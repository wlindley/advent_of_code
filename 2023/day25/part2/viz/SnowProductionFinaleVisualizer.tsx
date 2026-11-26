import { FinaleCanopyVisualizer, type VisualizerProps } from '../../../../shared/viz';
import { TOTAL_2023_STARS } from '../domain';

export function SnowProductionFinaleVisualizer({ rawInput }: VisualizerProps) {
  return (
    <FinaleCanopyVisualizer rawInput={rawInput} year={2023} totalStars={TOTAL_2023_STARS} badgeText="Advent of Code 2023 Complete (50/50 First-Try)" />
  );
}
