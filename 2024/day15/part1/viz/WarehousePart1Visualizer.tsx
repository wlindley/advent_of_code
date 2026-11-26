import type { VisualizerProps } from '../../../../shared/viz';
import { WarehouseVisualizer } from '../../shared/viz/WarehouseVisualizer';
import { solver } from '../domain';

/** Interactive step-by-step visualizer for Warehouse Woes Part 1. */
export function WarehousePart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <WarehouseVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 1 (1x crates)"
    />
  );
}
