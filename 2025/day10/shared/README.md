# Day 10 Shared — Factory Machine Model

Domain-neutral parser and immutable value model for Advent of Code 2025 Day 10 factory machines.

## Consumer Guide

- `FactoryMachine`: Frozen entity storing `targetLights`, `buttons`, and `joltageRequirements`, with dynamically computed getters `lightCount`, `buttonCount`, `targetMask`, and `buttonMasks`.
- `parseMachines(raw)`: Parses CRLF/LF machine lines `[lights] (b0,...) ... {j0,...}`, skipping blank lines and rejecting malformed or empty inputs.

## Maintainer Notes

- **Zero GF(2) Coupling**: `shared/` models machine geometry only so both Part 1 (GF(2) lights) and future Part 2 (integer joltage requirements) reuse it without solver coupling.
- **Single Source of Truth**: Bitmasks (`targetMask`, `buttonMasks`) are computed via getters from `targetLights` and `buttons` rather than stored separately.
- **Strict Boundary Validation**: Duplicate indices within a single button throw `Error`, while identical duplicate buttons across a machine are permitted.
