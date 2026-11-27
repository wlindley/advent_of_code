import type { VisualizerProps } from '../../../../shared/viz';
import { ShipCompartmentVisualizer } from '../../shared/viz/ShipCompartmentVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 15 Part 1 interactive Oxygen System repair droid visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <ShipCompartmentVisualizer rawInput={rawInput} solver={solver} />;
}
