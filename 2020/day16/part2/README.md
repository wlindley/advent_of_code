# 2020 Day 16 Part 2: Ticket Translation

## User / Consumer Guide
Computes the **departure field product** on your ticket by discarding invalid nearby tickets, deducing the unique rule-to-column mapping, and multiplying all `departure*` fields on `your ticket`.

- **Solver**: `export const solver` in `domain/solver.ts` (`TicketTranslationSolver(DEPARTURE_PRODUCT_POLICY)`).
- **Manifest**: `export const manifest` in `index.ts` (departure-prefixed Part 2 example -> `'132'`).
- **Visualizer**: `TicketPart2Visualizer` renders an interactive rule-by-column compatibility matrix animating each degree-1 peeling round alongside `your ticket` values.

## Developer / Maintainer Notes
- Delegates parsing, ticket validation (`scanNearbyTickets`), bitmask construction (`buildCompatibilityMasks`), and peeling (`resolveFieldMapping`) to `../../shared`.
- Discards invalid tickets using `scan.isValid` (zero-tolerant) before column compatibility checks and includes `yourTicket` in valid ticket checks.
- Uses `BigInt` compatibility masks (`1n << BigInt(col)`) and `BigInt` product accumulation for arbitrary field counts and large ticket values.
