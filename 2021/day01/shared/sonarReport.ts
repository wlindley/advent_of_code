const INTEGER_LINE_PATTERN = /^-?\d+$/;

/** Validates that a sliding-window stride is a positive integer. */
export function validateWindowSize(windowSize: number): void {
  if (!Number.isInteger(windowSize) || windowSize < 1) {
    throw new RangeError(`Window size must be a positive integer, got ${windowSize}`);
  }
}

/** Immutable sequence of validated integer depth measurements. */
export class SonarReport {
  readonly depths: readonly number[];

  constructor(depths: readonly number[]) {
    if (depths.length === 0) {
      throw new RangeError('Sonar report must contain at least one depth');
    }
    const copied: number[] = [];
    for (const depth of depths) {
      if (!Number.isSafeInteger(depth)) {
        throw new RangeError(`Depth must be a safe integer, got ${depth}`);
      }
      copied.push(depth + 0);
    }
    this.depths = Object.freeze(copied);
    Object.freeze(this);
  }

  get count(): number {
    return this.depths.length;
  }

  get minDepth(): number {
    let min = this.depths[0]!;
    for (let i = 1; i < this.depths.length; i += 1) {
      const value = this.depths[i]!;
      if (value < min) min = value;
    }
    return min;
  }

  get maxDepth(): number {
    let max = this.depths[0]!;
    for (let i = 1; i < this.depths.length; i += 1) {
      const value = this.depths[i]!;
      if (value > max) max = value;
    }
    return max;
  }

  depthAt(index: number): number {
    if (!Number.isInteger(index) || index < 0 || index >= this.depths.length) {
      throw new RangeError(`Depth index out of bounds: ${index}`);
    }
    return this.depths[index]!;
  }

  windowSum(start: number, windowSize: number): bigint {
    validateWindowSize(windowSize);
    if (!Number.isInteger(start) || start < 0 || start + windowSize > this.depths.length) {
      throw new RangeError(`Window [${start}, ${start + windowSize}) out of bounds`);
    }
    let total = 0n;
    for (let offset = 0; offset < windowSize; offset += 1) {
      total += BigInt(this.depths[start + offset]!);
    }
    return total;
  }
}

/** Parses newline-delimited integer depth readings into an immutable SonarReport. */
export function parseSonarReport(raw: string): SonarReport {
  const values: number[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    if (!INTEGER_LINE_PATTERN.test(trimmed)) {
      throw new SyntaxError(`Invalid depth reading: "${trimmed}"`);
    }
    values.push(Number(trimmed) + 0);
  }
  return new SonarReport(values);
}
