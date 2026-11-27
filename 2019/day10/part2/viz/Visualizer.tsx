import type { VisualizerProps } from '../../../../shared/viz';
import { MonitoringStationVisualizer } from '../../shared/viz/MonitoringStationVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 10 Part 2 interactive Monitoring Station laser-vaporization visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <MonitoringStationVisualizer rawInput={rawInput} solver={solver} />;
}
