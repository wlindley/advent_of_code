import { sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import { PassportBatch, PassportRecord } from './passport';
import type { PassportEvaluation, PassportValidationPolicy } from './policy';

export const DEFAULT_MAX_TRACE_STEPS = 120;

function assertIntegerInRange(name: string, value: number, min: number, max: number): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer in ${min}..${max}, got ${value}`);
  }
}

/** Snapshot of a passport evaluation step during a batch scan. */
export class PassportTraceFrame {
  readonly #recordIndex: number;
  readonly #totalRecords: number;
  readonly #evaluation: PassportEvaluation;
  readonly #validSoFar: number;

  constructor(
    recordIndex: number,
    totalRecords: number,
    evaluation: PassportEvaluation,
    validSoFar: number,
  ) {
    if (!Number.isInteger(totalRecords) || totalRecords < 1) {
      throw new RangeError(`totalRecords must be a positive integer, got ${totalRecords}`);
    }
    assertIntegerInRange('recordIndex', recordIndex, 0, totalRecords - 1);
    const minValid = evaluation.isValid ? 1 : 0;
    const maxValid = recordIndex + minValid;
    assertIntegerInRange('validSoFar', validSoFar, minValid, maxValid);

    this.#recordIndex = recordIndex;
    this.#totalRecords = totalRecords;
    this.#evaluation = evaluation;
    this.#validSoFar = validSoFar;
    Object.freeze(this);
  }

  get recordIndex(): number { return this.#recordIndex; }
  get totalRecords(): number { return this.#totalRecords; }
  get evaluation(): PassportEvaluation { return this.#evaluation; }
  get validSoFar(): number { return this.#validSoFar; }
  get record(): PassportRecord { return this.#evaluation.record; }
  get isValid(): boolean { return this.#evaluation.isValid; }
  get checkedSoFar(): number { return this.#recordIndex + 1; }
  get invalidSoFar(): number { return this.checkedSoFar - this.#validSoFar; }
}

/** Counts how many records in `batch` satisfy `policy`. */
export function countValidPassports(batch: PassportBatch, policy: PassportValidationPolicy): number {
  let valid = 0;
  for (const record of batch.records) {
    if (policy.evaluate(record).isValid) valid += 1;
  }
  return valid;
}

/** Traces batch evaluation step-by-step, downsampling cleanly to at most `maxSteps` frames. */
export function tracePassportScan(
  batch: PassportBatch,
  policy: PassportValidationPolicy,
  maxSteps?: number,
): readonly PassportTraceFrame[] {
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(batch.size, limit);
  const frames: PassportTraceFrame[] = [];
  let validSoFar = 0;
  let cursor = 0;

  for (let index = 0; index < batch.size; index += 1) {
    const evaluation = policy.evaluate(batch.records[index]!);
    if (evaluation.isValid) validSoFar += 1;
    if (index === sampled[cursor]) {
      frames.push(new PassportTraceFrame(index, batch.size, evaluation, validSoFar));
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}
