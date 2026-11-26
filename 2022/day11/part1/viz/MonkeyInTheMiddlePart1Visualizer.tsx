import type { VisualizerProps } from '../../../../shared/viz';
import { KeepAwayVisualizer } from '../../shared/viz/KeepAwayVisualizer';
import { PART1_RULE, solver } from '../domain';

/** Part 1 wrapper rendering the shared Keep Away visualizer with floor(worry / 3) relief. */
export function MonkeyInTheMiddlePart1Visualizer({ rawInput }: VisualizerProps) {
  return <KeepAwayVisualizer rawInput={rawInput} solver={solver} reliefLabel={PART1_RULE.reliefLabel} />;
}
