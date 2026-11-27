/** Amphipod species identifiers ordered by room index and step energy. */
export type AmphipodSpecies = 'A' | 'B' | 'C' | 'D';

/** Single cell state in the burrow encoding. */
export type CellContent = '.' | AmphipodSpecies;

/** Number of legal stopping hallway slots (excluding the 4 room doorways). */
export const HALL_COUNT = 7;

/** Number of side rooms in the burrow. */
export const ROOM_COUNT = 4;

/** Canonical species ordering corresponding to rooms 0..3. */
export const SPECIES = ['A', 'B', 'C', 'D'] as const;

/** 0-based hallway column indices (0..10) for the 7 legal hallway slots. */
export const HALL_COLS = [0, 1, 3, 5, 7, 9, 10] as const;

/** 0-based hallway column indices (0..10) for rooms A..D. */
export const ROOM_COLS = [2, 4, 6, 8] as const;

/** Energy cost per single step for species A..D. */
export const STEP_ENERGY = [1, 10, 100, 1000] as const;

/** Logical coordinate within the burrow (hallway slot or room depth). */
export type BurrowPosition =
  | { readonly kind: 'hallway'; readonly slot: number }
  | { readonly kind: 'room'; readonly room: number; readonly depth: number };

/** Maps species `'A'..'D'` to `0..3`. */
export function speciesToIndex(species: AmphipodSpecies): number {
  return species.charCodeAt(0) - 65;
}

/** Builds the canonical goal key for a burrow with rooms of `depth`. */
export function goalKeyForDepth(depth: number): string {
  return '.'.repeat(HALL_COUNT) + SPECIES.map((species) => species.repeat(depth)).join('');
}
