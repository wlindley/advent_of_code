import {
  type AmphipodSpecies,
  type BurrowPosition,
  type CellContent,
  goalKeyForDepth,
  HALL_COLS,
  HALL_COUNT,
  ROOM_COLS,
  ROOM_COUNT,
  SPECIES,
  speciesToIndex,
  STEP_ENERGY,
} from './constants';

function positionCol(pos: BurrowPosition): number {
  return pos.kind === 'hallway' ? HALL_COLS[pos.slot]! : ROOM_COLS[pos.room]!;
}

function positionVertical(pos: BurrowPosition): number {
  return pos.kind === 'hallway' ? 0 : pos.depth + 1;
}

function validateBurrowKey(key: string, roomDepth: number): void {
  const counts = [0, 0, 0, 0];
  for (let i = 0; i < key.length; i += 1) {
    const ch = key[i]!;
    if (ch === '.') continue;
    const idx = ch.charCodeAt(0) - 65;
    if (idx < 0 || idx >= ROOM_COUNT) {
      throw new Error(`Invalid burrow cell character "${ch}" at index ${i}`);
    }
    counts[idx]! += 1;
  }
  for (let r = 0; r < ROOM_COUNT; r += 1) {
    if (counts[r] !== roomDepth) {
      throw new Error(`Expected ${roomDepth} of species ${SPECIES[r]}, got ${counts[r]}`);
    }
  }
}

function validateNoFloatingAmphipods(key: string, roomDepth: number): void {
  for (let r = 0; r < ROOM_COUNT; r += 1) {
    const base = HALL_COUNT + r * roomDepth;
    let seenOccupied = false;
    for (let d = 0; d < roomDepth; d += 1) {
      const ch = key[base + d]!;
      if (ch === '.') {
        if (seenOccupied) {
          throw new Error(`Floating amphipod above empty slot in room ${SPECIES[r]}`);
        }
      } else {
        seenOccupied = true;
      }
    }
  }
}

/** Immutable amphipod move with dynamically computed step count and energy cost. */
export class BurrowMove {
  readonly species: AmphipodSpecies;
  readonly from: BurrowPosition;
  readonly to: BurrowPosition;

  constructor(species: AmphipodSpecies, from: BurrowPosition, to: BurrowPosition) {
    this.species = species;
    this.from = Object.freeze({ ...from });
    this.to = Object.freeze({ ...to });
    Object.freeze(this);
  }

  get steps(): number {
    return (
      positionVertical(this.from) +
      Math.abs(positionCol(this.from) - positionCol(this.to)) +
      positionVertical(this.to)
    );
  }

  get energy(): number {
    return this.steps * STEP_ENERGY[speciesToIndex(this.species)]!;
  }
}

/** Immutable burrow configuration keyed by compact hallway+rooms string. */
export class BurrowState {
  readonly key: string;
  readonly roomDepth: number;

  constructor(key: string, roomDepth: number) {
    if (!Number.isInteger(roomDepth) || roomDepth < 1) {
      throw new RangeError(`roomDepth must be a positive integer, got ${roomDepth}`);
    }
    const expectedLen = HALL_COUNT + ROOM_COUNT * roomDepth;
    if (key.length !== expectedLen) {
      throw new RangeError(`Expected key length ${expectedLen}, got ${key.length}`);
    }
    validateBurrowKey(key, roomDepth);
    validateNoFloatingAmphipods(key, roomDepth);
    this.key = key;
    this.roomDepth = roomDepth;
    Object.freeze(this);
  }

  hallwayAt(slot: number): CellContent {
    return this.key[slot] as CellContent;
  }

  roomAt(room: number, depth: number): CellContent {
    return this.key[HALL_COUNT + room * this.roomDepth + depth] as CellContent;
  }

  isSlotSettled(room: number, depth: number): boolean {
    const target = SPECIES[room]!;
    for (let d = depth; d < this.roomDepth; d += 1) {
      if (this.roomAt(room, d) !== target) return false;
    }
    return true;
  }

  get settledCount(): number {
    let total = 0;
    for (let r = 0; r < ROOM_COUNT; r += 1) {
      const target = SPECIES[r]!;
      for (let d = this.roomDepth - 1; d >= 0; d -= 1) {
        if (this.roomAt(r, d) !== target) break;
        total += 1;
      }
    }
    return total;
  }

  get isGoal(): boolean {
    return this.key === goalKeyForDepth(this.roomDepth);
  }
}
