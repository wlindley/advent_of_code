import { CabinOccupancy } from './occupancy';
import { BoardingPass } from './seat';

export type SeatPolicyId = 'highest-seat' | 'missing-interior-seat';

/** Immutable result produced by evaluating a `SeatQueryPolicy` on a `CabinOccupancy`. */
export class SeatQueryResult {
  readonly policyId: SeatPolicyId;
  readonly policyLabel: string;
  readonly seat: BoardingPass;
  readonly detail: string;

  constructor(policyId: SeatPolicyId, policyLabel: string, seat: BoardingPass, detail: string) {
    this.policyId = policyId;
    this.policyLabel = policyLabel;
    this.seat = seat;
    this.detail = detail;
    Object.freeze(this);
  }

  get seatId(): number {
    return this.seat.seatId;
  }
}

export interface SeatQueryPolicy {
  readonly id: SeatPolicyId;
  readonly label: string;
  query(occupancy: CabinOccupancy): SeatQueryResult;
}

/** Policy selecting the highest occupied seat ID in the cabin. */
export class HighestSeatPolicy implements SeatQueryPolicy {
  readonly id: SeatPolicyId = 'highest-seat';
  readonly label = 'Highest Seat ID';

  constructor() {
    Object.freeze(this);
  }

  query(occupancy: CabinOccupancy): SeatQueryResult {
    const maxSeatId = occupancy.maxSeatId;
    if (maxSeatId === null) {
      throw new RangeError('Cannot find highest seat ID in an empty cabin occupancy');
    }
    const seat = new BoardingPass(maxSeatId);
    return new SeatQueryResult(this.id, this.label, seat, `Highest occupied seat #${seat.seatId}`);
  }
}

/** Policy selecting the unique missing interior seat whose neighbors are both occupied. */
export class MissingInteriorSeatPolicy implements SeatQueryPolicy {
  readonly id: SeatPolicyId = 'missing-interior-seat';
  readonly label = 'Missing Interior Seat';

  constructor() {
    Object.freeze(this);
  }

  query(occupancy: CabinOccupancy): SeatQueryResult {
    const gaps = occupancy.missingInteriorSeatIds;
    if (gaps.length !== 1) {
      throw new RangeError(`Expected exactly 1 missing interior seat, found ${gaps.length}`);
    }
    const seat = new BoardingPass(gaps[0] as number);
    return new SeatQueryResult(
      this.id,
      this.label,
      seat,
      `Unique empty interior seat #${seat.seatId} between #${seat.seatId - 1} and #${seat.seatId + 1}`,
    );
  }
}

export const HIGHEST_SEAT_POLICY: SeatQueryPolicy = new HighestSeatPolicy();
export const MISSING_INTERIOR_SEAT_POLICY: SeatQueryPolicy = new MissingInteriorSeatPolicy();
