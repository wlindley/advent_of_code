# 2022 Day 20 Shared Domain & Visualizer

## Consumer Interface

- `parseEncryptedFile(raw)` -> `EncryptedFile` (validated signed `bigint[]` with unique `0n`)
- `SqrtCircularList` & `computeCircularSteps(delta, ringLength)` -> O(sqrt(N)) circular ring relocation
- `mixEncryptedFile(file, config)` / `solveGroveCoordinates(file, config)` -> mixed ID order and `GroveCoordinates` (`+1000`, `+2000`, `+3000` past `0n`)
- `buildMixingTrace(file, config, options?)` -> bounded `MixingTraceFrame[]` (`<= 160` frames, `<= 64` visible ring slots)
- `viz/GroveMixerVisualizer.tsx` & `viz/GroveRingSvg.tsx` -> shared circular ring playback UI for Parts 1 & 2

## Maintainer Notes

- `index.ts` is pure TypeScript and never imports `viz/`.
- `SqrtCircularList` tracks element positions via block lists and an un-frozen `Int32Array` `blockOf` map so Part 2 (`N = 5000, rounds = 10`) executes 50,000 moves in milliseconds.
- Circular steps use Euclidean `BigInt` modulo `(N - 1)` with `rawTarget === 0` mapped to `N - 1`.
- Large rings preserve `zeroIndex`, `+1k/+2k/+3k` landmarks, and `lastMove.toIndex` before uniform slot sampling.
