import { CubeBag } from './cubeBag';

function assertPositiveGameId(id: number): number {
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new RangeError(`Game ID must be a positive safe integer, got ${id}`);
  }
  return id;
}

function assertNonEmptyReveals(reveals: readonly CubeBag[]): readonly CubeBag[] {
  if (reveals.length === 0) {
    throw new RangeError('GameRecord requires at least one reveal');
  }
  return Object.freeze([...reveals]);
}

function mergeBag(acc: CubeBag, reveal: CubeBag): CubeBag {
  return acc.maxWith(reveal);
}

/**
 * Immutable representation of a single Cube Conundrum game and its ordered reveals.
 * Derived properties such as `minimumBag` are computed dynamically to avoid drift.
 */
export class GameRecord {
  readonly id: number;
  readonly reveals: readonly CubeBag[];

  constructor(id: number, reveals: readonly CubeBag[]) {
    this.id = assertPositiveGameId(id);
    this.reveals = assertNonEmptyReveals(reveals);
    Object.freeze(this);
  }

  /** Tightest bag capable of producing all reveals in this game. */
  get minimumBag(): CubeBag {
    return this.reveals.reduce(mergeBag, CubeBag.EMPTY);
  }

  /** Returns true when every reveal in this game is feasible under `limits`. */
  isPossibleWith(limits: CubeBag): boolean {
    return this.minimumBag.fitsWithin(limits);
  }
}
