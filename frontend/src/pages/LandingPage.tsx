import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-card">
        <p className="text-xs uppercase tracking-widest text-cyan-300">AutoEIT Research Prototype</p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight text-slate-100">
          Standardized, transparent scoring for Spanish Elicited Imitation Task responses
        </h2>
        <p className="mt-4 max-w-3xl text-slate-300">
          AutoEIT addresses scoring inconsistency across raters by providing reproducible, rubric-aligned,
          model-based evaluation. The platform enables rapid analysis of single responses and large transcription
          batches while preserving interpretability for research reporting.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/scoring"
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
          >
            Start scoring workflow
          </Link>
          <Link
            to="/results"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-300 hover:text-cyan-200"
          >
            View results dashboard
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <FeatureCard
          title="Scoring consistency"
          text="Deterministic scoring behavior reduces variance and supports methodological reliability."
        />
        <FeatureCard
          title="Rubric explainability"
          text="Every score is accompanied by rubric breakdowns, triggered rules, and penalty traces."
        />
        <FeatureCard
          title="Research scalability"
          text="Batch mode supports high-throughput CSV analysis for larger datasets and replication studies."
        />
      </section>
    </div>
  );
}

type FeatureCardProps = {
  title: string;
  text: string;
};

function FeatureCard({ title, text }: FeatureCardProps) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      <h3 className="text-lg font-medium text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{text}</p>
    </article>
  );
}

export default LandingPage;
