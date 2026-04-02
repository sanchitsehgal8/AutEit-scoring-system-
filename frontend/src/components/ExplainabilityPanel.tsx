import type { Explainability } from '../types/scoring';

type ExplainabilityPanelProps = {
  explainability: Explainability;
};

function ExplainabilityPanel({ explainability }: ExplainabilityPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-card">
      <h3 className="mb-4 text-lg font-semibold text-cyan-200">Explainability Panel</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-200">Triggered rubric rules</p>
          <ul className="space-y-1 text-sm text-slate-300">
            {explainability.triggered_rules.map((rule) => (
              <li key={rule}>• {rule}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-200">Penalties applied</p>
          <ul className="space-y-1 text-sm text-slate-300">
            {explainability.penalties.length > 0 ? (
              explainability.penalties.map((penalty) => <li key={penalty}>• {penalty}</li>)
            ) : (
              <li>• No penalties applied</li>
            )}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-200">Token mismatch diagnostics</p>
          <ul className="space-y-1 text-sm text-slate-300">
            {explainability.token_mismatches.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-700 p-4">
          <p className="text-sm text-slate-300">Meaning preserved</p>
          <p className={`text-xl font-semibold ${explainability.meaning_preserved ? 'text-emerald-300' : 'text-rose-300'}`}>
            {explainability.meaning_preserved ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
    </section>
  );
}

export default ExplainabilityPanel;
