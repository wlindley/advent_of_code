# `2025/day02/shared`

## Consumer Guide
Shared pure-TypeScript domain primitives for Advent of Code 2025 Day 2 ("Gift Shop").

### Public API (`2025/day02/shared/index.ts`)
- `repeatMultiplier(patternLength, repeats)`: computes exact `BigInt` multiplier `(10^(k*r) - 1) / (10^k - 1)`.
- `RepeatedPatternBand`: frozen arithmetic band (`patternLength`, `repeats`, `minPattern`, `maxPattern`) with derived `digitLength`, `multiplier`, `count`, `sum`, and `samplePatterns(maxSamples)`.
- `IdRange`: frozen closed interval `[start, end]` with `label`, `minDigits`, `maxDigits`, `repeatedPatternBand(k, r)`, and `IdRange.parse(token)`.
- `parseIdRanges(raw)`: parses comma-separated ranges with outer trimming and 1-based `Range N:` error context.

## Maintainer Guide
- **Pure domain**: zero DOM/React/Node dependencies; uses `bigint` throughout so arbitrarily wide digit bands never lose precision.
- **Invariants**: both `RepeatedPatternBand` and `IdRange` validate positive bounds on construction and `Object.freeze(this)`. Derived band metrics (`digitLength`, `multiplier`, `count`, `sum`) are computed dynamically rather than stored.
