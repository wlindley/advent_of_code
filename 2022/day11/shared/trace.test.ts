import { describe, expect, it } from 'vitest';
import { floorDiv } from '../../../shared/core';
import {
  AddConstantOperation,
  DEFAULT_MAX_TRACE_STEPS,
  KeepAwaySetup,
  KeepAwayTraceFrame,
  MonkeySpec,
  MultiplyConstantOperation,
  SquareOperation,
  buildKeepAwayTrace,
  computeMonkeyBusiness,
  createKeepAwaySolver,
  findTopTwoIndices,
  parseWorryOperation,
  simulateKeepAway,
  validateRuleRounds,
  type KeepAwayRule,
} from './index';

const EXAMPLE_INPUT = [
  'Monkey 0:',
  '  Starting items: 79, 98',
  '  Operation: new = old * 19',
  '  Test: divisible by 23',
  '    If true: throw to monkey 2',
  '    If false: throw to monkey 3',
  '',
  'Monkey 1:',
  '  Starting items: 54, 65, 75, 74',
  '  Operation: new = old + 6',
  '  Test: divisible by 19',
  '    If true: throw to monkey 2',
  '    If false: throw to monkey 0',
  '',
  'Monkey 2:',
  '  Starting items: 79, 60, 97',
  '  Operation: new = old * old',
  '  Test: divisible by 13',
  '    If true: throw to monkey 1',
  '    If false: throw to monkey 3',
  '',
  'Monkey 3:',
  '  Starting items: 74',
  '  Operation: new = old + 3',
  '  Test: divisible by 17',
  '    If true: throw to monkey 0',
  '    If false: throw to monkey 1',
].join('\n');

const divideByThreeRule = (rounds: number): KeepAwayRule => ({
  rounds,
  reliefLabel: 'floor(worry / 3)',
  relieve: (worry) => floorDiv(worry, 3n),
});

describe('KeepAwayTraceFrame', () => {
  it('deep-freezes arrays and computes derived getters dynamically', () => {
    const counts = [2, 4];
    const queues = [[10n], [20n, 30n]];
    const matrix = [[0, 2], [3, 0]];
    const frame = new KeepAwayTraceFrame(1, 5, counts, queues, matrix);
    counts[0] = 999;
    queues[0]!.push(999n);
    matrix[0]![1] = 999;

    expect(Object.isFrozen(frame)).toBe(true);
    expect(Object.isFrozen(frame.counts)).toBe(true);
    expect(Object.isFrozen(frame.queues)).toBe(true);
    expect(Object.isFrozen(frame.queues[0])).toBe(true);
    expect(Object.isFrozen(frame.throwMatrix)).toBe(true);
    expect(Object.isFrozen(frame.throwMatrix[0])).toBe(true);
    expect(frame.monkeyCount).toBe(2);
    expect(frame.totalItems).toBe(3);
    expect(frame.totalInspections).toBe(6);
    expect(frame.topTwoIndices).toEqual([1, 0]);
    expect(frame.monkeyBusiness).toBe(8n);
    expect(frame.isComplete).toBe(false);
    expect(new KeepAwayTraceFrame(5, 5, [2, 4], [[], []], [[0, 0], [0, 0]]).isComplete).toBe(true);
  });

  it('rejects invalid round and totalRounds bounds', () => {
    const q = [[], []];
    const m = [[0, 0], [0, 0]];
    expect(() => new KeepAwayTraceFrame(-1, 5, [0, 0], q, m)).toThrow(RangeError);
    expect(() => new KeepAwayTraceFrame(1.5, 5, [0, 0], q, m)).toThrow(RangeError);
    expect(() => new KeepAwayTraceFrame(3, 2, [0, 0], q, m)).toThrow(RangeError);
    expect(() => new KeepAwayTraceFrame(3, 3.5, [0, 0], q, m)).toThrow(RangeError);
  });

  it('rejects mismatched counts, queues, or throwMatrix dimensions', () => {
    expect(() => new KeepAwayTraceFrame(0, 1, [0], [[]], [[0]])).toThrow(RangeError);
    expect(() => new KeepAwayTraceFrame(0, 1, [0, 0], [[]], [[0, 0], [0, 0]])).toThrow(RangeError);
    expect(() => new KeepAwayTraceFrame(0, 1, [0, 0], [[], []], [[0, 0]])).toThrow(RangeError);
    expect(() => new KeepAwayTraceFrame(0, 1, [0, 0], [[], []], [[0], [0, 0]])).toThrow(RangeError);
  });
});

