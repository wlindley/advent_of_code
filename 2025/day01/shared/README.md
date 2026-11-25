# `2025/day01/shared`

## Consumer Guide
Shared pure-TypeScript domain primitives for Advent of Code 2025 Day 1 ("Secret Entrance").

### Public API (`2025/day01/shared/index.ts`)
- `DIAL_SIZE` (`100`) & `INITIAL_DIAL_POSITION` (`50`): canonical circular dial constants.
- `Direction`: `'L' | 'R'`.
- `Rotation`: frozen value object representing a single rotation instruction (`direction`, `distance`, `label`, `applyTo(position)`, `countZeroHitsFrom(position)`, `Rotation.parse(token)`).
- `parseRotations(raw)`: parses multi-line puzzle inputs (`LF` or `CRLF`) with outer trimming and 1-based line-numbered error wrapping.

## Maintainer Guide
- **Pure domain**: depends only on `shared/core` (`euclideanMod`); zero DOM/React/Node dependencies.
- **Invariants**: `Rotation` instances are frozen on construction with positive safe-integer distances; `assertValidPosition` validates `[0, DIAL_SIZE)` positions for both `applyTo` (which reduces `distance % DIAL_SIZE` prior to modular arithmetic) and `countZeroHitsFrom` (O(1) arithmetic counting `1 + floor((distance - firstHit) / DIAL_SIZE)`).
