/** Polymorphic worry transformation evaluated during a monkey's item inspection. */
export interface WorryOperation {
  readonly expression: string;
  apply(worry: bigint): bigint;
}

/** Worry operation adding a non-negative constant: `old + operand`. */
export class AddConstantOperation implements WorryOperation {
  readonly operand: bigint;

  constructor(operand: bigint) {
    if (operand < 0n) {
      throw new RangeError(`AddConstantOperation operand must be >= 0n, got ${operand}`);
    }
    this.operand = operand;
    Object.freeze(this);
  }

  get expression(): string {
    return `old + ${this.operand}`;
  }

  apply(worry: bigint): bigint {
    return worry + this.operand;
  }
}

/** Worry operation multiplying by a non-negative constant: `old * factor`. */
export class MultiplyConstantOperation implements WorryOperation {
  readonly factor: bigint;

  constructor(factor: bigint) {
    if (factor < 0n) {
      throw new RangeError(`MultiplyConstantOperation factor must be >= 0n, got ${factor}`);
    }
    this.factor = factor;
    Object.freeze(this);
  }

  get expression(): string {
    return `old * ${this.factor}`;
  }

  apply(worry: bigint): bigint {
    return worry * this.factor;
  }
}

/** Worry operation squaring the current worry level: `old * old`. */
export class SquareOperation implements WorryOperation {
  constructor() {
    Object.freeze(this);
  }

  get expression(): string {
    return 'old * old';
  }

  apply(worry: bigint): bigint {
    return worry * worry;
  }
}

const OP_PATTERN = /^old ([+*]) (old|\d+)$/;

/** Parses an AoC `Operation: new = <expr>` right-hand side into a `WorryOperation`. */
export function parseWorryOperation(raw: string): WorryOperation {
  const match = OP_PATTERN.exec(raw.trim());
  if (!match) {
    throw new Error(`Invalid worry operation: "${raw}"`);
  }
  const op = match[1]!;
  const rhs = match[2]!;
  if (op === '*') {
    return rhs === 'old' ? new SquareOperation() : new MultiplyConstantOperation(BigInt(rhs));
  }
  return rhs === 'old' ? new MultiplyConstantOperation(2n) : new AddConstantOperation(BigInt(rhs));
}
