export type AppMode = "life_english" | "sports_action";

export type InputType = "image" | "video_frames";

export type SourceType = "image" | "video" | "manual";

export type CandidateType = "object" | "action" | "scene";

export type BBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RecognitionCandidate = {
  candidate_id: string;
  label_en: string;
  label_zh: string;
  type: CandidateType;
  confidence: number;
  visual_reason: string;
  bbox: BBox | null;
  recommended_learning_focus: string;
};

export type RecognitionResult = {
  session_id: string;
  input_type: InputType;
  mode: AppMode;
  summary: string;
  candidates: RecognitionCandidate[];
  is_mock?: boolean;
};

export type RelatedExpression = {
  phrase_en: string;
  meaning_zh: string;
};

export type Confusable = {
  word_a: string;
  word_b: string;
  difference_zh: string;
};

export type LearningCard = {
  candidate_id: string;
  phrase_en: string;
  meaning_zh: string;
  part_of_speech: string;
  ipa: string;
  example_en: string;
  example_zh: string;
  related_expressions: RelatedExpression[];
  confusables: Confusable[];
  usage_scenarios: string[];
  natural_sentence_patterns: string[];
  is_mock?: boolean;
};

export type StoredLearningCard = LearningCard & {
  id: string;
  anon_user_id: string;
  mode: AppMode;
  source_type: SourceType;
  source_asset_url: string | null;
  raw_ai_result: unknown;
  created_at: string;
  updated_at?: string;
};

export type ApiError = {
  error: string;
};
