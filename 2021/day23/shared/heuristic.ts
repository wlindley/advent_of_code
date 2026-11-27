import {
  type AmphipodSpecies,
  HALL_COLS,
  HALL_COUNT,
  ROOM_COLS,
  ROOM_COUNT,
  SPECIES,
  speciesToIndex,
  STEP_ENERGY,
} from './constants';

function estimateRoomEnergy(
  key: string,
  room: number,
  depth: number,
  unsettled: number[],
): number {
  const targetChar = SPECIES[room]!;
  const base = HALL_COUNT + room * depth;
  let settledBelow = true;
  let energy = 0;

  for (let d = depth - 1; d >= 0; d -= 1) {
    const ch = key[base + d]!;
    if (ch === '.') break;
    if (settledBelow && ch === targetChar) continue;
    settledBelow = false;
    const target = speciesToIndex(ch as AmphipodSpecies);
    unsettled[target]! += 1;
    const hDist = target === room ? 2 : Math.abs(ROOM_COLS[room]! - ROOM_COLS[target]!);
    energy += (d + 1 + hDist) * STEP_ENERGY[target]!;
  }
  return energy;
}

/** Admissible and consistent A* lower bound on energy needed to reach the organized goal. */
export function estimateRemainingEnergy(key: string, depth: number): number {
  const unsettled = [0, 0, 0, 0];
  let total = 0;

  for (let s = 0; s < HALL_COUNT; s += 1) {
    const ch = key[s]!;
    if (ch === '.') continue;
    const target = speciesToIndex(ch as AmphipodSpecies);
    unsettled[target]! += 1;
    total += Math.abs(HALL_COLS[s]! - ROOM_COLS[target]!) * STEP_ENERGY[target]!;
  }
  for (let r = 0; r < ROOM_COUNT; r += 1) {
    total += estimateRoomEnergy(key, r, depth, unsettled);
  }
  for (let t = 0; t < ROOM_COUNT; t += 1) {
    const k = unsettled[t]!;
    total += ((k * (k + 1)) / 2) * STEP_ENERGY[t]!;
  }
  return total;
}
