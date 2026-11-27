import type { FftTraceFrame, SpectrumDigitBar, SpectrumLayout } from '../index';

interface SignalSpectrumSvgProps {
  readonly frame: FftTraceFrame;
  readonly layout: SpectrumLayout;
}

function DigitPreviewBars({ bars }: { readonly bars: readonly SpectrumDigitBar[] }) {
  return (
    <>
      {bars.map((bar) => (
        <rect
          key={bar.index}
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={bar.height}
          rx={1.5}
          fill={bar.isMessage ? 'var(--gold)' : 'var(--accent)'}
          fillOpacity={bar.isMessage ? 0.92 : 0.72}
        >
          <title>Index {bar.index}: {bar.digit}</title>
        </rect>
      ))}
    </>
  );
}

function DigitFrequencyHistogram({ layout }: { readonly layout: SpectrumLayout }) {
  return (
    <>
      {layout.histogramBars.map((bar) => (
        <g key={bar.digit}>
          {bar.height > 0 ? (
            <rect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              rx={3}
              fill="var(--ok)"
              fillOpacity={0.8}
            />
          ) : null}
          <text x={bar.x + bar.width / 2} y={231} textAnchor="middle" className="chart-axis-text">
            {bar.digit}
          </text>
          {bar.count > 0 ? (
            <text x={bar.x + bar.width / 2} y={bar.y - 4} textAnchor="middle" className="chart-axis-text">
              {bar.count}
            </text>
          ) : null}
        </g>
      ))}
    </>
  );
}

const PANEL_STYLE = {
  padding: '0.75rem',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
} as const;

const HEADER_STYLE = {
  display: 'flex',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '0.5rem',
  marginBottom: '0.45rem',
  fontSize: '0.82rem',
  color: 'var(--text)',
} as const;

/** Renders the leading signal digit spectrum and global 0–9 digit histogram. */
export function SignalSpectrumSvg({ frame, layout }: SignalSpectrumSvgProps) {
  const windowEnd = frame.windowOffset + frame.messageLength - 1;
  return (
    <div style={PANEL_STYLE}>
      <div style={HEADER_STYLE}>
        <strong>Signal Spectrum &amp; Digit Distribution</strong>
        <span className="muted">
          Preview {frame.previewDigits.length} of {frame.signalLength} · Message [{frame.windowOffset}..{windowEnd}]
        </span>
      </div>
      <svg viewBox={layout.viewBox} role="img" aria-label="FFT signal digit preview and frequency histogram" className="chart-svg">
        <text x={16} y={13} className="chart-axis-text">Leading Signal Digits (Message Window Highlighted)</text>
        <rect x={layout.messageRangeX} y={18} width={layout.messageRangeWidth} height={90} rx={4} fill="var(--gold)" fillOpacity={0.14} stroke="var(--gold)" strokeWidth={1.2} strokeDasharray="3 2" />
        <DigitPreviewBars bars={layout.digitBars} />
        <line x1={16} y1={122} x2={624} y2={122} className="chart-grid" />
        <text x={16} y={136} className="chart-axis-text">Digit Frequency Histogram (max {layout.maxHistogramCount})</text>
        <DigitFrequencyHistogram layout={layout} />
      </svg>
    </div>
  );
}
