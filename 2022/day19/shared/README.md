# 2022 Day 19 Shared Domain & Visualization

Shared pure TypeScript domain logic and interactive React visualization for Advent of Code 2022 Day 19 (*Not Enough Minerals*), supporting both Part 1 (`timeLimit = 24`, quality-level sum) and Part 2 (`timeLimit = 32`, first-3 geode product).

## Consumer Interface

- `parseBlueprints(raw)` — parses single-line or wrapped multi-line blueprint definitions into frozen `Blueprint` instances, rejecting empty input, malformed syntax, non-positive IDs/costs, and duplicate IDs.
- `optimizeBlueprint(bp, timeLimit)` / `optimizeBlueprints(blueprints, timeLimit)` — returns frozen `BlueprintResult` instances with the optimal build `plan`, `nodesVisited`, and dynamic `maxGeodes` / `qualityLevel` getters.
- `simulatePlan(bp, plan, timeLimit)` — replays any `BuildAction[]` plan minute-by-minute (`0..timeLimit`), validating strictly increasing build minutes and resource affordability prior to collection.
- `sumQualityLevels(results)` / `multiplyMaxGeodes(results)` — Part 1 and Part 2 aggregate evaluators.
- `buildFactoryTrace(blueprints, timeLimit, mode, options?)` — generates bounded (`DEFAULT_TRACE_MAX_STEPS = 64`) playback frames for `viz/`.

## Maintainer Notes

- **Module DAG**: `blueprint` -> `parser` / `upperBound` / `simulator` -> `optimizer` -> `trace` -> `index.ts` (pure TS; zero React/DOM imports). `viz/` sits strictly above `index.ts`.
- **Search algorithm**: `BlueprintOptimizer` runs a jump-to-next-robot-build DFS (`geode -> obsidian -> clay -> ore`) with immediate geode accounting (`geodes += remAfter`), exact `remAfter` horizon cutoffs (`geode >= 1`, `obsidian >= 3`, `ore >= 3`, `clay >= 5`), robot-rate caps, exact surplus stock prunes (`rem >= 4` for ore/obsidian, `rem >= 6` for clay), triangular bound, and a 3-tier decoupled relaxation bound (`computeRelaxedGeodeBound`).
