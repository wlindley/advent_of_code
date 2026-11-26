import type { PreambleScanFrame, SignalViewport, WeaknessScanFrame, XmasTraceFrame } from '../index';

export interface XmasSignalChartProps {
  readonly viewport: SignalViewport;
  readonly frame: XmasTraceFrame;
}

const CHART_W = 720;
const CHART_H = 212;
const PAD_X = 16;
const TOP_ARC = 44;
const BAR_H = 126;
const BASE_Y = TOP_ARC + BAR_H;

function slotCenterX(slot: number, slotW: number): number {
  return PAD_X + slot * slotW + slotW / 2;
}

function barTopY(viewport: SignalViewport, slot: number): number {
  const h = Math.max(6, viewport.bars[slot]!.normalizedHeight * BAR_H);
  return BASE_Y - h;
}

function resolveBarFill(index: number, frame: XmasTraceFrame): string {
  if (frame.phase === 'preamble') {
    const { check } = frame;
    if (index === check.targetIndex) return check.isValid ? 'var(--accent)' : 'var(--err)';
    if (check.pairMatch && (index === check.pairMatch.leftIndex || index === check.pairMatch.rightIndex)) {
      return 'var(--ok)';
    }
    if (index >= check.windowStart && index < check.targetIndex) return 'color-mix(in srgb, var(--accent) 42%, var(--surface))';
    return 'var(--border)';
  }
  const { weakness, probe, invalidIndex } = frame;
  if (weakness) {
    if (index === weakness.minIndex) return 'var(--gold)';
    if (index === weakness.maxIndex) return 'var(--ok)';
    if (index >= weakness.startIndex && index <= weakness.endIndex) return 'color-mix(in srgb, var(--ok) 45%, var(--surface))';
  } else if (index >= probe.windowStart && index < probe.windowEnd) {
    return 'var(--accent)';
  }
  return index === invalidIndex ? 'var(--err)' : 'var(--border)';
}

function PreambleOverlay({ viewport, frame, slotW }: { readonly viewport: SignalViewport; readonly frame: PreambleScanFrame; readonly slotW: number }) {
  const { check } = frame;
  const sT = viewport.slotOf(check.targetIndex);
  if (sT === null) return null;
  const tx = slotCenterX(sT, slotW);
  const ty = barTopY(viewport, sT);
  if (check.pairMatch) {
    const sL = viewport.slotOf(check.pairMatch.leftIndex);
    const sR = viewport.slotOf(check.pairMatch.rightIndex);
    if (sL === null || sR === null) return null;
    const lx = slotCenterX(sL, slotW);
    const rx = slotCenterX(sR, slotW);
    return (
      <g fill="none" stroke="var(--ok)" strokeWidth={2}>
        <path d={`M ${lx} ${barTopY(viewport, sL)} Q ${(lx + tx) / 2} 8 ${tx} ${ty}`} />
        <path d={`M ${rx} ${barTopY(viewport, sR)} Q ${(rx + tx) / 2} 20 ${tx} ${ty}`} />
        <circle cx={lx} cy={barTopY(viewport, sL)} r={3.5} fill="var(--ok)" />
        <circle cx={rx} cy={barTopY(viewport, sR)} r={3.5} fill="var(--ok)" />
      </g>
    );
  }
  const sW = viewport.slotOf(check.windowStart) ?? 0;
  const wx = slotCenterX(sW, slotW);
  return (
    <g fill="none" stroke="var(--err)" strokeWidth={2}>
      <path strokeDasharray="4 3" d={`M ${wx} ${TOP_ARC} Q ${(wx + tx) / 2} 10 ${tx} ${ty}`} />
      <circle cx={tx} cy={ty - 6} r={5} fill="var(--surface)" />
    </g>
  );
}

