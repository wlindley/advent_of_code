import type { DirectoryMetrics } from '../model';

export type AuditBarStatus = 'qualifying' | 'excluded' | 'pending' | 'best';

export interface DirectoryAuditBar {
  readonly metrics: DirectoryMetrics;
  readonly status: AuditBarStatus;
}

export interface DirectoryAuditSvgProps {
  readonly bars: readonly DirectoryAuditBar[];
  readonly currentIndex: number;
  readonly threshold: number;
  readonly thresholdLabel: string;
  readonly maxSize: number;
  readonly accentColor: string;
}

const SVG_W = 780;
const SVG_H = 340;
const WINDOW_ROWS = 12;
const TOP_Y = 38;
const ROW_H = 23;
const PATH_X = 28;
const BAR_X = 228;
const BAR_W = 370;
const SIZE_X = 610;
const BADGE_X = 706;

const STATUS_META: Record<AuditBarStatus, { readonly label: string; readonly color: string; readonly bg: string }> = {
  qualifying: { label: 'KEEP', color: 'var(--ok)', bg: '#dafbe1' },
  excluded: { label: 'SKIP', color: 'var(--muted)', bg: 'var(--bg)' },
  pending: { label: 'WAIT', color: 'var(--muted)', bg: 'var(--surface)' },
  best: { label: 'BEST', color: 'var(--gold)', bg: '#fff8c5' },
};

function logRatio(bytes: number, scaleMax: number): number {
  if (bytes <= 0 || scaleMax <= 0) return 0;
  return Math.min(1, Math.log10(bytes + 1) / Math.log10(scaleMax + 1));
}

function truncatePath(path: string, maxChars = 24): string {
  if (path.length <= maxChars) return path;
  return `…${path.slice(-(maxChars - 1))}`;
}

function formatSize(bytes: number): string {
  return `${bytes.toLocaleString('en-US')} B`;
}

function computeWindowStart(total: number, currentIndex: number): number {
  const maxStart = Math.max(0, total - WINDOW_ROWS);
  return Math.max(0, Math.min(maxStart, currentIndex - Math.floor(WINDOW_ROWS / 2)));
}

function AuditHeader({ thresholdX, thresholdLabel, accentColor }: { readonly thresholdX: number; readonly thresholdLabel: string; readonly accentColor: string }) {
  return (
    <g>
      <rect x={14} y={8} width={10} height={10} rx={2} fill={accentColor} />
      <text x={28} y={17} fontSize={11} fontWeight={600} fill="var(--text)">Direct files</text>
      <rect x={106} y={8} width={10} height={10} rx={2} fill={accentColor} fillOpacity={0.35} stroke={accentColor} strokeWidth={1} />
      <text x={120} y={17} fontSize={11} fontWeight={600} fill="var(--text)">Child dirs (log10 scale)</text>
      <line x1={thresholdX} y1={28} x2={thresholdX} y2={TOP_Y + WINDOW_ROWS * ROW_H} stroke={accentColor} strokeWidth={1.5} strokeDasharray="4 3" />
      <text x={Math.min(SVG_W - 120, Math.max(BAR_X, thresholdX + 4))} y={20} fontSize={11} fontWeight={700} fill={accentColor}>{thresholdLabel}</text>
    </g>
  );
}

function AuditRow({ bar, rowIndex, isCurrent, scaleMax, accentColor }: { readonly bar: DirectoryAuditBar; readonly rowIndex: number; readonly isCurrent: boolean; readonly scaleMax: number; readonly accentColor: string }) {
  const y = TOP_Y + rowIndex * ROW_H;
  const { metrics, status } = bar;
  const meta = STATUS_META[status];
  const totalW = BAR_W * logRatio(metrics.totalSize, scaleMax);
  const directW = metrics.totalSize > 0 ? totalW * (metrics.directFileSize / metrics.totalSize) : 0;
  const childW = Math.max(0, totalW - directW);
  const barColor = status === 'qualifying' ? 'var(--ok)' : status === 'best' ? 'var(--gold)' : status === 'excluded' ? 'var(--muted)' : accentColor;

  return (
    <g>
      {isCurrent && <rect x={8} y={y} width={SVG_W - 16} height={ROW_H - 2} rx={4} fill="var(--bg)" stroke={accentColor} strokeWidth={1.5} />}
      <circle cx={17} cy={y + 10} r={2.5} fill={isCurrent ? accentColor : 'var(--border)'} />
      <text x={PATH_X} y={y + 14} fontSize={10.5} fontWeight={isCurrent ? 700 : 500} fill="var(--text)" fontFamily="ui-monospace, monospace">
        {`d${metrics.depth} ${truncatePath(metrics.path, 21)}`}
      </text>
      <rect x={BAR_X} y={y + 4} width={BAR_W} height={13} rx={3} fill="var(--bg)" stroke="var(--border)" strokeWidth={0.75} />
      {directW > 0 && <rect x={BAR_X} y={y + 4} width={directW} height={13} rx={2} fill={barColor} />}
      {childW > 0 && <rect x={BAR_X + directW} y={y + 4} width={childW} height={13} rx={2} fill={barColor} fillOpacity={0.32} />}
      <text x={SIZE_X + 86} y={y + 14} fontSize={10.5} fontWeight={isCurrent ? 700 : 500} textAnchor="end" fill="var(--text)" fontFamily="ui-monospace, monospace">
        {formatSize(metrics.totalSize)}
      </text>
      <rect x={BADGE_X} y={y + 3} width={58} height={15} rx={7} fill={meta.bg} stroke={meta.color} strokeWidth={1} />
      <text x={BADGE_X + 29} y={y + 13.5} fontSize={9.5} fontWeight={700} textAnchor="middle" fill={meta.color}>{meta.label}</text>
    </g>
  );
}

/** Reusable log-scaled stacked horizontal bar chart for Day 7 directory size audits. */
export function DirectoryAuditSvg({ bars, currentIndex, threshold, thresholdLabel, maxSize, accentColor }: DirectoryAuditSvgProps) {
  const scaleMax = Math.max(maxSize, threshold, 1);
  const start = computeWindowStart(bars.length, currentIndex);
  const visible = bars.slice(start, start + WINDOW_ROWS);
  const thresholdX = BAR_X + BAR_W * logRatio(threshold, scaleMax);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '0.5rem', margin: '0.5rem 0' }}>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Log-scaled directory size audit chart">
        <AuditHeader thresholdX={thresholdX} thresholdLabel={thresholdLabel} accentColor={accentColor} />
        {visible.map((bar, offset) => (
          <AuditRow key={bar.metrics.path} bar={bar} rowIndex={offset} isCurrent={start + offset === currentIndex} scaleMax={scaleMax} accentColor={accentColor} />
        ))}
        <text x={14} y={SVG_H - 10} fontSize={10.5} fill="var(--muted)">
          {`Showing rows ${bars.length === 0 ? 0 : start + 1}–${start + visible.length} of ${bars.length} (post-order DFS)`}
        </text>
      </svg>
    </div>
  );
}
