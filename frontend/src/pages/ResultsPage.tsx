import DashboardPanel from '../components/DashboardPanel';
import type { BatchRecord, ScoreResponse } from '../types/scoring';

type ResultsPageProps = {
  latestResult: ScoreResponse | null;
  batchRecords: BatchRecord[];
};

function ResultsPage({ latestResult, batchRecords }: ResultsPageProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-card">
        <h2 className="text-2xl font-semibold text-cyan-200">Results Overview</h2>
        <p className="mt-2 text-sm text-slate-300">
          Review total score outcomes, confidence signals, and consistency indicators for ongoing analysis.
        </p>
      </section>

      <DashboardPanel latestResult={latestResult} batchRecords={batchRecords} />

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-card">
        <h3 className="text-lg font-semibold text-slate-100">Batch response table</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="px-2 py-2">Sentence ID</th>
                <th className="px-2 py-2">Transcription</th>
                <th className="px-2 py-2">Score</th>
                <th className="px-2 py-2">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {batchRecords.length === 0 ? (
                <tr>
                  <td className="px-2 py-4 text-slate-500" colSpan={4}>
                    No batch results yet.
                  </td>
                </tr>
              ) : (
                batchRecords.map((record) => (
                  <tr key={record.sentence_id} className="border-b border-slate-800 text-slate-200">
                    <td className="px-2 py-2">{record.sentence_id}</td>
                    <td className="px-2 py-2">{record.transcription}</td>
                    <td className="px-2 py-2">{record.score}/15</td>
                    <td className="px-2 py-2">{Math.round(record.confidence * 100)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ResultsPage;
