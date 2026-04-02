import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/5 p-8 shadow-card backdrop-blur-xl md:p-10">
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-orange-500/35 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-400/20 blur-3xl" />

        <div className="relative z-10 grid gap-8 md:grid-cols-[1.25fr_0.75fr] md:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-orange-100/90">AutoEIT Research Prototype</p>
            <h2 className="mt-3 max-w-2xl text-5xl font-bold leading-[0.95] text-white md:text-7xl">
              <span>Craft your</span>
              <br />
              <span className="bg-gradient-to-r from-orange-100 via-orange-300 to-orange-500 bg-clip-text text-transparent">
                scoring presence
              </span>
            </h2>
            <p className="mt-5 max-w-2xl text-lg text-slate-200/95">
              A research copilot for transparent EIT evaluation — from rubric-based interpretation to scalable,
              reproducible scoring workflows.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/scoring"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-orange-100"
              >
                Build scoring report
              </Link>
              <Link
                to="/results"
                className="rounded-full border border-white/30 bg-white/5 px-6 py-3 text-sm font-medium text-slate-100 backdrop-blur transition hover:border-orange-200/70 hover:bg-orange-400/10"
              >
                Open dashboard
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <InsightCard title="AI Rubric Engine" text="Consistent lexical, morphosyntactic, and semantic scoring in seconds." />
            <InsightCard title="Explainable Decisions" text="Penalty traces, triggered rules, and token-level mismatch diagnostics." />
          </div>
        </div>

        <div className="relative z-10 mt-8 grid gap-4 md:grid-cols-3">
          <FeatureCard
            title="Brand Identity"
            text="Human-readable score narratives and publication-ready interpretability outputs."
          />
          <FeatureCard
            title="Content Generator"
            text="CSV-scale scoring with deterministic outputs for reliability and replication."
            highlighted
          />
          <FeatureCard
            title="Digital Presence"
            text="Exportable CSV, JSON, and PDF reports for thesis and mentor demonstration."
          />
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
  highlighted?: boolean;
};

function FeatureCard({ title, text, highlighted = false }: FeatureCardProps) {
  return (
    <article
      className={`rounded-2xl border p-5 backdrop-blur ${
        highlighted
          ? 'border-white/35 bg-white/90 text-slate-900'
          : 'border-white/20 bg-white/10 text-slate-100'
      }`}
    >
      <h3 className={`text-2xl font-semibold ${highlighted ? 'text-slate-900' : 'text-white'}`}>{title}</h3>
      <p className={`mt-2 text-sm ${highlighted ? 'text-slate-700' : 'text-slate-200/90'}`}>{text}</p>
    </article>
  );
}

type InsightCardProps = {
  title: string;
  text: string;
};

function InsightCard({ title, text }: InsightCardProps) {
  return (
    <article className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
      <h3 className="text-2xl font-semibold text-orange-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-200/90">{text}</p>
    </article>
  );
}

export default LandingPage;
