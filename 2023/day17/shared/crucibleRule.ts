/** Straight-line run-length constraint `[minRun, maxRun]` before turning or stopping. */
export class CrucibleRule {
  readonly minRun: number;
  readonly maxRun: number;

  constructor(minRun: number, maxRun: number) {
    if (!Number.isInteger(minRun) || minRun < 1) {
      throw new RangeError(`minRun must be a positive integer, got ${minRun}`);
    }
    if (!Number.isInteger(maxRun) || maxRun < minRun) {
      throw new RangeError(`maxRun must be an integer >= minRun (${minRun}), got ${maxRun}`);
    }
    this.minRun = minRun;
    this.maxRun = maxRun;
    Object.freeze(this);
  }
}

export const CLUMSY_CRUCIBLE_RULE = new CrucibleRule(1, 3);
export const ULTRA_CRUCIBLE_RULE = new CrucibleRule(4, 10);
