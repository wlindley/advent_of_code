# `2022/day04/shared`

## Consumer Guide
Shared pure-TypeScript domain primitives for Advent of Code 2022 Day 4 ("Camp Cleanup").

### Public API (`2022/day04/shared/index.ts`)
- `containsInterval`, `overlaps`, `intersection`, `computeGlobalBounds`: closed-interval predicates, intersection, and global bounding-box helpers over `ClosedInterval`.
- `AssignmentPair`, `parseAssignmentPairs`: parses `LF`/`CRLF` `a-b,c-d` lines into immutable frozen `AssignmentPair` objects with `BigInt` bounds, dynamic `relation`, `hasFullContainment`, `hasOverlap`, and `overlapInterval` getters, skipping blank lines and reporting 1-based physical line errors.
- `PAIR_RELATIONS`, `RelationTally`, `createEmptyRelationCounts`, `DEFAULT_MAX_TRACE_STEPS`: immutable 5-way relation frequency snapshot (`identical`, `first-contains-second`, `second-contains-first`, `partial-overlap`, `disjoint`) with dynamic `totalPairs`, `fullContainmentCount`, `overlapCount`, and `disjointCount` getters.

## Maintainer Guide
- **Pure domain**: depends only on `shared/core` (`ClosedInterval`); zero DOM/React/Node dependencies.
- **Promotion candidate**: `containsInterval`, `overlaps`, and `intersection` in `intervalOps.ts` are strong candidates for end-of-year promotion into `shared/core/interval.ts`.
