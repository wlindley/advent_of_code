# `shared/viz`

## Consumer Guide
Reusable React UI controls and manifest contract shared across per-puzzle visualizations (`<year>/dayNN/partP/viz/`) and `site/`.

### Public API (`shared/viz/index.ts`)
- `PuzzlePartManifest`: registration contract exported by each `<year>/dayNN/partP/index.ts` so `site/` discovers it automatically.
- `PlaybackControls`: accessible Play/Pause, Step, Reset, timeline scrubber, and speed slider for animated visualizations.
- `usePlayback`: step-playback timer hook with auto-rewind when pressing Play at the final frame and auto-pause on manual scrubbing/stepping.
- `InputRunner`: interactive example/custom-input runner executing a `PuzzleSolver` locally in the browser with timing output.

## Maintainer Guide
- **Strict DAG rule**: `shared/viz` may depend only on `shared/core` and React. Never import from `site/`, `tools/`, or any `<year>/` puzzle folder.
