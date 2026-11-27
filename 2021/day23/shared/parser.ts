import { type AmphipodSpecies, ROOM_COUNT, SPECIES, speciesToIndex } from './constants';

export type RoomPair = readonly [AmphipodSpecies, AmphipodSpecies];

/** Parsed 5-line standard burrow diagram with 4 rooms of [top, bottom] amphipods. */
export interface BurrowDiagram {
  readonly rooms: readonly RoomPair[];
}

const TOP_WALL_RE = /^#{13}$/;
const HALL_RE = /^#\.{11}#$/;
const UPPER_ROOM_RE = /^###([A-D])#([A-D])#([A-D])#([A-D])###\s*$/;
const LOWER_ROOM_RE = /^  #([A-D])#([A-D])#([A-D])#([A-D])#\s*$/;
const BOTTOM_WALL_RE = /^  #{9}\s*$/;

function validateRoomCounts(rooms: readonly RoomPair[]): void {
  const counts = [0, 0, 0, 0];
  for (const [top, bottom] of rooms) {
    counts[speciesToIndex(top)]! += 1;
    counts[speciesToIndex(bottom)]! += 1;
  }
  for (let r = 0; r < ROOM_COUNT; r += 1) {
    if (counts[r] !== 2) {
      throw new Error(`Expected exactly 2 of species ${SPECIES[r]}, got ${counts[r]}`);
    }
  }
}

/** Parses a 5-line Amphipod burrow diagram into 4 frozen [top, bottom] room pairs. */
export function parseBurrow(raw: string): BurrowDiagram {
  if (raw.trim().length === 0) {
    throw new Error('Burrow input must not be empty');
  }
  const lines = raw.replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n');
  if (lines.length !== 5) {
    throw new Error(`Expected 5 burrow lines, got ${lines.length}`);
  }
  if (!TOP_WALL_RE.test(lines[0]!) || !HALL_RE.test(lines[1]!) || !BOTTOM_WALL_RE.test(lines[4]!)) {
    throw new Error('Invalid burrow wall or hallway structure');
  }
  const upperMatch = UPPER_ROOM_RE.exec(lines[2]!);
  const lowerMatch = LOWER_ROOM_RE.exec(lines[3]!);
  if (upperMatch === null || lowerMatch === null) {
    throw new Error('Invalid burrow room rows');
  }
  const rooms: RoomPair[] = [];
  for (let r = 0; r < ROOM_COUNT; r += 1) {
    rooms.push(
      Object.freeze([upperMatch[r + 1] as AmphipodSpecies, lowerMatch[r + 1] as AmphipodSpecies]),
    );
  }
  validateRoomCounts(rooms);
  return Object.freeze({ rooms: Object.freeze(rooms) });
}
