import type { ScoreResponse } from '../types/scoring';
import ScoreIndicator from './ScoreIndicator';

type ResultCardProps = {
  result: ScoreResponse;
};

function ResultCard({ result }: ResultCardProps) {
  return (
    <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">Scored sentence</p>
          <p className="mt-1 text-base text-slate-100">{result.sentence}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-slate-400">Total EIT score</p>
          <p className="text-3xl font-bold text-cyan-300">{result.score}/15</p>
          <p className="text-sm text-slate-300">{result.comparison_band}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ScoreIndicator label="Lexical accuracy" value={result.rubric_breakdown.lexical_accuracy} />
        <ScoreIndicator label="Morphosyntactic accuracy" value={result.rubric_breakdown.morphosyntactic_accuracy} />
        <ScoreIndicator label="Semantic preservation" value={result.rubric_breakdown.semantic_preservation} />
      </div>

      <div className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4 md:grid-cols-3">
        <div>
          <p className="text-xs text-slate-400">Rubric explanation</p>
          <p className="mt-1 text-sm text-slate-200">{result.rubric_explanation}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Confidence score</p>
          <p className="mt-1 text-lg font-semibold text-cyan-200">{Math.round(result.confidence * 100)}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Comparison band</p>
          <p className="mt-1 text-lg font-semibold text-emerald-300">{result.comparison_band}</p>
        </div>
      </div>

      {result.validation ? (
        <div className="rounded-xl border border-cyan-900/60 bg-cyan-950/20 p-4">
          <p className="text-xs text-cyan-100">Human score vs AutoEIT score</p>
          <p className="mt-1 text-sm text-slate-200">
            Agreement with human rating: {result.validation.agreement_percentage.toFixed(1)}% | Score deviation:{' '}
            {result.validation.score_deviation.toFixed(1)}
          </p>
        </div>
      ) : null}
    </section>
  );
}

export default ResultCard;
