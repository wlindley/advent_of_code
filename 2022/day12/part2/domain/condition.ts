import type { HeightMap, StartCondition } from '../../shared';

/** Part 2 start rule: any cell at lowest elevation (`'a'` or `'S'`, height `0`). */
export const ANY_LOWEST_START_CONDITION: StartCondition = Object.freeze({
  label: "Any lowest elevation ('a')",
  matches: (map: HeightMap, index: number) => map.heightAtIndex(index) === 0,
});
