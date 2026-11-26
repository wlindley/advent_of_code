import {
  BoardingManifest,
  BoardingPass,
  CABIN_CAPACITY,
  MAX_SEAT_ID,
  assertValidSeatId,
} from './seat';

/** Immutable wrapper around a 1024-seat cabin occupancy bitset (`Uint8Array`). */
export class CabinOccupancy {
  readonly #seats = new Uint8Array(CABIN_CAPACITY);

  constructor(passes: readonly BoardingPass[]) {
    for (const pass of passes) {
      this.#seats[pass.seatId] = 1;
    }
    Object.freeze(this);
  }

  static fromManifest(manifest: BoardingManifest): CabinOccupancy {
    return new CabinOccupancy(manifest.passes);
  }

  isOccupied(seatId: number): boolean {
    assertValidSeatId(seatId);
    return this.#seats[seatId] === 1;
  }

  get occupiedSeatIds(): readonly number[] {
    const ids: number[] = [];
    for (let i = 0; i < CABIN_CAPACITY; i += 1) {
      if (this.#seats[i] === 1) ids.push(i);
    }
    return Object.freeze(ids);
  }

  get occupiedCount(): number {
    return this.occupiedSeatIds.length;
  }

  get minSeatId(): number | null {
    for (let i = 0; i < CABIN_CAPACITY; i += 1) {
      if (this.#seats[i] === 1) return i;
    }
    return null;
  }

  get maxSeatId(): number | null {
    for (let i = MAX_SEAT_ID; i >= 0; i -= 1) {
      if (this.#seats[i] === 1) return i;
    }
    return null;
  }

  get missingInteriorSeatIds(): readonly number[] {
    const gaps: number[] = [];
    for (let i = 1; i < MAX_SEAT_ID; i += 1) {
      if (this.#seats[i] === 0 && this.#seats[i - 1] === 1 && this.#seats[i + 1] === 1) {
        gaps.push(i);
      }
    }
    return Object.freeze(gaps);
  }
}
