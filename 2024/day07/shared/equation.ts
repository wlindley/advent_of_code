import type { CalibrationOperator } from './operator';

const DIGIT_PATTERN = /^\d+$/;

/** Immutable calibration equation consisting of a positive target and operand sequence. */
export class CalibrationEquation {
  readonly target: bigint;
  readonly operands: readonly bigint[];

  constructor(target: bigint, operands: readonly bigint[]) {
    if (target < 1n) {
      throw new RangeError(`Equation target must be >= 1, got ${target}`);
    }
    if (operands.length === 0) {
      throw new RangeError('Equation must contain at least one operand');
    }
    for (const value of operands) {
      if (value < 1n) {
        throw new RangeError(`All operands must be >= 1, got ${value}`);
      }
    }
    this.target = target;
    this.operands = Object.freeze([...operands]);
    Object.freeze(this);
  }

  /** Evaluates left-to-right progressive accumulators `[acc_0, ..., acc_{k-1}]`. */
  evaluateSteps(operators: readonly CalibrationOperator[]): readonly bigint[] {
    if (operators.length !== this.operands.length - 1) {
      throw new RangeError(
        `Expected ${this.operands.length - 1} operators, got ${operators.length}`,
      );
    }
    const steps: bigint[] = [this.operands[0]!];
    for (let i = 0; i < operators.length; i += 1) {
      steps.push(operators[i]!.apply(steps[i]!, this.operands[i + 1]!));
    }
    return Object.freeze(steps);
  }
}

function parsePositiveBigInt(token: string, label: string, lineNumber: number): bigint {
  if (!DIGIT_PATTERN.test(token)) {
    throw new Error(`Invalid ${label} "${token}" on line ${lineNumber}`);
  }
  const value = BigInt(token);
  if (value < 1n) {
    throw new RangeError(`${label} must be >= 1 on line ${lineNumber}`);
  }
  return value;
}

function parseEquationLine(line: string, lineNumber: number): CalibrationEquation {
  const parts = line.split(':');
  if (parts.length !== 2) {
    throw new Error(`Expected single ":" delimiter on line ${lineNumber}`);
  }
  const target = parsePositiveBigInt(parts[0]!.trim(), 'target', lineNumber);
  const rhs = parts[1]!.trim();
  if (rhs.length === 0) {
    throw new Error(`Missing operands on line ${lineNumber}`);
  }
  const operands = rhs
    .split(/\s+/)
    .map((token) => parsePositiveBigInt(token, 'operand', lineNumber));
  return new CalibrationEquation(target, operands);
}

/** Parses newline-delimited `target: a b c` equations into frozen value objects. */
export function parseCalibrationInput(raw: string): readonly CalibrationEquation[] {
  const lines = raw.split(/\r?\n/);
  const equations: CalibrationEquation[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i]!.trim();
    if (trimmed.length === 0) continue;
    equations.push(parseEquationLine(trimmed, i + 1));
  }
  if (equations.length === 0) {
    throw new Error('Calibration input contains no equations');
  }
  return Object.freeze(equations);
}
