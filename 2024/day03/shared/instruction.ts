export const MIN_OPERAND = 0;
export const MAX_OPERAND = 999;
export const MAX_OPERAND_DIGITS = 3;

export type ControlKind = 'do' | 'dont';

function assertOperand(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < MIN_OPERAND || value > MAX_OPERAND) {
    throw new RangeError(`${label} must be an integer in [${MIN_OPERAND}, ${MAX_OPERAND}], got ${value}`);
  }
  return value + 0;
}

function assertSpan(start: number, end: number): readonly [number, number] {
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end <= start) {
    throw new RangeError(`Instruction span [${start}, ${end}) must satisfy 0 <= start < end`);
  }
  return [start + 0, end];
}

/** Immutable validated `mul(X,Y)` instruction with 1..3-digit operands in `[0, 999]`. */
export class MulInstruction {
  readonly kind = 'mul' as const;
  readonly x: number;
  readonly y: number;
  readonly start: number;
  readonly end: number;

  constructor(x: number, y: number, start: number, end: number) {
    this.x = assertOperand(x, 'x');
    this.y = assertOperand(y, 'y');
    const [safeStart, safeEnd] = assertSpan(start, end);
    this.start = safeStart;
    this.end = safeEnd;
    Object.freeze(this);
  }

  get product(): number {
    return this.x * this.y;
  }
}

/** Immutable validated `do()` or `don't()` control instruction. */
export class ControlInstruction {
  readonly kind: ControlKind;
  readonly start: number;
  readonly end: number;

  constructor(kind: ControlKind, start: number, end: number) {
    const [safeStart, safeEnd] = assertSpan(start, end);
    this.kind = kind;
    this.start = safeStart;
    this.end = safeEnd;
    Object.freeze(this);
  }
}

export type MemoryInstruction = MulInstruction | ControlInstruction;
