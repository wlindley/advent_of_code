import {
  BurrowState,
  type BurrowDiagram,
  type BurrowPolicy,
  HALL_COUNT,
  ROOM_COUNT,
  type RoomPair,
} from '../../shared';

/** Inserted middle amphipod pairs (top-middle, bottom-middle) for rooms A..D in Part 2. */
export const UNFOLDED_INSERTIONS: readonly RoomPair[] = Object.freeze([
  Object.freeze(['D', 'D'] as const),
  Object.freeze(['C', 'B'] as const),
  Object.freeze(['B', 'A'] as const),
  Object.freeze(['A', 'C'] as const),
]);

function unfoldRoom(pair: RoomPair, roomIndex: number): string {
  const [midTop, midBottom] = UNFOLDED_INSERTIONS[roomIndex]!;
  return `${pair[0]}${midTop}${midBottom}${pair[1]}`;
}

/** Part 2 policy unfolding depth-2 side rooms into depth-4 rooms with canonical insertions. */
export class UnfoldedBurrowPolicy implements BurrowPolicy {
  readonly id = 'unfolded' as const;
  readonly label = 'Unfolded (depth 4)';
  readonly roomDepth = 4;

  prepare(diagram: BurrowDiagram): BurrowState {
    if (diagram.rooms.length !== ROOM_COUNT) {
      throw new RangeError(`Expected ${ROOM_COUNT} rooms, got ${diagram.rooms.length}`);
    }
    const roomsKey = diagram.rooms.map(unfoldRoom).join('');
    return new BurrowState('.'.repeat(HALL_COUNT) + roomsKey, this.roomDepth);
  }
}

export const UNFOLDED_BURROW_POLICY: BurrowPolicy = Object.freeze(new UnfoldedBurrowPolicy());
