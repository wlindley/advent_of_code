import type { VisualizerProps } from '../../../../shared/viz';
import { type CircuitSnapshot, type LogicCircuit, buildEvaluationTrace } from '../../shared';
import { CircuitVisualizer } from '../../shared/viz/CircuitVisualizer';

export const PART1_EXAMPLE_INPUT = [
  'x00: 1', 'x01: 0', 'x02: 1', 'x03: 1', 'x04: 0',
  'y00: 1', 'y01: 1', 'y02: 1', 'y03: 1', 'y04: 1',
  '',
  'ntg XOR fgs -> mjb',
  'y02 OR x01 -> tnw',
  'kwq OR kpj -> z05',
  'x00 OR x03 -> fst',
  'tgd XOR rvg -> z01',
  'vdt OR tnw -> bfw',
  'bfw AND frj -> z10',
  'ffh OR nrd -> bqk',
  'y00 AND y03 -> djm',
  'y03 OR y00 -> psh',
  'bqk OR frj -> z08',
  'tnw OR fst -> frj',
  'gnj AND tgd -> z11',
  'bfw XOR mjb -> z00',
  'x03 OR x00 -> vdt',
  'gnj AND wpb -> z02',
  'x04 AND y00 -> kjc',
  'djm OR pbm -> qhw',
  'nrd AND vdt -> hwm',
  'kjc AND fst -> rvg',
  'y04 OR y02 -> fgs',
  'y01 AND x02 -> pbm',
  'ntg OR kjc -> kwq',
  'psh XOR fgs -> tgd',
  'qhw XOR tgd -> z09',
  'pbm OR djm -> kpj',
  'x03 XOR y03 -> ffh',
  'x00 XOR y04 -> ntg',
  'bfw OR bqk -> z06',
  'nrd XOR fgs -> wpb',
  'frj XOR qhw -> z04',
  'bqk OR frj -> z07',
  'y03 OR x01 -> nrd',
  'hwm AND bqk -> z03',
  'tgd XOR rvg -> z12',
  'tnw OR pbm -> gnj',
].join('\n');

function buildPart1Trace(circuit: LogicCircuit): readonly CircuitSnapshot[] {
  return buildEvaluationTrace(circuit);
}

function formatPart1Answer(snapshot: CircuitSnapshot): string {
  return snapshot.answer;
}

/** Interactive Part 1 Crossed Wires visualizer (topological gate evaluation). */
export function CrossedWiresPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <CircuitVisualizer
      rawInput={rawInput}
      cacheKey="part1-evaluate"
      buildTrace={buildPart1Trace}
      summaryLabel="Decimal Z"
      formatAnswer={formatPart1Answer}
    />
  );
}
