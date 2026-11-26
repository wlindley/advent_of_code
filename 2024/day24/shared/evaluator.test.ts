import { describe, expect, it } from 'vitest';
import { parseCircuit } from './circuit';
import { assembleBusValue, buildWireGraph, evaluateCircuit } from './evaluator';
import type { WireBit } from './types';

const TINY_EXAMPLE = [
  'x00: 1',
  'x01: 1',
  'x02: 1',
  'y00: 0',
  'y01: 1',
  'y02: 0',
  '',
  'x00 AND y00 -> z00',
  'x01 XOR y01 -> z01',
  'x02 OR y02 -> z02',
].join('\n');

const LARGE_EXAMPLE = [
  'x00: 1', 'x01: 0', 'x02: 1', 'x03: 1', 'x04: 0',
  'y00: 1', 'y01: 1', 'y02: 1', 'y03: 1', 'y04: 1',
  '',
  'ntg XOR fgs -> mjb', 'y02 OR x01 -> tnw', 'kwq OR kpj -> z05',
  'x00 OR x03 -> fst', 'tgd XOR rvg -> z01', 'vdt OR tnw -> bfw',
  'bfw AND frj -> z10', 'ffh OR nrd -> bqk', 'y00 AND y03 -> djm',
  'y03 OR y00 -> psh', 'bqk OR frj -> z08', 'tnw OR fst -> frj',
  'gnj AND tgd -> z11', 'bfw XOR mjb -> z00', 'x03 OR x00 -> vdt',
  'gnj AND wpb -> z02', 'x04 AND y00 -> kjc', 'djm OR pbm -> qhw',
  'nrd AND vdt -> hwm', 'kjc AND fst -> rvg', 'y04 OR y02 -> fgs',
  'y01 AND x02 -> pbm', 'ntg OR kjc -> kwq', 'psh XOR fgs -> tgd',
  'qhw XOR tgd -> z09', 'pbm OR djm -> kpj', 'x03 XOR y03 -> ffh',
  'x00 XOR y04 -> ntg', 'bfw OR bqk -> z06', 'nrd XOR fgs -> wpb',
  'frj XOR qhw -> z04', 'bqk OR frj -> z07', 'y03 OR x01 -> nrd',
  'hwm AND bqk -> z03', 'tgd XOR rvg -> z12', 'tnw OR pbm -> gnj',
].join('\n');

describe('Day 24 evaluator', () => {
  it('evaluates the tiny example to 4n and builds the wire DAG', () => {
    const circuit = parseCircuit(TINY_EXAMPLE);
    const graph = buildWireGraph(circuit);
    expect(graph.nodeCount).toBe(9);
    expect(graph.edgeCount).toBe(6);

    const evaluation = evaluateCircuit(circuit);
    expect(evaluation.zValue).toBe(4n);
    expect(evaluation.busValue('x')).toBe(7n);
    expect(evaluation.evaluationOrder).toHaveLength(3);
  });

  it('evaluates the 36-gate AoC example to 2024n', () => {
    const evaluation = evaluateCircuit(parseCircuit(LARGE_EXAMPLE));
    expect(evaluation.zValue).toBe(2024n);
  });

  it('handles self-duplicate inputs, high-bit z63 BigInt precision, and zero z wires', () => {
    const dupCircuit = parseCircuit([
      'x00: 1',
      'x01: 1',
      '',
      'x00 XOR x00 -> z00',
      'x01 AND x01 -> z63',
    ].join('\n'));
    const dupGraph = buildWireGraph(dupCircuit);
    expect(dupGraph.edgeCount).toBe(2);
    expect(evaluateCircuit(dupCircuit).zValue).toBe(1n << 63n);

    const noZ = parseCircuit('x00: 1\n\nx00 AND x00 -> mid');
    expect(evaluateCircuit(noZ).zValue).toBe(0n);

    const custom = new Map<string, WireBit>([['z02', 1], ['other', 1]]);
    expect(assembleBusValue(custom, 'z')).toBe(4n);
  });

  it('throws on 1-node and 2-node cycles', () => {
    const selfCycle = parseCircuit('x00: 1\n\nx00 OR a -> a');
    expect(() => evaluateCircuit(selfCycle)).toThrow(/Cycle/);

    const twoCycle = parseCircuit('x00: 1\n\nx00 OR b -> a\na AND x00 -> b');
    expect(() => evaluateCircuit(twoCycle)).toThrow(/Cycle/);
  });
});
