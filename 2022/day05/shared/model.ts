const CRATE_LABEL_RE = /^[A-Z]$/;

function requirePositiveInt(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${field} must be a positive safe integer, got ${value}`);
  }
  return value;
}

/** Immutable shipping crate identified by a single uppercase letter A-Z. */
export class Crate {
  readonly label: string;

  constructor(label: string) {
    if (!CRATE_LABEL_RE.test(label)) {
      throw new RangeError(`Crate label must match [A-Z], got "${label}"`);
    }
    this.label = label;
    Object.freeze(this);
  }
}

/** Immutable crane move instruction using 1-based stack indices. */
export class MoveInstruction {
  readonly count: number;
  readonly from: number;
  readonly to: number;

  constructor(count: number, from: number, to: number) {
    this.count = requirePositiveInt(count, 'count');
    this.from = requirePositiveInt(from, 'from');
    this.to = requirePositiveInt(to, 'to');
    if (this.from === this.to) {
      throw new RangeError(`Move source and destination must differ, got ${this.from}`);
    }
    Object.freeze(this);
  }

  get summary(): string {
    return `move ${this.count} from ${this.from} to ${this.to}`;
  }
}

/** Concatenates the top crate label of every non-empty stack in order. */
export function readTopMessage(stacks: readonly (readonly Crate[])[]): string {
  let message = '';
  for (const stack of stacks) {
    message += stack.at(-1)?.label ?? '';
  }
  return message;
}

function freezeStacks(stacks: readonly (readonly Crate[])[]): readonly (readonly Crate[])[] {
  const cloned: (readonly Crate[])[] = [];
  for (const stack of stacks) {
    cloned.push(Object.freeze([...stack]));
  }
  return Object.freeze(cloned);
}

/** Immutable validated supply rearrangement procedure (initial stacks + move list). */
export class SupplyProcedure {
  readonly initialStacks: readonly (readonly Crate[])[];
  readonly moves: readonly MoveInstruction[];

  constructor(initialStacks: readonly (readonly Crate[])[], moves: readonly MoveInstruction[]) {
    if (initialStacks.length === 0) {
      throw new RangeError('SupplyProcedure requires at least one stack');
    }
    const stackCount = initialStacks.length;
    for (const move of moves) {
      if (move.from > stackCount || move.to > stackCount) {
        throw new RangeError(
          `Move "${move.summary}" references stack outside 1..${stackCount}`,
        );
      }
    }
    this.initialStacks = freezeStacks(initialStacks);
    this.moves = Object.freeze([...moves]);
    Object.freeze(this);
  }

  get stackCount(): number {
    return this.initialStacks.length;
  }

  get totalCrates(): number {
    let total = 0;
    for (const stack of this.initialStacks) total += stack.length;
    return total;
  }

  get moveCount(): number {
    return this.moves.length;
  }

  get initialTopMessage(): string {
    return readTopMessage(this.initialStacks);
  }
}
