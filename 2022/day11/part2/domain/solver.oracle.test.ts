import { describe, expect, it } from 'vitest';
import {
  AddConstantOperation,
  KeepAwaySetup,
  MonkeySpec,
  MultiplyConstantOperation,
  SquareOperation,
  type WorryOperation,
  computeMonkeyBusiness,
} from '../../shared';
import { PART2_ROUNDS, solver } from './index';

const EXAMPLE_INPUT = [
  'Monkey 0:\n  Starting items: 79, 98\n  Operation: new = old * 19\n  Test: divisible by 23\n    If true: throw to monkey 2\n    If false: throw to monkey 3',
  'Monkey 1:\n  Starting items: 54, 65, 75, 74\n  Operation: new = old + 6\n  Test: divisible by 19\n    If true: throw to monkey 2\n    If false: throw to monkey 0',
  'Monkey 2:\n  Starting items: 79, 60, 97\n  Operation: new = old * old\n  Test: divisible by 13\n    If true: throw to monkey 1\n    If false: throw to monkey 3',
  'Monkey 3:\n  Starting items: 74\n  Operation: new = old + 3\n  Test: divisible by 17\n    If true: throw to monkey 0\n    If false: throw to monkey 1',
].join('\n\n');

class LcgRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  nextInt(bound: number): number {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state % bound;
  }
}

function createInitialResidues(item: bigint, monkeys: readonly MonkeySpec[]): bigint[] {
  const residues = new Array<bigint>(monkeys.length);
  for (let k = 0; k < monkeys.length; k += 1) {
    residues[k] = item % monkeys[k]!.divisor;
  }
  return residues;
}

function stepResidueVector(residues: bigint[], monkey: MonkeySpec, monkeys: readonly MonkeySpec[]): number {
  for (let k = 0; k < monkeys.length; k += 1) {
    residues[k] = monkey.operation.apply(residues[k]!) % monkeys[k]!.divisor;
  }
  return residues[monkey.id]! === 0n ? monkey.trueTarget : monkey.falseTarget;
}

function stepResidueRound(monkeys: readonly MonkeySpec[], queues: bigint[][][], counts: number[]): void {
  for (let m = 0; m < monkeys.length; m += 1) {
    const items = queues[m]!;
    if (items.length === 0) continue;
    const monkey = monkeys[m]!;
    queues[m] = [];
    for (let i = 0; i < items.length; i += 1) {
      counts[m]! += 1;
      const target = stepResidueVector(items[i]!, monkey, monkeys);
      queues[target]!.push(items[i]!);
    }
  }
}

/** Oracle 1: per-divisor residue vector (prod Z/d_k Z) that never computes commonModulus or LCM. */
function solveWithResidueVectors(setup: KeepAwaySetup, rounds: number): bigint {
  const monkeys = setup.monkeys;
  const counts = new Array<number>(monkeys.length).fill(0);
  const queues: bigint[][][] = [];
  for (let m = 0; m < monkeys.length; m += 1) {
    const items = monkeys[m]!.startingItems;
    const queue: bigint[][] = [];
    for (let i = 0; i < items.length; i += 1) {
      queue.push(createInitialResidues(items[i]!, monkeys));
    }
    queues.push(queue);
  }
  for (let r = 0; r < rounds; r += 1) stepResidueRound(monkeys, queues, counts);
  return computeMonkeyBusiness(counts);
}

function stepFifoRound(monkeys: readonly MonkeySpec[], modulus: bigint, queues: bigint[][], counts: number[]): void {
  for (let m = 0; m < monkeys.length; m += 1) {
    const items = queues[m]!;
    if (items.length === 0) continue;
    const monkey = monkeys[m]!;
    queues[m] = [];
    for (let i = 0; i < items.length; i += 1) {
      counts[m]! += 1;
      const worry = monkey.operation.apply(items[i]!) % modulus;
      const target = worry % monkey.divisor === 0n ? monkey.trueTarget : monkey.falseTarget;
      queues[target]!.push(worry);
    }
  }
}

