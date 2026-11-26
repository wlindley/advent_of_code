# Day 22 Shared Domain & Visualization

## User / Consumer Overview
Shared pure-TypeScript Monkey Market PRNG engine, 4-delta sequence optimizer, bounded snapshot trace builder, and interactive SVG visualizer for AoC 2024 Day 22 (*Monkey Market*).

### Public Exports (`./index.ts`)
- **PRNG (`./prng.ts`)**: `PRUNE_MODULUS`, `PRUNE_MASK`, `DEFAULT_SECRET_STEPS`, `assertNonNegativeSafeInt`, `assertPositiveSafeInt`, `mix`, `prune`, `secretPrice`, `advanceSecret`, `advanceSecretN`.
- **Parser (`./parser.ts`)**: `parseBuyerSeeds(raw)`.
- **Model (`./model.ts`)**: `DELTA_MIN`, `DELTA_MAX`, `DELTA_OFFSET`, `DELTA_BASE`, `DELTA_KEY_SPACE`, `DELTA_ROLL_MOD`, `MIN_PRICE_WINDOW_SIZE`, `DEFAULT_PRICE_WINDOW_SIZE`, `DeltaSequence`, `encodeDeltaSequence`, `decodeDeltaSequence`, `BuyerOutcome`, `SecretSumResult`, `BananaSequenceCandidate`, `MarketOptimizationResult`, `MarketPriceWindow`.
- **Market Engine (`./market.ts`)**: `sumNthSecrets`, `evaluateBuyers`, `findBestBananaSequence`, `buildBuyerPriceWindow`.
- **Trace & Snapshot (`./snapshot.ts`)**: `DEFAULT_MAX_TRACE_STEPS`, `MarketTracePhase`, `MarketSnapshot`, `buildSecretSumTrace`, `buildBananaOptimizationTrace`.

### UI Components (`./viz/`)
- `MarketChartSvg.tsx`: Interactive price polyline (`0..9`), step axis, signed price deltas, shaded 4-step trigger band + gold sell halo when `matchedStep !== null`, and buyer progress strip.
- `MonkeyMarketVisualizer.tsx`: Shared visualizer accepting `buildTrace` and `cacheKey`, rendering HUD badges, `MarketChartSvg`, buyer/leaderboard tables, and `PlaybackControls`.

## Developer / Maintainer Architecture
- **Strict one-way DAG**: `shared/core` -> `prng.ts` -> `parser.ts` -> `model.ts` -> `market.ts` -> `snapshot.ts` -> `index.ts` -> `viz/*.tsx` (zero `viz/` imports in `index.ts`).
- **Overflow-safe 24-bit PRNG**: `mix` uses `BigInt` XOR across `[0, Number.MAX_SAFE_INTEGER]`; `stepSecret24` keeps intermediate shifts within 24 bits via `PRUNE_MASK` (`0xFFFFFF`).
- **Typed-array Part 2 scanner**: `findBestBananaSequence` uses three local non-frozen `Int32Array(130_321)` buffers (`totals`, `seenStamp`, `buyerCounts`) and skips unobserved keys (`buyerCounts[k] === 0`) so unvisited sequences never win a 0-banana tie.
- **Zero stored derived state**: All totals, prices, deltas, and best-candidate accessors on domain classes are computed via dynamic getters.
- **Bounded trace assembly**: `assembleTraceFrames` samples buyer indices via `sampleTraceIndices` before constructing `MarketPriceWindow`s, keeping large inputs responsive.
