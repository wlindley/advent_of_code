import { sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import { PasswordDatabase, PasswordEntry } from './passwordEntry';
import type { PasswordValidationPolicy, PolicyEvaluation } from './policy';

export const DEFAULT_MAX_TRACE_STEPS = 120;

/** Immutable trace snapshot capturing a single password evaluation and cumulative totals. */
export class AuditTraceFrame {
  readonly #entryIndex: number;
  readonly #totalEntries: number;
  readonly #evaluation: PolicyEvaluation;
  readonly #validSoFar: number;

  constructor(
    entryIndex: number,
    totalEntries: number,
    evaluation: PolicyEvaluation,
    validSoFar: number,
  ) {
    if (!Number.isInteger(totalEntries) || totalEntries < 1) {
      throw new RangeError(`totalEntries must be an integer >= 1, got ${totalEntries}`);
    }
    if (!Number.isInteger(entryIndex) || entryIndex < 0 || entryIndex >= totalEntries) {
      throw new RangeError(`entryIndex must be in [0, ${totalEntries - 1}], got ${entryIndex}`);
    }
    const minValid = evaluation.isValid ? 1 : 0;
    const maxValid = evaluation.isValid ? entryIndex + 1 : entryIndex;
    if (!Number.isInteger(validSoFar) || validSoFar < minValid || validSoFar > maxValid) {
      throw new RangeError(`validSoFar must be an integer in [${minValid}, ${maxValid}], got ${validSoFar}`);
    }
    this.#entryIndex = entryIndex;
    this.#totalEntries = totalEntries;
    this.#evaluation = evaluation;
    this.#validSoFar = validSoFar;
    Object.freeze(this);
  }

  get entryIndex(): number {
    return this.#entryIndex;
  }

  get totalEntries(): number {
    return this.#totalEntries;
  }

  get evaluation(): PolicyEvaluation {
    return this.#evaluation;
  }

  get validSoFar(): number {
    return this.#validSoFar;
  }

  get entry(): PasswordEntry {
    return this.#evaluation.entry;
  }

  get isValid(): boolean {
    return this.#evaluation.isValid;
  }

  get checkedSoFar(): number {
    return this.#entryIndex + 1;
  }

  get invalidSoFar(): number {
    return this.checkedSoFar - this.#validSoFar;
  }
}

/** Counts how many entries in `database` satisfy `policy`. */
export function countValidPasswords(
  database: PasswordDatabase,
  policy: PasswordValidationPolicy,
): number {
  let valid = 0;
  for (const entry of database.entries) {
    if (policy.evaluate(entry).isValid) valid += 1;
  }
  return valid;
}

/** Evaluates all entries in a single pass and returns up to `maxSteps` sampled trace frames. */
export function tracePasswordAudit(
  database: PasswordDatabase,
  policy: PasswordValidationPolicy,
  maxSteps?: number,
): readonly AuditTraceFrame[] {
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const keepIndices = sampleTraceIndices(database.size, limit);
  const frames: AuditTraceFrame[] = [];
  let validSoFar = 0;
  let cursor = 0;

  for (let i = 0; i < database.size; i += 1) {
    const evaluation = policy.evaluate(database.entries[i]!);
    if (evaluation.isValid) validSoFar += 1;
    if (keepIndices[cursor] === i) {
      frames.push(new AuditTraceFrame(i, database.size, evaluation, validSoFar));
      cursor += 1;
    }
  }

  return Object.freeze(frames);
}
