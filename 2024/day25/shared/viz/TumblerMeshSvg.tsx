import type { PairFitEvaluation } from '../index';

export interface TumblerMeshSvgProps {
  readonly evaluation: PairFitEvaluation | null;
}

interface CellStyle {
  readonly fill: string;
  readonly stroke: string;
  readonly label: string;
  readonly labelColor: string;
}

interface MeshGeometry {
  readonly cellW: number;
  readonly cellH: number;
  readonly gap: number;
  readonly padX: number;
  readonly padTop: number;
  readonly gridH: number;
  readonly svgW: number;
  readonly svgH: number;
  readonly startX: number;
}

function getCellStyle(hasLock: boolean, hasKey: boolean, isBase: boolean): CellStyle {
  if (hasLock && hasKey) {
    return { fill: 'var(--err)', stroke: 'var(--err)', label: '×', labelColor: 'var(--surface)' };
  }
  if (hasLock || hasKey) {
    return {
      fill: isBase ? 'var(--text)' : hasLock ? 'var(--accent)' : 'var(--gold)',
      stroke: 'var(--surface)',
      label: isBase ? '■' : '#',
      labelColor: 'var(--surface)',
    };
  }
  return { fill: 'var(--bg)', stroke: 'var(--border)', label: '·', labelColor: 'var(--muted)' };
}

function computeGeometry(width: number, height: number): MeshGeometry {
  const cellW = Math.max(24, Math.min(48, Math.floor(460 / width)));
  const cellH = Math.max(18, Math.min(34, Math.floor(250 / height)));
  const gap = 3;
  const padX = 24;
  const padTop = 38;
  const gridW = width * cellW + (width - 1) * gap;
  const gridH = height * cellH + (height - 1) * gap;
  const svgW = Math.max(380, gridW + padX * 2);
  return { cellW, cellH, gap, padX, padTop, gridH, svgW, svgH: padTop + gridH + 42, startX: (svgW - gridW) / 2 };
}

function EmptyMeshBox() {
  return (
    <svg
      viewBox="0 0 420 120"
      style={{ width: '100%', maxHeight: 160, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
      role="img"
      aria-label="Empty tumbler chamber"
    >
      <text x="210" y="64" textAnchor="middle" fontSize="14" fill="var(--muted)">
        No lock/key pairs available to evaluate.
      </text>
    </svg>
  );
}

function MeshCells({ evaluation, geom }: { readonly evaluation: PairFitEvaluation; readonly geom: MeshGeometry }) {
  const { lock, key } = evaluation;
  const { cellW, cellH, gap, padTop, startX } = geom;
  return (
    <g>
      {Array.from({ length: lock.height }, (_, r) =>
        Array.from({ length: lock.width }, (_, c) => {
          const style = getCellStyle(r <= lock.heights[c]!, r >= lock.height - 1 - key.heights[c]!, r === 0 || r === lock.height - 1);
          const x = startX + c * (cellW + gap);
          const y = padTop + r * (cellH + gap);
          return (
            <g key={`${r}-${c}`}>
              <rect x={x} y={y} width={cellW} height={cellH} rx={4} fill={style.fill} stroke={style.stroke} strokeWidth={1} />
              <text x={x + cellW / 2} y={y + cellH / 2 + 4} textAnchor="middle" fontSize={Math.min(13, cellH * 0.55)} fontWeight="700" fill={style.labelColor}>
                {style.label}
              </text>
            </g>
          );
        }),
      )}
    </g>
  );
}

function ClearanceBadges({ clearances, geom }: { readonly clearances: readonly number[]; readonly geom: MeshGeometry }) {
  return (
    <g>
      {clearances.map((clr, c) => {
        const x = geom.startX + c * (geom.cellW + geom.gap);
        const y = geom.padTop + geom.gridH + 10;
        const color = clr < 0 ? 'var(--err)' : clr === 0 ? 'var(--gold)' : 'var(--ok)';
        return (
          <g key={`clr-${c}`}>
            <rect x={x} y={y} width={geom.cellW} height={22} rx={5} fill="var(--bg)" stroke={color} strokeWidth={1.5} />
            <text x={x + geom.cellW / 2} y={y + 15} textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>
              {clr > 0 ? `+${clr}` : String(clr)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Renders a meshed W × H chamber showing lock pins, key teeth, air clearances, and collisions. */
export function TumblerMeshSvg({ evaluation }: TumblerMeshSvgProps) {
  if (!evaluation) return <EmptyMeshBox />;
  const { lock, key, columnClearances, fits, collidingColumns } = evaluation;
  const geom = computeGeometry(lock.width, lock.height);
  const verdictColor = fits ? 'var(--ok)' : 'var(--err)';
  return (
    <svg
      viewBox={`0 0 ${geom.svgW} ${geom.svgH}`}
      style={{ width: '100%', maxHeight: 360, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
      role="img"
      aria-label={`Chamber mesh for ${lock.id} and ${key.id}`}
    >
      <text x={geom.padX} y={23} fontSize="13" fontWeight="700" fill="var(--text)">
        {lock.id} [{lock.profileLabel}] + {key.id} [{key.profileLabel}]
      </text>
      <text x={geom.svgW - geom.padX} y={23} textAnchor="end" fontSize="13" fontWeight="700" fill={verdictColor}>
        {fits ? 'FIT (NO OVERLAP)' : `COLLISION (${collidingColumns.length} COL)`}
      </text>
      <MeshCells evaluation={evaluation} geom={geom} />
      <ClearanceBadges clearances={columnClearances} geom={geom} />
    </svg>
  );
}
