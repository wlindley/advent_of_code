import { bigintLog2 } from '../../../../shared/core';
import {
  DIRECTIONAL_KEYS,
  type DirectionalKey,
  type KeypadConundrumSnapshot,
  NUMERIC_KEYPAD,
  type NumericKey,
} from '../index';

export interface KeypadSvgProps {
  readonly snapshot: KeypadConundrumSnapshot;
}

const NUM_LAYOUT: readonly (readonly (NumericKey | null)[])[] = [
  ['7', '8', '9'], ['4', '5', '6'], ['1', '2', '3'], [null, '0', 'A'],
];

function formatCompactCost(cost: bigint): string {
  const s = cost.toString();
  return s.length <= 5 ? s : `~2^${Math.floor(bigintLog2(cost))}`;
}

function cellShade(cost: bigint, maxCost: bigint): string {
  if (maxCost === 1n) return 'rgba(9, 105, 218, 0.08)';
  const ratio = (1 + bigintLog2(cost)) / (1 + bigintLog2(maxCost));
  const alpha = 0.08 + Math.min(1, Math.max(0, ratio)) * 0.34;
  return `rgba(9, 105, 218, ${alpha.toFixed(2)})`;
}

function NumericKeyTile({ k, r, c, isHit }: {
  readonly k: NumericKey | null; readonly r: number; readonly c: number; readonly isHit: boolean;
}) {
  const x = 10 + c * 44 + 2;
  const y = 10 + r * 44 + 2;
  const size = 40;
  if (k === null) {
    return (
      <g>
        <title>Gap hazard (forbidden)</title>
        <rect x={x} y={y} width={size} height={size} rx={6} fill="rgba(207, 34, 46, 0.08)" stroke="var(--err)" strokeDasharray="3 2" />
        <text x={x + 20} y={y + 25} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--err)">×</text>
      </g>
    );
  }
  const fill = isHit ? 'rgba(9, 105, 218, 0.16)' : k === 'A' ? 'rgba(154, 103, 0, 0.10)' : 'var(--bg)';
  const stroke = isHit ? 'var(--accent)' : k === 'A' ? 'var(--gold)' : 'var(--border)';
  return (
    <g>
      <title>{`Key ${k}${isHit ? ' (in active code)' : ''}`}</title>
      <rect x={x} y={y} width={size} height={size} rx={6} fill={fill} stroke={stroke} strokeWidth={isHit ? 2 : 1} />
      <text x={x + 20} y={y + 25} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--text)">{k}</text>
    </g>
  );
}

function NumericPadSvg({ activeCode }: { readonly activeCode: string | null }) {
  const activeSet = new Set(activeCode ? [...activeCode] : []);
  const w = NUMERIC_KEYPAD.cols * 44 + 20;
  const h = NUMERIC_KEYPAD.rows * 44 + 20;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="eyebrow">Numeric Keypad (4×3)</span>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="4 by 3 numeric keypad with bottom-left gap hazard"
        style={{ width: w, height: h, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
      >
        {NUM_LAYOUT.map((row, r) =>
          row.map((k, c) => <NumericKeyTile key={`${r}-${c}`} k={k} r={r} c={c} isHit={k !== null && activeSet.has(k)} />),
        )}
      </svg>
    </div>
  );
}

function HeatmapTile({ snapshot, from, to, r, c, maxCost }: {
  readonly snapshot: KeypadConundrumSnapshot; readonly from: DirectionalKey; readonly to: DirectionalKey;
  readonly r: number; readonly c: number; readonly maxCost: bigint;
}) {
  const depth = snapshot.activeDepth;
  const choice = snapshot.table.choiceOf(from, to, depth);
  const x = 26 + c * 44 + 2;
  const y = 26 + r * 44 + 2;
  return (
    <g>
      <title>{`${from} → ${to} @ d=${depth}: cost ${choice.cost.toString()}, path "${choice.bestPath}"`}</title>
      <rect x={x} y={y} width={40} height={40} rx={5} fill={cellShade(choice.cost, maxCost)} stroke="var(--border)" />
      <text x={x + 20} y={y + 24} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)">
        {formatCompactCost(choice.cost)}
      </text>
    </g>
  );
}

function DirectionalHeatmapSvg({ snapshot }: { readonly snapshot: KeypadConundrumSnapshot }) {
  const depth = snapshot.activeDepth;
  const maxCost = snapshot.table.maxCostAt(depth);
  const size = 26 + DIRECTIONAL_KEYS.length * 44 + 8;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="eyebrow">Directional DP Cost Heatmap (Depth {depth})</span>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`5 by 5 directional keypad transition cost heatmap at depth ${depth}`}
        style={{ width: size, height: size, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
      >
        {DIRECTIONAL_KEYS.map((key, i) => (
          <g key={`hdr-${key}`}>
            <text x={26 + i * 44 + 22} y={18} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--muted)">{key}</text>
            <text x={14} y={26 + i * 44 + 26} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--muted)">{key}</text>
          </g>
        ))}
        {DIRECTIONAL_KEYS.map((from, r) =>
          DIRECTIONAL_KEYS.map((to, c) => (
            <HeatmapTile key={`${from}-${to}`} snapshot={snapshot} from={from} to={to} r={r} c={c} maxCost={maxCost} />
          )),
        )}
      </svg>
    </div>
  );
}

/** Renders the 4x3 numeric keypad and 5x5 directional DP cost heatmap SVGs. */
export function KeypadSvg({ snapshot }: KeypadSvgProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'flex-start' }}>
      <NumericPadSvg activeCode={snapshot.activeEntry?.code.raw ?? null} />
      <DirectionalHeatmapSvg snapshot={snapshot} />
    </div>
  );
}
