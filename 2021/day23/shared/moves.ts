import { BurrowMove } from './burrow';
import {
  type AmphipodSpecies,
  type BurrowPosition,
  HALL_COUNT,
  ROOM_COUNT,
  SPECIES,
  speciesToIndex,
} from './constants';

export interface Transition {
  readonly nextKey: string;
  readonly move: BurrowMove;
}

function positionIndex(pos: BurrowPosition, depth: number): number {
  return pos.kind === 'hallway' ? pos.slot : HALL_COUNT + pos.room * depth + pos.depth;
}

/** Applies `move` to `key` and returns the resulting burrow key. */
export function applyMoveToKey(key: string, depth: number, move: BurrowMove): string {
  const chars = key.split('');
  chars[positionIndex(move.from, depth)] = '.';
  chars[positionIndex(move.to, depth)] = move.species;
  return chars.join('');
}

function createTransition(
  key: string,
  depth: number,
  species: AmphipodSpecies,
  from: BurrowPosition,
  to: BurrowPosition,
): Transition {
  const move = new BurrowMove(species, from, to);
  return { nextKey: applyMoveToKey(key, depth, move), move };
}

function isHallwaySliceClear(key: string, lo: number, hi: number): boolean {
  for (let s = lo; s <= hi; s += 1) {
    if (key[s] !== '.') return false;
  }
  return true;
}

function isHallwayToRoomClear(key: string, slot: number, room: number): boolean {
  return slot <= room + 1
    ? isHallwaySliceClear(key, slot + 1, room + 1)
    : isHallwaySliceClear(key, room + 2, slot - 1);
}

/** Returns deepest open depth in `room` if it holds only settled species, else `-1`. */
export function cleanEntryDepth(key: string, room: number, depth: number): number {
  const target = SPECIES[room]!;
  const base = HALL_COUNT + room * depth;
  for (let d = depth - 1; d > 0; d -= 1) {
    const ch = key[base + d]!;
    if (ch === '.') return d;
    if (ch !== target) return -1;
  }
  return key[base] === '.' ? 0 : -1;
}

/** Returns top occupied depth in `room` if that room contains any unsettled amphipod, else `-1`. */
export function findUnsettledTopDepth(key: string, room: number, depth: number): number {
  const target = SPECIES[room]!;
  const base = HALL_COUNT + room * depth;
  let top = -1;
  let hasForeign = false;
  for (let d = 0; d < depth; d += 1) {
    const ch = key[base + d]!;
    if (ch === '.') continue;
    if (top === -1) top = d;
    if (ch !== target) hasForeign = true;
  }
  return hasForeign ? top : -1;
}

function findForcedHallwayMove(key: string, depth: number): Transition | null {
  for (let s = 0; s < HALL_COUNT; s += 1) {
    const ch = key[s]!;
    if (ch === '.') continue;
    const species = ch as AmphipodSpecies;
    const targetRoom = speciesToIndex(species);
    const entryDepth = cleanEntryDepth(key, targetRoom, depth);
    if (entryDepth >= 0 && isHallwayToRoomClear(key, s, targetRoom)) {
      return createTransition(
        key,
        depth,
        species,
        { kind: 'hallway', slot: s },
        { kind: 'room', room: targetRoom, depth: entryDepth },
      );
    }
  }
  return null;
}

function findForcedRoomMove(key: string, depth: number): Transition | null {
  for (let r = 0; r < ROOM_COUNT; r += 1) {
    const topDepth = findUnsettledTopDepth(key, r, depth);
    if (topDepth < 0) continue;
    const species = key[HALL_COUNT + r * depth + topDepth] as AmphipodSpecies;
    const targetRoom = speciesToIndex(species);
    const entryDepth = cleanEntryDepth(key, targetRoom, depth);
    const lo = Math.min(r, targetRoom) + 2;
    const hi = Math.max(r, targetRoom) + 1;
    if (entryDepth >= 0 && isHallwaySliceClear(key, lo, hi)) {
      return createTransition(
        key,
        depth,
        species,
        { kind: 'room', room: r, depth: topDepth },
        { kind: 'room', room: targetRoom, depth: entryDepth },
      );
    }
  }
  return null;
}

/** Finds a single forced move directly into a clean home room (hallway->room, then room->room). */
export function findForcedHomeMove(key: string, depth: number): Transition | null {
  return findForcedHallwayMove(key, depth) ?? findForcedRoomMove(key, depth);
}

/** Generates all legal room-to-hallway exit moves for rooms with unsettled amphipods. */
export function generateRoomExitMoves(key: string, depth: number): readonly Transition[] {
  const moves: Transition[] = [];
  for (let r = 0; r < ROOM_COUNT; r += 1) {
    const topDepth = findUnsettledTopDepth(key, r, depth);
    if (topDepth < 0) continue;
    const species = key[HALL_COUNT + r * depth + topDepth] as AmphipodSpecies;
    const from: BurrowPosition = { kind: 'room', room: r, depth: topDepth };
    for (let s = r + 1; s >= 0 && key[s] === '.'; s -= 1) {
      moves.push(createTransition(key, depth, species, from, { kind: 'hallway', slot: s }));
    }
    for (let s = r + 2; s < HALL_COUNT && key[s] === '.'; s += 1) {
      moves.push(createTransition(key, depth, species, from, { kind: 'hallway', slot: s }));
    }
  }
  return moves;
}

/** Generates successor transitions, pruning immediately to a single forced home move if available. */
export function generateSuccessors(key: string, depth: number): readonly Transition[] {
  const forced = findForcedHomeMove(key, depth);
  return forced !== null ? [forced] : generateRoomExitMoves(key, depth);
}
