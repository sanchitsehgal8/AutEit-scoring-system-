export type RubricBreakdown = {
  lexical_accuracy: number;
  morphosyntactic_accuracy: number;
  semantic_preservation: number;
};

export type Explainability = {
  triggered_rules: string[];
  penalties: string[];
  token_mismatches: string[];
  meaning_preserved: boolean;
};

export type Validation = {
  agreement_percentage: number;
  score_deviation: number;
};

export type ScoreResponse = {
  sentence: string;
  score: number;
  rubric_breakdown: RubricBreakdown;
  confidence: number;
  rubric_explanation: string;
  comparison_band: string;
  explainability: Explainability;
  validation?: Validation | null;
};

export type BatchRecord = {
  sentence_id: string;
  transcription: string;
  score: number;
  confidence: number;
  rubric_details: Record<string, unknown>;
};

export type BatchResponse = {
  total_rows: number;
  average_score: number;
  records: BatchRecord[];
};
