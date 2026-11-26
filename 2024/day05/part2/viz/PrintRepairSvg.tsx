import type { ReactNode } from 'react';
import type { ApplicableRule } from '../../shared';
import type { PageDisplacement, PrintRepairTraceFrame } from '../domain';

const BEFORE_Y = 104;
const AFTER_Y = 216;
const SVG_HEIGHT = 310;

function nodeX(index: number, count: number, width: number, spacing: number): number {
  return count === 1 ? width / 2 : 48 + index * spacing;
}

function collectViolated(rules: readonly ApplicableRule[]): ReadonlySet<number> {
  const violated = new Set<number>();
  for (const r of rules) if (!r.isSatisfied) { violated.add(r.beforeIndex); violated.add(r.afterIndex); }
  return violated;
}

function collectMovedTargets(displacements: readonly PageDisplacement[]): ReadonlySet<number> {
  const moved = new Set<number>();
  for (const d of displacements) if (d.fromIndex !== d.toIndex) moved.add(d.toIndex);
  return moved;
}

function renderRuleArc(
  rule: ApplicableRule, key: string, yBase: number, upward: boolean, r: number,
  count: number, w: number, sp: number, opacity: number, markerId?: string,
): ReactNode {
  const x1 = nodeX(rule.beforeIndex, count, w, sp);
  const x2 = nodeX(rule.afterIndex, count, w, sp);
  const arcH = Math.min(72, 16 + Math.abs(rule.afterIndex - rule.beforeIndex) * 12);
  const yEdge = upward ? yBase - r - 1 : yBase + r + 1;
  const cy = upward ? yEdge - arcH : yEdge + arcH;
  const bad = !rule.isSatisfied;
  return (
    <path key={key} d={`M ${x1} ${yEdge} Q ${(x1 + x2) / 2} ${cy} ${x2} ${yEdge}`} fill="none"
      stroke={bad ? 'var(--err)' : 'var(--ok)'} strokeWidth={bad ? 2.4 : 1.3}
      strokeOpacity={bad ? 0.95 : opacity} markerEnd={bad && markerId ? `url(#${markerId})` : undefined}>
      <title>{`${rule.before}|${rule.after} (${bad ? 'violated' : 'satisfied'})`}</title>
    </path>
  );
}

function renderRibbon(d: PageDisplacement, count: number, r: number, w: number, sp: number): ReactNode {
  const x1 = nodeX(d.fromIndex, count, w, sp);
  const x2 = nodeX(d.toIndex, count, w, sp);
  const y1 = BEFORE_Y + r + 2;
  const y2 = AFTER_Y - r - 2;
  const midY = (y1 + y2) / 2;
  const isMid = d.toIndex === (count - 1) / 2;
  const isMoved = d.fromIndex !== d.toIndex;
  const stroke = isMid ? 'var(--gold)' : isMoved ? 'var(--accent)' : 'var(--muted)';
  const label = isMid ? 'repaired middle' : isMoved ? 'moved' : 'stationary';
  return (
    <path key={`rib-${d.page}`} d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
      fill="none" stroke={stroke} strokeWidth={isMid ? 2.8 : isMoved ? 2.1 : 1.2}
      strokeOpacity={isMid ? 0.95 : isMoved ? 0.85 : 0.45} strokeDasharray={isMid || isMoved ? undefined : '4 4'}>
      <title>{`Page ${d.page}: pos ${d.fromIndex + 1} -> ${d.toIndex + 1} (${label})`}</title>
    </path>
  );
}

function renderNode(
  page: number, i: number, y: number, r: number, count: number, w: number, sp: number,
  stroke: string, sw: number, fill: string,
): ReactNode {
  const cx = nodeX(i, count, w, sp);
  return (
    <g key={`${y}-${page}-${i}`}>
      <circle cx={cx} cy={y} r={r} fill="var(--surface)" stroke={stroke} strokeWidth={sw} />
      <text x={cx} y={y} textAnchor="middle" dominantBaseline="central"
        fontSize={count > 15 ? 11 : 13} fontWeight={sw >= 3 ? 700 : 600} fill={fill}>{page}</text>
    </g>
  );
}

