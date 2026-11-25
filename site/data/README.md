# `site/data`

## Consumer Guide
Single source of truth for Advent of Code solving progress rendered by the GitHub Pages dashboard (`site/data/status.json`) and its typed schema/selectors (`site/data/status.ts`).

### Public API
- `validateStatusDocument(doc)`: validates invariants (unique year/day/part keys, valid day bounds, consistent `selectedProposalId`, non-negative timings).
- `computeYearProgress(yearStatus)`: derives solved, in-progress, blocked, pending counts, and completion percentage dynamically.
- `findActiveParts(doc)` / `findPartRecord(doc, year, day, part)`: pure query helpers for the dashboard and routes.
- `VersionMonitor` (`versionMonitor.ts`): compares the running build ID against deployed `version.json` and triggers a safe reload whenever a new deployment lands.

## Maintainer Guide
- **No stored derived counts**: `status.json` stores only authoritative per-part records and `totalDays`; all counts and percentages are computed dynamically.
- **Make invalid states impossible**: `PartRecord` is a discriminated union (`pending | in_progress | solved | blocked`) so phase-specific fields only exist in valid states.
