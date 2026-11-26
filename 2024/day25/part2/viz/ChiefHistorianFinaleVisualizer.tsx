import { FinaleCanopyVisualizer, type VisualizerProps } from '../../../../shared/viz';
import { TOTAL_2024_STARS } from '../domain';

export function ChiefHistorianFinaleVisualizer({ rawInput }: VisualizerProps) {
  return (
    <FinaleCanopyVisualizer rawInput={rawInput} year={2024} totalStars={TOTAL_2024_STARS} badgeText="Advent of Code 2024 Complete (50/50 First-Try)" />
  );
}
