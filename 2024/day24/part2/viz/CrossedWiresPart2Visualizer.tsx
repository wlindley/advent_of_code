import type { VisualizerProps } from '../../../../shared/viz';
import { type CircuitSnapshot, type LogicCircuit, buildRepairTrace } from '../../shared';
import { CircuitVisualizer } from '../../shared/viz/CircuitVisualizer';
import { PART2_SWAP_COUNT } from '../domain';

export const PART2_EXAMPLE_INPUT = [
  'x00: 1', 'x01: 1', 'x02: 0', 'x03: 1',
  'y00: 1', 'y01: 0', 'y02: 1', 'y03: 1',
  '',
  'x00 XOR y00 -> c00',
  'x00 AND y00 -> z00',
  'x01 XOR y01 -> g01',
  'x01 AND y01 -> p01',
  'p01 XOR c00 -> z01',
  'p01 AND c00 -> h01',
  'g01 OR h01 -> c01',
  'x02 XOR y02 -> p02',
  'x02 AND y02 -> g02',
  'p02 XOR c01 -> c02',
  'p02 AND c01 -> h02',
  'g02 OR h02 -> z02',
  'x03 XOR y03 -> p03',
  'x03 AND y03 -> g03',
  'p03 XOR c02 -> h03',
  'p03 AND c02 -> z03',
  'g03 OR h03 -> z04',
].join('\n');

function buildPart2Trace(circuit: LogicCircuit): readonly CircuitSnapshot[] {
  return buildRepairTrace(circuit, PART2_SWAP_COUNT);
}

function formatPart2Answer(snapshot: CircuitSnapshot): string {
  return snapshot.answer || '—';
}

/** Interactive Part 2 Crossed Wires visualizer (incremental adder swap repair). */
export function CrossedWiresPart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <CircuitVisualizer
      rawInput={rawInput}
      cacheKey="part2-repair"
      buildTrace={buildPart2Trace}
      summaryLabel="Swapped Wires"
      formatAnswer={formatPart2Answer}
    />
  );
}
