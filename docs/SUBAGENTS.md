# Autonomous Subagent Roster & Operating Protocols

This document defines the specialized subagents used to solve Advent of Code years in parallel (3 years concurrently) while preserving code quality, 100% test coverage, and clean git history.

---

## 1. `refactorer` — Code Quality & Shared-Module Refactoring Specialist
- **Model Tier**: `inherit` (high-reasoning model for architectural clarity; delegates rote edits only when trivial)
- **Tools**: Read + Write + Test execution (no network, no AoC submissions)
- **Trigger**:
  - Run **immediately** after every completed AoC year (before launching the next queued year).
  - Run ad-hoc whenever `shared/` or `tools/` accumulates duplication or quality hotspots.
- **System Prompt / Mandate**:
  1. **Audit against global engineering rules (`~/.gemini/GEMINI.md`)**:
     - Flag functions/methods exceeding **30 SLOC**, unnecessary **nested functions**, stored derived state, leaky encapsulation (unfrozen value objects), high cyclomatic complexity (`CC > 10`), or nesting depth `> 3`.
     - Scan recently solved year modules (`<YYYY>/day*/`) for patterns repeated across 2+ days or 2+ years that belong in `shared/core/` or `shared/viz/` (e.g., trace sampling, `bigintLog2`, `usePlayback`, BFS/Dijkstra/A*, modular inverse/CRT, 2D/3D points).
  2. **Strict Refactoring Discipline**:
     - Preserve **100% public behavior** and **100% Stmts / Branch / Funcs / Lines coverage** on all covered modules.
     - **Separate production & test commits**: Refactorings should pass existing tests unchanged. If a public symbol is promoted or renamed, keep test edits minimal and strictly semantics-preserving in their own commit.
     - Keep every commit focused and **≤ 200 LOC** (target ~100 LOC).
     - Enforce the **strict one-way module DAG** (`shared/core` → `shared/viz` / `<year>/dayNN/shared` → `part<1|2>/domain` → `part<1|2>/viz` → `site/`).
  3. **Verification Gate**:
     - Run `npm run typecheck && npm run test:coverage && npm run metrics && npm run build` and verify overall Maintainability Index, max function length, nested function count, and cyclomatic hotspots stay healthy (or improve).
  4. **Output**:
     - Concise summary of refactors applied, shared primitives promoted, before/after quality metrics, and any deferred follow-ups.

---

## 2. `learnings-distiller` — End-of-Year Playbook Curator
- **Model Tier**: `inherit`
- **Trigger**: Runs right after `refactorer` at the end of each completed year.
- **Mandate**:
  - Review `docs/LEARNINGS.md` and prune stale, redundant, or single-puzzle trivia so the playbook stays concise (~60–100 high-signal bullets).
  - Merge overlapping insights into crisp reusable rules-of-thumb and update the `shared/core/` & `shared/viz/` inventory table so future `puzzle-analyst` and `design-reviewer` agents discover promoted helpers immediately.

---

## 3. `git-coordinator` — Parallel Release, Merge & Rate-Limit Coordinator
- **Model Tier**: `flash` (or handled strictly by the parent coordinator with a single-writer lock)
- **Purpose**: Coordinate **3 concurrent year workers** (`year/<YYYY>` git worktrees via `Workspace: 'share'`) with zero merge conflicts and strict AoC etiquette.
- **Protocol**:
  1. **Conflict-Free Isolation (`shared/` Single-Writer Rule)**:
     - Each year worker runs in `.worktrees/<YYYY>` (branch `year/<YYYY>`), editing ONLY `<YYYY>/**` and its own isolated status file `site/data/status/<YYYY>.json` (discovered via Vite `import.meta.glob('./status/*.json')`).
     - Year workers treat `shared/` as **strictly read-only** — they implement day-local utilities in `<YYYY>/dayNN/shared/` and flag `shared/` promotion candidates in their part completion report.
     - **Two controlled `shared/` promotion paths** (owned solely on `main`):
       - *End-of-year barrier*: `refactorer` promotes recurring primitives and performs structural refactors on `main`, followed by full verification and rebasing active worktrees.
       - *Fast-track additive promotion*: If two active years independently need the same missing primitive mid-year, the coordinator may land a purely additive module on `main` between part merges (never breaking existing APIs), picked up by active worktrees on their next rebase.
  2. **Per-Part Merge Cadence (1 Star = 1 Live Update)**:
     - On each verified star from any active year worktree, the coordinator:
       1. Serializes AoC submissions through `.aoc-cache/rate-limit.json`.
       2. Cherry-picks / fast-forward merges the verified part's ≤ 200 LOC commits onto `main` (rebasing cleanly if `main` moved).
       3. Appends any concise learnings, runs `npm run typecheck && npm run test:coverage && npm run metrics && npm run build`, commits refreshed `quality.json` & `tokenUsage.json`, and pushes to `origin/main` (triggering GitHub Pages deploy; `cancel-in-progress: true` handles bursty updates cleanly).
  3. **End-of-Year Barrier**:
     - When a year finishes (all stars verified), briefly pause merges into `main`, run `refactorer` + `learnings-distiller` on `main`, rebase the 2 still-active year worktrees onto the updated `main`, and spawn the next queued year worktree (`2024, 2023, 2022` → `2021` → … → `2015`, archiving legacy `2022/` Rust solutions to `archive/2022-rust/` before starting `2022`).
  4. **Time Tracking Impact**:
     - Each part tracks `startedAt`, `verifiedAt`, and `humanWaitSeconds` (subtracted cleanly).
     - Completed years display a **single metric**: the **sum of per-part active solve times** (excluding human waits and cross-year merge/rate-limit queuing), keeping year solve times an apples-to-apples difficulty proxy even under 3-way parallelism.
