import {
  LEAST_COMMON_CRITERION,
  MOST_COMMON_CRITERION,
  type Bit,
  type BitCriterion,
  type BitTally,
  type DiagnosticReport,
} from '../../shared';

const BINARY_STRING_PATTERN = /^[01]+$/;

/**
 * Selects the filtering bit for a candidate column tally.
 * When all remaining rows agree on a bit, keeps that bit regardless of least-common preference
 * so the candidate set never collapses to empty.
 */
export function selectFilterBit(tally: BitTally, criterion: BitCriterion): Bit {
  if (tally.ones === 0) return '0';
  if (tally.zeros === 0) return '1';
  return criterion.selectBit(tally);
}

/** Immutable result of filtering a diagnostic report down to a single rating selection. */
export class RatingSelection {
  readonly bits: string;
  readonly rowIndex: number;
  readonly roundsApplied: number;

  constructor(bits: string, rowIndex: number, roundsApplied: number) {
    if (!BINARY_STRING_PATTERN.test(bits)) {
      throw new SyntaxError(`Invalid binary rating string: "${bits}"`);
    }
    if (!Number.isInteger(rowIndex) || rowIndex < 0) {
      throw new RangeError(`rowIndex must be a non-negative integer, got ${rowIndex}`);
    }
    if (!Number.isInteger(roundsApplied) || roundsApplied < 0 || roundsApplied > bits.length) {
      throw new RangeError(`roundsApplied must be in [0, ${bits.length}], got ${roundsApplied}`);
    }
    this.bits = bits;
    this.rowIndex = rowIndex;
    this.roundsApplied = roundsApplied;
    Object.freeze(this);
  }

  get bitWidth(): number {
    return this.bits.length;
  }

  get rating(): bigint {
    return BigInt('0b' + this.bits);
  }
}

/** Immutable pair of oxygen generator and CO2 scrubber rating selections. */
export class LifeSupportRates {
  readonly oxygen: RatingSelection;
  readonly co2: RatingSelection;

  constructor(oxygen: RatingSelection, co2: RatingSelection) {
    if (oxygen.bitWidth !== co2.bitWidth) {
      throw new RangeError(
        `Bit width mismatch: oxygen=${oxygen.bitWidth}, co2=${co2.bitWidth}`,
      );
    }
    this.oxygen = oxygen;
    this.co2 = co2;
    Object.freeze(this);
  }

  get bitWidth(): number {
    return this.oxygen.bitWidth;
  }

  get lifeSupportRating(): bigint {
    return this.oxygen.rating * this.co2.rating;
  }
}

/** Builds an ordered array of initial row indices `[0 .. count - 1]`. */
export function createAllRowIndices(count: number): readonly number[] {
  const indices: number[] = [];
  for (let i = 0; i < count; i += 1) {
    indices.push(i);
  }
  return Object.freeze(indices);
}

/** Iteratively filters diagnostic rows column-by-column under `criterion` until one row (or final column) remains. */
export function findRatingSelection(
  report: DiagnosticReport,
  criterion: BitCriterion,
): RatingSelection {
  if (report.rowCount === 1) {
    return new RatingSelection(report.rowAt(0), 0, 0);
  }
  let candidates = createAllRowIndices(report.rowCount);
  for (let col = 0; col < report.bitWidth; col += 1) {
    const tally = report.countBitsAtColumn(col, candidates);
    const selectedBit = selectFilterBit(tally, criterion);
    candidates = report.filterRowsByBit(col, selectedBit, candidates);
    if (candidates.length === 1) {
      // Invariant: length === 1 guarantees index 0 exists.
      const winner = candidates[0]!;
      return new RatingSelection(report.rowAt(winner), winner, col + 1);
    }
  }
  // Invariant: selectFilterBit preserves >= 1 candidate every round (identical rows remain tied at final column).
  const fallbackIndex = candidates[0]!;
  return new RatingSelection(report.rowAt(fallbackIndex), fallbackIndex, report.bitWidth);
}

/** Computes oxygen generator and CO2 scrubber ratings for a DiagnosticReport. */
export function analyzeLifeSupport(report: DiagnosticReport): LifeSupportRates {
  const oxygen = findRatingSelection(report, MOST_COMMON_CRITERION);
  const co2 = findRatingSelection(report, LEAST_COMMON_CRITERION);
  return new LifeSupportRates(oxygen, co2);
}
