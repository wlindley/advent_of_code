import { useEffect, useMemo, useRef, useState } from 'react';
import { formatPartKey, type PuzzlePart } from '../shared/core';
import { DashboardView } from './components/DashboardView';
import { DayNavBar } from './components/DayNavBar';
import { InProgressPanel } from './components/InProgressPanel';
import { SolvedPartView } from './components/SolvedPartView';
import rawQuality from './data/quality.json';
import { filterFilesForScope, findPartQuality, type QualityReport } from './data/quality';
import { findActiveParts, findPartRecord } from './data/status';
import { loadStatusDocument } from './data/status/index';
import rawTokenUsage from './data/tokenUsage.json';
import type { TokenUsageReport } from './data/tokenUsage';
import { VersionMonitor } from './data/versionMonitor';
import {
  type DashboardTab,
  type MetricsScope,
  normalizeRouteKey,
  resolveMetricsScope,
  resolveSelectedYear,
  ViewStateStore,
} from './data/viewState';
import { getPartManifest } from './registry';

const POLL_INTERVAL_MS = 30_000;

function createBrowserViewStore(): ViewStateStore {
  try {
    return new ViewStateStore(window.sessionStorage, window.localStorage);
  } catch {
    return new ViewStateStore(null, null);
  }
}

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
  const statusDoc = useMemo(() => loadStatusDocument(), []);
  const availableYears = useMemo(() => statusDoc.years.map((y) => y.year), [statusDoc]);
  const viewStore = useMemo(() => createBrowserViewStore(), []);
  const initialView = useMemo(() => viewStore.load(), [viewStore]);
  const qualityReport = rawQuality as unknown as QualityReport;
  const tokenUsage = rawTokenUsage as unknown as TokenUsageReport;

  const [routeKey, setRouteKey] = useState<string>(() => normalizeRouteKey(window.location.hash));
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const [selectedYear, setSelectedYear] = useState<number>(() =>
    resolveSelectedYear(initialView.selectedYear, availableYears),
  );
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>(() => initialView.dashboardTab);
  const [metricsScope, setMetricsScope] = useState<MetricsScope>(() =>
    resolveMetricsScope(initialView.metricsScope, availableYears),
  );
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [updatePending, setUpdatePending] = useState(false);
  const routeKeyRef = useRef(routeKey);
  routeKeyRef.current = routeKey;

  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    viewStore.saveSelection({ selectedYear: year });
  };

  const handleSelectTab = (tab: DashboardTab) => {
    setDashboardTab(tab);
    viewStore.saveSelection({ dashboardTab: tab });
  };

  const handleSelectMetricsScope = (scope: MetricsScope) => {
    setMetricsScope(scope);
    viewStore.saveSelection({ metricsScope: scope });
  };

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    const onHashChange = () => {
      viewStore.saveScroll(routeKeyRef.current, window.scrollY);
      const nextKey = normalizeRouteKey(window.location.hash);
      routeKeyRef.current = nextKey;
      setRouteKey(nextKey);
      setRoute(parseHash(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [viewStore]);

  useEffect(() => {
    let rafId = 0;
    const persistScroll = () => {
      rafId = 0;
      viewStore.saveScroll(routeKeyRef.current, window.scrollY);
    };
    const onScroll = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(persistScroll);
    };
    const flushNow = () => viewStore.saveScroll(routeKeyRef.current, window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', flushNow);
    window.addEventListener('beforeunload', flushNow);
    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', flushNow);
      window.removeEventListener('beforeunload', flushNow);
    };
  }, [viewStore]);

  useEffect(() => {
    const savedY = viewStore.readScroll(routeKey);
    let innerRaf = 0;
    const outerRaf = window.requestAnimationFrame(() => {
      innerRaf = window.requestAnimationFrame(() => {
        window.scrollTo({ top: savedY, left: 0, behavior: 'instant' });
      });
    });
    return () => {
      window.cancelAnimationFrame(outerRaf);
      if (innerRaf !== 0) window.cancelAnimationFrame(innerRaf);
    };
  }, [routeKey, viewStore]);

  useEffect(() => {
    if (!autoRefresh) return;
    const reloadPreservingScroll = () => {
      viewStore.saveScroll(routeKeyRef.current, window.scrollY);
      window.location.reload();
    };
    const monitor = new VersionMonitor({
      currentBuildId: __APP_BUILD_ID__,
      fetchBuildId: fetchRemoteBuildId,
      isReloadSafe,
      onUpdate: reloadPreservingScroll,
    });
    const poll = () => {
      if (document.visibilityState !== 'visible') return;
      void monitor.checkNow().then(() => {
        if (monitor.hasPendingUpdate) setUpdatePending(true);
      });
    };
    const onFocusOut = () => monitor.flushPending();
    const timer = window.setInterval(poll, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', poll);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', poll);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, [autoRefresh, viewStore]);

  const activeParts = findActiveParts(statusDoc);

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="#/">Advent of Code · Autonomous Solver</a>
        <nav className="nav" aria-label="Primary">
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
          <button
            type="button"
            className="primary"
            onClick={() => {
              viewStore.saveScroll(routeKeyRef.current, window.scrollY);
              window.location.reload();
            }}
          >
            Reload now
          </button>
        </div>
      )}

      <main>
        {route.kind === 'dashboard' && (
          <DashboardView
            statusDoc={statusDoc}
            qualityReport={qualityReport}
            tokenUsage={tokenUsage}
            activeTab={dashboardTab}
            onSelectTab={handleSelectTab}
            selectedYear={selectedYear}
            onSelectYear={handleSelectYear}
            metricsScope={metricsScope}
            onSelectMetricsScope={handleSelectMetricsScope}
          />
        )}

        {route.kind === 'in_progress' && (
          activeParts.length === 0 ? (
            <section className="card">No puzzle parts are currently in progress.</section>
          ) : (
            activeParts.map((record) =>
              record.status === 'in_progress' || record.status === 'blocked' ? (
                <InProgressPanel
                  key={`${record.year}-${record.day}-${record.part}`}
                  record={record}
                  siblingPartStatus={findPartRecord(statusDoc, record.year, record.day, record.part === 1 ? 2 : 1)?.status}
                />
              ) : null,
            )
          )
        )}

        {route.kind === 'part' && (() => {
          const record = findPartRecord(statusDoc, route.year, route.day, route.part);
          const sibling = findPartRecord(statusDoc, route.year, route.day, route.part === 1 ? 2 : 1);
          if (!record || record.status === 'pending') {
            return (
              <>
                <DayNavBar
                  year={route.year}
                  day={route.day}
                  activePart={route.part}
                  part1Status={route.part === 1 ? 'pending' : sibling?.status}
                  part2Status={route.part === 2 ? 'pending' : sibling?.status}
                />
                <section className="card">
                  <h2>{route.year} Day {route.day} Part {route.part}</h2>
                  <p className="muted">This puzzle part has not been started yet.</p>
                  <a href={`https://adventofcode.com/${route.year}/day/${route.day}`} target="_blank" rel="noreferrer">
                    Official Puzzle Page ↗
                  </a>
                </section>
              </>
            );
          }
          if (record.status === 'solved') {
            const key = formatPartKey(route.year, route.day, route.part);
            return (
              <SolvedPartView
                record={record}
                manifest={getPartManifest(route.year, route.day, route.part)}
                quality={findPartQuality(qualityReport, key)}
                qualityFiles={filterFilesForScope(qualityReport.files, key)}
                siblingPartStatus={sibling?.status}
              />
            );
          }
          return <InProgressPanel record={record} siblingPartStatus={sibling?.status} />;
        })()}
      </main>
    </div>
  );
}
