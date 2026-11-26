import { useMemo } from 'react';
import {
  PlaybackControls,
  usePlayback,
  type PlaybackState,
  type VisualizerProps,
} from '../../../../shared/viz';
import {
  CpuProgram,
  CpuTimeline,
  DEFAULT_MAX_TRACE_STEPS,
  formatInstruction,
  instructionCycles,
} from '../../shared';
import {
  CRT_PIXEL_COUNT,
  CrtBeamTraceFrame,
  rasterizeCrtPrefix,
  solver,
} from '../domain';
import { CrtPhosphorDisplay } from './CrtPhosphorDisplay';

type VizState =
  | {
      readonly ok: true;
      readonly program: CpuProgram;
      readonly pixels: readonly boolean[];
      readonly frames: readonly CrtBeamTraceFrame[];
    }
  | { readonly ok: false; readonly message: string };

function buildVizState(rawInput: string): VizState {
  try {
    const program = solver.parse(rawInput);
    const timeline = CpuTimeline.execute(program);
    const pixels = rasterizeCrtPrefix(timeline);
    const frames = solver.trace!(program, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, program, pixels, frames };
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

function TelemetryBadges({
  program,
  frame,
  frameCount,
}: {
  readonly program: CpuProgram;
  readonly frame: CrtBeamTraceFrame;
  readonly frameCount: number;
}) {
  const s = frame.snapshot;
  const instr = program.instructions[s.instructionIndex]!;
  const fullyDecoded = frame.isScreenComplete && !frame.decodedText.includes('?');
  return (
    <div className="meta-row">
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Cycle: <code>{frame.cycle} / {frame.totalCycles}</code>
      </span>
      <span className="badge">
        Instr #{s.instructionIndex + 1}/{program.instructionCount}:{' '}
        <code>{formatInstruction(instr)} ({s.subCycle}/{instructionCycles(instr)})</code>
      </span>
      <span className="badge">
        X: <code>{s.xChanged ? `${s.xDuring} → ${s.xAfter}` : s.xDuring}</code>
      </span>
      <span className={`badge ${frame.cycle <= CRT_PIXEL_COUNT && s.spriteLit ? 'status-solved' : ''}`}>
        {frame.cycle <= CRT_PIXEL_COUNT
          ? `CRT (${s.crtRow}, ${s.crtCol}) · ${s.spriteLit ? 'LIT' : 'DARK'}`
          : 'CRT Frame Complete'}
      </span>
      <span className={`badge ${fullyDecoded ? 'status-solved' : ''}`}>
        OCR: <code>{frame.decodedText}</code>
      </span>
      {frameCount < frame.totalCycles && (
        <span className="muted">Sampled {frameCount} of {frame.totalCycles} cycles</span>
      )}
    </div>
  );
}

const panelStyle = {
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '0.5rem 0.65rem',
  background: 'var(--surface)',
  marginTop: '0.6rem',
} as const;

function PipelinePanel({ program, frame }: { readonly program: CpuProgram; readonly frame: CrtBeamTraceFrame }) {
  const idx = frame.snapshot.instructionIndex;
  const start = Math.max(0, Math.min(idx - 2, program.instructionCount - 5));
  return (
    <div style={panelStyle}>
      <div className="eyebrow">Instruction Pipeline</div>
      {program.instructions.slice(start, start + 5).map((instr, offset) => {
        const absIdx = start + offset;
        const active = absIdx === idx;
        return (
          <div key={absIdx} style={{ fontSize: '0.82rem', fontWeight: active ? 700 : 400, color: active ? 'var(--accent)' : 'var(--text)' }}>
            <code>#{String(absIdx + 1).padStart(3, '0')}</code> {formatInstruction(instr)}{' '}
            {active ? `← sub ${frame.snapshot.subCycle}/${instructionCycles(instr)}` : ''}
          </div>
        );
      })}
    </div>
  );
}

/** Interactive 40x6 CRT raster and progressive 8-letter OCR visualizer for 2022 Day 10 Part 2. */
export function CathodeRayTubePart2Visualizer({ rawInput }: VisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 75);
  const frame = frames[playback.step];
  if (!state.ok || !frame) {
    return (
      <p className="error-text">
        Unable to visualize input: {state.ok ? 'No trace frames' : state.message}
      </p>
    );
  }
  return (
    <div>
      <TelemetryBadges program={state.program} frame={frame} frameCount={frames.length} />
      <CrtPhosphorDisplay pixels={state.pixels} frame={frame} />
      <PipelinePanel program={state.program} frame={frame} />
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frames.length - 1)}
        onStepChange={(next) => handleStepChange(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
