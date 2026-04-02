import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BatchRecord, ScoreResponse } from '../types/scoring';

type DashboardPanelProps = {
  latestResult: ScoreResponse | null;
  batchRecords: BatchRecord[];
};

type HistogramBucket = {
  band: string;
  count: number;
};

function toBand(score: number): string {
  if (score >= 13) return '13-15';
  if (score >= 10) return '10-12';
  if (score >= 7) return '7-9';
  return '0-6';
}

function DashboardPanel({ latestResult, batchRecords }: DashboardPanelProps) {
  const scores = [
    ...batchRecords.map((record) => record.score),
    ...(latestResult ? [latestResult.score] : []),
  ];

  const responsesAnalyzed = scores.length;
  const averageScore = responsesAnalyzed
    ? (scores.reduce((acc, score) => acc + score, 0) / responsesAnalyzed).toFixed(2)
    : '0.00';

  const confidenceValues = [
    ...batchRecords.map((record) => record.confidence),
    ...(latestResult ? [latestResult.confidence] : []),
  ];

  const consistencyConfidence = confidenceValues.length
    ? Math.round(
        (confidenceValues.reduce((acc, value) => acc + value, 0) / confidenceValues.length) * 100,
      )
    : 0;

  const histogram = scores.reduce<Record<string, number>>((acc, score) => {
    const band = toBand(score);
    acc[band] = (acc[band] ?? 0) + 1;
    return acc;
  }, {});

  const histogramData: HistogramBucket[] = ['0-6', '7-9', '10-12', '13-15'].map((band) => ({
    band,
    count: histogram[band] ?? 0,
  }));

  return (
    <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-card">
      <h3 className="text-lg font-semibold text-cyan-200">Researcher Dashboard</h3>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Responses analyzed" value={String(responsesAnalyzed)} />
        <Metric title="Average learner score" value={`${averageScore} / 15`} />
        <Metric title="Consistency confidence" value={`${consistencyConfidence}%`} />
        <Metric title="Scoring mode" value="Deterministic" />
      </div>

      <div className="h-64 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <p className="mb-2 text-sm text-slate-300">Score distribution histogram</p>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={histogramData}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="band" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" allowDecimals={false} />
            <Tooltip cursor={{ fill: '#1e293b' }} />
            <Bar dataKey="count" fill="#22d3ee" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

type MetricProps = {
  title: string;
  value: string;
};

function Metric({ title, value }: MetricProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs text-slate-400">{title}</p>
      <p className="mt-1 text-xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}

export default DashboardPanel;
