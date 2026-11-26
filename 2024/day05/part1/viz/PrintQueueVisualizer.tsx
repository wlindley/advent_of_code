import { useId, useMemo, type ReactNode } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import type { ApplicableRule } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, solver, type PrintQueueTraceFrame } from '../domain';

type ParsedVizState =
  | { readonly ok: true; readonly frames: readonly PrintQueueTraceFrame[] }
  | { readonly ok: false; readonly message: string };

const BASELINE_Y = 120;

function buildVizState(rawInput: string): ParsedVizState {
  try {
    const queue = solver.parse(rawInput);
    return { ok: true, frames: solver.trace!(queue, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function collectViolatedIndices(rules: readonly ApplicableRule[]): ReadonlySet<number> {
  const indices = new Set<number>();
  for (const rule of rules) {
    if (!rule.isSatisfied) { indices.add(rule.beforeIndex); indices.add(rule.afterIndex); }
  }
  return indices;
}

function nodeX(index: number, count: number, width: number, spacing: number): number {
  return count === 1 ? width / 2 : 48 + index * spacing;
}

function renderArc(rule: ApplicableRule, idx: number, count: number, width: number, spacing: number, opacity: number, markerId: string): ReactNode {
  const x1 = nodeX(rule.beforeIndex, count, width, spacing);
  const x2 = nodeX(rule.afterIndex, count, width, spacing);
  const arcH = Math.min(88, 18 + Math.abs(rule.afterIndex - rule.beforeIndex) * 14);
  const yEdge = rule.isSatisfied ? BASELINE_Y - 17 : BASELINE_Y + 17;
  const cy = rule.isSatisfied ? yEdge - arcH : yEdge + arcH;
  return (
    <path
      key={`${rule.before}-${rule.after}-${idx}`}
      d={`M ${x1} ${yEdge} Q ${(x1 + x2) / 2} ${cy} ${x2} ${yEdge}`}
      fill="none"
      stroke={rule.isSatisfied ? 'var(--ok)' : 'var(--err)'}
      strokeWidth={rule.isSatisfied ? 1.5 : 2.5}
      strokeOpacity={rule.isSatisfied ? opacity : 0.95}
      markerEnd={rule.isSatisfied ? undefined : `url(#${markerId})`}
    >
      <title>{`${rule.before}|${rule.after} (${rule.isSatisfied ? 'satisfied' : 'violated'})`}</title>
    </path>
  );
}

function renderNode(page: number, i: number, count: number, violated: ReadonlySet<number>, width: number, spacing: number): ReactNode {
  const cx = nodeX(i, count, width, spacing);
  const isMiddle = i === (count - 1) / 2;
  const isViolated = violated.has(i);
  const stroke = isMiddle ? 'var(--gold)' : isViolated ? 'var(--err)' : 'var(--border)';
  return (
    <g key={`${page}-${i}`}>
      <circle cx={cx} cy={BASELINE_Y} r={count > 15 ? 13 : 16} fill="var(--surface)" stroke={stroke} strokeWidth={isMiddle ? 3 : isViolated ? 2 : 1.5} />
      <text x={cx} y={BASELINE_Y} textAnchor="middle" dominantBaseline="central" fontSize={count > 15 ? 11 : 13} fontWeight={isMiddle ? 700 : 600} fill={isMiddle ? 'var(--gold)' : 'var(--text)'}>
        {page}
      </text>
    </g>
  );
}

function StatusBadges({ frame }: { readonly frame: PrintQueueTraceFrame }) {
  return (
    <div className="meta-row">
      <span className="badge">Update: <code>{frame.updateIndex + 1} / {frame.totalUpdates}</code></span>
      <span className={`badge ${frame.isValid ? 'status-solved' : 'status-blocked'}`}>
        {frame.isValid ? 'Valid order' : `Invalid (${frame.violationCount} violation${frame.violationCount === 1 ? '' : 's'})`}
      </span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
        Middle: <code>{frame.update.middlePage}</code> (+{frame.middleContribution})
      </span>
      <span className="badge status-solved">
        Valid: <code>{frame.validCountSoFar}</code> · Sum: <strong className="gold"><code>{frame.middleSumSoFar}</code></strong>
      </span>
    </div>
  );
}

function VizFooter({ totalSteps, playback }: { readonly totalSteps: number; readonly playback: PlaybackState }) {
  return (
    <>
      <div className="meta-row" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
        <span><strong style={{ color: 'var(--ok)' }}>Above arcs</strong>: satisfied</span><span>·</span>
        <span><strong style={{ color: 'var(--err)' }}>Below arrows</strong>: violated right-to-left</span><span>·</span>
        <span><strong style={{ color: 'var(--gold)' }}>Gold ring</strong>: middle page</span>
      </div>
      <PlaybackControls
        step={playback.step} totalSteps={totalSteps} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
        onTogglePlay={() => { if (!playback.isPlaying && playback.step >= totalSteps - 1) playback.setStep(0); playback.togglePlay(); }}
        onStepChange={(next) => { if (playback.isPlaying) playback.togglePlay(); playback.setStep(next); }}
        onSpeedChange={playback.setSpeedMs}
      />
    </>
  );
}

function buildSvgElements(frame: PrintQueueTraceFrame, width: number, spacing: number, markerId: string): { arcs: ReactNode[]; nodes: ReactNode[] } {
  const pages = frame.update.pages;
  const violated = collectViolatedIndices(frame.applicableRules);
  let satisfied = 0;
  for (const r of frame.applicableRules) if (r.isSatisfied) satisfied += 1;
  const opacity = satisfied > 30 ? 0.28 : 0.72;
  const arcs: ReactNode[] = [];
  for (let i = 0; i < frame.applicableRules.length; i++) {
    arcs.push(renderArc(frame.applicableRules[i]!, i, pages.length, width, spacing, opacity, markerId));
  }
  const nodes: ReactNode[] = [];
  for (let i = 0; i < pages.length; i++) nodes.push(renderNode(pages[i]!, i, pages.length, violated, width, spacing));
  return { arcs, nodes };
}

export function PrintQueueVisualizer({ rawInput }: VisualizerProps) {
  const markerId = useId();
  const state = useMemo(() => buildVizState(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 450);
  const frame = frames[playback.step] ?? null;

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  const count = frame.update.pages.length;
  const spacing = count <= 11 ? 56 : Math.max(32, Math.floor(620 / Math.max(1, count - 1)));
  const width = Math.max(360, 96 + Math.max(0, count - 1) * spacing);
  const { arcs, nodes } = buildSvgElements(frame, width, spacing, markerId);

  return (
    <div>
      <StatusBadges frame={frame} />
      <div style={{ margin: '0.6rem 0', overflowX: 'auto' }}>
        <svg width={width} height={240} viewBox={`0 0 ${width} 240`} role="img"
          aria-label={`Precedence arc diagram for update ${frame.updateIndex + 1} with ${frame.violationCount} violations`}
          style={{ display: 'block', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', maxWidth: '100%', height: 'auto' }}>
          <defs>
            <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--err)" />
            </marker>
          </defs>
          <line x1={24} y1={BASELINE_Y} x2={width - 24} y2={BASELINE_Y} stroke="var(--border)" strokeWidth={1} />
          <g>{arcs}</g>
          <g>{nodes}</g>
        </svg>
      </div>
      <VizFooter totalSteps={frames.length} playback={playback} />
    </div>
  );
}
