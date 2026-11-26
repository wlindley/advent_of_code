import type { DividerBand, DividerTraceFrame } from '../domain';

export interface DividerBandChartProps {
  readonly frames: readonly DividerTraceFrame[];
  readonly activeFrame: DividerTraceFrame;
  readonly activeStep: number;
  readonly onSelectStep: (stepIndex: number) => void;
}

interface BarSegment {
  readonly key: string;
  readonly label: string;
  readonly count: number;
  readonly bg: string;
  readonly fg: string;
}

function bandMeta(band: DividerBand): { readonly short: string; readonly color: string } {
  if (band === 'before-first') return { short: '<2', color: 'var(--ok)' };
  if (band === 'between') return { short: '2..6', color: 'var(--accent)' };
  return { short: '>6', color: 'var(--gold)' };
}

function buildSegments(frame: DividerTraceFrame): readonly BarSegment[] {
  const pending = frame.totalPackets - frame.packetIndex;
  return [
    { key: 'b1', label: `< [[2]] (${frame.beforeFirstCount})`, count: frame.beforeFirstCount, bg: 'var(--ok)', fg: 'var(--surface)' },
    { key: 'd2', label: `[[2]] @ #${frame.firstDividerIndex}`, count: 1, bg: 'var(--text)', fg: 'var(--surface)' },
    { key: 'bw', label: `[[2]]..[[6]] (${frame.betweenCount})`, count: frame.betweenCount, bg: 'var(--accent)', fg: 'var(--surface)' },
    { key: 'd6', label: `[[6]] @ #${frame.secondDividerIndex}`, count: 1, bg: 'var(--text)', fg: 'var(--surface)' },
    { key: 'a2', label: `> [[6]] (${frame.afterSecondCount})`, count: frame.afterSecondCount, bg: 'var(--gold)', fg: 'var(--surface)' },
    { key: 'pd', label: `Pending (${pending})`, count: pending, bg: 'var(--bg)', fg: 'var(--muted)' },
  ].filter((seg) => seg.count > 0);
}

function PartitionBar({ frame }: { readonly frame: DividerTraceFrame }) {
  return (
    <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '0.5rem' }}>
      {buildSegments(frame).map((seg) => (
        <div
          key={seg.key}
          title={seg.label}
          style={{
            flex: `${seg.count} 1 0%`, background: seg.bg, color: seg.fg, fontSize: '0.74rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', whiteSpace: 'nowrap', padding: '0 0.2rem',
          }}
        >
          {seg.label}
        </div>
      ))}
    </div>
  );
}

function PacketTile({ frame, isCurrent, reached, onSelect }: {
  readonly frame: DividerTraceFrame;
  readonly isCurrent: boolean;
  readonly reached: boolean;
  readonly onSelect: () => void;
}) {
  const meta = bandMeta(frame.band);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isCurrent}
      aria-label={`Packet ${frame.packetIndex}`}
      style={{
        padding: '0.3rem 0.4rem', borderRadius: 6,
        border: isCurrent ? '2px solid var(--accent)' : `1px solid ${reached ? meta.color : 'var(--border)'}`,
        background: isCurrent ? 'var(--bg)' : 'var(--surface)', color: reached ? meta.color : 'var(--muted)',
        fontWeight: isCurrent ? 700 : 600, fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span style={{ color: 'var(--text)' }}>#{frame.packetIndex}</span>
      <span>{reached ? meta.short : '·'}</span>
    </button>
  );
}

/** Proportional 3-band divider partition bar with clickable sampled packet tiles. */
export function DividerBandChart({ frames, activeFrame, activeStep, onSelectStep }: DividerBandChartProps) {
  return (
    <section style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '0.75rem', background: 'var(--surface)', marginBottom: '0.85rem' }} aria-label="Divider partition bands">
      <PartitionBar frame={activeFrame} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(74px, 1fr))', gap: '0.35rem' }} role="group" aria-label="Sampled packets">
        {frames.map((frame, idx) => (
          <PacketTile key={frame.packetIndex} frame={frame} isCurrent={idx === activeStep} reached={idx <= activeStep} onSelect={() => onSelectStep(idx)} />
        ))}
      </div>
    </section>
  );
}
