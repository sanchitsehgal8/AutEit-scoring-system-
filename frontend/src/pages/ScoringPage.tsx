import { useMemo, useState, type ChangeEvent } from 'react';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import ExplainabilityPanel from '../components/ExplainabilityPanel';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ResultCard from '../components/ResultCard';
import { exportBatchCsv, scoreBatch, scoreTranscription } from '../lib/api';
import type { BatchRecord, ScoreResponse } from '../types/scoring';

type ScoringPageProps = {
  latestResult: ScoreResponse | null;
  batchRecords: BatchRecord[];
  onSingleResult: (result: ScoreResponse | null) => void;
  onBatchResult: (records: BatchRecord[]) => void;
};

function ScoringPage({ latestResult, batchRecords, onSingleResult, onBatchResult }: ScoringPageProps) {
  const [stimulus, setStimulus] = useState('');
  const [transcription, setTranscription] = useState('');
  const [humanScore, setHumanScore] = useState('');
  const [isScoring, setIsScoring] = useState(false);
  const [isBatchScoring, setIsBatchScoring] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState('');

  const progressLabel = useMemo(() => {
    if (isBatchScoring) return 'Scoring batch responses...';
    if (isScoring) return 'Scoring response...';
    return '';
  }, [isBatchScoring, isScoring]);

  const handleScore = async () => {
    if (!transcription.trim()) {
      setErrorText('Please enter a transcription sentence.');
      return;
    }

    setErrorText('');
    setStatusText('');
    setIsScoring(true);
    try {
      const parsedHuman = humanScore === '' ? undefined : Number(humanScore);
      const result = await scoreTranscription(transcription, parsedHuman, stimulus);
      onSingleResult(result);
      setStatusText('Scoring completed successfully.');
    } catch (error) {
      setErrorText('Unable to score transcription. Check backend connection.');
    } finally {
      setIsScoring(false);
    }
  };

  const handleBatchUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorText('');
    setStatusText('');
    setIsBatchScoring(true);
    try {
      const response = await scoreBatch(file);
      onBatchResult(response.records);
      setStatusText(`Batch completed. ${response.total_rows} responses analyzed.`);
    } catch (error) {
      setErrorText('Batch scoring failed. Ensure the CSV has sentence_id and transcription columns.');
    } finally {
      setIsBatchScoring(false);
      event.target.value = '';
    }
  };

  const exportJson = () => {
    const payload = {
      latestResult,
      batchRecords,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    saveAs(blob, 'autoeit_report.json');
  };

  const exportCsv = async () => {
    if (!batchRecords.length) {
      setErrorText('Batch export requires at least one batch record.');
      return;
    }

    const blob = await exportBatchCsv(batchRecords);
    saveAs(blob, 'autoeit_batch_scores.csv');
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('AutoEIT Scoring Report', 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);

    let y = 36;
    if (latestResult) {
      doc.text(`Sentence: ${latestResult.sentence}`, 14, y);
      y += 7;
      doc.text(`Total score: ${latestResult.score}/15`, 14, y);
      y += 7;
      doc.text(`Confidence: ${Math.round(latestResult.confidence * 100)}%`, 14, y);
      y += 10;
    }

    doc.text(`Batch records: ${batchRecords.length}`, 14, y);
    y += 7;
    batchRecords.slice(0, 10).forEach((record) => {
      doc.text(`${record.sentence_id}: ${record.score}/15 (${Math.round(record.confidence * 100)}%)`, 14, y);
      y += 6;
    });

    doc.save('autoeit_report.pdf');
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-card">
        <h2 className="text-xl font-semibold text-cyan-200">Scoring Workflow</h2>

        <label className="block text-sm text-slate-300">
          Stimulus sentence (recommended)
          <textarea
            className="mt-2 min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring"
            value={stimulus}
            onChange={(e) => setStimulus(e.target.value)}
            placeholder="Enter the original target sentence shown in EIT"
          />
        </label>

        <label className="block text-sm text-slate-300">
          Transcription input
          <textarea
            className="mt-2 min-h-24 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring"
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            placeholder="Enter a learner transcription sentence"
          />
        </label>

        <label className="block max-w-xs text-sm text-slate-300">
          Optional human score (0-15)
          <input
            type="number"
            min={0}
            max={15}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring"
            value={humanScore}
            onChange={(e) => setHumanScore(e.target.value)}
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleScore}
            disabled={isScoring}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-800"
          >
            {isScoring ? 'Scoring...' : 'Submit for scoring'}
          </button>

          <label className="cursor-pointer rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300 hover:text-cyan-200">
            Upload CSV batch
            <input type="file" accept=".csv" className="hidden" onChange={handleBatchUpload} />
          </label>

          <button
            type="button"
            onClick={exportCsv}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300 hover:text-cyan-200"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={exportJson}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300 hover:text-cyan-200"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={exportPdf}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300 hover:text-cyan-200"
          >
            Export PDF
          </button>
        </div>

        {progressLabel ? (
          <div className="rounded-lg border border-cyan-900/60 bg-cyan-900/20 px-3 py-2 text-sm text-cyan-200">
            {progressLabel}
          </div>
        ) : null}
        {statusText ? (
          <div className="rounded-lg border border-emerald-900/60 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-300">
            {statusText}
          </div>
        ) : null}
        {errorText ? (
          <div className="rounded-lg border border-rose-900/60 bg-rose-900/20 px-3 py-2 text-sm text-rose-300">
            {errorText}
          </div>
        ) : null}
        <p className="text-xs text-slate-400">
          Tip: include the stimulus sentence for robust scoring. Batch CSV can also include an optional
          <span className="font-semibold text-slate-300"> stimulus </span>column.
        </p>
      </section>

      {(isScoring || isBatchScoring) && <LoadingSkeleton />}

      {latestResult ? (
        <>
          <ResultCard result={latestResult} />
          <ExplainabilityPanel explainability={latestResult.explainability} />
        </>
      ) : null}
    </div>
  );
}

export default ScoringPage;
