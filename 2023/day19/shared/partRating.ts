import { type Category, validatePositiveInt } from './types';

export interface PartRatingFields {
  readonly x: number;
  readonly m: number;
  readonly a: number;
  readonly s: number;
}

/** Immutable machine part rating across the four `x, m, a, s` categories. */
export class PartRating implements PartRatingFields {
  readonly x: number;
  readonly m: number;
  readonly a: number;
  readonly s: number;

  constructor(fields: PartRatingFields) {
    this.x = validatePositiveInt(fields.x, 'Part rating x');
    this.m = validatePositiveInt(fields.m, 'Part rating m');
    this.a = validatePositiveInt(fields.a, 'Part rating a');
    this.s = validatePositiveInt(fields.s, 'Part rating s');
    Object.freeze(this);
  }

  /** Dynamic sum of all four category ratings. */
  get total(): number {
    return this.x + this.m + this.a + this.s;
  }

  /** Returns the rating value for the requested category. */
  valueOf(category: Category): number {
    return this[category];
  }
}