describe('buildKeepAwayTrace', () => {
  it('produces full 21-frame trace for 20 rounds matching expected round 0, 1, and 20', () => {
    const setup = KeepAwaySetup.parse(EXAMPLE_INPUT);
    const frames = buildKeepAwayTrace(setup, divideByThreeRule(20));
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(21);
    expect(frames[0]!.round).toBe(0);
    expect(frames[0]!.counts).toEqual([0, 0, 0, 0]);
    expect(frames[1]!.queues[0]).toEqual([20n, 23n, 27n, 26n]);
    expect(frames[20]!.isComplete).toBe(true);
    expect(frames[20]!.counts).toEqual([101, 95, 7, 105]);
    expect(frames[20]!.monkeyBusiness).toBe(10605n);
  });

  it('handles rounds === 0 and empty-item setups', () => {
    const setup = KeepAwaySetup.parse(EXAMPLE_INPUT);
    const zeroFrames = buildKeepAwayTrace(setup, divideByThreeRule(0));
    expect(zeroFrames).toHaveLength(1);
    expect(zeroFrames[0]!.isComplete).toBe(true);
    expect(zeroFrames[0]!.totalItems).toBe(10);

    const emptySetup = new KeepAwaySetup([
      new MonkeySpec(0, [], parseWorryOperation('old + 1'), 2n, 1, 1),
      new MonkeySpec(1, [], parseWorryOperation('old * 2'), 3n, 0, 0),
    ]);
    const emptyFrames = buildKeepAwayTrace(emptySetup, divideByThreeRule(3));
    expect(emptyFrames).toHaveLength(4);
    expect(emptyFrames[3]!.totalInspections).toBe(0);
    expect(emptyFrames[3]!.totalItems).toBe(0);
  });

  it('sub-samples cleanly for maxSteps: 5 and maxSteps: 1 and rejects invalid maxSteps', () => {
    const setup = KeepAwaySetup.parse(EXAMPLE_INPUT);
    const sampled5 = buildKeepAwayTrace(setup, divideByThreeRule(20), { maxSteps: 5 });
    expect(sampled5).toHaveLength(5);
    expect(sampled5[0]!.round).toBe(0);
    expect(sampled5[4]!.round).toBe(20);

    const sampled1 = buildKeepAwayTrace(setup, divideByThreeRule(20), { maxSteps: 1 });
    expect(sampled1).toHaveLength(1);
    expect(sampled1[0]!.round).toBe(20);

    expect(() => buildKeepAwayTrace(setup, divideByThreeRule(5), { maxSteps: 0 })).toThrow(RangeError);
    expect(() => buildKeepAwayTrace(setup, divideByThreeRule(5), { maxSteps: -2 })).toThrow(RangeError);
    expect(() => buildKeepAwayTrace(setup, divideByThreeRule(5), { maxSteps: 1.5 })).toThrow(RangeError);
  });
});

describe('createKeepAwaySolver and shared barrel exports', () => {
  it('builds a frozen PuzzleSolver and validates rule.rounds', () => {
    expect(() => createKeepAwaySolver(divideByThreeRule(-1))).toThrow(RangeError);
    const solver = createKeepAwaySolver(divideByThreeRule(20));
    expect(Object.isFrozen(solver)).toBe(true);
    const setup = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(setup)).toBe(10605n);
    expect(solver.trace?.(setup, { maxSteps: 5 })).toHaveLength(5);
    expect(validateRuleRounds(1)).toBe(1);
    expect(computeMonkeyBusiness(simulateKeepAway(setup, divideByThreeRule(20)))).toBe(10605n);
    expect(findTopTwoIndices([3, 1, 4])).toEqual([2, 0]);
    expect(new AddConstantOperation(1n).apply(2n)).toBe(3n);
    expect(new MultiplyConstantOperation(2n).apply(3n)).toBe(6n);
    expect(new SquareOperation().apply(4n)).toBe(16n);
  });
});
