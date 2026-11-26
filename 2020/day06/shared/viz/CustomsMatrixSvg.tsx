import { QUESTION_COUNT, QUESTION_LETTERS, hasQuestion } from '../index';
import type { ConsensusPolicyId, CustomsGroup, CustomsTraceFrame, PersonDeclaration } from '../index';

export interface CustomsMatrixSvgProps {
  readonly frame: CustomsTraceFrame;
  readonly policyId: ConsensusPolicyId;
}

const MAX_VISIBLE_PEOPLE = 16;
const PAD_X = 56;
const COL_PITCH = 20;
const CELL_W = 16;
const ROW_PITCH = 14;
const CELL_H = 10;
const BAR_MAX_H = 24;
const SVG_W = PAD_X + QUESTION_COUNT * COL_PITCH + 12;

function colX(q: number): number {
  return PAD_X + q * COL_PITCH;
}

function MatrixLegend() {
  return (
    <div className="chart-legend" style={{ fontSize: '0.76rem' }}>
      <span className="chart-legend-item">
        <span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--ok)' }} />
        Unanimous (AND)
      </span>
      <span className="chart-legend-item">
        <span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--warn)' }} />
        Partial (OR only)
      </span>
      <span className="chart-legend-item">
        <span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--accent)' }} />
        Person &ldquo;yes&rdquo;
      </span>
    </div>
  );
}

function PersonRow({ person, index, y }: { readonly person: PersonDeclaration; readonly index: number; readonly y: number }) {
  return (
    <g>
      <text x={PAD_X - 8} y={y + 8} textAnchor="end" className="chart-axis-text">P{index + 1}</text>
      {QUESTION_LETTERS.map((ch, q) => {
        const yes = person.answered(q);
        return (
          <rect
            key={ch} x={colX(q)} y={y} width={CELL_W} height={CELL_H} rx={2}
            fill={yes ? 'var(--accent)' : 'var(--bg)'} fillOpacity={yes ? 0.85 : 1}
            stroke="var(--border)" strokeWidth={0.75}
          />
        );
      })}
    </g>
  );
}

function VoteBars({ group, baseY }: { readonly group: CustomsGroup; readonly baseY: number }) {
  return (
    <g>
      <text x={PAD_X - 8} y={baseY - 4} textAnchor="end" className="chart-axis-text">Votes</text>
      {QUESTION_LETTERS.map((ch, q) => {
        const count = group.countResponders(q);
        const h = count === 0 ? 2 : Math.max(3, Math.round((count / group.size) * BAR_MAX_H));
        const fill = count === 0 ? 'var(--border)' : count === group.size ? 'var(--ok)' : 'var(--warn)';
        return <rect key={ch} x={colX(q)} y={baseY - h} width={CELL_W} height={h} rx={1.5} fill={fill} />;
      })}
    </g>
  );
}

function StripRow({ label, y, mask, unanimousMask, active }: {
  readonly label: string; readonly y: number; readonly mask: number; readonly unanimousMask: number; readonly active: boolean;
}) {
  return (
    <g>
      <text x={PAD_X - 8} y={y + 9} textAnchor="end" className="chart-axis-text" fontWeight={active ? 700 : 400}>{label}</text>
      {active && <rect x={PAD_X - 3} y={y - 2} width={QUESTION_COUNT * COL_PITCH - 1} height={CELL_H + 4} rx={3} fill="none" stroke="var(--text)" strokeWidth={1.2} />}
      {QUESTION_LETTERS.map((ch, q) => {
        const isSet = hasQuestion(mask, q);
        const fill = !isSet ? 'var(--bg)' : hasQuestion(unanimousMask, q) ? 'var(--ok)' : 'var(--warn)';
        return <rect key={ch} x={colX(q)} y={y} width={CELL_W} height={CELL_H} rx={2} fill={fill} stroke="var(--border)" strokeWidth={0.75} />;
      })}
    </g>
  );
}

/** 26-column (a-z) responder matrix, bar chart, and OR/AND consensus strips for one group. */
export function CustomsMatrixSvg({ frame, policyId }: CustomsMatrixSvgProps) {
  const { group } = frame;
  const visibleCount = Math.min(group.size, MAX_VISIBLE_PEOPLE);
  const hiddenCount = group.size - visibleCount;
  const rowsTop = 24;
  const barBaseY = rowsTop + visibleCount * ROW_PITCH + (hiddenCount > 0 ? 16 : 0) + BAR_MAX_H + 8;
  const orY = barBaseY + 10;
  const andY = orY + 16;

  return (
    <div className="chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <strong style={{ fontSize: '0.88rem' }}>
          Group #{frame.groupNumber} Matrix ({group.size} {group.size === 1 ? 'person' : 'people'} × 26 questions)
        </strong>
        <MatrixLegend />
      </div>
      <svg viewBox={`0 0 ${SVG_W} ${andY + CELL_H + 14}`} className="chart-svg" role="img" aria-label={`Group ${frame.groupNumber} question matrix`}>
        {QUESTION_LETTERS.map((ch, q) => (
          <text key={ch} x={colX(q) + CELL_W / 2} y={14} textAnchor="middle" className="chart-axis-text">{ch}</text>
        ))}
        {group.people.slice(0, visibleCount).map((person, pIdx) => (
          <PersonRow key={pIdx} person={person} index={pIdx} y={rowsTop + pIdx * ROW_PITCH} />
        ))}
        {hiddenCount > 0 && (
          <text x={PAD_X} y={rowsTop + visibleCount * ROW_PITCH + 11} className="chart-axis-text">+{hiddenCount} more people in group</text>
        )}
        <VoteBars group={group} baseY={barBaseY} />
        <StripRow label="OR" y={orY} mask={frame.anyYesMask} unanimousMask={frame.allYesMask} active={policyId === 'any-yes'} />
        <StripRow label="AND" y={andY} mask={frame.allYesMask} unanimousMask={frame.allYesMask} active={policyId === 'all-yes'} />
      </svg>
    </div>
  );
}
