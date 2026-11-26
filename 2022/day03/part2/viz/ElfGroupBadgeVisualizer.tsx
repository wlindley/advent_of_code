import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, priorityToItem, type PriorityTally, type Rucksack } from '../../shared';
import { solver, type ElfGroup, type ElfGroupTraceFrame } from '../domain';

const LOWER_PRIORITIES = Array.from({ length: 26 }, (_, i) => i + 1);
const UPPER_PRIORITIES = Array.from({ length: 26 }, (_, i) => i + 27);

type TraceResult =
  | { readonly ok: true; readonly frames: readonly ElfGroupTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceResult(rawInput: string): TraceResult {
  try {
    const groups = solver.parse(rawInput);
    const frames = solver.trace!(groups, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function handleTogglePlay(playback: PlaybackState, lastStep: number): void {
  if (!playback.isPlaying && playback.step >= lastStep) playback.setStep(0);
  playback.togglePlay();
}

function handleStepChange(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function TelemetryHeader({ frame }: { readonly frame: ElfGroupTraceFrame }) {
  const { group, tally } = frame;
  return (
    <div className="meta-row">
      <span className="badge">Group: <code>{group.groupNumber} / {frame.totalGroups}</code></span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        Badge: <code>{group.badgeItem}</code> (+{group.badgePriority})
      </span>
      <span className="badge status-solved">Total: <strong className="gold">{tally.totalPriority}</strong></span>
      <span className="badge">Types: <code>{tally.distinctTypes} / 52</code></span>
      {frame.totalGroups > frame.totalSteps && (
        <span className="muted">Sampled {frame.totalSteps} of {frame.totalGroups}</span>
      )}
    </div>
  );
}

function ElfRucksackRow({ index, rucksack, badge }: { readonly index: number; readonly rucksack: Rucksack; readonly badge: string }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', padding: '0.45rem 0.6rem' }}>
      <div className="eyebrow" style={{ marginBottom: '0.28rem' }}>
        Elf {index + 1} · Rucksack #{rucksack.rucksackNumber} ({rucksack.raw.length} items)
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '0.86rem' }}>
        {rucksack.raw.split('').map((ch, idx) => {
          const hit = ch === badge;
          return (
            <span key={idx} style={{
              padding: '0.06rem 0.26rem', borderRadius: 4,
              border: hit ? '1.5px solid var(--gold)' : '1px solid var(--border)',
              background: hit ? 'var(--surface)' : 'var(--bg)',
              color: hit ? 'var(--gold)' : 'var(--text)',
              fontWeight: hit ? 700 : 500,
            }}>{ch}</span>
          );
        })}
      </div>
    </div>
  );
}

function ElfGroupIntersectionCard({ group }: { readonly group: ElfGroup }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '0.6rem 0.75rem', margin: '0.5rem 0' }}>
      <div className="eyebrow" style={{ marginBottom: '0.45rem' }}>
        3-Elf Intersection · Group #{group.groupNumber} · Badge <code>{group.badgeItem}</code>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {group.rucksacks.map((rucksack, idx) => (
          <ElfRucksackRow key={rucksack.rucksackNumber} index={idx} rucksack={rucksack} badge={group.badgeItem} />
        ))}
      </div>
    </div>
  );
}

function HeatmapCell({ priority, count, active }: { readonly priority: number; readonly count: number; readonly active: boolean }) {
  const item = priorityToItem(priority);
  const border = active ? '2px solid var(--gold)' : count > 0 ? '1px solid var(--accent)' : '1px solid var(--border)';
  return (
    <div title={`${item} (priority ${priority}): ${count}`} style={{
      border, borderRadius: 4, padding: '0.2rem 0.1rem', textAlign: 'center',
      background: active || count > 0 ? 'var(--bg)' : 'var(--surface)',
      color: active ? 'var(--gold)' : count > 0 ? 'var(--text)' : 'var(--muted)',
      fontSize: '0.72rem', lineHeight: 1.2,
    }}>
      <div style={{ fontWeight: 700 }}>{item}</div>
      <div>{count > 0 ? count : '·'}</div>
    </div>
  );
}

function PriorityHeatmap({ tally, activePriority }: { readonly tally: PriorityTally; readonly activePriority: number }) {
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(26, minmax(22px, 1fr))', gap: 3 } as const;
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '0.6rem', overflowX: 'auto' }}>
      <div className="eyebrow" style={{ marginBottom: '0.35rem' }}>Badge Priority Tally (a–z: 1–26, A–Z: 27–52)</div>
      <div style={{ ...gridStyle, marginBottom: 4 }}>
        {LOWER_PRIORITIES.map((p) => (
          <HeatmapCell key={p} priority={p} count={tally.countOf(p)} active={p === activePriority} />
        ))}
      </div>
      <div style={gridStyle}>
        {UPPER_PRIORITIES.map((p) => (
          <HeatmapCell key={p} priority={p} count={tally.countOf(p)} active={p === activePriority} />
        ))}
      </div>
    </div>
  );
}

export function ElfGroupBadgeVisualizer({ rawInput }: VisualizerProps) {
  const state = useMemo(() => buildTraceResult(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 320);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }
  return (
    <div>
      <TelemetryHeader frame={frame} />
      <ElfGroupIntersectionCard group={frame.group} />
      <PriorityHeatmap tally={frame.tally} activePriority={frame.group.badgePriority} />
      <PlaybackControls
        step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frames.length - 1)}
        onStepChange={(next) => handleStepChange(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
