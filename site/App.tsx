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
import { VersionMonitor } from './data/versionMonitor';
import { getPartManifest } from './registry';

const POLL_INTERVAL_MS = 30_000;

async function fetchRemoteBuildId(): Promise<string | null> {
  const response = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) return null;
  const data = (await response.json()) as { buildId?: unknown };
  return typeof data.buildId === 'string' ? data.buildId : null;
}

function isReloadSafe(): boolean {
  const active = document.activeElement;
  return !(active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement);
}

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
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [updatePending, setUpdatePending] = useState(false);

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const monitor = new VersionMonitor({
      currentBuildId: __APP_BUILD_ID__,
      fetchBuildId: fetchRemoteBuildId,
      isReloadSafe,
      onUpdate: () => window.location.reload(),
    });
    const poll = () => {
      if (document.visibilityState !== 'visible') return;
      void monitor.checkNow().then(() => {
        if (monitor.hasPendingUpdate) setUpdatePending(true);
      });
    };
    const onFocusOut = () => {
      monitor.flushPending();
    };
    const timer = window.setInterval(poll, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', poll);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', poll);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, [autoRefresh]);

  const activeParts = findActiveParts(statusDoc);

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="#/">Advent of Code · Autonomous Solver</a>
        <nav className="nav" aria-label="Primary navigation">
          <a href="#/">Dashboard</a>
          <a href="#/in-progress">In Progress ({activeParts.length})</a>
          <button type="button" onClick={() => setAutoRefresh((enabled) => !enabled)}>
            Auto-refresh: {autoRefresh ? 'On' : 'Off'}
          </button>
          <a href="https://github.com/wlindley/advent_of_code" target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
      </header>
      {updatePending && (
        <div className="card meta-row" role="status">
          <span>A newer deployment is live.</span>
          <button type="button" className="primary" onClick={() => window.location.reload()}>
            Reload now
          </button>
        </div>
      )}

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
