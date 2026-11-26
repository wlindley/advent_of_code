import { useId } from 'react';
import type { CompactionMove } from '../compaction';
import { FREE_BLOCK } from '../diskMap';
import { fileColorCss } from './palette';

export interface DiskStripSvgProps {
  readonly blocks: ArrayLike<number>;
  readonly lastMove: CompactionMove | null;
}

interface StripLayout {
  readonly cellW: number;
  readonly gap: number;
  readonly padX: number;
  readonly stripY: number;
  readonly cellH: number;
  readonly width: number;
  readonly height: number;
}

function computeStripLayout(count: number): StripLayout {
  const safe = Math.max(1, count);
  const gap = safe <= 50 ? 2 : 1;
  const cellW = Math.max(8, Math.min(26, Math.floor((880 - (safe - 1) * gap) / safe)));
  const padX = 16;
  const stripY = 54;
  const cellH = 34;
  const stripW = safe * cellW + Math.max(0, safe - 1) * gap;
  return { cellW, gap, padX, stripY, cellH, width: stripW + padX * 2, height: stripY + cellH + 26 };
}

function cellX(layout: StripLayout, index: number): number {
  return layout.padX + index * (layout.cellW + layout.gap);
}

function TransferArc({ layout, move, markerId }: {
  readonly layout: StripLayout;
  readonly move: CompactionMove;
  readonly markerId: string;
}) {
  const spanW = (len: number) => len * layout.cellW + Math.max(0, len - 1) * layout.gap;
  const fromX = cellX(layout, move.fromStart) + spanW(move.length) / 2;
  const toX = cellX(layout, move.toStart) + spanW(move.length) / 2;
  const midX = (fromX + toX) / 2;
  const lift = Math.min(42, Math.max(18, Math.abs(fromX - toX) * 0.18));
  const ctrlY = layout.stripY - lift;
  return (
    <g>
      <path
        d={`M ${fromX} ${layout.stripY - 3} Q ${midX} ${ctrlY} ${toX} ${layout.stripY - 4}`}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2.2}
        markerEnd={`url(#${markerId})`}
      />
      <text x={midX} y={Math.max(13, ctrlY + 6)} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--accent)">
        #{move.fileId} ×{move.length} ({move.fromStart}→{move.toStart})
      </text>
    </g>
  );
}

function BlockCell({ index, fileId, layout, role }: {
  readonly index: number;
  readonly fileId: number;
  readonly layout: StripLayout;
  readonly role: 'normal' | 'dest' | 'src';
}) {
  const x = cellX(layout, index);
  const isFree = fileId === FREE_BLOCK;
  const stroke = role === 'dest' ? 'var(--ok)' : role === 'src' ? 'var(--gold)' : 'var(--border)';
  return (
    <g>
      <title>{`Block ${index}: ${isFree ? 'free' : `file #${fileId}`}`}</title>
      <rect
        x={x} y={layout.stripY} width={layout.cellW} height={layout.cellH} rx={3}
        fill={fileColorCss(fileId)} stroke={stroke}
        strokeWidth={role === 'normal' ? 1 : 2}
        strokeDasharray={role === 'src' ? '3 2' : undefined}
      />
      {layout.cellW >= 14 && (
        <text
          x={x + layout.cellW / 2} y={layout.stripY + layout.cellH / 2 + 4}
          textAnchor="middle" fontSize={layout.cellW >= 20 ? 11 : 9} fontWeight={700}
          fill={isFree ? 'var(--muted)' : '#ffffff'}
        >
          {isFree ? '·' : fileId}
        </text>
      )}
    </g>
  );
}

function SectorTicks({ count, layout }: { readonly count: number; readonly layout: StripLayout }) {
  const step = count <= 25 ? 5 : 10;
  return (
    <>
      {Array.from({ length: count }, (_, i) =>
        i % step === 0 || i === count - 1 ? (
          <text
            key={i} x={cellX(layout, i) + layout.cellW / 2} y={layout.stripY + layout.cellH + 17}
            textAnchor="middle" fontSize={10} fill="var(--muted)"
          >
            {i}
          </text>
        ) : null,
      )}
    </>
  );
}

/** Interactive SVG sector strip for small disks (`totalBlocks <= 100`) with transfer arc. */
export function DiskStripSvg({ blocks, lastMove }: DiskStripSvgProps) {
  const markerId = useId();
  const layout = computeStripLayout(blocks.length);
  const stripStyle = {
    width: '100%', height: 'auto', display: 'block',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
  } as const;

  return (
    <svg viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label="Disk sector compaction strip" style={stripStyle}>
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX={7} refY={5} markerWidth={6} markerHeight={6} orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--accent)" />
        </marker>
      </defs>
      {lastMove && <TransferArc layout={layout} move={lastMove} markerId={markerId} />}
      {Array.from({ length: blocks.length }, (_, i) => {
        const inDest = lastMove !== null && i >= lastMove.toStart && i < lastMove.toEnd;
        const inSrc = lastMove !== null && i >= lastMove.fromStart && i < lastMove.fromEnd;
        const role = inDest ? 'dest' : inSrc ? 'src' : 'normal';
        return <BlockCell key={i} index={i} fileId={blocks[i] ?? FREE_BLOCK} layout={layout} role={role} />;
      })}
      <SectorTicks count={blocks.length} layout={layout} />
    </svg>
  );
}
