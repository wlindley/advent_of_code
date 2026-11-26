import { useMemo } from 'react';
import {
  PlaybackControls,
  usePlayback,
  type PlaybackState,
  type VisualizerProps,
} from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, type CalorieTraceFrame, type ElfInventory } from '../../shared';
import { solver } from '../domain';

const WINDOW_SIZE = 9;

type TraceState =
  | { readonly ok: true; readonly inventories: readonly ElfInventory[]; readonly frames: readonly CalorieTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceState(rawInput: string): TraceState {
  try {
    const inventories = solver.parse(rawInput);
    const frames = solver.trace!(inventories, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, inventories, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function selectWindow(inventories: readonly ElfInventory[], focusIndex: number): readonly ElfInventory[] {
  const start = Math.max(0, Math.min(focusIndex - Math.floor(WINDOW_SIZE / 2), inventories.length - WINDOW_SIZE));
  return inventories.slice(start, start + WINDOW_SIZE);
}

function formatItems(elf: ElfInventory): string {
  const head = elf.items.slice(0, 4).join(' + ');
  const suffix = elf.items.length > 4 ? ` + … (+${elf.items.length - 4})` : '';
  return `${head}${suffix} = ${elf.totalCalories}`;
}

function handleTogglePlay(playback: PlaybackState, lastStep: number): void {
  if (!playback.isPlaying && playback.step >= lastStep) playback.setStep(0);
  playback.togglePlay();
}

function handleStepChange(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function barColor(isCurrent: boolean, isLeader: boolean, entered: boolean): string {
  if (isCurrent && entered) return 'var(--ok)';
  if (isLeader) return 'var(--gold)';
  if (isCurrent) return 'var(--accent)';
  return 'var(--muted)';
}

function ElfBarRow({ elf, scaleMax, isCurrent, isLeader, entered }: {
  readonly elf: ElfInventory;
  readonly scaleMax: number;
  readonly isCurrent: boolean;
  readonly isLeader: boolean;
  readonly entered: boolean;
}) {
  const widthPct = Math.max(4, Math.round((elf.totalCalories / scaleMax) * 100));
  const fill = barColor(isCurrent, isLeader, entered);
  const tag = isLeader ? ' ★' : isCurrent ? ' ◀' : '';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '4.5rem 1fr 5.5rem', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem' }}>
      <span style={{ fontWeight: isCurrent || isLeader ? 700 : 500, color: isLeader ? 'var(--gold)' : 'var(--text)' }}>
        Elf #{elf.elfNumber}{tag}
      </span>
      <div style={{ height: 18, background: 'var(--bg)', border: `1px solid ${isCurrent ? fill : 'var(--border)'}`, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${widthPct}%`, height: '100%', background: fill, opacity: isCurrent || isLeader ? 0.9 : 0.45, transition: 'width 140ms ease' }} />
      </div>
      <code style={{ textAlign: 'right', color: 'var(--text)', fontWeight: isLeader ? 700 : 400 }}>{elf.totalCalories}</code>
    </div>
  );
}

function TelemetryHeader({ frame }: { readonly frame: CalorieTraceFrame }) {
  const leader = frame.leaders[0]!;
  return (
    <div className="meta-row">
      <span className="badge">Elf: <code>{frame.currentElf.elfNumber} / {frame.totalElves}</code></span>
      <span className="badge">Current: <code>{frame.currentElf.totalCalories}</code> ({frame.currentElf.itemCount} items)</span>
      <span className="badge status-solved">Leader: <strong className="gold">Elf #{leader.elfNumber} ({leader.totalCalories})</strong></span>
      <span className={`badge ${frame.enteredLeaderboard ? 'status-solved' : ''}`}>
        {frame.enteredLeaderboard ? 'New Leader' : 'No Change'}
      </span>
      {frame.totalElves > frame.totalSteps && (
        <span className="muted">Sampled {frame.totalSteps} of {frame.totalElves} Elves</span>
      )}
    </div>
  );
}

function ElfBarPanel({ inventories, frame }: {
  readonly inventories: readonly ElfInventory[];
  readonly frame: CalorieTraceFrame;
}) {
  const leader = frame.leaders[0]!;
  const visible = selectWindow(inventories, frame.elfIndex);
  const scaleMax = Math.max(leader.totalCalories, ...visible.map((e) => e.totalCalories), 1);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '0.75rem', margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      {visible.map((elf) => (
        <ElfBarRow
          key={elf.elfNumber} elf={elf} scaleMax={scaleMax}
          isCurrent={elf.elfNumber === frame.currentElf.elfNumber}
          isLeader={elf.elfNumber === leader.elfNumber} entered={frame.enteredLeaderboard}
        />
      ))}
      <div className="muted" style={{ fontSize: '0.8rem', paddingTop: '0.35rem', borderTop: '1px solid var(--border)' }}>
        Elf #{frame.currentElf.elfNumber} items: <code>{formatItems(frame.currentElf)}</code>
      </div>
    </div>
  );
}

export function CalorieLeaderboardVisualizer({ rawInput }: VisualizerProps) {
  const state = useMemo(() => buildTraceState(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 260);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }
  return (
    <div>
      <TelemetryHeader frame={frame} />
      <ElfBarPanel inventories={state.inventories} frame={frame} />
      <PlaybackControls
        step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frames.length - 1)}
        onStepChange={(next) => handleStepChange(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
