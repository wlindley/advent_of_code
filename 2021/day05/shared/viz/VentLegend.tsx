import type { VentField, VentOverlapSummary, VentSelectionPolicy, VentTraceFrame } from '../index';

export interface VentLegendProps {
  readonly policy: VentSelectionPolicy;
  readonly field: VentField;
  readonly summary: VentOverlapSummary;
  readonly frame: VentTraceFrame;
  readonly frameCount: number;
  readonly answer: number;
}

function Swatch({ color, dashed, label }: { readonly color: string; readonly dashed?: boolean; readonly label: string }) {
  return (
    <span className="chart-legend-item">
      <span
        className={dashed ? 'legend-swatch dashed' : 'legend-swatch'}
        style={{ borderTopColor: color }}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}

function DotSwatch({ color, label }: { readonly color: string; readonly label: string }) {
  return (
    <span className="chart-legend-item">
      <span
        aria-hidden="true"
        style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '50%', background: color }}
      />
      <span>{label}</span>
    </span>
  );
}

function formatBounds(summary: VentOverlapSummary): string {
  const b = summary.bounds;
  return b === null ? 'none' : `[${b.minX}..${b.maxX}] × [${b.minY}..${b.maxY}]`;
}

/** Light-mode telemetry badges and color legend for hydrothermal vent visualization. */
export function VentLegend({ policy, field, summary, frame, frameCount, answer }: VentLegendProps) {
  return (
    <div className="stack" style={{ gap: '0.45rem' }}>
      <div className="meta-row" style={{ margin: 0 }}>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          Policy: <strong>{policy.label}</strong>
        </span>
        <span className="badge">Mode: <code>{summary.mode}</code></span>
        <span className="badge">Bounds: <code>{formatBounds(summary)}</code></span>
        <span className="badge">
          Progress: <code>{frame.processedSegmentCount}/{field.segmentCount}</code>
        </span>
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
          Overlaps (≥2): <strong>{frame.overlapCount}</strong>
        </span>
        <span className="badge" style={{ borderColor: 'var(--err)', color: 'var(--err)' }}>
          Intense (≥3): <strong>{frame.intenseCount}</strong>
        </span>
        <span className="badge">Max Depth: <code>{frame.maxDepth}</code></span>
        <span className="badge status-solved">Final Answer: <strong>{answer}</strong></span>
      </div>
      <div className="chart-legend">
        <Swatch color="var(--accent)" label="Included line" />
        <Swatch color="var(--text)" label="Latest included" />
        <Swatch color="var(--muted)" dashed label="Skipped line" />
        <DotSwatch color="var(--gold)" label="Overlap (depth ≥ 2)" />
        <DotSwatch color="var(--err)" label="Intense (depth ≥ 3)" />
        {frameCount < field.segmentCount && (
          <span className="muted">Sampled {frameCount} of {field.segmentCount} segments</span>
        )}
        {frame.hotspotsTruncated && (
          <span className="muted">Hotspot markers capped; counts remain exact</span>
        )}
      </div>
    </div>
  );
}
