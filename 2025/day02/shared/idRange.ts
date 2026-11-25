const RANGE_PATTERN = /^([1-9]\d*)-([1-9]\d*)$/;

function assertPatternSpec(patternLength: number, repeats: number): void {
  if (!Number.isSafeInteger(patternLength) || patternLength < 1) {
    throw new RangeError(`patternLength must be a positive safe integer, got ${patternLength}`);
  }
  if (!Number.isSafeInteger(repeats) || repeats < 2) {
    throw new RangeError(`repeats must be a safe integer >= 2, got ${repeats}`);
  }
}

function patternBounds(patternLength: number): readonly [bigint, bigint] {
  const minBound = 10n ** BigInt(patternLength - 1);
  return [minBound, minBound * 10n - 1n];
}

/** Multiplier M such that repeating a k-digit pattern r times equals pattern * M. */
export function repeatMultiplier(patternLength: number, repeats: number): bigint {
  assertPatternSpec(patternLength, repeats);
  const base = 10n ** BigInt(patternLength);
  return (base ** BigInt(repeats) - 1n) / (base - 1n);
}

/** Contiguous arithmetic band of r-repeated k-digit patterns inside an ID range. */
export class RepeatedPatternBand {
  readonly patternLength: number;
  readonly repeats: number;
  readonly minPattern: bigint;
  readonly maxPattern: bigint;

  constructor(patternLength: number, repeats: number, minPattern: bigint, maxPattern: bigint) {
    assertPatternSpec(patternLength, repeats);
    const [minBound, maxBound] = patternBounds(patternLength);
    if (minPattern < minBound || minPattern > maxPattern || maxPattern > maxBound) {
      throw new RangeError(`Pattern bounds [${minPattern}, ${maxPattern}] outside [${minBound}, ${maxBound}]`);
    }
    this.patternLength = patternLength;
    this.repeats = repeats;
    this.minPattern = minPattern;
    this.maxPattern = maxPattern;
    Object.freeze(this);
  }

  get digitLength(): number { return this.patternLength * this.repeats; }
  get multiplier(): bigint { return repeatMultiplier(this.patternLength, this.repeats); }
  get count(): bigint { return this.maxPattern - this.minPattern + 1n; }
  get sum(): bigint { return this.multiplier * ((this.count * (this.minPattern + this.maxPattern)) / 2n); }

  /** Returns up to `maxSamples` patterns in ascending order (head + tail when capped). */
  samplePatterns(maxSamples: number): readonly bigint[] {
    if (!Number.isSafeInteger(maxSamples) || maxSamples < 1) {
      throw new RangeError(`maxSamples must be a positive safe integer, got ${maxSamples}`);
    }
    if (this.count <= BigInt(maxSamples)) {
      const all: bigint[] = [];
      for (let p = this.minPattern; p <= this.maxPattern; p += 1n) all.push(p);
      return all;
    }
    const headCount = Math.ceil(maxSamples / 2);
    const tailCount = Math.floor(maxSamples / 2);
    const samples: bigint[] = [];
    for (let i = 0; i < headCount; i += 1) samples.push(this.minPattern + BigInt(i));
    for (let i = tailCount - 1; i >= 0; i -= 1) samples.push(this.maxPattern - BigInt(i));
    return samples;
  }
}

/** Closed positive integer ID interval [start, end]. */
export class IdRange {
  readonly start: bigint;
  readonly end: bigint;

  constructor(start: bigint, end: bigint) {
    if (start < 1n || end < start) throw new RangeError(`Invalid ID range [${start}, ${end}]`);
    this.start = start;
    this.end = end;
    Object.freeze(this);
  }

  get label(): string { return `${this.start}-${this.end}`; }
  get minDigits(): number { return this.start.toString().length; }
  get maxDigits(): number { return this.end.toString().length; }

  /** Computes the clamped band of k-digit patterns repeated r times within [start, end]. */
  repeatedPatternBand(patternLength: number, repeats: number): RepeatedPatternBand | null {
    const multiplier = repeatMultiplier(patternLength, repeats);
    const [minBound, maxBound] = patternBounds(patternLength);
    const ceilMin = (this.start + multiplier - 1n) / multiplier;
    const floorMax = this.end / multiplier;
    const minPattern = ceilMin > minBound ? ceilMin : minBound;
    const maxPattern = floorMax < maxBound ? floorMax : maxBound;
    return minPattern > maxPattern ? null : new RepeatedPatternBand(patternLength, repeats, minPattern, maxPattern);
  }

  static parse(token: string): IdRange {
    const match = RANGE_PATTERN.exec(token);
    if (!match) throw new Error(`Invalid ID range token "${token}"`);
    return new IdRange(BigInt(match[1]!), BigInt(match[2]!));
  }
}

export function parseIdRanges(raw: string): readonly IdRange[] {
  const trimmed = raw.trim();
  if (trimmed.length === 0) throw new Error('Input must contain at least one range');
  return trimmed.split(',').map((token, index) => {
    try {
      return IdRange.parse(token);
    } catch (error) {
      throw new Error(`Range ${index + 1}: ${(error as Error).message}`);
    }
  });
}
