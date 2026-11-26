import { useMemo } from 'react';
import { type GardenMap, parseGardenMap } from '../../shared';
import { GardenVisualizer } from '../../shared/viz/GardenVisualizer';
import { type InfiniteSolveReport, solveInfiniteGarden } from '../domain';

export interface GardenPart2VisualizerProps {
  readonly rawInput: string;
  readonly steps: bigint;
}

type Part2Summary =
  | { readonly ok: true; readonly map: GardenMap; readonly report: InfiniteSolveReport }
  | { readonly ok: false; readonly map: GardenMap | null; readonly message: string };

type QuadraticReport = Extract<InfiniteSolveReport, { mode: 'quadratic' }>;

function buildPart2Summary(rawInput: string, steps: bigint): Part2Summary {
  let map: GardenMap;
  try {
    map = parseGardenMap(rawInput);
  } catch (error) {
    return { ok: false, map: null, message: error instanceof Error ? error.message : String(error) };
  }
  try {
    return { ok: true, map, report: solveInfiniteGarden(map, steps) };
  } catch (error) {
    return { ok: false, map, message: error instanceof Error ? error.message : String(error) };
  }
}

function QuadraticStrip({ report }: { readonly report: QuadraticReport }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
      {report.samples.map((s) => (
        <span
          key={s.k.toString()}
          className="badge"
          style={s.k === 3n ? { borderColor: 'var(--ok)', color: 'var(--ok)' } : undefined}
        >
          k={s.k.toString()} ({s.steps.toString()}): <strong>{s.plots.toString()}</strong>
          {s.k === 3n ? ' ✓' : ''}
        </span>
      ))}
    </div>
  );
}

function Part2SummaryPanel({ report }: { readonly report: InfiniteSolveReport }) {
  const modeLabel = report.mode === 'quadratic' ? 'Quadratic Extrapolation' : 'Direct Infinite BFS';
  const cardStyle = {
    display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.65rem 0.75rem',
    border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)',
  } as const;
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          <strong>{modeLabel}</strong>
        </span>
        <span className="badge">Steps: <strong>{report.steps.toString()}</strong></span>
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
          Reachable: <strong>{report.answer.toString()}</strong>
        </span>
        {report.mode === 'quadratic' ? (
          <>
            <span className="badge">
              k×N+r: <strong>{report.quotient.toString()}×{report.period.toString()}+{report.remainder.toString()}</strong>
            </span>
            <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
              Δ₁=<strong>{report.progression.firstDifference.toString()}</strong> · Δ₂=<strong>{report.progression.secondDifference.toString()}</strong>
            </span>
          </>
        ) : null}
      </div>
      {report.mode === 'quadratic' ? <QuadraticStrip report={report} /> : null}
    </div>
  );
}

/** Interactive Part 2 summary and single-tile wavefront visualizer for AoC 2023 Day 21. */
export function GardenPart2Visualizer({ rawInput, steps }: GardenPart2VisualizerProps) {
  const summary = useMemo(() => buildPart2Summary(rawInput, steps), [rawInput, steps]);
  const tileSteps = summary.map ? Math.max(summary.map.width, summary.map.height) : 0;

  return (
    <div className="stack">
      {summary.ok ? (
        <Part2SummaryPanel report={summary.report} />
      ) : (
        <p className="error-text" role="alert">Part 2 unavailable: {summary.message}</p>
      )}
      {summary.map ? (
        <GardenVisualizer
          rawInput={rawInput}
          steps={tileSteps}
          partLabel={`Part 2 Tile Wavefront (${tileSteps} Steps)`}
        />
      ) : null}
    </div>
  );
}
