import type { HeightMap } from './heightMap';

/** Predicate selecting eligible start cells on a parsed elevation grid. */
export interface StartCondition {
  readonly label: string;
  matches(map: HeightMap, index: number): boolean;
}
