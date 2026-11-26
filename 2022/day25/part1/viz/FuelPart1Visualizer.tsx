import type { VisualizerProps } from '../../../../shared/viz';
import { SnafuVisualizer } from '../../shared/viz/SnafuVisualizer';
import { solver } from '../domain';

/** Part 1 interactive visualizer showing SNAFU ledger summation and balanced base-5 encoding. */
export function FuelPart1Visualizer({ rawInput }: VisualizerProps) {
  return <SnafuVisualizer rawInput={rawInput} solver={solver} partLabel="Part 1 (Fuel Sum)" />;
}