function buildDiagramLayers(frame: PrintRepairTraceFrame, markerId: string) {
  const count = frame.repaired.pages.length;
  const r = count > 15 ? 13 : 16;
  const sp = count <= 11 ? 56 : Math.max(32, Math.floor(620 / Math.max(1, count - 1)));
  const w = Math.max(360, 96 + Math.max(0, count - 1) * sp);
  const mid = (count - 1) / 2;
  const violated = collectViolated(frame.originalRules);
  const moved = collectMovedTargets(frame.displacements);
  const op = frame.repairedRules.length > 30 ? 0.28 : 0.7;
  const beforeOk: ReactNode[] = [], beforeErr: ReactNode[] = [], afterOk: ReactNode[] = [];
  const ribbons: ReactNode[] = [], beforeNodes: ReactNode[] = [], afterNodes: ReactNode[] = [];
  for (let i = 0; i < frame.originalRules.length; i++) {
    const rule = frame.originalRules[i]!;
    if (rule.isSatisfied) beforeOk.push(renderRuleArc(rule, `bok-${i}`, BEFORE_Y, true, r, count, w, sp, op));
    else beforeErr.push(renderRuleArc(rule, `berr-${i}`, BEFORE_Y, true, r, count, w, sp, 0.95, markerId));
  }
  for (const d of frame.displacements) ribbons.push(renderRibbon(d, count, r, w, sp));
  for (let i = 0; i < frame.repairedRules.length; i++) afterOk.push(renderRuleArc(frame.repairedRules[i]!, `aok-${i}`, AFTER_Y, false, r, count, w, sp, op));
  for (let i = 0; i < count; i++) {
    beforeNodes.push(renderNode(frame.original.pages[i]!, i, BEFORE_Y, r, count, w, sp, violated.has(i) ? 'var(--err)' : 'var(--border)', violated.has(i) ? 2.2 : 1.5, 'var(--text)'));
    afterNodes.push(renderNode(frame.repaired.pages[i]!, i, AFTER_Y, r, count, w, sp, i === mid ? 'var(--gold)' : moved.has(i) ? 'var(--accent)' : 'var(--border)', i === mid ? 3 : moved.has(i) ? 2 : 1.5, i === mid ? 'var(--gold)' : 'var(--text)'));
  }
  return { w, beforeOk, beforeErr, ribbons, afterOk, beforeNodes, afterNodes };
}

export function PrintRepairSvg({ frame, markerId }: { readonly frame: PrintRepairTraceFrame; readonly markerId: string }) {
  const d = buildDiagramLayers(frame, markerId);
  return (
    <div style={{ margin: '0.6rem 0', overflowX: 'auto' }}>
      <svg width={d.w} height={SVG_HEIGHT} viewBox={`0 0 ${d.w} ${SVG_HEIGHT}`} role="img"
        aria-label={`Before and after topological repair for update ${frame.updateIndex + 1}`}
        style={{ display: 'block', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', maxWidth: '100%', height: 'auto' }}>
        <defs><marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill="var(--err)" /></marker></defs>
        <text x={12} y={BEFORE_Y - 26} fontSize={11} fontWeight={600} fill="var(--muted)">Before</text>
        <text x={12} y={AFTER_Y + 34} fontSize={11} fontWeight={600} fill="var(--muted)">After</text>
        <line x1={24} y1={BEFORE_Y} x2={d.w - 24} y2={BEFORE_Y} stroke="var(--border)" strokeWidth={1} />
        <line x1={24} y1={AFTER_Y} x2={d.w - 24} y2={AFTER_Y} stroke="var(--border)" strokeWidth={1} />
        <g>{d.beforeOk}</g><g>{d.beforeErr}</g><g>{d.ribbons}</g><g>{d.afterOk}</g>
        <g>{d.beforeNodes}</g><g>{d.afterNodes}</g>
      </svg>
    </div>
  );
}
