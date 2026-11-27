# 2020 Day 16 Part 1: Ticket Translation

## User / Consumer Guide
Computes the **ticket scanning error rate** by validating every cell of every nearby ticket against the union of all field interval rules and summing invalid field values.

- **Solver**: `export const solver` in `domain/solver.ts` (`TicketTranslationSolver(ERROR_RATE_POLICY)`).
- **Manifest**: `export const manifest` in `index.ts` (`exampleInput` -> `'71'`).
- **Visualizer**: `TicketPart1Visualizer` renders an interactive 1D interval-union spectrum showing valid bands and invalid outlier markers per scanned nearby ticket.

## Developer / Maintainer Notes
- Delegates all parsing, interval coalescing (`IntervalUnion`), and scanning (`scanNearbyTickets`) to `../../shared`.
- Ignores `your ticket` during error-rate summation as specified by Part 1.
- Uses `BigInt` throughout so arbitrarily large field values and sums never lose precision.
