import { formatDayFolder, type PuzzlePart } from '../../shared/core';

export interface DayNavBarProps {
  readonly year: number;
  readonly day: number;
  readonly activePart: PuzzlePart;
  readonly part1Status?: string;
  readonly part2Status?: string;
}

function statusBadge(status?: string): string {
  if (status === 'solved') return ' ★';
  if (status === 'in_progress') return ' ◐';
  if (status === 'blocked') return ' !';
  return '';
}

export function DayNavBar({
  year,
  day,
  activePart,
  part1Status,
  part2Status,
}: DayNavBarProps) {
  const dayPath = `#/${year}/${formatDayFolder(day)}`;
  return (
    <nav className="day-nav" aria-label={`Day ${day} part navigation`}>
      <a href="#/">← Dashboard</a>
      <div className="day-nav-parts">
        <a
          href={`${dayPath}/part1`}
          className={`day-nav-pill${activePart === 1 ? ' active' : ''}`}
          aria-current={activePart === 1 ? 'page' : undefined}
        >
          Part 1{statusBadge(part1Status)}
        </a>
        <a
          href={`${dayPath}/part2`}
          className={`day-nav-pill${activePart === 2 ? ' active' : ''}`}
          aria-current={activePart === 2 ? 'page' : undefined}
        >
          Part 2{statusBadge(part2Status)}
        </a>
      </div>
    </nav>
  );
}
