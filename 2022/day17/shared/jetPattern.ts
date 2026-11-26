const VALID_JET_PATTERN = /^[<>]+$/;

/** Immutable validated jet stream pattern (`<` or `>`). */
export class JetPattern {
  readonly sequence: string;

  constructor(sequence: string) {
    if (!VALID_JET_PATTERN.test(sequence)) {
      throw new Error('Jet pattern must be a non-empty string of "<" and ">" characters');
    }
    this.sequence = sequence;
    Object.freeze(this);
  }

  /** Total number of jet directions before the pattern wraps. */
  get length(): number {
    return this.sequence.length;
  }

  /** Returns `true` when the jet at `index` pushes left (`<`). */
  isLeftAt(index: number): boolean {
    return this.sequence.charCodeAt(index) === 60;
  }
}

/** Parses and validates a raw jet pattern string, trimming outer whitespace. */
export function parseJetPattern(raw: string): JetPattern {
  return new JetPattern(raw.trim());
}