/** Oracle 2: synchronous round-by-round FIFO queue simulation using % commonModulus. */
function solveWithFifoModulus(setup: KeepAwaySetup, rounds: number): bigint {
  const monkeys = setup.monkeys;
  const modulus = setup.commonModulus;
  const counts = new Array<number>(monkeys.length).fill(0);
  const queues: bigint[][] = [];
  for (let m = 0; m < monkeys.length; m += 1) queues.push([...monkeys[m]!.startingItems]);
  for (let r = 0; r < rounds; r += 1) stepFifoRound(monkeys, modulus, queues, counts);
  return computeMonkeyBusiness(counts);
}

function buildDivisorGraph(divisors: readonly bigint[]): KeepAwaySetup {
  const specs: MonkeySpec[] = [];
  const count = divisors.length;
  for (let i = 0; i < count; i += 1) {
    const op = i % 3 === 0 ? new SquareOperation() : i % 3 === 1 ? new AddConstantOperation(5n) : new MultiplyConstantOperation(3n);
    specs.push(new MonkeySpec(i, [BigInt(i * 11 + 7), BigInt(i * 17 + 3)], op, divisors[i]!, (i + 1) % count, (i + 2) % count));
  }
  return new KeepAwaySetup(specs);
}

function pickTarget(rng: LcgRng, id: number, count: number): number {
  return (id + 1 + rng.nextInt(count - 1)) % count;
}

function randomOperation(rng: LcgRng): WorryOperation {
  const kind = rng.nextInt(3);
  if (kind === 0) return new AddConstantOperation(BigInt(1 + rng.nextInt(19)));
  if (kind === 1) return new MultiplyConstantOperation(BigInt(2 + rng.nextInt(17)));
  return new SquareOperation();
}

function generateRandomSetup(rng: LcgRng): KeepAwaySetup {
  const divisors = [1n, 2n, 3n, 4n, 6n, 9n, 11n, 12n, 15n, 17n, 19n];
  const count = 3 + rng.nextInt(2);
  const specs: MonkeySpec[] = [];
  for (let id = 0; id < count; id += 1) {
    const itemCount = rng.nextInt(3);
    const items: bigint[] = [];
    for (let j = 0; j < itemCount; j += 1) {
      items.push(BigInt(rng.nextInt(150)));
    }
    const divisor = divisors[rng.nextInt(divisors.length)]!;
    specs.push(new MonkeySpec(id, items, randomOperation(rng), divisor, pickTarget(rng, id, count), pickTarget(rng, id, count)));
  }
  return new KeepAwaySetup(specs);
}

describe('Part 2 differential oracles', () => {
  it('matches both oracles on the official example across 10,000 rounds', () => {
    const setup = solver.parse(EXAMPLE_INPUT);
    const actual = solver.solve(setup);
    expect(actual).toBe(2713310158n);
    expect(solveWithResidueVectors(setup, PART2_ROUNDS)).toBe(actual);
    expect(solveWithFifoModulus(setup, PART2_ROUNDS)).toBe(actual);
  });

  it('matches both oracles on composite and shared-factor divisor graphs', () => {
    for (const divisors of [[4n, 6n, 12n, 18n], [1n, 6n, 9n, 15n]]) {
      const setup = buildDivisorGraph(divisors);
      const actual = solver.solve(setup);
      expect(solveWithResidueVectors(setup, PART2_ROUNDS)).toBe(actual);
      expect(solveWithFifoModulus(setup, PART2_ROUNDS)).toBe(actual);
    }
  });

  it('matches no-LCM residue-vector oracle across 50 seeded random graphs', () => {
    const rng = new LcgRng(20221102);
    for (let trial = 0; trial < 50; trial += 1) {
      const setup = generateRandomSetup(rng);
      expect(solveWithResidueVectors(setup, PART2_ROUNDS)).toBe(solver.solve(setup));
    }
  });

  it('matches FIFO modulus oracle across 25 seeded random graphs', () => {
    const rng = new LcgRng(20221103);
    for (let trial = 0; trial < 25; trial += 1) {
      const setup = generateRandomSetup(rng);
      expect(solveWithFifoModulus(setup, PART2_ROUNDS)).toBe(solver.solve(setup));
    }
  });
});
