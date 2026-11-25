# `site`

## Consumer Guide
Static single-page web app deployed to GitHub Pages (`https://wlindley.github.io/advent_of_code/`). Displays overall progress per year, live in-progress puzzle designs and active work, and interactive solution/visualization pages for every solved part.

### Hash Routes
- `#/` — Progress dashboard, year selector, active in-progress banner, and calendar grid.
- `#/in-progress` — Dedicated view of all currently in-progress or blocked puzzle parts.
- `#/<year>/dayNN/part<1|2>` — Puzzle part page (in-progress design proposals or solved walkthrough + interactive visualization + local custom-input runner).

## Maintainer Guide
- **Thin presentation layer**: All progress aggregation and schema validation live in `site/data/status.ts`; all puzzle solving and trace logic live in `<year>/dayNN/partP/domain/`.
- **Zero-boilerplate discovery**: `site/registry.ts` uses `import.meta.glob` to discover every `<year>/day*/part*/index.ts` manifest automatically at build time.
