import { lcmBigInt } from '../../../shared/core';
import { type WorryOperation, parseWorryOperation } from './operation';

function validateNonNegativeSafeInt(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer, got ${value}`);
  }
  return value;
}

function validateTarget(target: number, id: number, label: string): number {
  const checked = validateNonNegativeSafeInt(target, label);
  if (checked === id) {
    throw new RangeError(`${label} cannot reference monkey ${id} itself`);
  }
  return checked;
}

function matchLine(line: string, pattern: RegExp, expected: string): string {
  const match = pattern.exec(line);
  if (!match) {
    throw new Error(`Expected ${expected}, got "${line}"`);
  }
  return match[1]!;
}

function parseStartingItems(line: string): readonly bigint[] {
  const rawList = matchLine(line, /^Starting items:(.*)$/, 'Starting items line').trim();
  if (rawList === '') return [];
  return rawList.split(',').map((token) => {
    const cleaned = token.trim();
    if (!/^\d+$/.test(cleaned)) {
      throw new Error(`Invalid starting item worry level: "${token}"`);
    }
    return BigInt(cleaned);
  });
}

/** Immutable specification for a single monkey's initial items, operation, and throw test. */
export class MonkeySpec {
  readonly id: number;
  readonly startingItems: readonly bigint[];
  readonly operation: WorryOperation;
  readonly divisor: bigint;
  readonly trueTarget: number;
  readonly falseTarget: number;

  constructor(
    id: number,
    startingItems: readonly bigint[],
    operation: WorryOperation,
    divisor: bigint,
    trueTarget: number,
    falseTarget: number,
  ) {
    this.id = validateNonNegativeSafeInt(id, 'Monkey id');
    this.startingItems = Object.freeze(
      startingItems.map((item) => {
        if (item < 0n) throw new RangeError(`Starting item must be >= 0n, got ${item}`);
        return item;
      }),
    );
    this.operation = operation;
    if (divisor <= 0n) throw new RangeError(`Divisor must be > 0n, got ${divisor}`);
    this.divisor = divisor;
    this.trueTarget = validateTarget(trueTarget, this.id, 'trueTarget');
    this.falseTarget = validateTarget(falseTarget, this.id, 'falseTarget');
    Object.freeze(this);
  }
}

function parseMonkeyBlock(block: string): MonkeySpec {
  const lines = block.split('\n').map((line) => line.trim());
  if (lines.length !== 6) {
    throw new Error(`Monkey block must have 6 lines, got ${lines.length}`);
  }
  const id = Number(matchLine(lines[0]!, /^Monkey (\d+):$/, 'Monkey header'));
  const items = parseStartingItems(lines[1]!);
  const op = parseWorryOperation(matchLine(lines[2]!, /^Operation: new = (.+)$/, 'Operation line'));
  const divisor = BigInt(matchLine(lines[3]!, /^Test: divisible by (\d+)$/, 'Test divisor line'));
  const trueTarget = Number(matchLine(lines[4]!, /^If true: throw to monkey (\d+)$/, 'If true line'));
  const falseTarget = Number(matchLine(lines[5]!, /^If false: throw to monkey (\d+)$/, 'If false line'));
  return new MonkeySpec(id, items, op, divisor, trueTarget, falseTarget);
}

/** Immutable validated collection of monkeys participating in Keep Away. */
export class KeepAwaySetup {
  readonly monkeys: readonly MonkeySpec[];

  constructor(monkeys: readonly MonkeySpec[]) {
    if (monkeys.length < 2) {
      throw new RangeError(`KeepAwaySetup requires at least 2 monkeys, got ${monkeys.length}`);
    }
    const count = monkeys.length;
    for (let i = 0; i < count; i += 1) {
      const m = monkeys[i]!;
      if (m.id !== i) throw new RangeError(`Expected contiguous monkey id ${i}, got ${m.id}`);
      if (m.trueTarget >= count || m.falseTarget >= count) {
        throw new RangeError(`Monkey ${m.id} throw target out of range [0, ${count - 1}]`);
      }
    }
    this.monkeys = Object.freeze([...monkeys]);
    Object.freeze(this);
  }

  get monkeyCount(): number {
    return this.monkeys.length;
  }

  get totalItems(): number {
    return this.monkeys.reduce((sum, m) => sum + m.startingItems.length, 0);
  }

  get commonModulus(): bigint {
    return this.monkeys.reduce((acc, m) => lcmBigInt(acc, m.divisor), 1n);
  }

  static parse(raw: string): KeepAwaySetup {
    const normalized = raw.replace(/\r\n/g, '\n').trim();
    if (normalized === '') {
      throw new Error('KeepAway input must not be empty');
    }
    const blocks = normalized.split(/\n\s*\n/);
    return new KeepAwaySetup(blocks.map(parseMonkeyBlock));
  }
}
