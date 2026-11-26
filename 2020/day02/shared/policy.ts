import { PasswordEntry } from './passwordEntry';

export type CharCheckStatus = 'match' | 'miss' | 'neutral';
export type PolicyId = 'sled-rental' | 'toboggan';

export interface PolicyEvaluation {
  readonly entry: PasswordEntry;
  readonly policy: PasswordValidationPolicy;
  readonly isValid: boolean;
  readonly checkedIndices: readonly number[];
  readonly matchedIndices: readonly number[];
  readonly detail: string;
  charStatusAt(index: number): CharCheckStatus;
}

export interface PasswordValidationPolicy {
  readonly id: PolicyId;
  readonly name: string;
  readonly ruleSummary: string;
  evaluate(entry: PasswordEntry): PolicyEvaluation;
}

/** Dynamic evaluation of a password entry under the sled-rental count rule. */
export class SledEvaluation implements PolicyEvaluation {
  readonly #entry: PasswordEntry;
  readonly #policy: PasswordValidationPolicy;

  constructor(entry: PasswordEntry, policy: PasswordValidationPolicy) {
    this.#entry = entry;
    this.#policy = policy;
    Object.freeze(this);
  }

  get entry(): PasswordEntry {
    return this.#entry;
  }

  get policy(): PasswordValidationPolicy {
    return this.#policy;
  }

  get checkedIndices(): readonly number[] {
    const indices: number[] = [];
    for (let i = 0; i < this.#entry.password.length; i += 1) {
      indices.push(i);
    }
    return Object.freeze(indices);
  }

  get matchedIndices(): readonly number[] {
    const matches: number[] = [];
    const { password, letter } = this.#entry;
    // Full scan without early exit so displayed counts and matched tiles remain accurate.
    for (let i = 0; i < password.length; i += 1) {
      if (password[i] === letter) matches.push(i);
    }
    return Object.freeze(matches);
  }

  get isValid(): boolean {
    const count = this.matchedIndices.length;
    return count >= this.#entry.first && count <= this.#entry.second;
  }

  get detail(): string {
    const count = this.matchedIndices.length;
    return `count(${this.#entry.letter}) = ${count} (required ${this.#entry.first}..${this.#entry.second})`;
  }

  charStatusAt(index: number): CharCheckStatus {
    return this.#entry.password[index] === this.#entry.letter ? 'match' : 'neutral';
  }
}

/** Dynamic evaluation of a password entry under the Toboggan XOR-position rule. */
export class TobogganEvaluation implements PolicyEvaluation {
  readonly #entry: PasswordEntry;
  readonly #policy: PasswordValidationPolicy;

  constructor(entry: PasswordEntry, policy: PasswordValidationPolicy) {
    this.#entry = entry;
    this.#policy = policy;
    Object.freeze(this);
  }

  get entry(): PasswordEntry {
    return this.#entry;
  }

  get policy(): PasswordValidationPolicy {
    return this.#policy;
  }

  get checkedIndices(): readonly number[] {
    return Object.freeze([this.#entry.first - 1, this.#entry.second - 1]);
  }

  get matchedIndices(): readonly number[] {
    const matches: number[] = [];
    const { first, second, letter, password } = this.#entry;
    if (password[first - 1] === letter) matches.push(first - 1);
    if (password[second - 1] === letter) matches.push(second - 1);
    return Object.freeze(matches);
  }

  get isValid(): boolean {
    return this.matchedIndices.length === 1;
  }

  get detail(): string {
    const hits = this.matchedIndices.length;
    return `pos ${this.#entry.first} & ${this.#entry.second}: ${hits}/1 match '${this.#entry.letter}'`;
  }

  charStatusAt(index: number): CharCheckStatus {
    const isChecked = index === this.#entry.first - 1 || index === this.#entry.second - 1;
    if (!isChecked) return 'neutral';
    return this.#entry.password[index] === this.#entry.letter ? 'match' : 'miss';
  }
}

/** AoC 2020 Day 2 Part 1 policy: character occurrence count within [first, second]. */
export class SledRentalPolicy implements PasswordValidationPolicy {
  readonly id: PolicyId = 'sled-rental';
  readonly name = 'Sled Rental Policy';
  readonly ruleSummary = 'Policy letter count must lie within [min, max].';

  evaluate(entry: PasswordEntry): PolicyEvaluation {
    return new SledEvaluation(entry, this);
  }
}

/** AoC 2020 Day 2 Part 2 policy: exact XOR match at 1-based positions first and second. */
export class TobogganPolicy implements PasswordValidationPolicy {
  readonly id: PolicyId = 'toboggan';
  readonly name = 'Toboggan Corporate Policy';
  readonly ruleSummary = 'Exactly one of 1-based positions must match policy letter.';

  evaluate(entry: PasswordEntry): PolicyEvaluation {
    return new TobogganEvaluation(entry, this);
  }
}

export const SLED_RENTAL_POLICY: PasswordValidationPolicy = Object.freeze(new SledRentalPolicy());
export const TOBOGGAN_POLICY: PasswordValidationPolicy = Object.freeze(new TobogganPolicy());
