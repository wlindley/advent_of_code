# `tools/aoc`

## Consumer Guide
Local Node/TypeScript helper for interacting politely with `adventofcode.com` using a gitignored `.aoc-session` cookie and local `.aoc-cache/` storage.

### CLI Commands (`npm run aoc -- <command>`)
- `discover <year>` — Fetch/parse the year's calendar days and current star counts.
- `fetch <year> <day> [--refresh]` — Fetch and cache the puzzle HTML and personal input under `.aoc-cache/`.
- `run <year> <day> <part> [--input <path>]` — Dynamically load `<year>/dayNN/part<P>/domain/solver.ts`, execute it against the cached personal input (or custom file), and print `{ answer, elapsedMs, runtime }`.
- `submit <year> <day> <part> <answer>` — Submit an answer while honoring AoC rate-limit cooldowns persisted in `.aoc-cache/rate-limit.json`.

## Maintainer Guide
- **Testable external boundaries**: `AocClient` injects `HttpTransport`, `FileStore`, and `AsyncClock` so all caching, error handling, and cooldown logic is tested deterministically with hand-written in-memory fakes (zero mocks, zero network calls in tests).
- **AoC etiquette**: Puzzle HTML and personal inputs are cached on disk and never re-fetched unless `--refresh` is explicitly requested (e.g., to unlock Part 2 after Part 1 succeeds). Requests send an identifying `User-Agent` header.
