import { projectSpectrum, type ErrorScanTraceFrame, type SpectrumMarker } from '../index';

const SVG_W = 760;
const SVG_H = 156;
const PAD_X = 36;
const SPAN_W = SVG_W - PAD_X * 2;
const BAND_Y = 58;
const BAND_H = 26;

function xPos(frac: number): number {
  return PAD_X + frac * SPAN_W;
}

function MarkerPin({ marker, index }: { readonly marker: SpectrumMarker; readonly index: number }) {
  const x = xPos(marker.frac);
  const color = marker.isInvalid ? 'var(--gold)' : 'var(--ok)';
  const labelY = marker.isInvalid ? 26 + (index % 2) * 14 : 118 + (index % 2) * 14;
  return (
    <g>
      <line x1={x} y1={BAND_Y - 12} x2={x} y2={BAND_Y + BAND_H + 12} stroke={color} strokeWidth={marker.isInvalid ? 2.2 : 1.5} />
      <circle cx={x} cy={BAND_Y + BAND_H / 2} r={marker.isInvalid ? 5.5 : 4} fill={color} stroke="var(--surface)" strokeWidth={1.2} />
      <text x={x} y={labelY} textAnchor="middle" fontSize={10.5} fontWeight={marker.isInvalid ? 700 : 500} fill={color}>
        {marker.valueLabel}
      </text>
    </g>
  );
}

/** 1D interval-union spectrum SVG highlighting valid rule bands and invalid ticket outliers. */
export function SpectrumScannerSvg({ frame }: { readonly frame: ErrorScanTraceFrame }) {
  const spectrum = projectSpectrum(frame);
  const invalidMarkers = spectrum.markers.filter((m) => m.isInvalid);
  return (
    <div className="chart-card">
      <div className="quality-header">
        <strong>{`Ticket #${frame.scannedCount} Interval Spectrum`}</strong>
        <span className="chart-sub muted">
          {invalidMarkers.length === 0 ? 'All fields valid' : `Invalid: ${invalidMarkers.map((m) => m.valueLabel).join(', ')}`}
        </span>
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${SVG_W} ${SVG_H}`} role="img" aria-label="Ticket values mapped onto valid interval union">
        <line x1={PAD_X} y1={BAND_Y + BAND_H / 2} x2={PAD_X + SPAN_W} y2={BAND_Y + BAND_H / 2} stroke="var(--border)" strokeWidth={2} />
        {spectrum.bands.map((band, idx) => {
          const x = xPos(band.startFrac);
          const w = Math.max(3, xPos(band.endFrac) - x);
          return (
            <rect key={idx} x={x} y={BAND_Y} width={w} height={BAND_H} rx={4} fill="color-mix(in srgb, var(--accent) 22%, var(--surface))" stroke="var(--accent)" strokeWidth={1.5} />
          );
        })}
        {spectrum.markers.map((m, idx) => <MarkerPin key={m.fieldIndex} marker={m} index={idx} />)}
        <text x={PAD_X} y={SVG_H - 8} className="chart-axis-text">{spectrum.minLabel}</text>
        <text x={PAD_X + SPAN_W} y={SVG_H - 8} textAnchor="end" className="chart-axis-text">{spectrum.maxLabel}</text>
      </svg>
      <div className="chart-legend">
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderColor: 'var(--accent)' }} />Valid Bands</span>
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderColor: 'var(--ok)' }} />Valid Value</span>
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderColor: 'var(--gold)' }} />Invalid Value</span>
      </div>
    </div>
  );
}
