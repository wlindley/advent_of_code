import type { HeightMap, StartCondition } from '../../shared';

/** Part 1 start rule: only the unique `S` cell is an eligible starting point. */
export const FIXED_START_CONDITION: StartCondition = Object.freeze({
  label: 'Fixed start (S)',
  matches: (map: HeightMap, index: number) => index === map.startIndex,
});
