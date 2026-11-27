export const MIN_CUP_COUNT = 4;

/** Validated, immutable starting cup ring permutation of distinct integers 1..N. */
export class CupRingSpec {
  readonly labels: readonly number[];

  constructor(labels: readonly number[]) {
    const n = labels.length;
    if (n < MIN_CUP_COUNT) {
      throw new RangeError(`Cup ring requires at least ${MIN_CUP_COUNT} cups, got ${n}`);
    }
    const seen = new Uint8Array(n + 1);
    for (const label of labels) {
      if (!Number.isInteger(label) || label < 1 || label > n) {
        throw new RangeError(`Cup label must be an integer in [1, ${n}], got ${label}`);
      }
      if (seen[label] === 1) {
        throw new RangeError(`Duplicate cup label: ${label}`);
      }
      seen[label] = 1;
    }
    this.labels = Object.freeze([...labels]);
    Object.freeze(this);
  }

  get count(): number {
    return this.labels.length;
  }

  get firstCup(): number {
    return this.labels[0]!;
  }
}

/** Parses a digit-only cup sequence string into a validated CupRingSpec. */
export function parseCupLabels(raw: string): CupRingSpec {
  const trimmed = raw.trim();
  if (!/^[1-9]+$/.test(trimmed)) {
    throw new Error('Cup labels must be a non-empty string of digits 1-9');
  }
  const digits = Array.from(trimmed, (ch) => Number(ch));
  return new CupRingSpec(digits);
}
