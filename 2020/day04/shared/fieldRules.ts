import type { RequiredPassportField } from './passport';

/** Validation rule for a single passport field value. */
export interface FieldRule {
  readonly description: string;
  isValid(value: string): boolean;
}

const FOUR_DIGIT_YEAR = /^\d{4}$/;
const HEIGHT_PATTERN = /^([1-9]\d*)(cm|in)$/;

function assertIntegerBounds(min: number, max: number, lowerLimit: number, upperLimit: number): void {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new RangeError('Bounds must be integers');
  }
  if (min < lowerLimit || max > upperLimit || min > max) {
    throw new RangeError(`Bounds ${min}..${max} must lie within ${lowerLimit}..${upperLimit}`);
  }
}

/** Rule requiring a 4-digit year within an inclusive integer range. */
export class YearRangeRule implements FieldRule {
  readonly #min: number;
  readonly #max: number;

  constructor(min: number, max: number) {
    assertIntegerBounds(min, max, 1000, 9999);
    this.#min = min;
    this.#max = max;
    Object.freeze(this);
  }

  get description(): string {
    return `${this.#min}..${this.#max} (4 digits)`;
  }

  isValid(value: string): boolean {
    if (!FOUR_DIGIT_YEAR.test(value)) return false;
    const year = Number(value);
    return year >= this.#min && year <= this.#max;
  }
}

/** Rule requiring an integer height with `cm` or `in` suffix within unit bounds. */
export class HeightRule implements FieldRule {
  readonly #minCm: number;
  readonly #maxCm: number;
  readonly #minIn: number;
  readonly #maxIn: number;

  constructor(minCm: number, maxCm: number, minIn: number, maxIn: number) {
    assertIntegerBounds(minCm, maxCm, 1, 999);
    assertIntegerBounds(minIn, maxIn, 1, 999);
    this.#minCm = minCm;
    this.#maxCm = maxCm;
    this.#minIn = minIn;
    this.#maxIn = maxIn;
    Object.freeze(this);
  }

  get description(): string {
    return `${this.#minCm}-${this.#maxCm}cm or ${this.#minIn}-${this.#maxIn}in`;
  }

  isValid(value: string): boolean {
    const match = HEIGHT_PATTERN.exec(value);
    if (!match) return false;
    const amount = Number(match[1]!);
    const unit = match[2]!;
    if (unit === 'cm') {
      return amount >= this.#minCm && amount <= this.#maxCm;
    }
    return amount >= this.#minIn && amount <= this.#maxIn;
  }
}

/** Rule requiring a value to match a stateless regular expression. */
export class PatternRule implements FieldRule {
  readonly #pattern: RegExp;
  readonly #description: string;

  constructor(pattern: RegExp, description: string) {
    if (pattern.global || pattern.sticky) {
      throw new RangeError('PatternRule does not allow stateful global or sticky regex flags');
    }
    const trimmed = description.trim();
    if (trimmed.length === 0) {
      throw new RangeError('PatternRule description must be non-empty');
    }
    this.#pattern = new RegExp(pattern.source, pattern.flags);
    this.#description = trimmed;
    Object.freeze(this);
  }

  get description(): string {
    return this.#description;
  }

  isValid(value: string): boolean {
    return this.#pattern.test(value);
  }
}

/** Rule requiring a value to belong to a finite set of allowed tokens. */
export class AllowedValuesRule implements FieldRule {
  readonly #values: ReadonlySet<string>;

  constructor(values: Iterable<string>) {
    const set = new Set(values);
    if (set.size === 0) {
      throw new RangeError('AllowedValuesRule requires at least one allowed value');
    }
    this.#values = set;
    Object.freeze(this);
  }

  get description(): string {
    return [...this.#values].join(' | ');
  }

  isValid(value: string): boolean {
    return this.#values.has(value);
  }
}

/** Official strict validation rules for the seven required passport fields. */
export const STRICT_FIELD_RULES: Readonly<Record<RequiredPassportField, FieldRule>> = Object.freeze({
  byr: new YearRangeRule(1920, 2002),
  iyr: new YearRangeRule(2010, 2020),
  eyr: new YearRangeRule(2020, 2030),
  hgt: new HeightRule(150, 193, 59, 76),
  hcl: new PatternRule(/^#[0-9a-f]{6}$/, '# followed by 6 lowercase hex chars'),
  ecl: new AllowedValuesRule(['amb', 'blu', 'brn', 'gry', 'grn', 'hzl', 'oth']),
  pid: new PatternRule(/^\d{9}$/, '9-digit number including leading zeroes'),
});
