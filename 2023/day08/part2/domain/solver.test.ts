import { describe, expect, it } from 'vitest';
import { parseWastelandNetwork } from '../../shared';
import { analyzeGhostConvergence, solveHauntedWastelandPart2 } from './convergence';
import { solver } from './solver';

const OFFICIAL_PART2_EXAMPLE = [
  'LR',
  '',
  '11A = (11B, XXX)',
  '11B = (XXX, 11Z)',
  '11Z = (11B, XXX)',
  '22A = (22B, XXX)',
  '22B = (22C, 22C)',
  '22C = (22Z, 22Z)',
  '22Z = (22B, 22B)',
  'XXX = (XXX, XXX)',
].join('\n');

describe('analyzeGhostConvergence & solveHauntedWastelandPart2', () => {
  it('solves the official Part 2 example as general-crt = 6n', () => {
    const net = parseWastelandNetwork(OFFICIAL_PART2_EXAMPLE);
    const plan = analyzeGhostConvergence(net);
    expect(plan.regime).toBe('general-crt');
    expect(plan.answer).toBe(6n);
    expect(plan.mergeSteps).toHaveLength(2);
    expect(Object.isFrozen(plan)).toBe(true);
    expect(solveHauntedWastelandPart2(net)).toBe(6n);
  });

  it('classifies aligned LCM systems when every ghost hits **Z only at 0 mod cycleLength', () => {
    const net = parseWastelandNetwork([
      'L',
      '',
      '11A = (11B, 11B)',
      '11B = (11C, 11C)',
      '11C = (11D, 11D)',
      '11D = (11E, 11E)',
      '11E = (11Z, 11Z)',
      '11Z = (11B, 11B)',
      '22A = (22B, 22B)',
      '22B = (22C, 22C)',
      '22C = (22D, 22D)',
      '22D = (22E, 22E)',
      '22E = (22F, 22F)',
      '22F = (22Z, 22Z)',
      '22Z = (22B, 22B)',
    ].join('\n'));
    const plan = analyzeGhostConvergence(net);
    expect(plan.regime).toBe('aligned-lcm');
    expect(plan.answer).toBe(30n);
  });

  it('orders ghosts deterministically by (cycleHits.length, cycleLength, startId) and handles multi-branch CRT', () => {
    const net = parseWastelandNetwork([
      'L',
      '',
      '11A = (11Z, 11Z)',
      '11Z = (11B, 11B)',
      '11B = (21Z, 21Z)',
      '21Z = (11C, 11C)',
      '11C = (11Z, 11Z)',
      '22A = (22Z, 22Z)',
      '22Z = (22A, 22A)',
      '33A = (33B, 33B)',
      '33B = (33Z, 33Z)',
      '33Z = (33A, 33A)',
    ].join('\n'));
    const plan = analyzeGhostConvergence(net);
    expect(plan.cycles.map((c) => c.startLabel)).toEqual(['22A', '33A', '11A']);
    expect(plan.mergeSteps[2]!.congruences.length).toBeGreaterThanOrEqual(2);
    expect(plan.answer).toBe(5n);

    // Same cycleHits.length & cycleLength -> tie-break by startId; 2nd congruence yields smaller step
    const tieNet = parseWastelandNetwork([
      'L',
      '',
      '44A = (44B, 44B)',
      '44B = (44Z, 44Z)',
      '44Z = (44A, 44A)',
      '11A = (11Z, 11Z)',
      '11Z = (11B, 11B)',
      '11B = (21Z, 21Z)',
      '21Z = (11C, 11C)',
      '11C = (11Z, 11Z)',
      '55A = (55B, 55B)',
      '55B = (55Z, 55Z)',
      '55Z = (55A, 55A)',
    ].join('\n'));
    const tiePlan = analyzeGhostConvergence(tieNet);
    expect(tiePlan.cycles.map((c) => c.startLabel)).toEqual(['44A', '55A', '11A']);
    expect(tiePlan.answer).toBe(5n);
  });

  it('handles pure pre-cycle convergence even when another ghost has zero cycle hits', () => {
    const net = parseWastelandNetwork([
      'L',
      '',
      '11A = (11Z, 11Z)',
      '11Z = (11X, 11X)',
      '11X = (11X, 11X)',
      '22A = (22Z, 22Z)',
      '22Z = (22A, 22A)',
    ].join('\n'));
    const plan = analyzeGhostConvergence(net);
    expect(plan.regime).toBe('pre-cycle');
    expect(plan.answer).toBe(1n);
    expect(plan.mergeSteps).toEqual([]);
  });

  it('handles mixed pre-cycle and cycle hits and falls through when pre-cycle hits miss', () => {
    const missNet = parseWastelandNetwork([
      'L',
      '',
      '11A = (11Z, 11Z)',
      '11Z = (11B, 11B)',
      '11B = (11C, 11C)',
      '11C = (11Z, 11Z)',
      '22A = (22B, 22B)',
      '22B = (22Z, 22Z)',
      '22Z = (22B, 22B)',
    ].join('\n'));
    const plan = analyzeGhostConvergence(missNet);
    expect(plan.regime).toBe('general-crt');
    expect(plan.answer).toBe(4n);
  });

  it('throws on missing **A nodes, zero cycle hits without pre-cycle match, and incompatible moduli', () => {
    const noStarts = parseWastelandNetwork('L\n\nBBB = (ZZZ, ZZZ)\nZZZ = (ZZZ, ZZZ)');
    expect(() => solveHauntedWastelandPart2(noStarts)).toThrow(/No ghost start nodes/);

    const deadEnd = parseWastelandNetwork([
      'L',
      '',
      '11A = (11X, 11X)',
      '11X = (11X, 11X)',
    ].join('\n'));
    expect(() => solveHauntedWastelandPart2(deadEnd)).toThrow(/never reaches/);

    const conflict = parseWastelandNetwork([
      'L',
      '',
      '11A = (11Z, 11Z)',
      '11Z = (11A, 11A)',
      '22A = (22B, 22B)',
      '22B = (22Z, 22Z)',
      '22Z = (22A, 22A)',
    ].join('\n'));
    // 11A hits at odd steps (1 mod 2); make 22A hit at even steps mod 2: 22A -> 22B -> 22Z -> 22C -> 22A (len 4, hit at 2)
    const evenConflict = parseWastelandNetwork([
      'L',
      '',
      '11A = (11Z, 11Z)',
      '11Z = (11A, 11A)',
      '22A = (22B, 22B)',
      '22B = (22Z, 22Z)',
      '22Z = (22C, 22C)',
      '22C = (22A, 22A)',
    ].join('\n'));
    expect(solveHauntedWastelandPart2(conflict)).toBe(5n);
    expect(() => solveHauntedWastelandPart2(evenConflict)).toThrow(/no compatible convergence/);
  });

  it('exposes frozen PuzzleSolver end-to-end', () => {
    expect(Object.isFrozen(solver)).toBe(true);
    const parsed = solver.parse(OFFICIAL_PART2_EXAMPLE);
    expect(solver.solve(parsed)).toBe(6n);
    expect(solver.trace!(parsed).at(-1)!.runningStep).toBe(6n);
  });
});
