import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useMemo, useState } from 'react';
import LandingPage from './pages/LandingPage';
import ScoringPage from './pages/ScoringPage';
import ResultsPage from './pages/ResultsPage';
import type { BatchRecord, ScoreResponse } from './types/scoring';

function App() {
  const [latestResult, setLatestResult] = useState<ScoreResponse | null>(null);
  const [batchRecords, setBatchRecords] = useState<BatchRecord[]>([]);

  const analyzedCount = useMemo(
    () => batchRecords.length + (latestResult ? 1 : 0),
    [batchRecords.length, latestResult],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-wide text-cyan-300">AutoEIT</h1>
            <p className="text-xs text-slate-400">Automated Scoring for Spanish Elicited Imitation Tasks</p>
          </div>
          <nav className="flex items-center gap-5 text-sm">
            <Link to="/" className="text-slate-300 transition hover:text-cyan-300">Overview</Link>
            <Link to="/scoring" className="text-slate-300 transition hover:text-cyan-300">Scoring</Link>
            <Link to="/results" className="text-slate-300 transition hover:text-cyan-300">Results</Link>
            <span className="rounded-full border border-cyan-400/40 px-3 py-1 text-xs text-cyan-200">
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