function WeaknessOverlay({ viewport, frame, slotW }: { readonly viewport: SignalViewport; readonly frame: WeaknessScanFrame; readonly slotW: number }) {
  const { weakness } = frame;
  if (!weakness) return null;
  const sStart = Math.max(0, weakness.startIndex - viewport.startIndex);
  const sEnd = Math.min(viewport.barCount - 1, weakness.endIndex - viewport.startIndex);
  if (sStart > sEnd) return null;
  const x1 = PAD_X + sStart * slotW + 2;
  const x2 = PAD_X + (sEnd + 1) * slotW - 2;
  const sMin = viewport.slotOf(weakness.minIndex);
  const sMax = viewport.slotOf(weakness.maxIndex);
  return (
    <g>
      <path d={`M ${x1} ${BASE_Y + 4} L ${x1} ${BASE_Y + 11} L ${x2} ${BASE_Y + 11} L ${x2} ${BASE_Y + 4}`} fill="none" stroke="var(--ok)" strokeWidth={2.5} />
      {sMin !== null && <text x={slotCenterX(sMin, slotW)} y={24} textAnchor="middle" fill="var(--gold)" fontSize={11} fontWeight={700}>MIN</text>}
      {sMax !== null && <text x={slotCenterX(sMax, slotW)} y={24} textAnchor="middle" fill="var(--ok)" fontSize={11} fontWeight={700}>MAX</text>}
    </g>
  );
}

/** Log-scaled SVG signal bar chart with sliding window band, pair arcs, and weakness bracket. */
export function XmasSignalChart({ viewport, frame }: XmasSignalChartProps) {
  const slotW = (CHART_W - 2 * PAD_X) / Math.max(1, viewport.barCount);
  const barW = Math.max(3, slotW * 0.72);
  const [bStart, bEnd] = frame.phase === 'preamble'
    ? [frame.check.windowStart, frame.check.targetIndex]
    : frame.weakness
      ? [frame.weakness.startIndex, frame.weakness.endIndex + 1]
      : [frame.probe.windowStart, frame.probe.windowEnd];
  const visStart = Math.max(bStart, viewport.startIndex);
  const visEnd = Math.min(bEnd, viewport.endIndex);

  return (
    <div className="stack" style={{ gap: '0.45rem' }}>
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="chart-svg" role="img" aria-label="XMAS signal window visualization">
        {visStart < visEnd && (
          <rect
            x={PAD_X + (visStart - viewport.startIndex) * slotW}
            y={TOP_ARC - 4}
            width={(visEnd - visStart) * slotW}
            height={BAR_H + 8}
            rx={4}
            fill={frame.phase === 'weakness' && frame.isFound ? 'color-mix(in srgb, var(--ok) 12%, transparent)' : 'color-mix(in srgb, var(--accent) 10%, transparent)'}
            stroke={frame.phase === 'weakness' && frame.isFound ? 'var(--ok)' : 'var(--accent)'}
            strokeOpacity={0.35}
          />
        )}
        {viewport.bars.map((bar, slot) => {
          const x = PAD_X + slot * slotW + (slotW - barW) / 2;
          const h = Math.max(6, bar.normalizedHeight * BAR_H);
          return (
            <rect key={bar.index} x={x} y={BASE_Y - h} width={barW} height={h} rx={2} fill={resolveBarFill(bar.index, frame)}>
              <title>{`#${bar.index}: ${bar.value.toString()}`}</title>
            </rect>
          );
        })}
        {frame.phase === 'preamble'
          ? <PreambleOverlay viewport={viewport} frame={frame} slotW={slotW} />
          : <WeaknessOverlay viewport={viewport} frame={frame} slotW={slotW} />}
        <text x={PAD_X} y={CHART_H - 10} className="chart-axis-text">{`#${viewport.startIndex}`}</text>
        <text x={CHART_W - PAD_X} y={CHART_H - 10} textAnchor="end" className="chart-axis-text">{`#${viewport.endIndex - 1} (log2 max ${viewport.maxLog2})`}</text>
      </svg>
    </div>
  );
}
