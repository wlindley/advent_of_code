import { useEffect, useMemo, useState } from 'react';
import { bitCount } from '../../../../shared/core';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, solver, type MachineTraceFrame } from '../domain';

export function FactoryLightsVisualizer({ rawInput }: VisualizerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(380);

  const state = useMemo(() => {
    try {
      const machines = solver.parse(rawInput);
      return { ok: true as const, frames: solver.trace!(machines, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
    }
  }, [rawInput]);

  useEffect(() => { setFrameIndex(0); setIsPlaying(false); }, [rawInput]);

  const frames: readonly MachineTraceFrame[] = state.ok ? state.frames : [];
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;
    const id = window.setInterval(() => {
      setFrameIndex((prev) => {
        if (prev + 1 >= frames.length - 1) { setIsPlaying(false); return frames.length - 1; }
        return prev + 1;
      });
    }, speedMs);
    return () => window.clearInterval(id);
  }, [isPlaying, speedMs, frames.length]);

  if (!state.ok || frames.length === 0) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  const clamped = Math.min(frameIndex, frames.length - 1);
  const frame = frames[clamped]!;
  const { machine, system, pressMask } = frame;
  const [L, B, presses] = [machine.lightCount, machine.buttonCount, bitCount(pressMask)];
  const pivotSet = new Set(system.pivotColumns);
  const pivotRowByCol = new Map(system.pivotColumns.map((col, row) => [col, row]));
  const litMask = machine.buttonMasks.reduce(
    (acc, bm, b) => ((pressMask & (1n << BigInt(b))) !== 0n ? acc ^ bm : acc), 0n,
  );

  const cell = 28;
  const [lightStep, btnW, btnStep] = [44, 54, 62];
  const W = Math.max(720, L * lightStep + 60, B * btnStep + 60, (B + 2) * cell + 80);
  const matrixY = 186;
  const H = matrixY + L * cell + 30;
  const lightX0 = (W - (L - 1) * lightStep) / 2;
  const btnX0 = (W - (B * btnStep - 8)) / 2;
  const matX0 = (W - (B + 1) * cell - 10) / 2;

  return (
    <div>
      <div className="meta-row">
        <span className="badge">Machine: <code>{frame.machineIndex + 1} / {frame.totalMachines}</code></span>
        <span className="badge">Rank: <code>{system.rank}</code></span>
        <span className="badge">Nullity: <code>{system.nullity}</code> (<code>{(2n ** BigInt(system.nullity)).toString()}</code> sol)</span>
        <span className="badge">Presses: <code>{presses}</code></span>
        <span className="badge status-solved">
          Cumulative: <strong className="gold"><code>{frame.cumulativePresses}</code></strong>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Machine ${frame.machineIndex + 1} of ${frame.totalMachines}: ${presses} presses, cumulative ${frame.cumulativePresses}`}
        style={{
          width: '100%', height: 'auto', display: 'block', margin: '0.6rem 0',
          border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)',
        }}
      >
        <text x={20} y={24} fontSize={12} fontWeight={600} fill="var(--muted)">
          INDICATOR LIGHT BANK (ring = target, fill = lit)
        </text>
        {machine.targetLights.map((target, l) => {
          const cx = lightX0 + l * lightStep;
          const isLit = (litMask & (1n << BigInt(l))) !== 0n;
          return (
            <g key={l}>
              <circle cx={cx} cy={56} r={16} fill="none" stroke={target ? 'var(--gold)' : 'var(--border)'} strokeWidth={target ? 3 : 1.5} strokeDasharray={target ? undefined : '4 3'} />
              <circle cx={cx} cy={56} r={11} fill={isLit ? 'var(--ok)' : 'var(--bg)'} stroke="var(--border)" strokeWidth={1} />
              <text x={cx} y={86} fontSize={11} textAnchor="middle" fill="var(--text)">L{l}</text>
            </g>
          );
        })}

        <text x={20} y={110} fontSize={12} fontWeight={600} fill="var(--muted)">
          BUTTONS (P = pivot, F = free, green = pressed)
        </text>
        {machine.buttons.map((btn, b) => {
          const x = btnX0 + b * btnStep;
          const pressed = (pressMask & (1n << BigInt(b))) !== 0n;
          const isPivot = pivotSet.has(b);
          const stroke = pressed ? 'var(--ok)' : isPivot ? 'var(--accent)' : 'var(--gold)';
          const wiring = btn.length <= 3 ? btn.join(',') : `${btn.length}L`;
          return (
            <g key={b}>
              <rect x={x} y={120} width={btnW} height={40} rx={6} fill={pressed ? 'var(--ok)' : 'var(--bg)'} fillOpacity={pressed ? 0.16 : 1} stroke={stroke} strokeWidth={pressed ? 2.4 : 1.3} />
              <text x={x + btnW / 2} y={136} fontSize={11} fontWeight={700} textAnchor="middle" fill="var(--text)">B{b} · {isPivot ? 'P' : 'F'}</text>
              <text x={x + btnW / 2} y={152} fontSize={10} textAnchor="middle" fill="var(--muted)">({wiring})</text>
            </g>
          );
        })}

        <text x={20} y={178} fontSize={12} fontWeight={600} fill="var(--muted)">
          GF(2) RREF AUGMENTED MATRIX ({L} × {B + 1})
        </text>
        {system.rrefRows.map((row, r) => {
          const y = matrixY + r * cell;
          const rx = matX0 + B * cell + 10;
          const rhsBit = (row & (1n << BigInt(B))) !== 0n ? 1 : 0;
          return (
            <g key={r}>
              {Array.from({ length: B }, (_, c) => {
                const x = matX0 + c * cell;
                const bit = (row & (1n << BigInt(c))) !== 0n ? 1 : 0;
                const isPivotCell = pivotRowByCol.get(c) === r;
                const isFreeCol = !pivotSet.has(c);
                const fill = isPivotCell ? 'var(--accent)' : isFreeCol ? 'var(--gold)' : 'var(--bg)';
                return (
                  <g key={c}>
                    <rect x={x} y={y} width={cell - 2} height={cell - 2} rx={4} fill={fill} fillOpacity={isPivotCell ? 0.18 : isFreeCol ? 0.1 : 1} stroke="var(--border)" strokeWidth={1} />
                    <text x={x + (cell - 2) / 2} y={y + cell / 2 + 3} fontSize={12} fontWeight={isPivotCell ? 700 : 500} textAnchor="middle" fill="var(--text)">{bit}</text>
                  </g>
                );
              })}
              <line x1={matX0 + B * cell + 4} y1={y} x2={matX0 + B * cell + 4} y2={y + cell - 2} stroke="var(--text)" strokeWidth={1.5} />
              <rect x={rx} y={y} width={cell - 2} height={cell - 2} rx={4} fill="var(--surface)" stroke="var(--border)" strokeWidth={1} />
              <text x={rx + (cell - 2) / 2} y={y + cell / 2 + 3} fontSize={12} fontWeight={700} textAnchor="middle" fill="var(--accent)">{rhsBit}</text>
            </g>
          );
        })}
      </svg>

      <PlaybackControls
        step={clamped}
        totalSteps={frames.length}
        isPlaying={isPlaying}
        speedMs={speedMs}
        onTogglePlay={() => {
          if (!isPlaying && clamped >= frames.length - 1) setFrameIndex(0);
          setIsPlaying((p) => !p);
        }}
        onStepChange={(next) => { setIsPlaying(false); setFrameIndex(next); }}
        onSpeedChange={setSpeedMs}
      />
    </div>
  );
}
