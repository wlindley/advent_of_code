import { type KeepAwaySetup, type MonkeySpec } from './setup';

/** Strategy governing round count and post-inspection worry relief. */
export interface KeepAwayRule {
  readonly rounds: number;
  readonly reliefLabel: string;
  relieve(worry: bigint, commonModulus: bigint): bigint;
}

/** Validates that a simulation round count is a non-negative safe integer. */
export function validateRuleRounds(rounds: number): number {
  if (!Number.isSafeInteger(rounds) || rounds < 0) {
    throw new RangeError(`Rule rounds must be a non-negative safe integer, got ${rounds}`);
  }
  return rounds;
}

/** Returns `[first, second]` monkey indices with highest inspection counts (lower index wins ties). */
export function findTopTwoIndices(counts: readonly number[]): readonly [number, number] {
  if (counts.length < 2) {
    throw new RangeError(`At least 2 counts are required, got ${counts.length}`);
  }
  for (let i = 0; i < counts.length; i += 1) {
    const value = counts[i]!;
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError(`Inspection count at ${i} must be a non-negative safe integer, got ${value}`);
    }
  }
  let first = 0;
  let second = 1;
  if (counts[1]! > counts[0]!) {
    first = 1;
    second = 0;
  }
  for (let i = 2; i < counts.length; i += 1) {
    const value = counts[i]!;
    if (value > counts[first]!) {
      second = first;
      first = i;
    } else if (value > counts[second]!) {
      second = i;
    }
  }
  return Object.freeze([first, second]);
}

/** Computes exact BigInt product of the top two inspection counts. */
export function computeMonkeyBusiness(counts: readonly number[]): bigint {
  const [first, second] = findTopTwoIndices(counts);
  return BigInt(counts[first]!) * BigInt(counts[second]!);
}

function traceItemTrajectory(
  monkeys: readonly MonkeySpec[],
  startMonkey: number,
  initialWorry: bigint,
  rounds: number,
  commonModulus: bigint,
  rule: KeepAwayRule,
  counts: number[],
): void {
  let current = startMonkey;
  let worry = initialWorry;
  let round = 0;
  // Each item's trajectory is independent of other items; a throw to a lower-indexed
  // monkey means that target already took its turn this round and inspects it next round.
  while (round < rounds) {
    const monkey = monkeys[current]!;
    counts[current]! += 1;
    worry = rule.relieve(monkey.operation.apply(worry), commonModulus);
    const next = worry % monkey.divisor === 0n ? monkey.trueTarget : monkey.falseTarget;
    if (next < current) round += 1;
    current = next;
  }
}

/**
 * Simulates `rule.rounds` of Keep Away using a queue-free per-item trajectory loop
 * and returns frozen inspection counts per monkey.
 */
export function simulateKeepAway(setup: KeepAwaySetup, rule: KeepAwayRule): readonly number[] {
  const rounds = validateRuleRounds(rule.rounds);
  const counts = new Array<number>(setup.monkeyCount).fill(0);
  if (rounds === 0) return Object.freeze(counts);
  const commonModulus = setup.commonModulus;
  const monkeys = setup.monkeys;
  for (let startId = 0; startId < monkeys.length; startId += 1) {
    const items = monkeys[startId]!.startingItems;
    for (let i = 0; i < items.length; i += 1) {
      traceItemTrajectory(monkeys, startId, items[i]!, rounds, commonModulus, rule, counts);
    }
  }
  return Object.freeze(counts);
}
