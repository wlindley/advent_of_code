import type { VisualizerProps } from '../../../../shared/viz';
import { KeepAwayVisualizer } from '../../shared/viz/KeepAwayVisualizer';
import { PART2_RULE, solver } from '../domain';

/** Part 2 wrapper rendering the shared Keep Away visualizer with modulo-LCM relief. */
export function MonkeyInTheMiddlePart2Visualizer({ rawInput }: VisualizerProps) {
  return <KeepAwayVisualizer rawInput={rawInput} solver={solver} reliefLabel={PART2_RULE.reliefLabel} />;
}
