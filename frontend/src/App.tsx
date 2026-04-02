import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useMemo, useState } from 'react';
import LandingPage from './pages/LandingPage.tsx';
import ScoringPage from './pages/ScoringPage.tsx';
import ResultsPage from './pages/ResultsPage.tsx';
import type { BatchRecord, ScoreResponse } from './types/scoring.ts';

function App() {
  const [latestResult, setLatestResult] = useState<ScoreResponse | null>(null);
  const [batchRecords, setBatchRecords] = useState<BatchRecord[]>([]);

  const analyzedCount = useMemo(
    () => batchRecords.length + (latestResult ? 1 : 0),
    [batchRecords.length, latestResult],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_8%_82%,rgba(249,115,22,0.25),transparent_30%),radial-gradient(circle_at_85%_12%,rgba(249,115,22,0.22),transparent_35%),linear-gradient(180deg,#07131b_0%,#0c1d28_52%,#121b23_100%)] text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/35 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-wide text-white">AutoEIT</h1>
            <p className="text-xs text-slate-300/90">Automated Scoring for Spanish Elicited Imitation Tasks</p>
          </div>
          <nav className="flex items-center gap-5 text-sm">
            <Link to="/" className="text-slate-200 transition hover:text-orange-200">Overview</Link>
            <Link to="/scoring" className="text-slate-200 transition hover:text-orange-200">Scoring</Link>
            <Link to="/results" className="text-slate-200 transition hover:text-orange-200">Results</Link>
            <span className="rounded-full border border-orange-300/40 bg-orange-400/10 px-3 py-1 text-xs text-orange-100">
              {analyzedCount} analyzed
            </span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/scoring"
            element={
              <ScoringPage
                latestResult={latestResult}
                batchRecords={batchRecords}
                onSingleResult={setLatestResult}
                onBatchResult={setBatchRecords}
              />
            }
          />
          <Route
            path="/results"
            element={<ResultsPage latestResult={latestResult} batchRecords={batchRecords} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
