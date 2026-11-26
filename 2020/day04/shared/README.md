# 2020 Day 4 Shared Domain

## User / Consumer
Pure TypeScript domain library for parsing and validating passport batches:
- `parsePassportBatch(raw)` parses blank-line-delimited `key:value` blocks into a `PassportBatch` of `PassportRecord`s.
- `PRESENCE_POLICY` checks presence of the seven required fields (`cid` optional).
- `STRICT_FIELD_POLICY` applies `STRICT_FIELD_RULES` to every required field.
- `countValidPassports(batch, policy)` and `tracePassportScan(batch, policy, maxSteps)` summarize or trace scans.

## Developer / Maintainer
- Dependency DAG: `passport.ts` <- `fieldRules.ts` <- `policy.ts` <- `audit.ts` <- `index.ts`.
- `index.ts` is strictly pure TS (zero React or `viz/` imports).
- All value objects (`PassportRecord`, `PassportBatch`, rules, evaluations, `PassportTraceFrame`) are frozen and compute derived metrics dynamically without stored derived state.
