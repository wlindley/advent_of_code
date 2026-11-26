import type { PuzzleSolver } from '../../../../shared/core';
import { parseAlmanac, type Almanac } from '../../shared';
import { findLowestLocation, traceAlmanac, type SeedJourneyFrame } from './trace';

export const solver: PuzzleSolver<Almanac, bigint, SeedJourneyFrame> = Object.freeze({
  parse: parseAlmanac,
  solve: findLowestLocation,
  trace: traceAlmanac,
});
