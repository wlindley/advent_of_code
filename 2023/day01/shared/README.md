# `2023/day01/shared`

## Consumer Guide
Shared pure-TypeScript calibration primitives for Advent of Code 2023 Day 1 ("Trebuchet?!").

### Public API (`2023/day01/shared/index.ts`)
- `DigitMatch`: frozen value object representing a matched digit (`value`, `start`, `length`, `end`).
- `LineCalibration`: frozen per-line calibration (`lineNumber`, `text`, `first`, `last`, derived `value` and `isSingleDigit`).
- `DigitExtractor`: strategy interface (`matchAt(line, index)`) implemented differently by Part 1 and Part 2.
- `calibrateLine(line, lineNumber, extractor)`: locates first and last digits in a line or throws with the 1-based line number.
- `CalibrationDocument`: frozen multi-line document with `CalibrationDocument.parse(raw)`, `lineCount`, `calibrate(extractor)`, and bounded `trace(extractor, options)`.
- `DEFAULT_MAX_TRACE_STEPS` (`200`) & `CalibrationTraceFrame`.

## Maintainer Guide
- **Pure domain**: depends only on `shared/core` (`validateMaxSteps`, `sampleTraceIndices`); zero DOM/React/Node dependencies.
- **Invariants**: `DigitMatch`, `LineCalibration`, `CalibrationDocument`, `lines`, and trace frames are frozen on construction. `findLastDigit` scans backward down to `first.start + 1` and falls back to `first` when only a single digit position exists. `trace()` evaluates every line so `runningSum` and validation errors match `calibrate()` exactly while bounding emitted frames via uniform endpoint-preserving sampling.
