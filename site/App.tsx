import { useEffect, useMemo, useState } from 'react';
import type { PuzzlePart } from '../shared/core';
import { DashboardView } from './components/DashboardView';
import { InProgressPanel } from './components/InProgressPanel';
import { SolvedPartView } from './components/SolvedPartView';
import rawStatus from './data/status.json';
import {
  findActiveParts,
  findPartRecord,
  validateStatusDocument,
  type StatusDocument,
} from './data/status';
import { getPartManifest } from './registry';

type Route =
  | { readonly kind: 'dashboard' }
  | { readonly kind: 'in_progress' }
  | { readonly kind: 'part'; readonly year: number; readonly day: number; readonly part: PuzzlePart };

function parseHash(hash: string): Route {
  const cleaned = hash.replace(/^#\/?/, '');
  if (cleaned === 'in-progress') return { kind: 'in_progress' };
  const match = cleaned.match(/^(\d{4})\/day(\d{2})\/part([12])$/);
  if (match) {
    return { kind: 'part', year: Number(match[1]!), day: Number(match[2]!), part: Number(match[3]!) as PuzzlePart };
  }
  return { kind: 'dashboard' };
}

export function App() {
  const statusDoc = useMemo(() => validateStatusDocument(rawStatus as unknown as StatusDocument), []);
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const [selectedYear, setSelectedYear] = useState<number>(statusDoc.years[0]?.year ?? 2025);

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const activeParts = findActiveParts(statusDoc);

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="#/">Advent of Code · Autonomous Solver</a>
        <nav className="nav" aria-label="Primary navigation">
          <a href="#/">Dashboard</a>
          <a href="#/in-progress">In Progress ({activeParts.length})</a>
          <a href="https://github.com/wlindley/advent_of_code" target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
      </header>

      <main>
        {route.kind === 'dashboard' && (
          <DashboardView statusDoc={statusDoc} selectedYear={selectedYear} onSelectYear={setSelectedYear} />
        )}

        {route.kind === 'in_progress' && (
          activeParts.length === 0 ? (
            <section className="card">No puzzle parts are currently in progress.</section>
          ) : (
            activeParts.map((record) =>
              record.status === 'in_progress' || record.status === 'blocked' ? (
                <InProgressPanel key={`${record.year}-${record.day}-${record.part}`} record={record} />
              ) : null,
            )
          )
        )}

        {route.kind === 'part' && (() => {
          const record = findPartRecord(statusDoc, route.year, route.day, route.part);
          if (!record || record.status === 'pending') {
            return (
              <section className="card">
                <h2>{route.year} Day {route.day} Part {route.part}</h2>
                <p className="muted">This puzzle part has not been started yet.</p>
                <a href={`https://adventofcode.com/${route.year}/day/${route.day}`} target="_blank" rel="noreferrer">
                  Official Puzzle Page ↗
                </a>
              </section>
            );
          }
          if (record.status === 'solved') {
            return <SolvedPartView record={record} manifest={getPartManifest(route.year, route.day, route.part)} />;
          }
          return <InProgressPanel record={record} />;
        })()}
      </main>
    </div>
  );
}
