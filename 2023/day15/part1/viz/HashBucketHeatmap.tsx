import type { CSSProperties } from 'react';
import { HASH_BUCKET_COUNT } from '../../shared';

export interface HashBucketHeatmapProps {
  readonly bucketCounts: readonly number[];
  readonly activeBucket: number;
  readonly peakBucketCount: number;
}

const GRID_SIDE = 16;
const CELL_SIZE = 28;
const CELL_GAP = 2;
const PADDING = 6;
const SVG_SIZE = GRID_SIDE * CELL_SIZE + (GRID_SIDE - 1) * CELL_GAP + PADDING * 2;

const WRAPPER_STYLE: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '0.75rem 0.85rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.55rem',
};

function BucketCell({
  bucket,
  count,
  isActive,
  peakBucketCount,
}: {
  readonly bucket: number;
  readonly count: number;
  readonly isActive: boolean;
  readonly peakBucketCount: number;
}) {
  const row = Math.floor(bucket / GRID_SIDE);
  const col = bucket % GRID_SIDE;
  const x = PADDING + col * (CELL_SIZE + CELL_GAP);
  const y = PADDING + row * (CELL_SIZE + CELL_GAP);
  const ratio = peakBucketCount > 0 ? count / peakBucketCount : 0;
  const fill = count === 0 ? 'var(--bg)' : `rgba(26, 127, 55, ${(0.2 + 0.72 * ratio).toFixed(2)})`;
  const textFill = count > 0 && ratio > 0.52 ? 'var(--surface)' : count > 0 ? 'var(--text)' : 'var(--muted)';

  return (
    <g>
      <title>{`Bucket #${bucket} (row ${row}, col ${col}): ${count} token(s)`}</title>
      <rect
        x={x}
        y={y}
        width={CELL_SIZE}
        height={CELL_SIZE}
        rx={4}
        fill={fill}
        stroke={isActive ? 'var(--accent)' : count > 0 ? 'var(--ok)' : 'var(--border)'}
        strokeWidth={isActive ? 2.4 : 1}
      />
      <text
        x={x + CELL_SIZE / 2}
        y={y + CELL_SIZE / 2 + 3.5}
        textAnchor="middle"
        fontSize={count > 0 ? 10 : 8.5}
        fontWeight={count > 0 ? 700 : 500}
        fill={textFill}
        style={{ fontVariantNumeric: 'tabular-nums', pointerEvents: 'none' }}
      >
        {count > 0 ? count : bucket}
      </text>
    </g>
  );
}

/** 16x16 SVG heatmap of all 256 HASH buckets scaled against the global sequence peak. */
export function HashBucketHeatmap({
  bucketCounts,
  activeBucket,
  peakBucketCount,
}: HashBucketHeatmapProps) {
  const buckets = Array.from({ length: HASH_BUCKET_COUNT }, (_, b) => b);

  return (
    <div style={WRAPPER_STYLE}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem' }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text)' }}>
          256 HASH Buckets (16×16)
        </span>
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            Active: <strong>#{activeBucket}</strong>
          </span>
          <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
            Peak count: <strong>{peakBucketCount}</strong>
          </span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        role="img"
        aria-label={`16 by 16 hash bucket heatmap highlighting active bucket ${activeBucket}`}
        style={{ width: '100%', maxWidth: '460px', height: 'auto', display: 'block' }}
      >
        {buckets.map((b) => (
          <BucketCell
            key={b}
            bucket={b}
            count={bucketCounts[b] ?? 0}
            isActive={b === activeBucket}
            peakBucketCount={peakBucketCount}
          />
        ))}
      </svg>
    </div>
  );
}
